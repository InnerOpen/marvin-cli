# Webhooks

Manage workspace webhooks for real-time event notifications to external services.

!!! note "Required role"
    Every webhook command except `types`, reads included, needs the workspace **ADMIN** (or OWNER) role. Without it the command fails with `Permission denied (403)` and names the role it needs. See [Workspace roles](../reference/authentication.md#workspace-roles).

## Commands

### List Webhooks

```bash
marvin webhooks list [--page <n>] [--per-page <n>] [--all]
```

### Get Webhook

```bash
marvin webhooks get <id>
```

### Create Webhook

```bash
marvin webhooks create --data <json|@file|->
marvin webhooks create --file <path>
```

`--data` takes inline JSON, `@path` to read a file, or `-` to read stdin. `--file <path>` is the
same as `--data @path`.

### Update Webhook

```bash
marvin webhooks update <id> --data <json|@file|->
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

### Rerun Today's Webhooks

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
| `--page <n>` | Page number | `1` |
| `--per-page <n>` | Items per page | `50` |
| `--all` | Fetch every page (ignores `--page`) | `false` |
| `--json` | Output as JSON | `false` |
| `--yaml` | Output as YAML | `false` |
| `--output <format>` | Output format: table, json, yaml | `table` |

Without `--all` the command returns one page (50 webhooks by default).

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
| `--data <payload>` | Webhook data: inline JSON, `@path` to read a file, or `-` for stdin |
| `--file <path>` | Path to a JSON file with webhook data (same as `--data @path`) |

Provide the body with `--data`, `--file`, or by piping JSON on stdin.

### `marvin webhooks update <id>`

| Option | Description |
|--------|-------------|
| `<id>` | Webhook ID (required) |
| `--data <payload>` | Webhook data: inline JSON, `@path` to read a file, or `-` for stdin |
| `--file <path>` | Path to a JSON file with webhook data (same as `--data @path`) |

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

No additional options. Re-fires today's scheduled webhooks (everything due since 00:00 UTC). The work
runs in the background; the command returns as soon as it has started, with a message only (no
count of deliveries).

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

Create from inline JSON:

```bash
marvin webhooks create --data '{
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

The confirmation goes to stderr and the created webhook to stdout:

```
✓ Created webhook: 01234567-89ab-cdef-0123-456789abcdef
```

With `--json`, stdout holds only the webhook object, so you can capture its ID:

```bash
id=$(marvin webhooks create --file webhook.json --json | jq -r .id)
```

### Update Webhook

Update from JSON:

```bash
marvin webhooks update 01234567-89ab-cdef-0123-4567 --data '{
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

Output (stderr):

```
✓ Deleted webhook: 01234567-89ab-cdef-0123-4567
```

With `--json`, stdout gets:

```json
{"deleted": "01234567-89ab-cdef-0123-4567"}
```

### Test Webhook

Send a test payload to verify configuration:

```bash
marvin webhooks test 01234567-89ab-cdef-0123-4567
```

Output (stderr):

```
✓ Webhook test scheduled
```

The test is queued; check the result with `marvin webhooks logs <id>`. With `--json`, stdout gets
`{"ok": true, "message": "..."}`.

### Rerun Today's Webhooks

Re-fire every scheduled webhook due since 00:00 UTC today:

```bash
marvin webhooks rerun
```

Output (stderr):

```
✓ Webhook posting started
```

With `--json`, stdout gets `{"ok": true, "message": "..."}`.

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
marvin webhooks create --data '{
  "name": "Slack - Entry Published",
  "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
  "enabled": true,
  "events": ["entry.published"]
}'
```

### Trigger Netlify Build

```bash
marvin webhooks create --data '{
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
marvin webhooks create --data '{
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
marvin webhooks list --all --json | jq -r '.[].id' | while read id; do
  marvin webhooks update "$id" --data '{"enabled": false}' --json > /dev/null
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
marvin webhooks list --all --json | jq -r '.[] | select(.enabled == true) | .id' | while read id; do
  echo "Testing: $id"
  # stdout is {"ok": true, ...}; the exit code is non-zero if the API refused the test
  if marvin webhooks test "$id" --json > /dev/null; then
    echo "  ✓ Test scheduled"
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
  execSync('marvin webhooks list --all --json', { encoding: 'utf-8' })
);

console.log(`Total webhooks: ${webhooks.length}`);
console.log(`Enabled: ${webhooks.filter(w => w.enabled).length}\n`);

// Test each enabled webhook
webhooks
  .filter(w => w.enabled)
  .forEach(webhook => {
    console.log(`Testing: ${webhook.name}`);
    
    try {
      // stdout is {"ok": true, ...}; a refused test throws (non-zero exit)
      const result = JSON.parse(execSync(
        `marvin webhooks test ${webhook.id} --json`,
        { encoding: 'utf-8' }
      ));
      console.log(result.ok ? '  ✓ Test scheduled' : '  ✗ Test failed');
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
    ['marvin', 'webhooks', 'list', '--all', '--json'],
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
marvin webhooks create --data '{"name": "test", "url": "https://example.com", "events": ["*"]}'
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
- [`marvin workspace use`](workspaces.md) - Set active workspace

## API Reference

This command calls:

```
GET    /api/groups/webhooks?page=&perPage=
GET    /api/groups/webhooks/{id}
POST   /api/groups/webhooks
PUT    /api/groups/webhooks/{id}
DELETE /api/groups/webhooks/{id}
GET    /api/groups/webhooks/{id}/test
GET    /api/groups/webhooks/rerun
```

See [API Mapping](../reference/api-mapping.md) for more details.
