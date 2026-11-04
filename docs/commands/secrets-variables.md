# Secrets and Variables

Secrets and variables are named workspace values that other configuration refers to by slug with
`{{SLUG}}` placeholders (for example in [integration](integrations.md) action arguments), so
credentials and per-environment settings stay out of the definitions that use them.

- **Secrets** are write-only: the value is encrypted when stored and no read command returns it, apart from the explicit `reveal`.
- **Variables** are plain-text key/value config; `list` shows their values.

## Commands

```bash
marvin platform secrets list
marvin platform secrets slugs
marvin platform secrets reveal <id>
marvin platform secrets create --name <name> [--value-stdin | --value <value>] [--slug <slug>] [--description <text>]
marvin platform secrets update <id> [--name <name>] [--value-stdin | --value <value>] [--description <text>]
marvin platform secrets delete <id> --yes

marvin platform variables list
marvin platform variables create --name <name> --value <value> [--slug <slug>] [--description <text>]
marvin platform variables update <id> [--name <name>] [--value <value>] [--description <text>]
marvin platform variables delete <id> --yes
```

!!! note "Required role"
    Creating, updating, deleting and revealing a secret needs the workspace **ADMIN** (or OWNER) role;
    `secrets list` and `secrets slugs` carry no role requirement in the CLI. Every `variables`
    command, reads included, needs **ADMIN**. See
    [Workspace roles](../reference/authentication.md#workspace-roles).

`<id>` is the UUID shown in the ID column of `list`.

## Slugs

`create` takes `--slug`, or derives it from `--name` when omitted. Either way the CLI normalises it
before sending: upper-cased, with every run of characters other than `A-Z` and `0-9` replaced by `_`
(`"Stripe key"` becomes `STRIPE_KEY`). Use it as `{{STRIPE_KEY}}`. A slug cannot be changed by
`update`.

## Secrets

### List and slugs

```bash
marvin platform secrets list
marvin platform secrets slugs
```

`list` shows metadata only (ID, Name, Slug, Description); values are never returned. `slugs` prints
the slugs available for `{{SLUG}}` interpolation, one per line (a JSON array with `--json`).

### Create

```bash
pass show stripe/live | marvin platform secrets create --name "Stripe key" --value-stdin --description "Live API key"
marvin platform secrets create --name "Webhook signing secret"       # prompts for the value, hidden
```

| Option | Description | Default |
|--------|-------------|---------|
| `--name <name>` | Secret name (required) | |
| `--value-stdin` | Read the value from stdin | |
| `--value <value>` | The value on the command line (deprecated) | |
| `--slug <slug>` | Slug for `{{SLUG}}` interpolation | derived from `--name` |
| `--description <description>` | Description | none |

How the value is supplied, in order:

1. `--value-stdin` reads it from a pipe (surrounding whitespace is trimmed; an empty value is an error).
2. `--value` is accepted but prints a warning, because the secret lands in your shell history. Giving both `--value` and `--value-stdin` is an error.
3. With neither, an interactive terminal prompts for it with the input hidden. Without a terminal the command fails with `No secret value: pipe it in with --value-stdin`.

Prints `Created secret: <id>` on stderr and the secret's metadata (no value) on stdout.

### Update

```bash
marvin platform secrets update 8a41f6d2-0c93-47be-9d15-6e2b7f3a1c40 --description "Rotated 2026-10"
cat new-key.txt | marvin platform secrets update 8a41f6d2-0c93-47be-9d15-6e2b7f3a1c40 --value-stdin
```

Changes the name, description and/or value; only what you pass is sent. `--value-stdin` and `--value`
behave as for `create`, except that no prompt appears: without either, the value is left alone. With
nothing to change the command exits 1 (`Provide at least one of --name, --value-stdin, or --description`).

### Reveal

```bash
marvin platform secrets reveal 8a41f6d2-0c93-47be-9d15-6e2b7f3a1c40
marvin platform secrets reveal 8a41f6d2-0c93-47be-9d15-6e2b7f3a1c40 --json | jq -r .value
```

Prints the plaintext value, as `{"value": "..."}` data on stdout (so it ends up in whatever captures
the output). It is the only command that returns a secret's value.

### Delete

```bash
marvin platform secrets delete 8a41f6d2-0c93-47be-9d15-6e2b7f3a1c40 --yes
```

`--yes` is required; without it the command exits 1. With `--json` it prints `{"deleted": "<id>"}`.

## Variables

```bash
marvin platform variables list
marvin platform variables create --name "Site URL" --value https://example.com --description "Public base URL"
marvin platform variables update 3d9c7a05-f1e2-4b68-a0c4-85e6d2b19f73 --value https://www.example.com
marvin platform variables delete 3d9c7a05-f1e2-4b68-a0c4-85e6d2b19f73 --yes
```

`list` columns: ID, Name, Slug, Value, Description.

| Option | Applies to | Description |
|--------|-----------|-------------|
| `--name <name>` | create (required), update | Variable name |
| `--value <value>` | create (required), update | Variable value |
| `--slug <slug>` | create | Slug for `{{SLUG}}` interpolation; derived from `--name` when omitted (see [Slugs](#slugs)) |
| `--description <description>` | create, update | Description |
| `--yes` | delete | Skip confirmation prompt (required; without it the command exits 1) |

`create` prints `Created variable: <id>` on stderr and the variable on stdout; `update` only sends the
fields you pass (a non-empty `--name` or `--value`, or any `--description`) and exits 1 if there are none.
