# FuseBase agent plugins

The `fusebase-apps` plugin lets you create FuseBase apps by asking your coding agent, without
opening a terminal. It works with Claude Code and Codex.

> **Status**: not published yet. The catalogs are in place, the plugin and its skills are not.

## Install

In Claude Code:

```
claude plugin marketplace add fusebase-dev/agent-plugins
claude plugin install fusebase-apps@fusebase
```

In Codex:

```
codex plugin marketplace add fusebase-dev/agent-plugins
codex plugin add fusebase-apps@fusebase
```

You can paste either pair into the agent and let it run them for you.

If your agent's CLI is not on `PATH`, which is common when you installed only the desktop app, add
the marketplace through the plugin manager instead. In Claude Code: **+ → Plugins → Add plugin → Add
marketplace → Add from a repository**, then enter `fusebase-dev/agent-plugins`.

Claude Code needs `/reload-plugins` or a restart before a plugin installed mid-session becomes
active.

## What the plugin contributes

Two skills, and nothing else. No hooks, no agents, no MCP server, and nothing written to your
`CLAUDE.md` or `AGENTS.md`.

| Skill | What it does |
| --- | --- |
| `create-app` | Creates a FuseBase app. Picks your organisation, makes a directory, runs `fusebase init`, then hands off to the generated project's own skills. |
| `install-cli` | Installs, updates and authenticates the FuseBase CLI. Loads only when the CLI is missing or out of date. |

Installing the plugin installs nothing else. The CLI and the login happen the first time you
actually ask for an app.

## What it does to your machine

The first time `install-cli` runs:

- **macOS and Linux**: installs the `fusebase` binary to `~/.local/bin` and adds that directory to
  your `PATH` via your shell rc file. No `sudo`. Node is required, and the skill will help you
  install it if it is missing.
- **Windows**: downloads and starts the signed FuseBase CLI installer. Windows shows the usual
  elevation prompt and you click Yes. The installer handles Node itself. Restart your agent
  afterwards so `fusebase` resolves.
- **Authentication**: `fusebase auth` opens your browser so you can log in to FuseBase.

Linux arm64 is not supported.

## Updates

Skills change as they are tuned, so keep the marketplace syncing. Codex does this by default.
Claude Code exposes a *Sync automatically* toggle when you add a marketplace, and `install-cli`
will tell you if it looks disabled.

## Security

This plugin runs code on your machine with your privileges, as every plugin does. Everything it
runs is in this repository in readable form, with no build step, so you can check it before
installing. The installer scripts it invokes are published at `thefusebase.com/fusebase-cli/`.

## Support

Issues and questions: https://github.com/fusebase-dev/agent-plugins/issues
