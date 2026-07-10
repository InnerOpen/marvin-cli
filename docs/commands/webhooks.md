# Webhooks

Manage workspace webhooks for real-time event notifications to external services.

## Commands

### List Webhooks

```bash
marvin webhooks list
```

### Get Webhook

```bash
marvin webhooks get <id>
```

### Create Webhook

```bash
marvin webhooks create --json <json>
marvin webhooks create --file <path>
```

### Update Webhook

```bash
marvin webhooks update <id> --json <json>
marvin webhooks update <id> --file <path>
```

### Delete Webhook

```bash
marvin webhooks delete <id> --yes
```

### Test Webhook

```bash
marvin webhooks test <id>
```

### Rerun Failed Webhooks

```bash
marvin webhooks rerun
```

## Description

Webhooks allow Marvin to send real-time HTTP notifications to your external services when events occur (entry published, form submitted, user invited, etc.). Configure webhooks to integrate with tools like Slack, Discord, Zapier, or custom endpoints.

## Authentication

Requires user authentication via `marvin login` and an active workspace.

```bash
marvin login
marvin workspace use <workspace>
```

## Options

### `marvin webhooks list`

| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output as JSON | `false` |
| `--yaml` | Output as YAML | `false` |
| `--output <format>` | Output format: table, json, yaml | `table` |

### `marvin webhooks get <id>`

| Option | Description |
|--------|-------------|
| `<id>` | Webhook ID (required) |
| `--json` | Output as JSON |
| `--yaml` | Output as YAML |
| `--output <format>` | Output format: table, json |

### `marvin webhooks create`

| Option | Description |
|--------|-------------|
| `--json <json>` | Webhook data as JSON string |
| `--file <path>` | Path to JSON file with webhook data |

Either `--json` or `--file` is required.

### `marvin webhooks update <id>`

| Option | Description |
|--------|-------------|
| `<id>` | Webhook ID (required) |
| `--json <json>` | Webhook data as JSON string |
| `--file <path>` | Path to JSON file with webhook data |

### `marvin webhooks delete <id>`

| Option | Description | Default |
|--------|-------------|---------|
| `<id>` | Webhook ID (required) | - |
| `--yes` | Skip confirmation prompt | Required |

### `marvin webhooks test <id>`

| Option | Description |
|--------|-------------|
| `<id>` | Webhook ID (required) |

### `marvin webhooks rerun`

No additional options. Retries all failed webhook deliveries.

## Examples

### Basic Usage

List all webhooks:

```bash
marvin webhooks list
```

Output:

```
┌──────────────────────────────┬─────────────────┬────────────────────────────┬─────────┐
│ ID                           │ Name            │ URL                        │ Enabled │
├──────────────────────────────┼─────────────────┼────────────────────────────┼─────────┤
│ 01234567-89ab-cdef-0123-4567 │ Slack Notify    │ https://hooks.slack.com/...│ true    │
│ 89abcdef-0123-4567-89ab-cdef │ Custom Webhook  │ https://api.example.com/...│ true    │
│ cdef0123-4567-89ab-cdef-0123 │ Zapier Hook     │ https://hooks.zapier.com/..│ false   │
└──────────────────────────────┴─────────────────┴────────────────────────────┴─────────┘
```

Get a specific webhook:

```bash
marvin webhooks get 01234567-89ab-cdef-0123-4567
```

Output:

```
┌─────────────┬──────────────────────────────────────────┐
│ Field       │ Value                                    │
├─────────────┼──────────────────────────────────────────┤
│ ID          │ 01234567-89ab-cdef-0123-4567             │
│ Name        │ Slack Notify                             │
│ URL         │ https://hooks.slack.com/services/...     │
│ Enabled     │ true                                     │
│ Events      │ entry.published, form.submitted          │
└─────────────┴──────────────────────────────────────────┘
```

### Create Webhook

Create from JSON string:

```bash
marvin webhooks create --json '{
  "name": "Slack Notifications",
  "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
  "enabled": true,
  "events": ["entry.published", "entry.deleted"],
  "headers": {
    "Content-Type": "application/json"
  }
}'
```

Create from file:

```bash
cat > webhook.json <<EOF
{
  "name": "Custom Webhook",
  "url": "https://api.example.com/webhooks",
  "enabled": true,
  "events": ["*"],
  "headers": {
    "Authorization": "Bearer YOUR_TOKEN",
    "Content-Type": "application/json"
  },
  "secret": "webhook_secret_key"
}
EOF

marvin webhooks create --file webhook.json
```

