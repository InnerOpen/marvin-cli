# Email

Two groups cover the email side of a workspace: `platform email` handles the system-level email
templates and the SMTP test, and `platform email-subscriptions` decides which events send which
template to whom. Workspace-specific templates live in [Email Templates](email-templates.md). The
admin-side email settings are under `marvin admin email`; see [admin-email](admin-email.md).

## Commands

```bash
marvin platform email template-vars --type <type>
marvin platform email get-template <id>
marvin platform email update-template <id> (--data <json|@file|-> | --file <path>)
marvin platform email test-template <id> <email>
marvin platform email test-smtp <email>

marvin platform email-subscriptions list
marvin platform email-subscriptions get <id>
marvin platform email-subscriptions create --template-id <id> --event-type <type> [--recipient-type <type>] [--recipient-email <email>] [--recipient-field <field>]
marvin platform email-subscriptions delete <id> --yes
```

!!! note "Required role"
    `update-template`, `test-template` and `test-smtp`, and every `email-subscriptions` command, reads
    included, need the workspace **ADMIN** (or OWNER) role. `template-vars` and `get-template` carry
    no role requirement in the CLI. See
    [Workspace roles](../reference/authentication.md#workspace-roles).

## Template variables

```bash
marvin platform email template-vars --type welcome
```

Shows the variables available to a template of the given type. `--type <type>` is required.

## SMTP and system templates

System templates are the built-in defaults, addressed by id (the `list` in
[Email Templates](email-templates.md#list-and-get) marks them with Scope `system`).

```bash
marvin platform email get-template 2e7d9a14-6c05-4b3f-81a8-d4f0c5b92e67
marvin platform email update-template 2e7d9a14-6c05-4b3f-81a8-d4f0c5b92e67 --data '{"subject": "Reset your Marvin password"}'
marvin platform email test-template 2e7d9a14-6c05-4b3f-81a8-d4f0c5b92e67 me@example.com
marvin platform email test-smtp me@example.com
```

| Command | What it does |
|---------|--------------|
| `get-template <id>` | Prints a system email template |
| `update-template <id>` | Updates it from a JSON body: `--data <json\|@file\|->` (inline JSON, `@path`, or `-` for stdin) or `--file <path>`. Fields: `name`, `description`, `subject`, `bodyMarkdown`, `customHtml`, `availableVariables`, `enabled`. Prints `Updated system template: <id>` on stderr and the template on stdout |
| `test-template <id> <email>` | Sends a test email using the system template to `<email>` |
| `test-smtp <email>` | Sends a test email to `<email>` to check the SMTP configuration |

`test-template` and `test-smtp` print the server's message and `Recipient: <email>` on stderr; with
`--json` the result is `{"ok": true, "message": "...", "recipient": "..."}`.

## Email subscriptions

A subscription sends an email template when an event happens.

```bash
marvin platform email-subscriptions list
marvin platform email-subscriptions get 6f20b8c1-3a4e-49d7-b5e2-1c9d07a8f344
marvin platform email-subscriptions create --template-id 9b3e41d7-5c28-4a60-8f17-0d2c6e4a7b93 --event-type entry.published
marvin platform email-subscriptions create --template-id 9b3e41d7-5c28-4a60-8f17-0d2c6e4a7b93 \
  --event-type form.submitted --recipient-type specific --recipient-email ops@example.com
marvin platform email-subscriptions delete 6f20b8c1-3a4e-49d7-b5e2-1c9d07a8f344 --yes
```

`list` columns: ID, Template ID, Event Type, Recipient Type, Enabled. `get` prints the full
subscription.

`create` options:

| Option | Description | Default |
|--------|-------------|---------|
| `--template-id <id>` | Email template ID (required) | |
| `--event-type <type>` | Event type to subscribe to, for example `entry.published` (required) | |
| `--recipient-type <type>` | `admins`, `specific` or `event_field` | `admins` |
| `--recipient-email <email>` | Recipient address, for `specific` | none |
| `--recipient-field <field>` | Field of the event payload holding the recipient's address, for `event_field` | none |

It prints `Created email subscription: <id>` on stderr and the subscription on stdout. `delete`
requires `--yes` (without it the command exits 1); with `--json` it prints `{"deleted": "<id>"}`.
There is no `update`: delete and recreate to change a subscription.
