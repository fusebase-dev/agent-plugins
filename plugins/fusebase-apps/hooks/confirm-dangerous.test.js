#!/usr/bin/env node
// Run: node plugins/fusebase-apps/hooks/confirm-dangerous.test.js
const assert = require("node:assert");
const { execFileSync } = require("node:child_process");
const { join } = require("node:path");

const HOOK = join(__dirname, "confirm-dangerous.js");
const CLAUDE = { CLAUDE_PLUGIN_ROOT: "/plugins/fusebase-apps", CLAUDE_PROJECT_DIR: "/work/app" };
// Codex sets CLAUDE_PLUGIN_ROOT as an alias, but never CLAUDE_PROJECT_DIR.
const CODEX = { CLAUDE_PLUGIN_ROOT: "/plugins/fusebase-apps", PLUGIN_ROOT: "/plugins/fusebase-apps" };

function run(event, env) {
  const out = execFileSync("node", [HOOK], {
    input: typeof event === "string" ? event : JSON.stringify(event),
    env: { PATH: process.env.PATH, ...env },
    encoding: "utf8",
  });
  return out ? JSON.parse(out).hookSpecificOutput : null;
}

const toolCall = (args) => ({
  tool_name: "mcp__fusebase-gate__tool_call",
  tool_input: { opId: "deleteFile", args },
});
const perOpCall = (input) => ({ tool_name: "mcp__fusebase-dashboards__deleteDatabase", tool_input: input });

// Claude Code asks for a confirmed call, and names the server, the operation and the arguments.
const asked = run(toolCall({ fileId: "f1", confirm: true }), CLAUDE);
assert.strictEqual(asked.permissionDecision, "ask");
assert.match(asked.permissionDecisionReason, /^Approval required by the FuseBase plugin\. fusebase-gate: deleteFile/);
assert.match(asked.permissionDecisionReason, /fileId="f1"/);
assert.doesNotMatch(asked.permissionDecisionReason, /confirm=/);

// A per-op tool carries confirm at the top level.
assert.strictEqual(run(perOpCall({ databaseId: "d1", confirm: true }), CLAUDE).permissionDecision, "ask");

// Anything not confirmed is silent: reads, previews, confirm omitted or not exactly true.
assert.strictEqual(run(toolCall({ fileId: "f1" }), CLAUDE), null);
assert.strictEqual(run(toolCall({ fileId: "f1", confirm: "true" }), CLAUDE), null);
assert.strictEqual(run({ tool_name: "mcp__fusebase-gate__tools_list", tool_input: {} }, CLAUDE), null);

// Codex cannot ask, so it denies unless the person set the override.
const denied = run(toolCall({ fileId: "f1", confirm: true }), CODEX);
assert.strictEqual(denied.permissionDecision, "deny");
assert.match(denied.permissionDecisionReason, /FUSEBASE_ALLOW_DANGEROUS=1/);

// The override means "no opinion", never "allow": Codex still runs its own approval flow.
assert.strictEqual(run(toolCall({ fileId: "f1", confirm: true }), { ...CODEX, FUSEBASE_ALLOW_DANGEROUS: "1" }), null);

// A host that is neither is treated as one that cannot ask.
assert.strictEqual(run(toolCall({ fileId: "f1", confirm: true }), {}).permissionDecision, "deny");

// Every argument name survives, however long the values are: the last flag is often the dangerous one.
const long = run(toolCall({ sql: "x".repeat(5000), allowAll: true, confirm: true }), CLAUDE);
assert.match(long.permissionDecisionReason, /allowAll=true/);
assert.ok(long.permissionDecisionReason.length < 2400, long.permissionDecisionReason.length);

// A realistic statement is shown in full, not cut mid-WHERE.
const sql = `DELETE FROM orders WHERE ${"status = 'draft' AND ".repeat(20)}created_at < '2026-01-01'`;
const full = run(toolCall({ sql, confirm: true }), CLAUDE);
assert.ok(full.permissionDecisionReason.includes(sql));

// Malformed input never blocks the call.
assert.strictEqual(run("not json", CLAUDE), null);
assert.strictEqual(run({ tool_name: "mcp__fusebase-gate__tool_call" }, CLAUDE), null);

console.log("confirm-dangerous: all checks passed");
