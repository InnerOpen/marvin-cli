# Notifications

Manage workspace notification rules for automated alerts based on system events.

## Commands

### List Notifications

```bash
marvin notifications list
```

### Get Notification

```bash
marvin notifications get <id>
```

### Create Notification

```bash
marvin notifications create --json <json>
marvin notifications create --file <path>
```

### Update Notification

```bash
marvin notifications update <id> --json <json>
marvin notifications update <id> --file <path>
```

### Delete Notification

```bash
marvin notifications delete <id> --yes
```

### Test Notification

```bash
marvin notifications test <id>
```

## Description

Notifications allow you to set up automated alerts that trigger when specific events occur in your workspace. Configure email, Slack, or webhook notifications for events like entry publications, form submissions, or errors.

## Authentication

Requires user authentication via `marvin login` and an active workspace.

```bash
marvin login
marvin workspace use <workspace>
```

## Options

### `marvin notifications list`

| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output as JSON | `false` |
| `--yaml` | Output as YAML | `false` |
| `--output <format>` | Output format: table, json, yaml | `table` |

### `marvin notifications get <id>`

| Option | Description |
|--------|-------------|
| `<id>` | Notification ID (required) |
| `--json` | Output as JSON |
| `--output <format>` | Output format: table, json |

### `marvin notifications create`

| Option | Description |
|--------|-------------|
| `--json <json>` | Notification data as JSON string |
| `--file <path>` | Path to JSON file with notification data |

Either `--json` or `--file` is required.

### `marvin notifications update <id>`

| Option | Description |
|--------|-------------|
| `<id>` | Notification ID (required) |
| `--json <json>` | Notification data as JSON string |
| `--file <path>` | Path to JSON file with notification data |

### `marvin notifications delete <id>`

| Option | Description | Default |
|--------|-------------|---------|
| `<id>` | Notification ID (required) | - |
| `--yes` | Skip confirmation prompt | Required |

### `marvin notifications test <id>`

| Option | Description |
|--------|-------------|
| `<id>` | Notification ID (required) |

## Examples

### Basic Usage

List all notifications:

```bash
marvin notifications list
```

Output:

```
┌──────────────────────────────┬──────────────────────┬──────────────────┬─────────┐
│ ID                           │ Name                 │ Event Type       │ Enabled │
├──────────────────────────────┼──────────────────────┼──────────────────┼─────────┤
│ 01234567-89ab-cdef-0123-4567 │ Entry Published Alert│ entry.published  │ true    │
│ 89abcdef-0123-4567-89ab-cdef │ Form Submission      │ form.submitted   │ true    │
│ cdef0123-4567-89ab-cdef-0123 │ Webhook Failures     │ webhook.failed   │ true    │
└──────────────────────────────┴──────────────────────┴──────────────────┴─────────┘
```

Get a specific notification:

```bash
marvin notifications get 01234567-89ab-cdef-0123-456789abcdef
```

Output:

```
┌─────────────┬──────────────────────────────────────────┐
│ Field       │ Value                                    │
├─────────────┼──────────────────────────────────────────┤
│ ID          │ 01234567-89ab-cdef-0123-456789abcdef     │
│ Name        │ Entry Published Alert                    │
│ Event Type  │ entry.published                          │
│ Enabled     │ true                                     │
│ Type        │ email                                    │
│ Recipients  │ admin@example.com                        │
└─────────────┴──────────────────────────────────────────┘
```

### Create Notification

Create email notification:

```bash
marvin notifications create --json '{
  "name": "Entry Published Alert",
  "eventType": "entry.published",
  "type": "email",
  "enabled": true,
  "config": {
    "recipients": ["admin@example.com", "editor@example.com"],
    "subject": "New Entry Published",
    "template": "entry_published_notification"
  }
}'
```

Create Slack notification:

```bash
marvin notifications create --json '{
  "name": "Slack - New Form Submission",
  "eventType": "form.submitted",
  "type": "slack",
  "enabled": true,
  "config": {
    "webhookUrl": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
    "channel": "#forms",
    "username": "Marvin Bot"
  }
}'
```

Create from file:

