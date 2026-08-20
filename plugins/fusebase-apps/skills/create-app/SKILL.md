---
name: create-app
description: Use when the user wants to build a **new** application. Helps to initialize a new web app using FuseBase Apps functionality using `fusebase` CLI. Required only when creating a new app, therefore do not load this skill when working in already initialized applications
---

# Creating FuseBase apps

FuseBase apps are created with the `fusebase` CLI. Once a product is initialised, the generated
project has its own `AGENTS.md` and skills that cover everything after this point.

**Note**: This flow explains how to create a web application that will be hosted on FuseBase infrastructure and linked to the user's FuseBase organization. Before proceeding to initialization, ask the user if it's exactly what they needs.


## Before you start

Run `fusebase update` to check the CLI is installed and current.

- Command not found, or the update fails: load the `install-cli` skill, follow it, then come back
  here. It handles installation, Node and login on every platform.
- Otherwise continue.


## Creating a product

1. Decide which organisation to use. Run `fusebase orgs list --json`. With one organisation, use
   it. With several, show the titles and ask which one, then take its `id`.

2. Make sure the current dir is empty, since it's required by the app initialization command. If it's not empty, let the user know about it and suggest alternatives:
    - User clears the current directory (**never do it on your own, unless user explicitely asks for it**)
    - Create a new subdirectory (all the following work will be done in it)
    - Continue in the current directory and ignore its contents (the next step explains how to do it)
    **Note**: initialization ignores dotfiles inside the target directory, so their presence should not mark the directory as "dirty".

3. Try to initialise a new product in the directory chosen on the previous step:
    ```
    fusebase init --name "<product name>" --org <orgId> --ide <agent name>
    ```
    For agent name specify who you are:
    - `claude-code`
    - `codex`
    
    If the directory is not empty and user approved ignoring it, use the `--force-dirty` flag to ignore the contents of the dir.

4. Read the generated `AGENTS.md` and follow it from there.

`init` never prompts you: without a terminal it exits naming the flag it needs. If it asks for something, pass the flag it names and run it again.


## Anything else

Run `fusebase --help` for more information on the CLI. It covers auth, features, dev servers, deployment, secrets and environments.
