# Authentication Commands

Save and clear the tokens the CLI uses, and handle the public account flows (register, password
reset). These are top-level commands, not part of a group.

## Commands

```bash
marvin login [--user-token <token>] [--site-token <token>] [--workspace <slug>]
marvin logout [--site-token | --all]
marvin register [--email <email>] [--password <password>] [--data <json|@file|->] [--file <path>]
marvin forgot-password <email>
marvin reset-password --token <token> --password <newPassword>
```

There is no `marvin auth ...` group and no `whoami` command. To see who you are, use
`marvin user profile show` ([User](user.md)); to see the active workspace, use
`marvin workspace current` ([Workspaces](workspaces.md#workspace-current)).

The CLI authenticates with **tokens**, not an email and password: a *user token* for the Platform
and Admin APIs, and a per-workspace *site client token* for the Publishing API. Create a user token
in the Marvin UI or with `marvin user tokens create` ([User](user.md)); site client tokens are
managed under [API clients](api-clients.md). See also the
[Authentication Reference](../reference/authentication.md).

## Login

Validates the token against the server, then saves it to `~/.marvin/credentials.json`.

| Option | Description | Default |
|--------|-------------|---------|
| `--user-token <token>` | User token for Platform access. If omitted (and `MARVIN_USER_TOKEN` is unset) you are prompted, with hidden input. | Prompt |
| `--site-token <token>` | Site client token for Publishing access. Saved for the workspace given by `--workspace`, or the active workspace. | none |
| `--workspace <slug>` | Workspace slug. Required when saving a site token and no workspace is active; with a user token it also becomes the active workspace. | none |

The API URL must be known (`--api-url`, `MARVIN_API_URL`, or a previously saved one).

- With neither token option, `login` prompts for a user token.
- With only `--site-token`, only the site token is validated and saved; no user-token prompt.
- A user token given by `--user-token` or `MARVIN_USER_TOKEN` is saved alongside any site token.
- The first saved site token also becomes the active workspace if none is set.

```bash
# Interactive: prompts for the user token
marvin login --api-url https://marvin.example.com

# Non-interactive, and select the workspace
marvin login --user-token "$MARVIN_USER_TOKEN" --workspace acme

# Publishing API only
marvin login --site-token marvin_sk_xxx --workspace acme
```

After a user login without `--workspace`, pick one with `marvin workspace use <slug>`.

## Logout

Clears saved credentials.

| Option | Description | Default |
|--------|-------------|---------|
| `--site-token` | Clear only the site token of the active workspace | `false` |
| `--all` | Clear everything (user token, site tokens, active workspace, API URL) | `false` |

With no option only the user token is removed and site tokens are kept.

```bash
marvin logout
marvin logout --site-token
marvin logout --all
```

## Register

Creates a user account. Public: no token is needed, only an API URL. The payload is the registration
data; `--email` and `--password` override the same fields in `--data` / `--file` / piped stdin.

| Option | Description | Default |
|--------|-------------|---------|
| `--email <email>` | User email | none |
| `--password <password>` | User password | none |
| `--data <json\|@file\|->` | Registration data as JSON, `@path` to read a file, or `-` for stdin | none |
| `--file <path>` | JSON file with registration data (same as `--data @path`) | none |

Registration data fields: `username`, `email`, `full_name`, `password` and `password_confirm`, plus
optional `group_token`, `group`, `advanced`, `private` and `seed_data`.

```bash
marvin register --data '{"username":"jo","email":"jo@example.com","full_name":"Jo Doe","password":"s3cret-pass","password_confirm":"s3cret-pass"}'
marvin register --file new-user.json --email jo@example.com
```

On success it prints `Registered user: <email>` followed by the created user.

## Forgot and reset password

`forgot-password` asks the server to email a reset link. It always reports success, whether or not the
address exists. `reset-password` sets a new password using the token from that email; both options
are required.

```bash
marvin forgot-password jo@example.com
marvin reset-password --token <token-from-email> --password 'a-new-s3cret-pass'
```

Prefer `--password` from an environment variable or a prompt wrapper over typing it on a shared
shell, as it is visible in shell history.

## Credential sources

| Credential | Resolved from (first match wins) |
|------------|----------------------------------|
| User token (Platform, Admin) | `MARVIN_USER_TOKEN`, then saved credentials. There is no command-line flag for it on other commands. |
| Site client token (Publishing) | `--site-token` / `--token` on `marvin publish`, saved token for the workspace, then `MARVIN_SITE_CLIENT_TOKEN` |
| API URL | `--api-url`, `MARVIN_API_URL`, then saved credentials |

## CI

```bash
export MARVIN_API_URL=https://marvin.example.com
export MARVIN_USER_TOKEN=...        # from your secret store
export MARVIN_WORKSPACE_SLUG=acme
marvin platform entries list
```

No `login` is needed when the environment variables are set.

## Related

- [Workspaces](workspaces.md)
- [User](user.md)
- [Environment Variables](../reference/environment-variables.md)
- [Authentication Reference](../reference/authentication.md)
