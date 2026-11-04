# API Clients

An API client is a named token for the Publishing API (`marvin publish ...`). Each workspace can have
several, for example one per site or environment. These commands create them, edit them, and rotate
their tokens.

## Commands

```bash
marvin platform api-clients list
marvin platform api-clients get <id>
marvin platform api-clients create (--name <name> [--description <text>] | --data <json|@file|-> | --file <path>)
marvin platform api-clients update <id> (--name <name> | --description <text> | --data <json|@file|-> | --file <path>)
marvin platform api-clients delete <id> --yes
marvin platform api-clients rotate-token <id>
marvin platform api-clients preview <id>
```

!!! note "Required role"
    Every API client command, reads included, needs the workspace **ADMIN** (or OWNER) role. Without
    it the command fails with `Permission denied (403)` and names the role it needs. See
    [Workspace roles](../reference/authentication.md#workspace-roles).

`<id>` is the client's UUID (the ID column of `list`).

## List, get, preview

```bash
marvin platform api-clients list
marvin platform api-clients get 7c1e5d3a-2b9f-4e0a-8d64-5f3a9b1c0e22
marvin platform api-clients preview 7c1e5d3a-2b9f-4e0a-8d64-5f3a9b1c0e22
```

`list` columns: ID, Name, Description (first 50 characters), Created. `get` prints the full record
(slug, enabled, permissions, last-used and created timestamps). `preview` prints the same record as
the server returns it for a preview, which shows the token prefix and metadata without revealing the
full token. Neither returns the token itself; that is only shown when a client is created or its
token is rotated.

## Create

```bash
marvin platform api-clients create --name "Production site" --description "Token for the live website"
marvin platform api-clients create --data '{"name": "Staging", "slug": "staging"}'
```

| Option | Description |
|--------|-------------|
| `--name <name>` | Client name; a quick way to create without a JSON body |
| `--description <description>` | Client description (used with `--name`) |
| `--data <json\|@file\|->` | Full body as inline JSON, `@path`, or `-` for stdin |
| `--file <path>` | Path to a JSON file (same as `--data @path`; `-` for stdin) |

`--data` / `--file` win over `--name`. Without any of them the command exits 1 with
`Provide API client data via --data, --file, or --name`. The body accepts `name` (required), `slug`,
`description` and `permissions`.

The response includes the client's **token**, shown once. It is printed on stderr as
`Token: <token>`; when stdout is not a terminal (CI, pipes, logs) that line is masked to the first
and last four characters. The record printed on stdout (`--json` etc.) is the server's response and
includes the full `token` field, so capture it from there in scripts:

```bash
TOKEN=$(marvin platform api-clients create --name "CI build" --json | jq -r .token)
export MARVIN_SITE_CLIENT_TOKEN="$TOKEN"
```

## Update

```bash
marvin platform api-clients update 7c1e5d3a-2b9f-4e0a-8d64-5f3a9b1c0e22 --description "Live site, EU"
marvin platform api-clients update 7c1e5d3a-2b9f-4e0a-8d64-5f3a9b1c0e22 --data '{"enabled": false}'
```

`--name` and `--description` are shortcuts; `--data` / `--file` can also set `permissions` and
`enabled` (set `enabled` to `false` to switch a client off without deleting it). With no option the
command exits 1 with `Provide API client data via --data, --file, --name, or --description`. The
token is not changed.

## Rotate token

```bash
marvin platform api-clients rotate-token 7c1e5d3a-2b9f-4e0a-8d64-5f3a9b1c0e22
```

Generates a new token and invalidates the old one immediately; every site or job using the old token
starts failing with 401 until it is updated. The new token is shown once, as for `create`
(`New Token: ...` on stderr, `token` in the stdout record).

## Delete

```bash
marvin platform api-clients delete 7c1e5d3a-2b9f-4e0a-8d64-5f3a9b1c0e22 --yes
```

| Option | Description |
|--------|-------------|
| `--yes` | Skip confirmation prompt (required; without it the command exits 1) |

With `--json` the result is `{"deleted": "<id>"}`.
