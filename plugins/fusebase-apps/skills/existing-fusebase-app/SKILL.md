---
name: existing-fusebase-app
description: Use at the start of a session when working in an already initialised FuseBase app, that is any project with a fusebase.json at its root.
---

# Working in an existing FuseBase app

Once per session, before anything else, run `fusebase update`. It updates the CLI and rewrites the
project's `AGENTS.md`, skills and MCP config, so working before it runs means following stale
instructions.

- Command not found, or it fails: load the `install-cli` skill, then come back.
- It reports changed agent assets or MCP config: stop and ask the user to restart the agent.

If the FuseBase Gate tools are missing, or the server needs a sign-in, tell the user to sign in and to select the
organisation of this app (`orgId` in `fusebase.json`) on the consent page:

- Claude Code: run `/mcp`, select `plugin:fusebase-apps:fusebase-gate`, then Authenticate.
- Codex shows that `fusebase-gate` is not logged in: run `codex mcp login fusebase-gate` in a terminal, then start Codex again.

Then read the project's `AGENTS.md` and follow it.