```bash
cat > notification.json <<EOF
{
  "name": "Webhook Failure Alert",
  "eventType": "webhook.failed",
  "type": "email",
  "enabled": true,
  "config": {
    "recipients": ["devops@example.com"],
    "subject": "Webhook Delivery Failed"
  },
  "filters": {
    "severity": "high"
  }
}
EOF

marvin notifications create --file notification.json
```

Output:

```
✓ Created notification: 01234567-89ab-cdef-0123-456789abcdef
```

### Update Notification

```bash
marvin notifications update 01234567-89ab-cdef-0123-4567 --json '{
  "enabled": false
}'
```

Update from file:

```bash
marvin notifications update 01234567-89ab-cdef-0123-4567 --file updated-notification.json
```

Output:

```
✓ Updated notification: 01234567-89ab-cdef-0123-4567
```

### Delete Notification

```bash
marvin notifications delete 01234567-89ab-cdef-0123-4567 --yes
```

Output:

```
✓ Deleted notification: 01234567-89ab-cdef-0123-4567
```

### Test Notification

Send a test notification:

```bash
marvin notifications test 01234567-89ab-cdef-0123-456789abcdef
```

Output:

```
✓ Notification test successful
```

Or if it fails:

```
✗ Notification test failed
Error: Invalid email address
```

### JSON Output

```bash
marvin notifications list --json
```

```json
[
  {
    "id": "01234567-89ab-cdef-0123-456789abcdef",
    "name": "Entry Published Alert",
    "eventType": "entry.published",
    "type": "email",
    "enabled": true,
    "config": {
      "recipients": ["admin@example.com"],
      "subject": "New Entry Published",
      "template": "entry_published_notification"
    },
    "filters": {},
    "createdAt": "2026-06-01T10:00:00Z",
    "updatedAt": "2026-07-01T15:30:00Z"
  }
]
```

## Notification Configuration

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Notification name |
| `eventType` | string | Event type to trigger on |
| `type` | string | Notification type (email, slack, webhook) |

### Optional Fields

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `enabled` | boolean | Whether notification is active | `true` |
| `config` | object | Type-specific configuration | `{}` |
| `filters` | object | Event filters | `{}` |

### Notification Types

#### Email

```json
{
  "type": "email",
  "config": {
    "recipients": ["user@example.com"],
    "subject": "Event Notification",
    "template": "notification_template_name"
  }
}
```

#### Slack

```json
{
  "type": "slack",
  "config": {
    "webhookUrl": "https://hooks.slack.com/services/...",
    "channel": "#notifications",
    "username": "Marvin Bot",
    "iconEmoji": ":rocket:"
  }
}
```

#### Webhook

```json
{
  "type": "webhook",
  "config": {
    "url": "https://api.example.com/notify",
    "method": "POST",
    "headers": {
      "Authorization": "Bearer YOUR_TOKEN"
    }
  }
}
```

## Event Types

| Event Type | Description |
|------------|-------------|
| `entry.published` | Entry published |
| `entry.unpublished` | Entry unpublished |
| `entry.deleted` | Entry deleted |
| `form.submitted` | Form submission received |
| `asset.uploaded` | Asset uploaded |
| `webhook.failed` | Webhook delivery failed |
| `user.invited` | User invited to workspace |
| `error.occurred` | System error occurred |

## Use Cases

### Alert on Entry Publications

```bash
marvin notifications create --json '{
  "name": "Entry Published",
  "eventType": "entry.published",
  "type": "email",
  "enabled": true,
  "config": {
    "recipients": ["editor@example.com"],
    "subject": "Entry Published: {{ entry.title }}"
  }
}'
```

### Slack Alert for Form Submissions

```bash
marvin notifications create --json '{
  "name": "Slack - Form Submissions",
  "eventType": "form.submitted",
  "type": "slack",
  "enabled": true,
  "config": {
    "webhookUrl": "https://hooks.slack.com/services/...",
    "channel": "#forms"
  }
}'
```

### Monitor Webhook Failures

```bash
marvin notifications create --json '{
  "name": "Webhook Failure Alerts",
  "eventType": "webhook.failed",
  "type": "email",
  "enabled": true,
  "config": {
    "recipients": ["devops@example.com"],
    "subject": "⚠️ Webhook Delivery Failed"
  }
}'
```

