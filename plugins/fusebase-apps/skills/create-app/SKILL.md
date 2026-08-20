---
name: create-app
description: Use when the user wants to build, create or start a new app, product, internal tool or dashboard on FuseBase. Covers creating a new FuseBase product with the fusebase CLI. Not needed once a fusebase.json exists, because the project then carries its own instructions.
---

# Creating FuseBase apps

FuseBase apps are created with the `fusebase` CLI. Once a product is initialised, the generated
project has its own `AGENTS.md` and skills that cover everything after this point.

## Before you start

Run `fusebase update` to check the CLI is installed and current.

- Command not found, or the update fails: load the `install-cli` skill, follow it, then come back
  here. It handles installation, Node and login on every platform.
- Otherwise continue.

## Creating a product

1. Decide which organisation to use. Run `fusebase orgs list --json`. With one organisation, use
   it. With several, show the titles and ask which one, then take its `id`.

2. Create a new **empty** directory for the product and change into it. `init` stops in a directory
   that already has visible files in it.

3. Initialise:

   ```
   fusebase init --name "<product name>" --org <orgId> --ide claude-code
   ```

   Use `--ide codex` under Codex.

4. Read the generated `AGENTS.md` and follow it from there.

`init` never prompts you: without a terminal it exits naming the flag it needs. If it asks for
something, pass the flag it names and run it again.

## Anything else

Run `fusebase --help`. It covers auth, features, dev servers, deployment, secrets and environments.
