# Email Templates

Manage workspace email templates for system notifications and user communications.

## Commands

### List Email Templates

```bash
marvin email-templates list
```

### Get Email Template

```bash
marvin email-templates get <template-id>
```

### Create Email Template

```bash
marvin email-templates create [options]
```

### Update Email Template

```bash
marvin email-templates update <template-id> [options]
```

### Delete Email Template

```bash
marvin email-templates delete <template-id> --yes
```

### Test Send

```bash
marvin email-templates test-send <template-id> <email>
```

## Description

Email templates allow you to customize the emails sent by Marvin for various system events like user invitations, password resets, notifications, and custom triggers. Templates can use structured fields (header, message, button) or custom HTML.

## Authentication

Requires user authentication via `marvin login` and an active workspace.

```bash
marvin login
marvin workspace use <workspace>
```

## Options

### `marvin email-templates list`

| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output as JSON | `false` |
| `--yaml` | Output as YAML | `false` |
| `--output <format>` | Output format: table, json, yaml | `table` |

### `marvin email-templates get <template-id>`

| Option | Description | Default |
|--------|-------------|---------|
| `<template-id>` | Template ID (required) | - |
| `--json` | Output as JSON | `false` |
| `--yaml` | Output as YAML | `false` |
| `--output <format>` | Output format: table, json | `table` |

### `marvin email-templates create`

| Option | Description | Default |
|--------|-------------|---------|
| `--type <type>` | Template type (welcome, notification, etc.) | Required |
| `--name <name>` | Template name | Required |
| `--subject <subject>` | Email subject line | Required |
| `--description <desc>` | Template description | - |
| `--header <text>` | Header text (structured mode) | - |
| `--message-top <text>` | Message top (structured mode) | - |
| `--message-bottom <text>` | Message bottom (structured mode) | - |
| `--button-text <text>` | Button text (structured mode) | - |
| `--custom-html <html>` | Custom HTML template (overrides structured fields) | - |
| `--disabled` | Create as disabled | `false` |

### `marvin email-templates update <template-id>`

| Option | Description |
|--------|-------------|
| `<template-id>` | Template ID (required) |
| `--name <name>` | Template name |
| `--subject <subject>` | Email subject |
| `--description <desc>` | Template description |
| `--header <text>` | Header text |
| `--message-top <text>` | Message top |
| `--message-bottom <text>` | Message bottom |
| `--button-text <text>` | Button text |
| `--custom-html <html>` | Custom HTML template |
| `--enable` | Enable the template |
| `--disable` | Disable the template |

### `marvin email-templates delete <template-id>`

| Option | Description | Default |
|--------|-------------|---------|
| `<template-id>` | Template ID (required) | - |
| `--yes` | Skip confirmation prompt | Required |

### `marvin email-templates test-send <template-id> <email>`

| Option | Description |
|--------|-------------|
| `<template-id>` | Template ID (required) |
| `<email>` | Recipient email address (required) |

## Examples

### Basic Usage

List all email templates:

```bash
marvin email-templates list
```

Output:

```
┌────────────────────┬──────────────┬─────────┬────────┐
│ Name               │ Type         │ Enabled │ Scope  │
├────────────────────┼──────────────┼─────────┼────────┤
│ Welcome Email      │ welcome      │ true    │ -      │
│ Password Reset     │ reset        │ true    │ -      │
│ User Invitation    │ invite       │ true    │ -      │
│ Weekly Digest      │ notification │ false   │ -      │
└────────────────────┴──────────────┴─────────┴────────┘
```

Get a specific template:

```bash
marvin email-templates get 01234567-89ab-cdef-0123-456789abcdef
```

Output:

```
┌──────────────┬─────────────────────────────────────────┐
│ Field        │ Value                                   │
├──────────────┼─────────────────────────────────────────┤
│ ID           │ 01234567-89ab-cdef-0123-456789abcdef    │
│ Name         │ Welcome Email                           │
│ Type         │ welcome                                 │
│ Subject      │ Welcome to {{ workspace.name }}!        │
│ Enabled      │ true                                    │
│ Header       │ Welcome!                                │
│ Message Top  │ We're excited to have you.              │
└──────────────┴─────────────────────────────────────────┘
```

### Create Email Template

Create a structured template:

```bash
marvin email-templates create \
  --type welcome \
  --name "Welcome Email" \
  --subject "Welcome to {{ workspace.name }}!" \
  --header "Welcome!" \
  --message-top "We're excited to have you join our workspace." \
  --message-bottom "If you have questions, contact us anytime." \
  --button-text "Get Started"
```

Output:

```
✓ Created email template: Welcome Email
```

Create with custom HTML:

```bash
marvin email-templates create \
  --type notification \
  --name "Custom Notification" \
  --subject "New Update Available" \
  --custom-html '<html><body><h1>Custom Email</h1><p>{{ message }}</p></body></html>'
```

### Update Email Template

Update template content:

```bash
marvin email-templates update 01234567-89ab-cdef-0123-456789abcdef \
  --subject "Updated Subject Line" \
  --message-top "This message has been updated"
```

Enable or disable a template:

```bash
marvin email-templates update 01234567-89ab-cdef-0123-456789abcdef --disable
marvin email-templates update 01234567-89ab-cdef-0123-456789abcdef --enable
```

### Delete Email Template

Delete a template (requires confirmation):

```bash
marvin email-templates delete 01234567-89ab-cdef-0123-456789abcdef --yes
```

Output:

```
✓ Deleted template: 01234567-89ab-cdef-0123-456789abcdef
```

### Test Send

Send a test email:

```bash
marvin email-templates test-send 01234567-89ab-cdef-0123-456789abcdef user@example.com
```