### Disable All Notifications

```bash
marvin notifications list --json | jq -r '.[].id' | while read id; do
  marvin notifications update $id --json '{"enabled": false}'
  echo "Disabled notification: $id"
done
```

## Scripting Examples

### Bash Script

```bash
#!/bin/bash

# List all notifications
echo "Active Notifications:"
marvin notifications list --json | jq -r '.[] | select(.enabled == true) | "\(.name) (\(.eventType))"'

# Test all active notifications
echo -e "\nTesting active notifications:"
marvin notifications list --json | jq -r '.[] | select(.enabled == true) | .id' | while read id; do
  echo "Testing: $id"
  if marvin notifications test $id 2>&1 | grep -q "successful"; then
    echo "  ✓ Success"
  else
    echo "  ✗ Failed"
  fi
done
```

### Node.js

```javascript
const { execSync } = require('child_process');

// Get all notifications
const notifications = JSON.parse(
  execSync('marvin notifications list --json', { encoding: 'utf-8' })
);

console.log(`Total notifications: ${notifications.length}`);
console.log(`Enabled: ${notifications.filter(n => n.enabled).length}\n`);

// Group by event type
const byEventType = notifications.reduce((acc, notif) => {
  acc[notif.eventType] = (acc[notif.eventType] || 0) + 1;
  return acc;
}, {});

console.log('Notifications by Event Type:');
Object.entries(byEventType).forEach(([eventType, count]) => {
  console.log(`  ${eventType}: ${count}`);
});

// Group by type
const byType = notifications.reduce((acc, notif) => {
  acc[notif.type] = (acc[notif.type] || 0) + 1;
  return acc;
}, {});

console.log('\nNotifications by Type:');
Object.entries(byType).forEach(([type, count]) => {
  console.log(`  ${type}: ${count}`);
});
```

### Python

```python
import subprocess
import json

# Get all notifications
result = subprocess.run(
    ['marvin', 'notifications', 'list', '--json'],
    capture_output=True,
    text=True
)

notifications = json.loads(result.stdout)

# Analyze
total = len(notifications)
enabled = sum(1 for n in notifications if n['enabled'])
disabled = total - enabled

print(f"Notification Summary:")
print(f"  Total: {total}")
print(f"  Enabled: {enabled}")
print(f"  Disabled: {disabled}")

# Test all enabled notifications
print("\nTesting enabled notifications...")
for notif in notifications:
    if not notif['enabled']:
        continue
    
    result = subprocess.run(
        ['marvin', 'notifications', 'test', notif['id']],
        capture_output=True,
        text=True
    )
    
    status = "✓" if "successful" in result.stdout else "✗"
    print(f"  {status} {notif['name']}")
```

## Error Handling

### 401 Unauthorized

Not authenticated:

```bash
marvin login
marvin workspace use <workspace>
```

### 404 Not Found

Notification doesn't exist:

```bash
# List all notifications to find valid IDs
marvin notifications list --json | jq -r '.[].id'
```

### Test Failure

Common issues:
- Invalid email addresses
- Invalid Slack webhook URL
- Unreachable webhook endpoint
- Missing configuration

Check notification configuration:

```bash
marvin notifications get <notification-id> --json | jq .config
```

### Delete Without Confirmation

Must provide `--yes` flag:

```bash
marvin notifications delete <notification-id> --yes
```

## Related Commands

- [`marvin event-log list`](event-log.md) - View events that trigger notifications
- [`marvin webhooks list`](webhooks.md) - Webhook configuration
- [`marvin email-templates list`](email-templates.md) - Email template management

## API Reference

This command calls:

```
GET /api/platform/workspaces/{workspace_id}/notifications
GET /api/platform/workspaces/{workspace_id}/notifications/{id}
POST /api/platform/workspaces/{workspace_id}/notifications
PATCH /api/platform/workspaces/{workspace_id}/notifications/{id}
DELETE /api/platform/workspaces/{workspace_id}/notifications/{id}
POST /api/platform/workspaces/{workspace_id}/notifications/{id}/test
```

See [API Mapping](../reference/api-mapping.md) for more details.
