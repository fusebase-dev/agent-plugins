# AGENTS.md

This file provides guidance for AI agents working with the FuseBase agent plugins repository.

## Project Overview

This repository is the marketplace FuseBase publishes for coding agents. Users add it once, install
the `fusebase-apps` plugin, and get skills that let them create FuseBase apps without opening a
terminal.

It serves Claude Code and Codex from a single copy of each skill. The two agents read their catalogs
and plugin manifests from different paths, which do not collide, so one directory satisfies both.

The repository is a build output. Skill content is authored in `apps-cli` alongside the existing
app-development skills, so `bun run skills:validate` covers it there. Do not hand-edit skills here
and expect the change to survive.

## Project Structure

```
.claude-plugin/
  marketplace.json          # Claude Code catalog
.agents/plugins/
  marketplace.json          # Codex catalog
plugins/fusebase-apps/
  .claude-plugin/plugin.json    # optional for Claude Code
  .codex-plugin/plugin.json     # required for Codex
  skills/
    create-app/SKILL.md         # when and how to create a FuseBase app
    existing-fusebase-app/SKILL.md  # update the CLI before working in an existing app
    install-cli/SKILL.md        # install, update and authenticate the CLI
  hooks/
    hooks.json                  # PreToolUse entry; Claude Code reads this path
    confirm-dangerous.js        # holds a confirmed irreversible MCP call for the human
    confirm-dangerous.test.js   # node hooks/confirm-dangerous.test.js, no dependencies
docs/                       # internal planning material, gitignored, never published
```

The two catalogs have different schemas. Claude's takes a top-level `description` and a required
`owner` object. Codex's takes neither, puts the display name under `interface.displayName`, and uses
an object rather than a string for each plugin's `source`. Copy Codex's shape from a real catalog
under `~/.codex/.tmp/` rather than guessing.

Component directories (`skills/`, `agents/`, `hooks/`) live at the plugin root, not inside
`.claude-plugin/`. Getting this wrong fails silently.

## The confirmation hook

`hooks/confirm-dangerous.js` is authored here, not in `apps-cli`, because it belongs to the plugin
rather than to a generated app. It keys on `confirm: true` in the tool input and on nothing else, so
it never needs updating when fusebase-gate or dashboard-service flags another operation as dangerous.

Claude Code gets `permissionDecision: "ask"` in every permission mode except bypass permissions
(`permission_mode` `bypassPermissions`), where the person opted out of prompts and the hook stays
silent. Auto mode asks (Claude honours it, checked live on 2.1.283); "don't ask again" is the opt-out. Everywhere else the hook does nothing: Codex parses
`ask` but does not act on it, and answering `deny` there instead was ruled out (NIM-44889, 2026-09-25).
The Codex manifest therefore declares no `hooks`. Claude Code is recognised by `CLAUDE_PROJECT_DIR`,
which it sets for hooks and Codex does not; `CLAUDE_PLUGIN_ROOT` cannot be used because Codex sets
it as an alias. Never answer `allow`: it means "execute" and skips the host's own approval flow.
"Yes, and don't ask again" on the hook's prompt writes the tool name to the project
`.claude/settings.local.json` allow list. The hook honours that rule only when the person picked it
on the hook's own prompt. When it asks, it stores the call's `tool_use_id` in
`$CLAUDE_PLUGIN_DATA/dont-ask-again.json`; the same script runs as PostToolUse (and
PostToolUseFailure, for an op that failed after approval), which Claude fires only after a Yes, and
remembers the tool if the rule was missing at the prompt and is present now. After a No no post hook
runs (checked live on 2.1.283), so a rule added later in /permissions, in auto mode or by another
prompt is never taken for option 2. Every PreToolUse call to either server drops the tool from `remembered` when its rule is missing, so removing the rule always
brings the prompt back. Gap: another prompt (a second session, or a parallel call in this one)
answered while ours is open. A rule that already existed is not honoured, or allowing a read would
switch the guard off.
Without `CLAUDE_PLUGIN_DATA`, or when that state cannot be read or written, the hook asks.
A malformed payload exits silently too, because a hook that throws must not be able to block a
tool call.

The matcher assumes the standard MCP tool names, `mcp__fusebase-gate__*` and
`mcp__fusebase-dashboards__*`, which is what `fusebase init` writes. A host configured to expose MCP
tools under unprefixed names would not match.

Run `node plugins/fusebase-apps/hooks/confirm-dangerous.test.js` after touching either file.

## Naming

| Thing | Name | Where users see it |
| --- | --- | --- |
| Repository | `fusebase-dev/agent-plugins` | The marketplace-add step, and the Add marketplace dialog |
| Marketplace | `fusebase` | After `@` in install commands, and in each agent's plugin manager |
| Plugin | `fusebase-apps` | Before `@` in install commands; namespaces every skill |
| Skills | `create-app`, `existing-fusebase-app`, `install-cli` | `/fusebase-apps:create-app` |

Marketplace names are global per user, and adding a different marketplace under the same name
replaces the first. Every future FuseBase plugin belongs in this one catalog. Names resembling
official Anthropic sources are blocked and will stop the catalog from loading.

Skills drop the `fusebase-` prefix because the plugin name already supplies it.

## Install commands

```
claude plugin marketplace add fusebase-dev/agent-plugins
claude plugin install fusebase-apps@fusebase
```

```
codex plugin marketplace add fusebase-dev/agent-plugins
codex plugin add fusebase-apps@fusebase
```

Both CLIs also accept a local path as a marketplace source, so changes are testable before anything
is pushed.

## Crucial instructions

- Validate before pushing: `claude plugin validate .`
- Bump the plugin `version` on every release. When `version` is set the plugin is pinned to that
  string, and users receive an update only when it changes.
- Skill descriptions sit in the context window on every turn; only the body is loaded on use. Keep
  the skill count deliberate and the descriptions short.
- This repository is published for users to audit. Keep the source readable, keep internal planning
  material out of version control, and state in the README exactly what the plugin contributes.
- Background and decisions for the work that created this repository are in `docs/`, which is
  gitignored. `docs/specs/pivot-plugins-spec.md` is the design; `docs/decisions.md` is the record.
