# Admin Email

Platform-level email: view the server's SMTP settings, send a test message through them, and manage the
system email templates. Workspace-specific templates and subscriptions are covered in
[Email](email.md) and [Email Templates](email-templates.md).

## Commands

```bash
marvin admin email settings
marvin admin email test <email>
marvin admin email templates list
marvin admin email templates get <id>
marvin admin email templates create (--data <json|@file|-> | --file <path>)
marvin admin email templates update <id> (--data <json|@file|-> | --file <path>)
marvin admin email templates test <id> <email>
marvin admin email templates delete <id> --yes
```

!!! note "Required role"
    Every `marvin admin` command needs the **SUPER_ADMIN** platform role. Without it the command fails
    with `Permission denied (403)`.

## Settings and test

```bash
marvin admin email settings
marvin admin email test admin@example.com
```

`settings` shows the SMTP configuration the server uses (host, port, username, from address and whether
TLS is on). The password is never returned, and there is no command to change the settings. `test`
sends a test message to `<email>` through the configured SMTP server and prints
`Test email sent to <email>`, or `{"ok": true, "email": "<email>"}` with `--json`. A delivery failure
comes back as an error from the server.

## Templates

System templates are the platform-wide email templates, as opposed to a workspace's own.

### List and get

```bash
marvin admin email templates list
marvin admin email templates get 9b3e41d7-5c28-4a60-8f17-0d2c6e4a7b93
```

`list` columns: `id`, `name`, `templateType`, `enabled`, `groupId`. `get` adds `description`, `subject`,
`bodyMarkdown`, `customHtml`, `availableVariables` and the created / updated timestamps.

### Create and update

```bash
marvin admin email templates create --data '{
  "templateType": "welcome",
  "name": "Welcome",
  "subject": "Welcome to Marvin",
  "bodyMarkdown": "Your account is ready.",
  "enabled": true
}'

marvin admin email templates update 9b3e41d7-5c28-4a60-8f17-0d2c6e4a7b93 --data '{"enabled": false}'
```

| Option | Description | Default |
|--------|-------------|---------|
| `--data <json\|@file\|->` | Template data as inline JSON, `@path` to read a file, or `-` for stdin | none |
| `--file <path>` | JSON file with the template data (same as `--data @path`; `-` for stdin) | none |

`create` requires `templateType`, `name`, `subject` and `enabled`; `description`, `bodyMarkdown`,
`customHtml`, `availableVariables` and `groupId` are optional. `update` takes any of `name`,
`description`, `subject`, `bodyMarkdown`, `customHtml`, `availableVariables` and `enabled` (the type and
group cannot be changed). Both print `Created email template: <id>` / `Updated email template: <id>` and then
the template.

### Test and delete

```bash
marvin admin email templates test 9b3e41d7-5c28-4a60-8f17-0d2c6e4a7b93 admin@example.com
marvin admin email templates delete 9b3e41d7-5c28-4a60-8f17-0d2c6e4a7b93 --yes
```

`test` sends the template to `<email>` and prints
`Test email for template <id> sent to <email>` (`{"ok": true, "templateId": ..., "email": ...}` with
`--json`). `delete` needs `--yes`; without it the command exits 1 without calling the API. With `--json`
the result is `{"deleted": "<id>"}`.

## Related

- [Email](email.md) - workspace SMTP test and event subscriptions
- [Email Templates](email-templates.md) - templates for a single workspace
