#!/usr/bin/env node
// PreToolUse hook for the FuseBase MCP servers.
//
// The servers refuse an irreversible operation unless the call carries `confirm: true`.
// That stops an accident, not an agent that decides to confirm on its own. This hook puts
// the human back in the loop: a confirmed call is held until you approve it.
//
// Only `confirm: true` is looked at, never a list of operation ids, so the hook stays
// correct when the servers flag more operations.

const MAX_ARGS_CHARS = 300;

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

function summarise(args) {
  const { confirm, ...rest } = args;
  const text = JSON.stringify(rest);
  if (!text || text === "{}") return "No arguments.";
  return text.length > MAX_ARGS_CHARS ? `${text.slice(0, MAX_ARGS_CHARS)}…` : text;
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

  // Codex sets PLUGIN_ROOT; Claude Code sets CLAUDE_PLUGIN_ROOT alone.
  if (!process.env.PLUGIN_ROOT) {
    emit("ask", what);
    return;
  }

  // Codex parses "ask" but does not act on it yet, so the safe answer there is "deny".
  if (process.env.FUSEBASE_ALLOW_DANGEROUS === "1") {
    emit("allow", `${what} Allowed by FUSEBASE_ALLOW_DANGEROUS.`);
    return;
  }

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
