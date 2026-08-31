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
docs/                       # internal planning material, gitignored, never published
```

The two catalogs have different schemas. Claude's takes a top-level `description` and a required
`owner` object. Codex's takes neither, puts the display name under `interface.displayName`, and uses
an object rather than a string for each plugin's `source`. Copy Codex's shape from a real catalog
under `~/.codex/.tmp/` rather than guessing.

Component directories (`skills/`, `agents/`, `hooks/`) live at the plugin root, not inside
`.claude-plugin/`. Getting this wrong fails silently.

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
