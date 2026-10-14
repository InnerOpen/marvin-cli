# Workspace Members and Invites

Who can work in a workspace: `platform invites` creates and revokes invitation links for new people,
and `platform workspace-members` lists, adds, re-roles and removes people who already have a user
account. Both are workspace-ADMIN tools. A SUPER_ADMIN managing memberships across workspaces uses
`marvin admin workspace-members`, documented in [admin-groups](admin-groups.md).

## Commands

```bash
marvin platform invites list [--page <n>] [--per-page <n>] [--all]
marvin platform invites invite [--email <email>] [--uses <n>] [--role <role>]
marvin platform invites link --token <token>
marvin platform invites revoke --id <id> [--yes]

marvin platform workspace-members list <workspace-id>
marvin platform workspace-members get <workspace-id> <user-id>
marvin platform workspace-members add <workspace-id> (--user-id <id> --role <role> | --data <json|@file|-> | --file <path>)
marvin platform workspace-members update-role <workspace-id> <user-id> (--role <role> | --data <json|@file|-> | --file <path>)
marvin platform workspace-members remove <workspace-id> <user-id> --yes
```

!!! note "Required role"
    Every command here, reads included, needs the workspace **ADMIN** (or OWNER) role. Without it the
    command fails with `Permission denied (403)` and names the role it needs. See
    [Workspace roles](../reference/authentication.md#workspace-roles).

## Invites

An invitation is a token with a role and a number of uses. Its link lets a person join the workspace with that role.

### List

```bash
marvin platform invites list
marvin platform invites list --all --json
```

| Option | Description | Default |
|--------|-------------|---------|
| `--page <number>` | Page number | `1` |
| `--per-page <number>` | Items per page | `50` |
| `--all` | Fetch every page (ignores `--page`) | off |

Columns: Token (first 20 characters), Role, Uses Left, Created. Table output ends with
`Total: <n> invitation token(s)`; with no invitations it prints `No invitation tokens found`.

### Invite

```bash
marvin platform invites invite --role AUTHOR
marvin platform invites invite --email ada@example.com --role EDITOR
marvin platform invites invite --uses 10 --role VIEWER
```

Creates an invitation token and prints its link; with `--email` it also emails the link.

| Option | Description | Default |
|--------|-------------|---------|
| `--email <email>` | Send the invitation to this address (validated first) | none (just print the link) |
| `--uses <number>` | Number of uses allowed | `1` |
| `--role <role>` | Role for invited users: `VIEWER`, `AUTHOR`, `EDITOR`, `ADMIN`, `OWNER` | `EDITOR` |

In table mode the invitation URL is the only thing written to stdout, so
`URL=$(marvin platform invites invite)` captures it; the token, role and remaining uses go to stderr.
If the email cannot be sent the command says so and still prints the URL to share by hand. The token
is shown in full only on a terminal; otherwise it is masked (first and last four characters) in the
`Token:` line and in the JSON `token` field. The invitation URL always contains the full token, so
treat it as a credential. With `--json` the output is `{token, inviteUrl, usesLeft, workspaceRole}`, or
`{token, inviteUrl, email, emailSent, error}` when `--email` is given.

### Link

```bash
marvin platform invites link --token 5Xk2...
```

Prints the invitation URL for an existing token (`--token <token>`, required), as `{"inviteUrl": ...}`
with `--json`. It builds the URL locally and does not check that the token is valid.

### Revoke

```bash
marvin platform invites revoke --id 0e6b94c2-1d73-4a58-9f20-b3c71a5d8e46 --yes
```

| Option | Description |
|--------|-------------|
| `--id <id>` | Invitation token ID (required) |
| `--yes` | Skip confirmation |

The link stops working. Without `--yes` the command asks `Revoke this invitation? The link will stop working. (y/N)` and cancels
on anything but `y`. With `--json` it prints `{"deleted": "<id>"}`.

## Workspace members

`<workspace-id>` is the workspace's UUID (`marvin workspace list` shows it) and `<user-id>` the
user's UUID.

### List and get

```bash
marvin platform workspace-members list 5a8f0c3e-7d12-4b94-a6e1-92c4d0b7f358
marvin platform workspace-members get 5a8f0c3e-7d12-4b94-a6e1-92c4d0b7f358 c19d3f70-8a24-4e6b-b0d5-7f2e91a4c638
```

`list` columns: User ID, Username, Email, Role, Joined (date). `get` prints one member in full.

### Add

```bash
marvin platform workspace-members add 5a8f0c3e-7d12-4b94-a6e1-92c4d0b7f358 --user-id c19d3f70-8a24-4e6b-b0d5-7f2e91a4c638 --role ADMIN
marvin platform workspace-members add 5a8f0c3e-7d12-4b94-a6e1-92c4d0b7f358 --data '{"user_id": "c19d3f70-8a24-4e6b-b0d5-7f2e91a4c638", "workspace_role": "VIEWER"}'
```

| Option | Description |
|--------|-------------|
| `--user-id <id>` | User ID to add |
| `--role <role>` | Workspace role: `OWNER`, `ADMIN`, `MEMBER` or `VIEWER` (case-insensitive) |
| `--data <json\|@file\|->` | Full body as inline JSON, `@path`, or `-` for stdin |
| `--file <path>` | Path to a JSON file (same as `--data @path`) |

The flags form is used only when **both** `--user-id` and `--role` are given and there is no
`--data`/`--file`; otherwise the body is read from `--data`, `--file` or piped stdin, with keys
`user_id` and `workspace_role`. A `workspace_role` outside the four values above is rejected before
anything is sent (`Invalid role. Must be one of: OWNER, ADMIN, MEMBER, VIEWER`). Prints
`Added user to workspace with role: <role>` on stderr and the member on stdout.

### Update role

```bash
marvin platform workspace-members update-role 5a8f0c3e-7d12-4b94-a6e1-92c4d0b7f358 c19d3f70-8a24-4e6b-b0d5-7f2e91a4c638 --role VIEWER
```

Takes `--role <role>` (new role, same four values, case-insensitive) or a body via `--data` /
`--file` / stdin (`{"workspace_role": "ADMIN"}`); the same role check applies. Prints
`Updated member role to: <role>` and the member.

### Remove

```bash
marvin platform workspace-members remove 5a8f0c3e-7d12-4b94-a6e1-92c4d0b7f358 c19d3f70-8a24-4e6b-b0d5-7f2e91a4c638 --yes
```

`--yes` is required (`Remove requires --yes confirmation flag` and exit 1 otherwise). With `--json` it
prints `{"deleted": "<user-id>"}`. The user account itself is not deleted.
