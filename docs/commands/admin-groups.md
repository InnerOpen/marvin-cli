# Admin Groups & Workspace Members

"Group" is the platform's name for a workspace. These commands create, inspect, rename and delete
workspaces across the whole platform, and manage who belongs to them, whichever workspace you are
currently in. Members of your active workspace are managed with
[`marvin platform workspace-members`](workspace-members.md), which needs only the workspace ADMIN role.

## Commands

```bash
marvin admin groups list [--page <number>] [--per-page <number>] [--all]
marvin admin groups create (--data <json|@file|-> | --file <path>)
marvin admin groups get <id>
marvin admin groups update <id> (--data <json|@file|-> | --file <path>)
marvin admin groups delete <id> --yes [--force]

marvin admin workspace-members list <workspace-id>
marvin admin workspace-members get <workspace-id> <user-id>
marvin admin workspace-members add <workspace-id> (--data <json|@file|-> | --file <path>)
marvin admin workspace-members update-role <workspace-id> <user-id> (--data <json|@file|-> | --file <path>)
marvin admin workspace-members remove <workspace-id> <user-id> --yes
```

!!! note "Required role"
    Every `marvin admin` command needs the **SUPER_ADMIN** platform role. Without it the command fails
    with `Permission denied (403)`. Member roles are the [workspace roles](../reference/authentication.md#workspace-roles):
    `OWNER`, `ADMIN`, `EDITOR`, `AUTHOR` and `VIEWER`.

## Groups

### List

```bash
marvin admin groups list
marvin admin groups list --all --json | jq -r '.[].slug'
```

| Option | Description | Default |
|--------|-------------|---------|
| `--page <number>` | Page number | `1` |
| `--per-page <number>` | Items per page | `50` |
| `--all` | Fetch every page (ignores `--page`) | off |

Columns: `id`, `name`, `slug`.

### Create, get, update

```bash
marvin admin groups create --data '{"name": "Acme Studio"}'
marvin admin groups get 5b0e8c14-2d7f-4a36-b9d1-6e3f0a7c8d25
marvin admin groups update 5b0e8c14-2d7f-4a36-b9d1-6e3f0a7c8d25 \
  --data '{"id": "5b0e8c14-2d7f-4a36-b9d1-6e3f0a7c8d25", "name": "Acme Studios"}'
```

| Option | Description | Default |
|--------|-------------|---------|
| `--data <json\|@file\|->` | Group data as inline JSON, `@path` to read a file, or `-` for stdin | none |
| `--file <path>` | JSON file with the group data (same as `--data @path`; `-` for stdin) | none |

`create` needs a `name`. `get` prints the workspace: `id`, `name`,
`slug`, its `users`, `preferences` and `webhooks`. `update` sends the group-admin schema, which has
`name` and `id` (both required by the API schema) and optional `preferences`. `create` and `update` print
`Created group: <id>` / `Updated group: <id>` and then the group.

### Delete

```bash
marvin admin groups delete 5b0e8c14-2d7f-4a36-b9d1-6e3f0a7c8d25 --yes
marvin admin groups delete 5b0e8c14-2d7f-4a36-b9d1-6e3f0a7c8d25 --yes --force
```

| Option | Description | Default |
|--------|-------------|---------|
| `--yes` | Confirm the deletion (required) | off |
| `--force` | Delete even if the group has members or content | off |

Without `--yes` the command exits 1 without calling the API. Without `--force` the server may refuse to
delete a group that still has members or content. With `--json` the result is `{"deleted": "<id>"}`.

## Workspace members

`<workspace-id>` is the group id from `admin groups list`; `<user-id>` is the id from
[`admin users list`](admin-users.md).

```bash
marvin admin workspace-members list 5b0e8c14-2d7f-4a36-b9d1-6e3f0a7c8d25
marvin admin workspace-members get 5b0e8c14-2d7f-4a36-b9d1-6e3f0a7c8d25 3f2c9d1e-7a54-4b0e-9c1a-5d8e2f6b7a10
```

`list` columns: `id`, `userId`, `groupId`, `workspaceRole`. `get` prints one membership, including the
user summary (`username`, `email`, `fullName`).

### Add, change role, remove

```bash
marvin admin workspace-members add 5b0e8c14-2d7f-4a36-b9d1-6e3f0a7c8d25 \
  --data '{"userId": "3f2c9d1e-7a54-4b0e-9c1a-5d8e2f6b7a10", "workspaceRole": "EDITOR"}'

marvin admin workspace-members update-role 5b0e8c14-2d7f-4a36-b9d1-6e3f0a7c8d25 3f2c9d1e-7a54-4b0e-9c1a-5d8e2f6b7a10 \
  --data '{"workspaceRole": "ADMIN"}'

marvin admin workspace-members remove 5b0e8c14-2d7f-4a36-b9d1-6e3f0a7c8d25 3f2c9d1e-7a54-4b0e-9c1a-5d8e2f6b7a10 --yes
```

| Option | Description | Default |
|--------|-------------|---------|
| `--data <json\|@file\|->` | Member data as inline JSON, `@path` to read a file, or `-` for stdin (`add`, `update-role`) | none |
| `--file <path>` | JSON file with the member data (same as `--data @path`; `-` for stdin) | none |
| `--yes` | Confirm the removal (`remove`; required) | off |

`add` takes `userId` and `workspaceRole`; `update-role` takes `workspaceRole`. Both print a confirmation
and the membership. `remove` without `--yes` exits 1 without calling the API; with `--json` it returns
`{"deleted": "<user-id>"}`.

## Related

- [Admin users](admin-users.md) - accounts and platform roles
- [Workspace members](workspace-members.md) - `platform workspace-members` for the active workspace
