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

1. Decide which organisation to use. If the user belongs to more than one, list them and ask. The
   CLI cannot prompt in this mode.

2. Create a new **empty** directory for the product and change into it. `init` refuses to run in a
   directory that already has files in it.

3. Initialise:

   ```
   fusebase init --non-interactive --name "<product name>" --org <orgId> \
     --coding-agent claude_code --model <your model id>
   ```

   Use `--coding-agent codex` under Codex. Set `--model` to the model you are running as, and drop
   the flag if you do not know it rather than guessing.

4. Read the generated `AGENTS.md` and follow it from there.

## Anything else

Run `fusebase --help`. It covers auth, features, dev servers, deployment, secrets and environments.
