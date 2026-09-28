#!/usr/bin/env node
// PreToolUse hook for the FuseBase MCP servers.
//
// The servers refuse an irreversible operation unless the call carries `confirm: true`.
// That stops an accident, not an agent that decides to confirm on its own. This hook puts
// the human back in the loop: a confirmed call is held until you approve it.
//
// Only `confirm: true` is looked at, never a list of operation ids, so the hook stays
// correct when the servers flag more operations.

const fs = require("node:fs");
const path = require("node:path");

// Long enough for a full SQL statement, the thing the person has to read.
// The caps only stop a bulk payload (thousands of rows) from burying the prompt.
const MAX_VALUE_CHARS = 1000;
const MAX_ARRAY_ITEMS = 50;

function emit(permissionDecision, permissionDecisionReason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision,
        permissionDecisionReason,
      },
    }),
  );
}

// Every field is shown as a dotted path, because the one that decides the blast radius
// (`body.allowAll`, the last statement of a batch) is often nested and last. Gate ops carry
// their whole request under one `body` argument. Only long leaf values and long arrays are
// cut, and each cut says how much it hid.
function flatten(value, path, lines) {
  if (value && typeof value === "object" && Object.keys(value).length > 0) {
    if (Array.isArray(value)) {
      value.slice(0, MAX_ARRAY_ITEMS).forEach((item, i) => flatten(item, `${path}[${i}]`, lines));
      if (value.length > MAX_ARRAY_ITEMS) {
        lines.push(`${path}: ${MAX_ARRAY_ITEMS} of ${value.length} items shown, ${value.length - MAX_ARRAY_ITEMS} hidden`);
      }
    } else {
      for (const [key, item] of Object.entries(value)) flatten(item, path ? `${path}.${key}` : key, lines);
    }
    return;
  }
  const text = JSON.stringify(value) ?? "undefined";
  const hidden = text.length - MAX_VALUE_CHARS;
  lines.push(`${path}=${hidden > 0 ? `${text.slice(0, MAX_VALUE_CHARS)}… (${hidden} more chars)` : text}`);
}

function summarise(args) {
  const lines = [];
  for (const [name, value] of Object.entries(args)) {
    if (name !== "confirm") flatten(value, name, lines);
  }
  return lines.length === 0 ? "No arguments." : lines.join(", ");
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return undefined;
  }
}

// Claude's "Yes, and don't ask again" writes the tool name here.
function allowedInProject(toolName) {
  const file = path.join(process.env.CLAUDE_PROJECT_DIR, ".claude", "settings.local.json");
  const rules = readJson(file)?.permissions?.allow;
  return Array.isArray(rules) && rules.includes(toolName);
}

// "Don't ask again" must count only when it was picked on this hook's prompt. The same allow
// rule also comes from Claude's own prompt for a harmless call or from /permissions, and
// honouring that would switch the guard off for anyone who allowed reads. So when the hook asks,
// it records the call's tool use id (`pending`), and the answer is read after the call: the
// post hook runs only when the person said Yes to that call, and a rule that was missing at the
// prompt and is present now can only be option 2. After a No nothing runs and nothing is kept.
// ponytail: another prompt answered while ours is open (a second session, or a parallel call in
// this one) can still write the rule in between; if the rule already existed when the hook asked,
// the choice writes nothing and cannot be seen, so the person is asked every time until they
// remove that rule.
function withState(update) {
  if (!process.env.CLAUDE_PLUGIN_DATA) return undefined;
  const file = path.join(process.env.CLAUDE_PLUGIN_DATA, "dont-ask-again.json");
  const all = readJson(file) ?? {};
  const project = all[process.env.CLAUDE_PROJECT_DIR] ?? { remembered: [] };
  const before = JSON.stringify(project);
  const result = update(project);
  if (JSON.stringify(project) !== before) {
    all[process.env.CLAUDE_PROJECT_DIR] = project;
    fs.mkdirSync(process.env.CLAUDE_PLUGIN_DATA, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(all, null, 2));
  }
  return result;
}

// Removing the rule (/permissions) brings the prompt back. Checked on every call, not only
// confirmed ones, so a rule re-added later on a read's prompt is not taken for the old answer.
function forgetIfRuleRemoved(toolName) {
  withState((project) => {
    if (!allowedInProject(toolName)) project.remembered = project.remembered.filter((t) => t !== toolName);
  });
}

// Before a confirmed call: true when the person already chose not to be asked for this tool.
function remembered(toolName, toolUseId) {
  return withState((project) => {
    if (allowedInProject(toolName)) return project.remembered.includes(toolName);
    project.pending = toolUseId;
    return false;
  });
}

// After a call the person allowed.
function answered(toolName, toolUseId) {
  withState((project) => {
    if (!toolUseId || project.pending !== toolUseId) return;
    delete project.pending;
    if (allowedInProject(toolName) && !project.remembered.includes(toolName)) project.remembered.push(toolName);
  });
}

function decide(event) {
  // Only Claude Code can ask the person, and it sets CLAUDE_PROJECT_DIR for hooks. Codex
  // sets CLAUDE_PLUGIN_ROOT as an alias but not this one. Elsewhere the hook stays out of
  // the way: refusing calls there was ruled out, and the server still demands confirm.
  if (!process.env.CLAUDE_PROJECT_DIR) return;
  const toolName = typeof event.tool_name === "string" ? event.tool_name : "";
  if (event.hook_event_name === "PostToolUse" || event.hook_event_name === "PostToolUseFailure") {
    answered(toolName, event.tool_use_id);
    return;
  }
  try {
    forgetIfRuleRemoved(toolName);
  } catch {
    // Broken state: a confirmed call below fails the same way and is asked.
  }
  // Bypass permissions: the person opted out of every prompt, so Claude's own setting decides.
  // Auto mode still asks. The server still demands confirm and logs the call.
  if (event.permission_mode === "bypassPermissions") return;

  const input = event.tool_input ?? {};
  // `tool_call` nests the operation arguments under `args`; a per-op tool passes them directly.
  const args = input.args && typeof input.args === "object" ? input.args : input;
  if (input.confirm !== true && args.confirm !== true) return;
  try {
    // Silent here means Claude applies the person's own allow rule, as for any other tool.
    if (remembered(toolName, event.tool_use_id)) return;
  } catch {
    // Broken or unwritable state must not skip the prompt, as the top-level catch would.
  }

  const parts = toolName.split("__");
  const server = parts[1] || "fusebase";
  const opId = input.opId || parts[parts.length - 1] || "operation";
  emit(
    "ask",
    `Approval required by the FuseBase plugin. ${server}: ${opId} is irreversible and this call confirms it. Arguments: ${summarise(args)}`,
  );
}

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  raw += chunk;
});
process.stdin.on("end", () => {
  try {
    decide(JSON.parse(raw));
  } catch {
    // A broken hook must never block a tool call: say nothing and let the host decide.
  }
});
