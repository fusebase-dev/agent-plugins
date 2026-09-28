#!/usr/bin/env node
// Run: node plugins/fusebase-apps/hooks/confirm-dangerous.test.js
const assert = require("node:assert");
const { execFileSync } = require("node:child_process");
const { join } = require("node:path");
const fs = require("node:fs");
const os = require("node:os");

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

// Auto mode and bypass permissions: the person opted out of prompts, so the hook stays silent.
// The other modes still ask.
const inMode = (permission_mode) => ({ ...toolCall({ fileId: "f1", confirm: true }), permission_mode });
assert.strictEqual(run(inMode("auto"), CLAUDE), null);
assert.strictEqual(run(inMode("bypassPermissions"), CLAUDE), null);
assert.strictEqual(run(inMode("default"), CLAUDE).permissionDecision, "ask");
assert.strictEqual(run(inMode("acceptEdits"), CLAUDE).permissionDecision, "ask");

// Codex and any other host: the hook does nothing at all, confirmed or not.
assert.strictEqual(run(toolCall({ fileId: "f1", confirm: true }), CODEX), null);
assert.strictEqual(run(toolCall({ fileId: "f1", confirm: true }), {}), null);

// Gate ops carry the request under `body`. The field that sets the blast radius is shown
// by its dotted path even behind 60 wide columns, which filled the old per-argument cap.
const values = Object.fromEntries(Array.from({ length: 60 }, (_, i) => [`column_${i}`, `value ${i} `.repeat(4)]));
const update = run(
  toolCall({ orgId: "o1", storeId: "s1", stage: "dev", body: { tableName: "orders", values, allowAll: true }, confirm: true }),
  CLAUDE,
);
assert.match(update.permissionDecisionReason, /body\.tableName="orders"/);
assert.match(update.permissionDecisionReason, /body\.values\.column_59=/);
assert.match(update.permissionDecisionReason, /body\.allowAll=true/);

// The last statement of a batch is shown, however many harmless ones come first.
const operations = Array.from({ length: 25 }, (_, i) => ({ op: "execute", sql: `UPDATE orders SET note = 'reviewed by the nightly job, batch ${i}' WHERE id = ${i} AND status = 'draft'` }));
operations.push({ op: "execute", sql: "DELETE FROM orders" });
const batch = run(toolCall({ orgId: "o1", storeId: "s1", stage: "dev", body: { operations }, confirm: true }), CLAUDE);
assert.match(batch.permissionDecisionReason, /body\.operations\[25\]\.sql="DELETE FROM orders"/);

// A bulk payload is cut, and the cut says how much it hid.
const rows = Array.from({ length: 5000 }, (_, i) => ({ id: i }));
const bulk = run(toolCall({ body: { rows, allowAll: true }, confirm: true }), CLAUDE);
assert.match(bulk.permissionDecisionReason, /body\.rows: 50 of 5000 items shown, 4950 hidden/);
assert.match(bulk.permissionDecisionReason, /body\.allowAll=true/);
assert.ok(bulk.permissionDecisionReason.length < 3000, bulk.permissionDecisionReason.length);
const huge = run(toolCall({ sql: "x".repeat(5000), allowAll: true, confirm: true }), CLAUDE);
assert.match(huge.permissionDecisionReason, /… \(4002 more chars\), allowAll=true/);

// A realistic statement is shown in full, not cut mid-WHERE.
const sql = `DELETE FROM orders WHERE ${"status = 'draft' AND ".repeat(20)}created_at < '2026-01-01'`;
const full = run(toolCall({ sql, confirm: true }), CLAUDE);
assert.ok(full.permissionDecisionReason.includes(sql));

// Malformed input never blocks the call.
assert.strictEqual(run("not json", CLAUDE), null);
assert.strictEqual(run({ tool_name: "mcp__fusebase-gate__tool_call" }, CLAUDE), null);

// "Yes, and don't ask again" on the hook's prompt writes an allow rule; from then on the hook
// stays silent for that tool in that project, until the rule is removed.
const tmp = fs.mkdtempSync(join(os.tmpdir(), "confirm-dangerous-"));
const project = join(tmp, "app");
fs.mkdirSync(join(project, ".claude"), { recursive: true });
const setRules = (allow) =>
  fs.writeFileSync(join(project, ".claude", "settings.local.json"), JSON.stringify({ permissions: { allow } }));
const WITH_DATA = { ...CLAUDE, CLAUDE_PROJECT_DIR: project, CLAUDE_PLUGIN_DATA: join(tmp, "data") };
const confirmed = toolCall({ fileId: "f1", confirm: true });
const read = toolCall({ fileId: "f1" });
const TOOL = "mcp__fusebase-gate__tool_call";

setRules([]);
assert.strictEqual(run(confirmed, WITH_DATA).permissionDecision, "ask");
setRules([TOOL]); // the person picked "Yes, and don't ask again"
assert.strictEqual(run(confirmed, WITH_DATA), null);
assert.strictEqual(run(confirmed, WITH_DATA), null);
// Another project and the other server are still asked.
assert.strictEqual(run(confirmed, { ...WITH_DATA, CLAUDE_PROJECT_DIR: join(tmp, "other") }).permissionDecision, "ask");
assert.strictEqual(run(perOpCall({ databaseId: "d1", confirm: true }), WITH_DATA).permissionDecision, "ask");
// Removing the rule brings the prompt back, and it is not remembered any more.
setRules([]);
assert.strictEqual(run(confirmed, WITH_DATA).permissionDecision, "ask");
run(read, WITH_DATA); // plain "Yes": the next call sees no rule
setRules([TOOL]); // then "don't ask again" on Claude's own prompt for a harmless call
assert.strictEqual(run(confirmed, WITH_DATA).permissionDecision, "ask");
// With the rule already there, the choice cannot be seen, so the hook keeps asking.
assert.strictEqual(run(confirmed, WITH_DATA).permissionDecision, "ask");

// Without a data dir, or with one that cannot be written, the hook keeps asking.
setRules([TOOL]);
assert.strictEqual(run(confirmed, { ...WITH_DATA, CLAUDE_PLUGIN_DATA: "" }).permissionDecision, "ask");
fs.writeFileSync(join(tmp, "file"), "");
assert.strictEqual(run(confirmed, { ...WITH_DATA, CLAUDE_PLUGIN_DATA: join(tmp, "file", "data") }).permissionDecision, "ask");
fs.rmSync(tmp, { recursive: true, force: true });

console.log("confirm-dangerous: all checks passed");
