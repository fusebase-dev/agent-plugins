---
name: install-cli
description: Use when the fusebase CLI is missing, out of date, or not logged in. Covers installing, updating and authenticating the FuseBase CLI on macOS, Linux and Windows.
---


# Installing the FuseBase CLI

Work through these steps in order and tell the user what you are doing as you go.

First decide which case you are in. Check them in this order and take the first that matches:

1. **Claude Cowork**: `CLAUDE_CODE_ENTRYPOINT` is `remote_cowork`, or `$HOME` matches `/sessions/rcw-*`. In section "1. Install or update", follow "Claude Cowork" instead of "macOS and Linux".
2. **Claude Code cloud session**: `CLAUDE_CODE_REMOTE` is `true`. The session runs on a cloud machine, whether the user started it from claude.ai, the desktop app or the mobile app. Do not install anything. Tell the user: "The FuseBase CLI is not available in Claude Code cloud sessions, because every session starts on a new machine and loses the CLI and its login. Start a local Claude Code session on your computer, or use Cowork with your project folder connected." Then stop.
3. Otherwise you are on the user's own computer. In section "1. Install or update", follow the part for their OS.

Run the installer as given. If it fails, stop and report what it printed. The only exceptions are the failures this skill tells you how to handle: the previous install that needs `sudo rm` in "macOS and Linux", and `403 from proxy` in "Claude Cowork". Do not download the binary yourself or place it by hand: the installer owns where the CLI lives and how it updates, and working around it hides the failure and leaves a binary `fusebase update` will not replace.


## 1. Install or update

### macOS and Linux

```
curl -sSL https://thefusebase.com/fusebase-cli/install-fusebase.sh | FUSEBASE_AGENT=1 sh
```

This handles both cases. It installs to `$HOME/.local/bin` without elevation, adds that directory to `PATH` in the shell rc file, and updates in place when the CLI is already there.

If it exits reporting a previous install it cannot remove, relay its message. The user runs the one `sudo rm` line it prints, then you run the installer again.

If `$HOME/.local/bin` was not already on `PATH`, `fusebase` will not resolve until the shell restarts. Use `~/.local/bin/fusebase` for the rest of this session.


### Claude Cowork

Cowork has two machines:

- **Cloud VM**: a machine in the cloud. It is new and empty in every chat. Never install or run `fusebase` there.
- **Local VM**: a Linux VM on the user's computer. The folders the user connected to the chat are under `$HOME/mnt/`. Install and run `fusebase` only here.

Pick the shell that runs in the local VM. Use it for every command in this skill, sections 2 and 3 included, and for every `fusebase` command for the rest of the session:

1. Run `echo $HOME` in your `Bash` tool. If it prints `/sessions/rcw-<id>`, your `Bash` runs in the local VM. Use `Bash`.
2. Otherwise your `Bash` runs in the cloud VM. Use the `mcp__remote-devices__device_bash` tool instead. Never use `Bash` for this work.
3. If you have no `mcp__remote-devices__device_bash` tool, no folder is connected to the chat. Tell the user: "Connect your project folder to this chat, then ask again." Then stop.

Pick the project folder among the connected folders under `$HOME/mnt/`, in this order:

1. The folder the user named as the project.
2. The only connected folder that has `fusebase.json`.
3. The only connected folder.
4. Otherwise ask the user which connected folder is the project.

`<dir>` is the absolute path of `.fusebase` inside the project folder, for example `/sessions/rcw-abc/mnt/my-app/.fusebase`. Never put the CLI in `$HOME` itself, `/tmp` or `/var/tmp`: every chat gets a new home, so a CLI there is lost and costs about 100 MB of shared disk each time.

a. If `<dir>/bin/fusebase` exists, do not download anything. Run `update` with the prefix from step c, then go to step c.

b. Otherwise install it:

   ```
   curl -sSL https://thefusebase.com/fusebase-cli/install-fusebase.sh | FUSEBASE_AGENT=1 FUSEBASE_INSTALL_DIR="<dir>/bin" FUSEBASE_CONFIG_DIR="<dir>/config" sh
   ```

   If the project folder has a `.gitignore` without a `.fusebase/` line, add one.

c. Shell variables do not survive between your commands. For the rest of the session, write this full prefix on every `fusebase` command: in this skill, in any other skill, and in project docs that tell you to run `fusebase`:

   ```
   FUSEBASE_CONFIG_DIR="<dir>/config" PATH="<dir>/bin:$PATH" "<dir>/bin/fusebase" <command>
   ```

If step a or b fails with `403 from proxy`, Cowork is blocking FuseBase. Tell the user: "Allow `thefusebase.com`, `public-api.thefusebase.com` and `app.nimbusweb.me` on the claude.ai website, not in the desktop app: Settings > Capabilities, or Organization settings > Capabilities on Team and Enterprise plans." Once they confirm, run the failed step again.


### Windows

```
irm https://thefusebase.com/fusebase-cli/install-fusebase.ps1 | iex
```

Windows raises the elevation prompt and the user clicks "Yes". 
The installer bundles Node, so a first install takes a while. The script waits 90 seconds and then hands back rather than blocking.

Exit code 2 means it is still installing, not that it failed. Poll until `%PROGRAMFILES%\FuseBase CLI\fusebase.exe` exists, then continue.

Use that full path for the rest of this session, since the machine `PATH` change is invisible to the running session.


## 2. Check Node (macOS, Linux and Claude Cowork)

Run `node --version`. Without Node the CLI cannot create apps. Install it with whatever the user already has, Homebrew or nvm or apt, or ask which they prefer. 
The Windows installer handles Node itself.


## 3. Authenticate

Check first: `fusebase orgs list` fails when nobody is logged in. If it lists organisations, skip this step.

`fusebase auth` opens a browser and waits with no timeout, so it will outlive your command timeout.
Start it in the background and tell the user to finish logging in in the browser window that opened. It exits 0 once the login lands, so wait for the process to exit rather than polling anything.


## 4. Check the marketplace stays in sync

These skills change as they are tuned, and a marketplace that does not sync freezes the user on the version they installed. 
Codex syncs by default. 
On Claude Code, verify that auto updating is enabled for the `fusebase` marketplace.


## 5. Report

Tell the user the CLI is ready and return to whatever you were doing.

On Windows, also tell them to restart the agent before development, because `fusebase` will not resolve as a bare command until they do.
