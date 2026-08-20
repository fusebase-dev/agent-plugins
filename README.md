# FuseBase agent plugins

The `fusebase-apps` plugin lets you create FuseBase apps by asking your coding agent, without
opening a terminal. It works with Claude Code and Codex.

## Install

Three ways to install. The first two need your agent's CLI on your `PATH`. The third does not, so
it works everywhere.

### Ask your agent

Paste this into Claude Code or Codex:

```
Install the fusebase-dev/agent-plugins marketplace and the fusebase-apps plugin from it.
```

The agent runs its own CLI to do this. That only works if the CLI is on your `PATH`, which it
often is not when you installed the desktop app alone. If the agent reports that its command was
not found, skip to [installing from the app itself](#install-from-the-app-itself).

### Run the commands yourself

These are the same commands the agent would run, so if asking the agent failed because the CLI was
not found, these will fail the same way. Use the next method instead.

For Claude Code:

```
claude plugin marketplace add fusebase-dev/agent-plugins
claude plugin install fusebase-apps@fusebase
```

For Codex:

```
codex plugin marketplace add fusebase-dev/agent-plugins
codex plugin add fusebase-apps@fusebase
```

### Install from the app itself

Both Claude Code and Codex can add the marketplace from their own interface. This needs no CLI, so
it works when the other two methods do not.

**Claude Code desktop**

1. Click **+** next to the prompt box and pick **Add plugins...**.
2. In the **Plugins** directory, click **+** (*Add marketplace*) at the top right.
3. Choose **Add from a repository**, enter `fusebase-dev/agent-plugins`, and press **Sync**.
4. Open the **Code** tab, select the `fusebase` marketplace, and install **Fusebase apps**.

**Codex**

1. Open **Settings -> Plugins**.
2. Click **Add -> Add a marketplace**.
3. Enter `fusebase-dev/agent-plugins` as the source and press **Add marketplace**.
4. Find **FuseBase Apps** under the **Personal** tab and press **Install**.

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

- **macOS and Linux**: installs the `fusebase` binary to `~/.local/bin`, adding that directory to
  your `PATH` via your shell rc file if it is not there already. No `sudo`. Node is required, and
  the skill will help you install it if it is missing.
- **An older install at `/usr/local/bin/fusebase`** is removed first, because it would shadow the
  new one. That path needs root, so the installer stops and prints a single `sudo rm` line for you
  to run yourself.
- **Windows**: downloads and starts the signed FuseBase CLI installer. Windows shows the usual
  elevation prompt and you click Yes. The installer handles Node itself. Restart your agent
  afterwards so `fusebase` resolves.
- **Authentication**: `fusebase auth` opens your browser so you can log in to FuseBase.

Linux arm64 is not supported.

## Updates

Skills change as they are tuned, so keep the marketplace syncing. Codex does this by default.
Claude Code exposes a *Sync automatically* toggle when you add a marketplace, and `install-cli`
asks you to confirm it is on.

## Security

This plugin runs code on your machine with your privileges, as every plugin does. Everything it
runs is in this repository in readable form, with no build step, so you can check it before
installing. The installer scripts it invokes are published at `thefusebase.com/fusebase-cli/`.

## Support

Issues and questions: https://github.com/fusebase-dev/agent-plugins/issues
