# User Account

Self-service commands for the signed-in user: view and edit your profile, manage personal API tokens and
change your password. They act on your own account only; to manage other people's accounts see
[Admin users](admin-users.md).

## Commands

```bash
marvin user profile show
marvin user profile update (--name <name> | --email <email>)
marvin user tokens list
marvin user tokens create --name <name> [--description <text>] [--expires <date>]
marvin user tokens get <token-id>
marvin user tokens update <token-id> (--data <json|@file|-> | --file <path>)
marvin user tokens revoke <token-id>
marvin user tokens rotate <token-id>
marvin user tokens delete <token-id>
marvin user change-password
```

These need a signed-in user (`marvin login`) but no particular role.

## Profile

```bash
marvin user profile show
marvin user profile update --name "Sam Rivera"
marvin user profile update --email sam@example.com
```

`show` prints your user record: `id`, `username`, `fullName`, `email`, `authMethod`, `platformRole`,
`group` and `workspaceMemberships`.

| Option | Description | Default |
|--------|-------------|---------|
| `--name <name>` | New display name | unchanged |
| `--email <email>` | New email address | unchanged |

`update` needs at least one option; with neither it exits 1 with `Provide at least one of --name or
--email`. It prints `Profile updated`, or `{"ok": true, "updated": {...}}` with `--json`.

## Personal API tokens

A personal API token lets scripts call the platform API as you, as you, where an interactive login
is not possible. Credentials for an application rather than a person are [API clients](api-clients.md).

!!! warning "The token value is shown once"
    `create` and `rotate` print the token value once, with a warning on stderr (`Save this token now - it
    will not be shown again!`). Store it in a secret manager straight away; `list` and `get` never show
    it.

### List and get

```bash
marvin user tokens list
marvin user tokens get 8c4e1f09-3b72-4d65-a1f8-0e9d7c2b5a36
```

`list` columns: `id`, `name`, `description`, `createdAt`, `lastUsedAt`, `expiresAt`. `get` prints one
token record: `id`, `userId`, `name`, `description`, `enabled`, `lastUsedAt`, `revokedAt`, `integrationId`
and timestamps.

### Create

```bash
marvin user tokens create --name ci-deploy --description "Nightly publish job"
marvin user tokens create --name ci-deploy --json | jq -r '.token'
```

| Option | Description | Default |
|--------|-------------|---------|
| `-n, --name <name>` | Token name (required) | |
| `-d, --description <description>` | Token description | none |
| `-e, --expires <date>` | Expiration date (ISO 8601) | none |

The output is the new token record, including `token` (the secret value). `--expires` is accepted but the
current CLI does not send it to the API, so a token created this way does not expire on that date.

### Update

```bash
marvin user tokens update 8c4e1f09-3b72-4d65-a1f8-0e9d7c2b5a36 --data '{"description": "Nightly publish"}'
marvin user tokens update 8c4e1f09-3b72-4d65-a1f8-0e9d7c2b5a36 --data '{"enabled": false}'
```

| Option | Description | Default |
|--------|-------------|---------|
| `--data <json\|@file\|->` | Token data as inline JSON, `@path` to read a file, or `-` for stdin | none |
| `--file <path>` | JSON file with the token data (same as `--data @path`; `-` for stdin) | none |

The payload may contain `name`, `description` and `enabled`; setting `enabled` to `false` turns the token
off without revoking it. Prints `Updated API token: <id>` and the token record.

### Revoke, rotate, delete

```bash
marvin user tokens revoke 8c4e1f09-3b72-4d65-a1f8-0e9d7c2b5a36
marvin user tokens rotate 8c4e1f09-3b72-4d65-a1f8-0e9d7c2b5a36
marvin user tokens delete 8c4e1f09-3b72-4d65-a1f8-0e9d7c2b5a36
```

- `revoke` invalidates the token. Prints `Token <id> revoked successfully`, or `{"deleted": "<id>"}` with
  `--json`.
- `rotate` revokes the token and creates a replacement in one step, and prints the new record including
  its new `token` value. Update whatever used the old token.
- `delete` removes the token record. Prints `Token <id> deleted successfully`, or `{"deleted": "<id>"}`.

None of the three asks for confirmation.

## Change password

```bash
marvin user change-password
```

Prompts for your current password, the new password and a confirmation, with input hidden, so nothing
lands in shell history or the process list. There are no flags; it needs an interactive terminal. It exits
1 if either value is empty or the two new passwords differ, and prints `Password changed successfully`
on success.