Output:

```
✓ Created webhook: 01234567-89ab-cdef-0123-456789abcdef
```

### Update Webhook

Update from JSON:

```bash
marvin webhooks update 01234567-89ab-cdef-0123-4567 --json '{
  "enabled": false,
  "events": ["entry.published"]
}'
```

Update from file:

```bash
marvin webhooks update 01234567-89ab-cdef-0123-4567 --file updated-webhook.json
```

### Delete Webhook

```bash
marvin webhooks delete 01234567-89ab-cdef-0123-4567 --yes
```

Output:

```
✓ Deleted webhook: 01234567-89ab-cdef-0123-4567
```

### Test Webhook

Send a test payload to verify configuration:

```bash
marvin webhooks test 01234567-89ab-cdef-0123-4567
```

Output:

```
✓ Webhook test successful
Status code: 200
```

Or if it fails:

```
✗ Webhook test failed
Status code: 401
Error: Unauthorized
```

### Rerun Failed Webhooks

```bash
marvin webhooks rerun
```

Output:

```
Requeued failed webhooks
Requeued: 3 webhooks
```

### JSON Output

```bash
marvin webhooks list --json
```

```json
[
  {
    "id": "01234567-89ab-cdef-0123-4567",
    "name": "Slack Notify",
    "url": "https://hooks.slack.com/services/...",
    "enabled": true,
    "events": ["entry.published", "form.submitted"],
    "headers": {
      "Content-Type": "application/json"
    },
    "secret": null,
    "retryAttempts": 3,
    "timeoutMs": 5000,
    "createdAt": "2026-06-01T10:00:00Z",
    "updatedAt": "2026-07-01T15:30:00Z"
  }
]
```

## Webhook Configuration

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Webhook name |
| `url` | string | Endpoint URL (must be HTTPS in production) |
| `events` | array | Event types to trigger webhook (use `["*"]` for all) |

### Optional Fields

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `enabled` | boolean | Whether webhook is active | `true` |
| `headers` | object | Custom HTTP headers | `{}` |
| `secret` | string | Signing secret for verification | `null` |
| `retryAttempts` | number | Number of retry attempts on failure | `3` |
| `timeoutMs` | number | Request timeout in milliseconds | `5000` |

## Available Events

| Event | Description |
|-------|-------------|
| `*` | All events (wildcard) |
| `entry.created` | Entry created |
| `entry.updated` | Entry updated |
| `entry.published` | Entry published |
| `entry.unpublished` | Entry unpublished |
| `entry.deleted` | Entry deleted |
| `form.submitted` | Form submission received |
| `user.invited` | User invited to workspace |
| `collection.updated` | Collection modified |
| `asset.uploaded` | Asset uploaded |
| `asset.deleted` | Asset deleted |

## Webhook Payload

Webhooks receive a JSON payload:

```json
{
  "event": "entry.published",
  "workspace": {
    "id": "workspace-uuid",
    "slug": "workspace-slug"
  },
  "data": {
    "id": "entry-uuid",
    "slug": "entry-slug",
    "title": "Entry Title",
    "entryType": "page"
  },
  "timestamp": "2026-07-10T14:30:00Z",
  "signature": "sha256=..."
}
```

## Use Cases

### Notify Slack on Published Entry

```bash
marvin webhooks create --json '{
  "name": "Slack - Entry Published",
  "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
  "enabled": true,
  "events": ["entry.published"]
}'
```

### Trigger Netlify Build

```bash
marvin webhooks create --json '{
  "name": "Netlify Deploy",
  "url": "https://api.netlify.com/build_hooks/YOUR_HOOK_ID",
  "enabled": true,
  "events": ["entry.published", "entry.updated", "entry.deleted"],
  "headers": {
    "Content-Type": "application/json"
  }
}'
```

### Custom Integration with Authentication

```bash
marvin webhooks create --json '{
  "name": "Custom API",
  "url": "https://api.example.com/marvin-webhook",
  "enabled": true,
  "events": ["*"],
  "headers": {
    "Authorization": "Bearer YOUR_API_TOKEN",
    "X-Custom-Header": "value"
  },
  "secret": "your-signing-secret"
}'
```

### Disable All Webhooks

```bash
marvin webhooks list --json | jq -r '.[].id' | while read id; do
  marvin webhooks update $id --json '{"enabled": false}'
  echo "Disabled webhook: $id"
done
```

## Scripting Examples

### Bash Script

