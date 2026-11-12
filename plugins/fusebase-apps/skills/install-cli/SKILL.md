---
name: install-cli
description: Use when the fusebase CLI is missing, out of date, or not logged in. Covers installing, updating and authenticating the FuseBase CLI on macOS, Linux and Windows.
---


# Installing the FuseBase CLI

Work through these steps in order and tell the user what you are doing as you go.

First check where your shell runs:

- **Claude Cowork**: `CLAUDE_CODE_ENTRYPOINT` is `remote_cowork`, or `$HOME` matches `/sessions/rcw-*`. In step 1, use the Claude Cowork section instead of macOS and Linux.
- **Cloud session**, such as Claude Code on the web: `CLAUDE_CODE_REMOTE` is `true`. Do not install. Every session there starts on a new machine, so the CLI and its login are lost each time. Tell the user the FuseBase CLI works only on their own computer, in Claude Code or in Cowork with a folder connected, and stop.

Run the installer as given. If it fails, stop and report what it printed. Do not download the binary yourself or place it by hand: the installer owns where the CLI lives and how it updates, and working around it hides the failure and leaves a binary `fusebase update` will not replace.


## 1. Install or update

### macOS and Linux

```
curl -sSL https://thefusebase.com/fusebase-cli/install-fusebase.sh | FUSEBASE_AGENT=1 sh
```

This handles both cases. It installs to `$HOME/.local/bin` without elevation, adds that directory to `PATH` in the shell rc file, and updates in place when the CLI is already there.

If it exits reporting a previous install it cannot remove, relay its message. The user runs the one `sudo rm` line it prints, then you run the installer again.

If `$HOME/.local/bin` was not already on `PATH`, `fusebase` will not resolve until the shell restarts. Use `~/.local/bin/fusebase` for the rest of this session.


### Claude Cowork

Cowork can give you two shells: your own `Bash`, and `device_bash`, which runs commands in a Linux VM on the user's computer. If `$HOME` in your `Bash` matches `/sessions/rcw-*`, your `Bash` is that VM; use it. Otherwise your `Bash` is a cloud VM that starts empty every session: never install there, and run every command in this skill, and every `fusebase` command after it, through `device_bash`. `device_bash` exists only when a folder is connected to the chat. If it is missing, tell the user to connect the folder they work in, and stop.

Every Cowork chat gets a new, empty home in that VM, so a CLI installed there is lost and costs about 100 MB of shared disk each time. Keep the CLI and its login in the connected folder you are working in (it is under `$HOME/mnt/`), with `<dir>` as the absolute path of `<that folder>/.fusebase`. Never install into `/tmp` or `/var/tmp`.

If a download fails with `403 from proxy`, Cowork is blocking FuseBase. Tell the user to allow `thefusebase.com`, `public-api.thefusebase.com` and `app.nimbusweb.me` on the claude.ai website, not in the desktop app: Settings > Capabilities, or Organization settings > Capabilities on Team and Enterprise plans. Then try again.

a. If `<dir>/bin/fusebase` exists, do not download anything. Run `update` with the prefix from step c, then go to step c.

b. Otherwise install it:

   ```
   curl -sSL https://thefusebase.com/fusebase-cli/install-fusebase.sh | FUSEBASE_AGENT=1 FUSEBASE_INSTALL_DIR="<dir>/bin" FUSEBASE_CONFIG_DIR="<dir>/config" sh
   ```

   If the working folder has a `.gitignore` without a `.fusebase/` line, add one.

c. Shell variables do not survive between your commands. For the rest of the session, write this full prefix on every `fusebase` command: in this skill, in any other skill, and in project docs that tell you to run `fusebase`:

   ```
   FUSEBASE_CONFIG_DIR="<dir>/config" PATH="<dir>/bin:$PATH" "<dir>/bin/fusebase" <command>
   ```


### Windows

```
irm https://thefusebase.com/fusebase-cli/install-fusebase.ps1 | iex
```

Windows raises the elevation prompt and the user clicks "Yes". 
The installer bundles Node, so a first install takes a while. The script waits 90 seconds and then hands back rather than blocking.

Exit code 2 means it is still installing, not that it failed. Poll until `%PROGRAMFILES%\FuseBase CLI\fusebase.exe` exists, then continue.

Use that full path for the rest of this session, since the machine `PATH` change is invisible to the running session.


## 2. Check Node (macOS and Linux only)

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
