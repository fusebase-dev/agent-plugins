---
name: install-cli
description: Use when the fusebase CLI is missing, out of date, or not logged in. Covers installing, updating and authenticating the FuseBase CLI on macOS, Linux and Windows.
---

# Installing the FuseBase CLI

Work through these steps in order and tell the user what you are doing as you go.

Linux arm64 has no build. If the user is on it, stop and say so.

## 1. Install or update

**macOS and Linux**

If `fusebase` resolves, run `fusebase update`. Otherwise install it:

```
curl -sSL https://thefusebase.com/fusebase-cli/install-fusebase.sh | FUSEBASE_AGENT=1 sh
```

The installer writes to `$HOME/.local/bin` and adds that directory to `PATH` through the shell rc
file, so it needs no elevation. `FUSEBASE_AGENT=1` stops it opening a browser guide.

If `fusebase update` fails on permissions (`EPERM`, `EACCES`, `Failed to replace binary`), the
machine has an older root-owned install that cannot replace itself. Ask the user to run this once in
a terminal, then install as above:

```
sudo rm /usr/local/bin/fusebase
```

**Windows**

```
irm https://thefusebase.com/fusebase-cli/install-fusebase.ps1 | iex
```

This downloads the signed installer and starts it. Windows raises the elevation prompt and the user
clicks Yes. The installer bundles Node, so it can run for several minutes; the script starts it and
polls rather than blocking.

Afterwards the CLI is on the machine `PATH`, which the running session cannot see. For the rest of
this session call it by full path:

```
%PROGRAMFILES%\FuseBase CLI\fusebase.exe
```

## 2. Check Node (macOS and Linux only)

Run `node --version`. Without Node the CLI cannot create apps. Install it with whatever the user
already has, Homebrew or nvm or apt, or ask which they prefer. The Windows installer handles Node
itself.

## 3. Authenticate

`fusebase auth` opens a browser and waits with no timeout, so it will outlive your command timeout.
Start it in the background, tell the user to finish logging in in the browser window that opened,
then poll `fusebase auth --status` until it reports a logged-in account.

## 4. Check the marketplace stays in sync

These skills change as they are tuned, and a marketplace that does not sync freezes the user on the
version they installed. Codex syncs by default. On Claude Code, ask the user to confirm *Sync
automatically* is on for the `fusebase` marketplace under **+ → Plugins**, and to turn it on if it
is not.

## 5. Report

Tell the user the CLI is ready and return to whatever you were doing.

On Windows, also tell them to restart the agent before development, because `fusebase` will not
resolve as a bare command until they do.
