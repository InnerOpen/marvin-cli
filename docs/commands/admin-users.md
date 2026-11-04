# Admin Users

Platform-wide user management: list, create, change and delete accounts, issue password reset tokens
and unlock accounts that were locked after failed sign-ins.

## Commands

```bash
marvin admin users list [--page <number>] [--per-page <number>]
marvin admin users get <id>
marvin admin users create (--data <json|@file|-> | --file <path>)
marvin admin users update <id> (--data <json|@file|-> | --file <path>)
marvin admin users delete <id> --yes
marvin admin users reset-password <user-id>
marvin admin users unlock <user-id>
```

!!! note "Required role"
    Every `marvin admin` command needs the **SUPER_ADMIN** platform role. Without it the command fails
    with `Permission denied (403)`. This is a platform role, separate from the
    [workspace roles](../reference/authentication.md#workspace-roles).

## List

```bash
marvin admin users list
marvin admin users list --page 2 --per-page 100
```

| Option | Description | Default |
|--------|-------------|---------|
| `--page <number>` | Page number | `1` |
| `--per-page <number>` | Items per page | `50` |

Columns: `id`, `username`, `fullName`, `email`, `platformRole`. One page is returned per call; there
is no `--all`, so step `--page` until a page comes back empty.

```bash
marvin admin users list --json | jq -r '.[] | select(.platformRole == "SUPER_ADMIN") | .email'
```

## Get

```bash
marvin admin users get 3f2c9d1e-7a54-4b0e-9c1a-5d8e2f6b7a10
```

Prints the full user record. Fields include `id`, `username`, `fullName`, `email`, `authMethod`
(`MARVIN`, `LDAP` or `OIDC`), `platformRole` (`NONE` or `SUPER_ADMIN`), `group` / `groupId` /
`groupSlug`, `activeGroupId`, the `admin`, `advanced`, `canInvite`,
`canManage` and `canOrganize` flags, and `workspaceMemberships`.

## Create and update

```bash
marvin admin users create --data '{
  "email": "sam@example.com",
  "username": "sam",
  "fullName": "Sam Rivera",
  "authMethod": "MARVIN",
  "platformRole": "NONE",
  "password": "<initial-password>"
}'

marvin admin users update 3f2c9d1e-7a54-4b0e-9c1a-5d8e2f6b7a10 --data '{"platformRole": "SUPER_ADMIN"}'
marvin admin users update 3f2c9d1e-7a54-4b0e-9c1a-5d8e2f6b7a10 --file ./user-patch.json
```

| Option | Description | Default |
|--------|-------------|---------|
| `--data <json\|@file\|->` | User data as inline JSON, `@path` to read a file, or `-` for stdin | none |
| `--file <path>` | JSON file with the user data (same as `--data @path`; `-` for stdin) | none |

`create` requires `email`, `authMethod`, `platformRole` and `password`; `username`, `fullName` and the
permission flags are optional. `update` takes any of `username`, `fullName`, `email`, `authMethod` and
`platformRole`. Both print `Created user: <id>` / `Updated user: <id>` on stderr and then the user.

## Delete

```bash
marvin admin users delete 3f2c9d1e-7a54-4b0e-9c1a-5d8e2f6b7a10 --yes
```

`--yes` is required: without it the command prints an error and exits 1 without calling the API. With
`--json` the result is `{"deleted": "<id>"}`.

## Reset password

```bash
marvin admin users reset-password 3f2c9d1e-7a54-4b0e-9c1a-5d8e2f6b7a10
```

Generates a password reset token for the user and prints it with the path the user opens to finish the
reset (`/reset-password?token=...`). The token is shown in full only in an interactive terminal; when
stdout is not a TTY (CI, a pipe, a log) it is masked and a warning is written to stderr, so run this
command interactively. With `--json` or `--yaml` the output is `{ userId, token, resetPath }`.
Treat the token as a credential and send it to the user over a private channel.

## Unlock

```bash
marvin admin users unlock 3f2c9d1e-7a54-4b0e-9c1a-5d8e2f6b7a10
```

Clears the lock on an account. Prints `User <id> unlocked successfully`, or `{"ok": true, "userId": "<id>"}`
with `--json`.

## Related

- [Admin groups & workspace members](admin-groups.md) - which workspaces a user belongs to
- [User account](user.md) - what a user can change about themselves