```bash
#!/bin/bash

# List all webhooks
echo "Active Webhooks:"
marvin webhooks list --json | jq -r '.[] | select(.enabled == true) | "\(.name) -> \(.url)"'

# Test all active webhooks
echo -e "\nTesting active webhooks:"
marvin webhooks list --json | jq -r '.[] | select(.enabled == true) | .id' | while read id; do
  echo "Testing: $id"
  if marvin webhooks test $id 2>&1 | grep -q "successful"; then
    echo "  ✓ Success"
  else
    echo "  ✗ Failed"
  fi
done
```

### Node.js

```javascript
const { execSync } = require('child_process');

// Get all webhooks
const webhooks = JSON.parse(
  execSync('marvin webhooks list --json', { encoding: 'utf-8' })
);

console.log(`Total webhooks: ${webhooks.length}`);
console.log(`Enabled: ${webhooks.filter(w => w.enabled).length}\n`);

// Test each enabled webhook
webhooks
  .filter(w => w.enabled)
  .forEach(webhook => {
    console.log(`Testing: ${webhook.name}`);
    
    try {
      const result = execSync(
        `marvin webhooks test ${webhook.id}`,
        { encoding: 'utf-8' }
      );
      
      if (result.includes('successful')) {
        console.log('  ✓ Test passed');
      } else {
        console.log('  ✗ Test failed');
      }
    } catch (error) {
      console.error(`  ✗ Error: ${error.message}`);
    }
  });
```

### Python

```python
import subprocess
import json

# Get all webhooks
result = subprocess.run(
    ['marvin', 'webhooks', 'list', '--json'],
    capture_output=True,
    text=True
)

webhooks = json.loads(result.stdout)

# Group by event type
event_counts = {}
for webhook in webhooks:
    for event in webhook.get('events', []):
        event_counts[event] = event_counts.get(event, 0) + 1

print("Webhooks by Event Type:")
for event, count in sorted(event_counts.items()):
    print(f"  {event}: {count}")

# Find broken webhooks
print("\nTesting webhooks...")
for webhook in webhooks:
    if not webhook.get('enabled'):
        continue
    
    result = subprocess.run(
        ['marvin', 'webhooks', 'test', webhook['id']],
        capture_output=True,
        text=True
    )
    
    if 'successful' not in result.stdout:
        print(f"⚠️  {webhook['name']}: Test failed")
```

## Error Handling

### 401 Unauthorized

Not authenticated:

```bash
marvin login
marvin workspace use <workspace>
```

### 404 Not Found

Webhook doesn't exist:

```bash
# List all webhooks to find valid IDs
marvin webhooks list --json | jq -r '.[].id'
```

### Webhook Test Failure

Common issues:
- Invalid URL
- Endpoint returns non-2xx status
- Timeout (endpoint too slow)
- Network/DNS issues

Check webhook configuration:

```bash
marvin webhooks get <webhook-id> --json | jq
```

### Delete Without Confirmation

Must provide `--yes` flag:

```bash
marvin webhooks delete <webhook-id> --yes
```

### Invalid JSON

When creating/updating with invalid JSON:

```bash
# Validate JSON first
echo '{"name": "test"}' | jq .

# Then create webhook
marvin webhooks create --json '{"name": "test", "url": "https://example.com", "events": ["*"]}'
```

## Security

### Webhook Signatures

When a `secret` is configured, Marvin signs webhook payloads:

```
X-Marvin-Signature: sha256=...
```

Verify in your endpoint:

```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}
```

### Best Practices

- Always use HTTPS URLs
- Set a webhook secret for verification
- Use specific events instead of `*` when possible
- Monitor webhook failures via event log
- Set reasonable timeout values
- Implement retry logic on your endpoint

## Related Commands

- [`marvin event-log list`](event-log.md) - View webhook delivery events
- [`marvin notifications list`](notifications.md) - Email notifications
- [`marvin workspace use`](workspaces.md) - Set active workspace

## API Reference

This command calls:

```
GET /api/platform/workspaces/{workspace_id}/webhooks
GET /api/platform/workspaces/{workspace_id}/webhooks/{id}
POST /api/platform/workspaces/{workspace_id}/webhooks
PATCH /api/platform/workspaces/{workspace_id}/webhooks/{id}
DELETE /api/platform/workspaces/{workspace_id}/webhooks/{id}
POST /api/platform/workspaces/{workspace_id}/webhooks/{id}/test
POST /api/platform/workspaces/{workspace_id}/webhooks/rerun
```

See [API Mapping](../reference/api-mapping.md) for more details.
