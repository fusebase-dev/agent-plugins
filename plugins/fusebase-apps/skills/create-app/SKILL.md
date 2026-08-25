---
name: create-app
description: Use when the user wants to build a **new** application (even if user doesn't say directly that he wants Fusebase App). Helps to initialize a new web app using FuseBase Apps functionality using `fusebase` CLI. Required only when creating a new app, therefore do not load this skill when working in already initialized applications
---

# Creating FuseBase apps

FuseBase apps are created with the `fusebase` CLI. Once a product is initialised, the generated
project has its own `AGENTS.md` and skills that cover everything after this point.

**Note**: This flow explains how to create a web application that will be hosted on FuseBase infrastructure and linked to the user's FuseBase organization. Before proceeding to initialization, ask the user if it's exactly what they need.

**Note**: This flow ends at the newly created project, not at a working app. `init` writes an `.mcp.json` that the agent only reads at startup, so the session has to be restarted before any of the work described in the generated `AGENTS.md` can begin. Tell the user this before you initialize, so the stop is expected.


## Before you start

Run `fusebase update` to check the CLI is installed and current.

- Command not found, or the update fails: load the `install-cli` skill, follow it, then come back
  here. It handles installation, Node and login on every platform.
- Otherwise continue.
- Ask user to update the FuseBase marketplace in plugin settings, use emojis to highlight the text. Separate the update message visibly.


## Creating a product

1. Decide which organisation to use. Run `fusebase orgs list --json`. With one organisation, use
   it. With several, show the titles and ask which one, then take its `id`.

2. Make sure the current dir is empty, since it's required by the app initialization command. If it's not empty, let the user know about it and suggest alternatives:
    - User clears the current directory (**never do it on your own, unless user explicitely asks for it**)
    - Create a new subdirectory (all the following work will be done in it)
    - Continue in the current directory and ignore its contents (the next step explains how to do it)
    **Note**: initialization ignores dotfiles inside the target directory, so their presence should not mark the directory as "dirty".

    **Codex only**: do not use a subdirectory. Codex cannot move to it and will not load the MCP config from there. If the current directory does not work, stop and ask the user to relaunch Codex with a new session in an empty directory.

3. Try to initialise a new product in the directory chosen on the previous step:
    ```
    fusebase init --name "<product name>" --org <orgId> --ide <agent name>
    ```
    For agent name specify who you are:
    - `claude-code`
    - `codex`

    If the directory is not empty and user approved ignoring it, use the `--force-dirty` flag to ignore the contents of the dir.

4. If the app was created outside the directory you are running in, and you have a tool that changes your working directory, use it to move to the project directory. That's needed because MCP config is read only from the directory the agent is rooted in.

5. Stop here and hand back to the user. Tell them to:
    - Restart the agent, in the project directory if you could not move there
    - Approve the FuseBase MCP servers if prompted
    - Ask you to continue once it is back
    - Provide link to the guide about agent restart `https://ai-dev.thefusebase.com/full-product-restart?agent=AGENT`, instead of AGENT put either `claude-code` or `codex`.

    Do not start on the app itself in this session until MCP is connected.

6. After the restart, read the generated `AGENTS.md` and follow it from there.

If user saying that they restarted the agent, but MCP is still not working it might be that user did not close the agent completely and they need to close it using tray(aka notification area) on windows or Dock on mac.

`init` never prompts you: without a terminal it exits naming the flag it needs. If it asks for something, pass the flag it names and run it again.


## Anything else

Run `fusebase --help` for more information on the CLI. It covers auth, features, dev servers, deployment, secrets and environments.
