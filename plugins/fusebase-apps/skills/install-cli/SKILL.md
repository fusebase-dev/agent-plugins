---
name: install-cli
description: Use when the fusebase CLI is missing, out of date, or not logged in. Covers installing, updating and authenticating the FuseBase CLI on macOS, Linux and Windows.
---


# Installing the FuseBase CLI

Work through these steps in order and tell the user what you are doing as you go.

**Claude Cowork**: if `$HOME` matches `/sessions/rcw-*`, you are in Cowork. Use the Cowork section below instead of the macOS and Linux steps.

Run the installer as given. If it fails, stop and report what it printed. Do not download the binary yourself or place it by hand: the installer owns where the CLI lives and how it updates, and working around it hides the failure and leaves a binary `fusebase update` will not replace.


## 1. Install or update

### macOS and Linux

```
curl -sSL https://thefusebase.com/fusebase-cli/install-fusebase.sh | FUSEBASE_AGENT=1 sh
```

This handles both cases. It installs to `$HOME/.local/bin` without elevation, adds that directory to `PATH` in the shell rc file, and updates in place when the CLI is already there.

If it exits reporting a previous install it cannot remove, relay its message. The user runs the one `sudo rm` line it prints, then you run the installer again.

If `$HOME/.local/bin` was not already on `PATH`, `fusebase` will not resolve until the shell restarts. Use `~/.local/bin/fusebase` for the rest of this session.


#### Claude Cowork

Every Cowork chat gets a new, empty home, so a CLI installed there is lost and costs about 100 MB of shared disk each time. Keep the CLI and its login in the connected folder you are working in (it is under `$HOME/mnt/`), with `<dir>` as the absolute path of `<that folder>/.fusebase`. If no folder is connected, use the macOS and Linux steps above instead and skip this section. Never install into `/tmp` or `/var/tmp`.

1. If `<dir>/bin/fusebase` exists, go to step 3. Do not download anything.

2. Install it:

   ```
   curl -sSL https://thefusebase.com/fusebase-cli/install-fusebase.sh | FUSEBASE_AGENT=1 FUSEBASE_INSTALL_DIR="<dir>/bin" FUSEBASE_CONFIG_DIR="<dir>/config" sh
   ```

   If the working folder has a `.gitignore` without a `.fusebase/` line, add one.

3. Shell variables do not survive between your commands, so write the full prefix on every `fusebase` command for the rest of the session, including the ones in the steps below:

   ```
   FUSEBASE_CONFIG_DIR="<dir>/config" PATH="<dir>/bin:$PATH" "<dir>/bin/fusebase" <command>
   ```

   To update the CLI, run the same prefix with `update`.


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