Output:

```
✓ Test email sent successfully
  Recipient: user@example.com
```

### JSON Output

List templates as JSON:

```bash
marvin email-templates list --json
```

```json
[
  {
    "id": "01234567-89ab-cdef-0123-456789abcdef",
    "name": "Welcome Email",
    "template_type": "welcome",
    "subject": "Welcome to {{ workspace.name }}!",
    "enabled": true,
    "header_text": "Welcome!",
    "message_top": "We're excited to have you.",
    "message_bottom": "Contact us anytime.",
    "button_text": "Get Started",
    "custom_html": null,
    "createdAt": "2026-06-01T10:00:00Z",
    "updatedAt": "2026-07-01T15:30:00Z"
  }
]
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique template ID (UUID) |
| `name` | string | Template name |
| `template_type` | string | Template type identifier |
| `subject` | string | Email subject (supports variables) |
| `description` | string | Template description |
| `enabled` | boolean | Whether template is active |
| `header_text` | string | Header text (structured mode) |
| `message_top` | string | Top message content (structured mode) |
| `message_bottom` | string | Bottom message content (structured mode) |
| `button_text` | string | Call-to-action button text |
| `custom_html` | string | Custom HTML template |
| `group_id` | string | Scope/group ID if applicable |
| `createdAt` | string | ISO 8601 timestamp of creation |
| `updatedAt` | string | ISO 8601 timestamp of last update |

## Template Variables

Email templates support variables for dynamic content:

| Variable | Description |
|----------|-------------|
| `{{ workspace.name }}` | Workspace name |
| `{{ user.name }}` | User's full name |
| `{{ user.email }}` | User's email address |
| `{{ action_url }}` | Dynamic action URL (invites, resets) |
| `{{ message }}` | Custom message content |

## Use Cases

### Customize Welcome Emails

```bash
marvin email-templates update <welcome-template-id> \
  --subject "Welcome to Our Platform!" \
  --header "Hello!" \
  --message-top "Thanks for joining us. Here's what you can do next..." \
  --button-text "Start Exploring"
```

### Disable Unused Templates

```bash
# List all templates
marvin email-templates list --json | jq -r '.[] | select(.enabled == true) | .id' | while read id; do
  echo "Template: $id"
  # Disable if needed
  # marvin email-templates update $id --disable
done
```

### Test All Templates

```bash
# Test all enabled templates
marvin email-templates list --json | jq -r '.[] | select(.enabled == true) | .id' | while read id; do
  echo "Testing template: $id"
  marvin email-templates test-send $id test@example.com
done
```

### Export Templates

```bash
marvin email-templates list --json > email-templates-backup.json
```

## Scripting Examples

### Bash Script

```bash
#!/bin/bash

# List all enabled templates
echo "Enabled Email Templates:"
marvin email-templates list --json | jq -r '.[] | select(.enabled == true) | "\(.name) (\(.template_type))"'

# Count by type
echo -e "\nTemplates by Type:"
marvin email-templates list --json | jq -r '.[].template_type' | sort | uniq -c
```

### Node.js

```javascript
const { execSync } = require('child_process');

// Get all templates
const templates = JSON.parse(
  execSync('marvin email-templates list --json', { encoding: 'utf-8' })
);

console.log(`Total templates: ${templates.length}\n`);

// Test each enabled template
templates
  .filter(t => t.enabled)
  .forEach(template => {
    console.log(`Testing: ${template.name}`);
    
    try {
      execSync(
        `marvin email-templates test-send ${template.id} test@example.com`,
        { encoding: 'utf-8' }
      );
      console.log('  ✓ Test sent');
    } catch (error) {
      console.error(`  ✗ Failed: ${error.message}`);
    }
  });
```

### Python

```python
import subprocess
import json

# Get all templates
result = subprocess.run(
    ['marvin', 'email-templates', 'list', '--json'],
    capture_output=True,
    text=True
)

templates = json.loads(result.stdout)

# Group by type
by_type = {}
for template in templates:
    t_type = template['template_type']
    if t_type not in by_type:
        by_type[t_type] = []
    by_type[t_type].append(template)

print("Templates by Type:")
for t_type, items in by_type.items():
    enabled = sum(1 for t in items if t['enabled'])
    print(f"  {t_type}: {len(items)} total, {enabled} enabled")
```

## Error Handling

### 401 Unauthorized

Not authenticated:

```bash
marvin login
marvin workspace use <workspace>
```

### 404 Not Found

Template doesn't exist:

```bash
# List all templates to find valid IDs
marvin email-templates list --json | jq -r '.[].id'
```

### Test Send Failure

Invalid email address or template issue:

```bash
# Check template first
marvin email-templates get <template-id> --json

# Verify email address format
marvin email-templates test-send <template-id> valid@example.com
```

### Delete Without Confirmation

Must provide `--yes` flag:

```bash
marvin email-templates delete <template-id> --yes
```

## Related Commands

- [`marvin workspace use`](workspaces.md) - Set active workspace
- [`marvin notifications list`](notifications.md) - Notification rules that trigger emails
- [`marvin event-log list`](event-log.md) - View sent email events

## API Reference

This command calls:

```
GET /api/platform/workspaces/{workspace_id}/email-templates
GET /api/platform/workspaces/{workspace_id}/email-templates/{id}
POST /api/platform/workspaces/{workspace_id}/email-templates
PATCH /api/platform/workspaces/{workspace_id}/email-templates/{id}
DELETE /api/platform/workspaces/{workspace_id}/email-templates/{id}
POST /api/platform/workspaces/{workspace_id}/email-templates/{id}/test
```

See [API Mapping](../reference/api-mapping.md) for more details.
