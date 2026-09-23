#!/usr/bin/env node
// PreToolUse hook for the FuseBase MCP servers.
//
// The servers refuse an irreversible operation unless the call carries `confirm: true`.
// That stops an accident, not an agent that decides to confirm on its own. This hook puts
// the human back in the loop: a confirmed call is held until you approve it.
//
// Only `confirm: true` is looked at, never a list of operation ids, so the hook stays
// correct when the servers flag more operations.

// Long enough for a full SQL statement or migration, the thing the person has to read.
// The cap only stops a bulk payload (thousands of rows) from burying the prompt.
const MAX_VALUE_CHARS = 2000;

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

// Every argument name is shown, because the one that decides the blast radius
// (`allowAll`, a WHERE-less statement) is often the last. Only values are cut.
function summarise(args) {
  const names = Object.keys(args).filter((key) => key !== "confirm");
  if (names.length === 0) return "No arguments.";
  return names
    .map((name) => {
      const text = JSON.stringify(args[name]) ?? "undefined";
      return `${name}=${text.length > MAX_VALUE_CHARS ? `${text.slice(0, MAX_VALUE_CHARS)}…` : text}`;
    })
    .join(", ");
}

function decide(event) {
  const toolName = typeof event.tool_name === "string" ? event.tool_name : "";
  const input = event.tool_input ?? {};
  // `tool_call` nests the operation arguments under `args`; a per-op tool passes them directly.
  const args = input.args && typeof input.args === "object" ? input.args : input;
  if (input.confirm !== true && args.confirm !== true) return;

  const parts = toolName.split("__");
  const server = parts[1] || "fusebase";
  const opId = input.opId || parts[parts.length - 1] || "operation";
  const what = `Approval required by the FuseBase plugin. ${server}: ${opId} is irreversible and this call confirms it. Arguments: ${summarise(args)}`;

  // Claude Code sets CLAUDE_PROJECT_DIR for hooks and is the only host that acts on "ask".
  // Codex sets CLAUDE_PLUGIN_ROOT as an alias but knows nothing of CLAUDE_PROJECT_DIR.
  if (process.env.CLAUDE_PROJECT_DIR) {
    emit("ask", what);
    return;
  }

  // Codex parses "ask" but does not act on it yet, so the safe answer there is "deny".
  // With the override set we say nothing at all: "allow" would skip the host's own
  // approval flow, which is the opposite of what this hook is for.
  if (process.env.FUSEBASE_ALLOW_DANGEROUS === "1") return;

  emit(
    "deny",
    `${what} Codex cannot ask for approval on this yet. Stop and let the person run the operation themselves, or have them restart Codex with FUSEBASE_ALLOW_DANGEROUS=1 for this session.`,
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
