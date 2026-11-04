# Email Templates

Workspace email templates customise the emails Marvin sends. A template has a type (the kind of email
it replaces or adds), a subject, and either a Markdown body (rendered in the default layout) or custom HTML.
These commands manage the current workspace's templates. System-level templates and SMTP are in
[Email](email.md); sending an email on an event is set up with
[email subscriptions](email.md#email-subscriptions).

## Commands

```bash
marvin platform email-templates list
marvin platform email-templates get <template-id>
marvin platform email-templates create --type <type> --name <name> --subject <subject> [options]
marvin platform email-templates update <template-id> [options]
marvin platform email-templates delete <template-id> --yes
marvin platform email-templates event-connections <group-id>
marvin platform email-templates test-send <template-id> <email>
```

`platform templates` is an alias for `platform email-templates`; `list` also answers to `ls`,
`delete` to `rm`, and `test-send` to `test`.

!!! note "Required role"
    Listing and reading templates is open to any workspace member. Creating, updating, deleting and
    test-sending templates, and `event-connections`, need the workspace **ADMIN** (or OWNER) role.
    See [Workspace roles](../reference/authentication.md#workspace-roles).

`list`, `get`, `create`, `update`, `delete` and `test-send` all act on the current workspace (the one
from `--workspace` or `marvin workspace use`).

## List and get

```bash
marvin platform email-templates list
marvin platform email-templates get 9b3e41d7-5c28-4a60-8f17-0d2c6e4a7b93 --json
```

`list` columns: Name, Type, Enabled, Scope (`workspace` for the workspace's own templates, `system`
for the built-in defaults). `get` prints the full template.

## Create

```bash
marvin platform email-templates create \
  --type welcome --name "Welcome" --subject "Welcome to Marvin" \
  --body "Your account is ready."
```

| Option | Description | Default |
|--------|-------------|---------|
| `--type <type>` | Template type, for example `welcome` or `notification` (required) | |
| `--name <name>` | Template name (required) | |
| `--subject <subject>` | Email subject (required) | |
| `--description <desc>` | Template description | none |
| `--body <markdown>` | Markdown body, rendered in the default layout (sent as `bodyMarkdown`) | none |
| `--custom-html <html>` | Custom HTML; overrides `--body` | none |
| `--disabled` | Create the template disabled | enabled |

The API has no separate header, message or button fields, so use `--body` (or `--custom-html`). The
variables available for a template type are shown by
[`marvin platform email template-vars --type <type>`](email.md#template-variables). The created
template is printed on stdout and `Created email template: <name>` on stderr.

## Update

```bash
marvin platform email-templates update 9b3e41d7-5c28-4a60-8f17-0d2c6e4a7b93 --subject "Welcome!" --disable
marvin platform email-templates update 9b3e41d7-5c28-4a60-8f17-0d2c6e4a7b93 --custom-html "$(cat welcome.html)"
```

| Option | Description |
|--------|-------------|
| `--name <name>` | Template name |
| `--subject <subject>` | Email subject |
| `--description <desc>` | Template description |
| `--body <markdown>` | Markdown body, rendered in the default layout |
| `--custom-html <html>` | Custom HTML template (overrides `--body`) |
| `--enable` | Enable the template |
| `--disable` | Disable the template |

Only the options you pass are sent, and an empty value is ignored, so a field cannot be cleared from
the command line. The type cannot be changed.

## Delete

```bash
marvin platform email-templates delete 9b3e41d7-5c28-4a60-8f17-0d2c6e4a7b93 --yes
```

`--yes` confirms (default off); without it the command prints `Delete template? Use --yes to
confirm` and exits 1. With `--json` it prints `{"deleted": "<id>"}`.

## Event connections

```bash
marvin platform email-templates event-connections 5a8f0c3e-7d12-4b94-a6e1-92c4d0b7f358
```

Lists the event connections available for the workspace's email templates. `<group-id>` is the
workspace id (shown by `marvin workspace list`). The result is printed as returned by the server.

## Test send

```bash
marvin platform email-templates test-send 9b3e41d7-5c28-4a60-8f17-0d2c6e4a7b93 me@example.com
```

Sends a test email using the template to `<email>`. Prints the server's message and
`Recipient: <email>` on stderr; with `--json`, `{"ok": true, "message": "...", "recipient": "..."}`.
To check the SMTP configuration itself, use
[`marvin platform email test-smtp`](email.md#smtp-and-system-templates).
