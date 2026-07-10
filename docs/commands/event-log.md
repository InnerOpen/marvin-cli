# Event Log

View workspace event log and audit trail for all system activities.

## Commands

### List Events

```bash
marvin event-log list [options]
```

### Get Event

```bash
marvin event-log get <event-id>
```

### Get Entity History

```bash
marvin event-log entity <entity-id> [options]
```

### Get User Activity

```bash
marvin event-log user <user-id> [options]
```

## Description

The event log provides a complete audit trail of all activities in your workspace. Track entry publications, form submissions, user actions, webhook deliveries, and more. Use filters to find specific events or monitor user activity.

## Authentication

Requires user authentication via `marvin login` and an active workspace.

```bash
marvin login
marvin workspace use <workspace>
```

## Options

### `marvin event-log list`

| Option | Description | Default |
|--------|-------------|---------|
| `--event-type <type>` | Filter by event type (e.g., entry.published) | All types |
| `--entity-type <type>` | Filter by entity type (e.g., entry, asset) | All types |
| `--entity-id <id>` | Filter by entity ID | - |
| `--user-id <id>` | Filter by user ID | - |
| `--start-date <date>` | Filter by start date (ISO 8601) | - |
| `--end-date <date>` | Filter by end date (ISO 8601) | - |
| `--limit <number>` | Maximum number of events to return | `50` |
| `--offset <number>` | Number of events to skip | `0` |
| `--json` | Output as JSON | `false` |
| `--yaml` | Output as YAML | `false` |
| `--output <format>` | Output format: table, json, yaml | `table` |

### `marvin event-log get <event-id>`

| Option | Description |
|--------|-------------|
| `<event-id>` | Event ID (required) |
| `--json` | Output as JSON |
| `--output <format>` | Output format: table, json |

### `marvin event-log entity <entity-id>`

| Option | Description | Default |
|--------|-------------|---------|
| `<entity-id>` | Entity ID (required) | - |
| `--entity-type <type>` | Filter by entity type | - |
| `--limit <number>` | Maximum number of events | `100` |
| `--offset <number>` | Number of events to skip | `0` |
| `--json` | Output as JSON | `false` |
| `--output <format>` | Output format: table, json | `table` |

### `marvin event-log user <user-id>`

| Option | Description | Default |
|--------|-------------|---------|
| `<user-id>` | User ID (required) | - |
| `--event-type <type>` | Filter by event type | - |
| `--start-date <date>` | Filter by start date (ISO 8601) | - |
| `--end-date <date>` | Filter by end date (ISO 8601) | - |
| `--limit <number>` | Maximum number of events | `100` |
| `--offset <number>` | Number of events to skip | `0` |
| `--json` | Output as JSON | `false` |
| `--output <format>` | Output format: table, json | `table` |

## Examples

### Basic Usage

List recent events:

```bash
marvin event-log list
```

Output:

```
┌──────────────┬──────────────────┬─────────────────────┬─────────┬─────────────┬──────────────────┐
│ Event ID     │ Event Type       │ Occurred At         │ User ID │ Entity Type │ Message          │
├──────────────┼──────────────────┼─────────────────────┼─────────┼─────────────┼──────────────────┤
│ evt_abc123   │ entry.published  │ 2026-07-10 14:30:00 │ usr_001 │ entry       │ Published "About"│
│ evt_def456   │ form.submitted   │ 2026-07-10 14:25:00 │ null    │ form        │ Form submitted   │
│ evt_ghi789   │ asset.uploaded   │ 2026-07-10 14:20:00 │ usr_002 │ asset       │ Uploaded logo.png│
└──────────────┴──────────────────┴─────────────────────┴─────────┴─────────────┴──────────────────┘
```

Get a specific event:

```bash
marvin event-log get evt_abc123def456
```

Output:

```
┌─────────────┬──────────────────────────────────────────┐
│ Field       │ Value                                    │
├─────────────┼──────────────────────────────────────────┤
│ Event ID    │ evt_abc123def456                         │
│ Event Type  │ entry.published                          │
│ Occurred At │ 2026-07-10T14:30:00Z                     │
│ User ID     │ usr_001                                  │
│ Entity Type │ entry                                    │
│ Entity ID   │ 01234567-89ab-cdef-0123-456789abcdef     │
│ Message     │ Published "About Us" page                │
└─────────────┴──────────────────────────────────────────┘
```

### Filtering Events

Filter by event type:

```bash
marvin event-log list --event-type entry.published
marvin event-log list --event-type form.submitted
marvin event-log list --event-type webhook.delivered
```

Filter by entity type:

```bash
marvin event-log list --entity-type entry
marvin event-log list --entity-type asset
marvin event-log list --entity-type form
```

Filter by date range:

```bash
marvin event-log list \
  --start-date 2026-07-01T00:00:00Z \
  --end-date 2026-07-10T23:59:59Z
```

Filter by user:

```bash
marvin event-log list --user-id usr_abc123def456
```

Combine filters:

```bash
marvin event-log list \
  --event-type entry.published \
  --user-id usr_abc123 \
  --start-date 2026-07-01T00:00:00Z \
  --limit 20
```

### Entity History

View complete history for an entry:

```bash
marvin event-log entity 01234567-89ab-cdef-0123-456789abcdef
```

Output:

```
┌──────────────┬──────────────────┬─────────────────────┬─────────┬──────────────────┐
│ Event ID     │ Event Type       │ Occurred At         │ User ID │ Message          │
├──────────────┼──────────────────┼─────────────────────┼─────────┼──────────────────┤
│ evt_001      │ entry.created    │ 2026-07-01 10:00:00 │ usr_001 │ Created entry    │
│ evt_002      │ entry.updated    │ 2026-07-05 14:30:00 │ usr_001 │ Updated content  │
│ evt_003      │ entry.published  │ 2026-07-10 14:30:00 │ usr_001 │ Published entry  │
└──────────────┴──────────────────┴─────────────────────┴─────────┴──────────────────┘
```

Filter entity history by type:

```bash
marvin event-log entity 01234567-89ab-cdef-0123-4567 --entity-type entry
```

### User Activity

View all activity by a user:

```bash
marvin event-log user usr_abc123def456
```

Output:

```
┌──────────────┬──────────────────┬─────────────────────┬─────────────┬───────────┬──────────────────┐
│ Event ID     │ Event Type       │ Occurred At         │ Entity Type │ Entity ID │ Message          │
├──────────────┼──────────────────┼─────────────────────┼─────────────┼───────────┼──────────────────┤
│ evt_001      │ entry.published  │ 2026-07-10 14:30:00 │ entry       │ ent_123   │ Published "About"│
│ evt_002      │ asset.uploaded   │ 2026-07-10 13:15:00 │ asset       │ ast_456   │ Uploaded file    │
│ evt_003      │ entry.created    │ 2026-07-09 09:00:00 │ entry       │ ent_789   │ Created entry    │
└──────────────┴──────────────────┴─────────────────────┴─────────────┴───────────┴──────────────────┘
```

Filter user activity by event type:

```bash
marvin event-log user usr_abc123 --event-type entry.published
```

Filter user activity by date range:

```bash
marvin event-log user usr_abc123 \
  --start-date 2026-07-01T00:00:00Z \
  --end-date 2026-07-10T23:59:59Z
```

### JSON Output

```bash
marvin event-log list --json --limit 2
```

```json
[
  {
    "event_id": "evt_abc123def456",
    "event_type": "entry.published",
    "occurred_at": "2026-07-10T14:30:00Z",
    "user_id": "usr_001",
    "entity_type": "entry",
    "entity_id": "01234567-89ab-cdef-0123-456789abcdef",
    "message_title": "Published entry",
    "message_details": "Published 'About Us' page",
    "metadata": {
      "entry_slug": "about",
      "entry_title": "About Us"
    }
  },
  {
    "event_id": "evt_def456ghi789",
    "event_type": "form.submitted",
    "occurred_at": "2026-07-10T14:25:00Z",
    "user_id": null,
    "entity_type": "form",
    "entity_id": "form_abc123",
    "message_title": "Form submitted",
    "message_details": "Contact form submission received",
    "metadata": {
      "form_slug": "contact",
      "ip_address": "192.168.1.1"
    }
  }
]
```

## Event Types

| Event Type | Description |
|------------|-------------|
| `entry.created` | Entry created |
| `entry.updated` | Entry updated |
| `entry.published` | Entry published |
| `entry.unpublished` | Entry unpublished |
| `entry.deleted` | Entry deleted |
| `form.submitted` | Form submission received |
| `form.created` | Form created |
| `form.updated` | Form updated |
| `form.deleted` | Form deleted |
| `asset.uploaded` | Asset uploaded |
| `asset.updated` | Asset metadata updated |
| `asset.deleted` | Asset deleted |
| `webhook.delivered` | Webhook successfully delivered |
| `webhook.failed` | Webhook delivery failed |
| `user.invited` | User invited to workspace |
| `user.joined` | User accepted invitation |
| `user.removed` | User removed from workspace |
| `collection.created` | Collection created |
| `collection.updated` | Collection updated |
| `collection.deleted` | Collection deleted |

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `event_id` | string | Unique event identifier |
| `event_type` | string | Event type (see Event Types) |
| `occurred_at` | string | ISO 8601 timestamp of event |
| `user_id` | string | User who triggered event (null for system events) |
| `entity_type` | string | Type of entity affected |
| `entity_id` | string | ID of entity affected |
| `message_title` | string | Short event description |
| `message_details` | string | Detailed event description |
| `metadata` | object | Additional event-specific data |

## Use Cases

### Audit Trail

View all activity for the last 7 days:

```bash
START_DATE=$(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%SZ)
END_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ)

marvin event-log list \
  --start-date "$START_DATE" \
  --end-date "$END_DATE" \
  --limit 1000 \
  --json > audit-trail.json
```

### Track Entry Changes

```bash
# Get entry history
marvin event-log entity <entry-id> --json | jq '.[] | {
  type: .event_type,
  time: .occurred_at,
  user: .user_id,
  message: .message_title
}'
```

### Monitor User Activity

```bash
# Get today's activity for a user
TODAY=$(date -u +%Y-%m-%dT00:00:00Z)
marvin event-log user <user-id> --start-date "$TODAY" --json
```

### Find Failed Webhooks

```bash
marvin event-log list --event-type webhook.failed --json | jq -r '.[] | "\(.occurred_at): \(.message_details)"'
```

### Count Events by Type

```bash
marvin event-log list --limit 1000 --json | jq -r '.[].event_type' | sort | uniq -c | sort -rn
```

Output:

```
     42 entry.published
     28 form.submitted
     15 asset.uploaded
     12 entry.updated
      8 webhook.delivered
```

## Scripting Examples

### Bash Script

```bash
#!/bin/bash

# Daily activity report
TODAY=$(date -u +%Y-%m-%dT00:00:00Z)

echo "Daily Activity Report"
echo "Date: $(date +%Y-%m-%d)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Get today's events
EVENTS=$(marvin event-log list --start-date "$TODAY" --limit 1000 --json)

# Count by type
echo -e "\nEvents by Type:"
echo "$EVENTS" | jq -r '.[].event_type' | sort | uniq -c | sort -rn

# Count by user
echo -e "\nEvents by User:"
echo "$EVENTS" | jq -r '.[] | select(.user_id != null) | .user_id' | sort | uniq -c | sort -rn

# Failed webhooks
FAILED=$(echo "$EVENTS" | jq '[.[] | select(.event_type == "webhook.failed")]')
FAILED_COUNT=$(echo "$FAILED" | jq 'length')

if [ "$FAILED_COUNT" -gt 0 ]; then
  echo -e "\n⚠️  Failed Webhooks: $FAILED_COUNT"
  echo "$FAILED" | jq -r '.[] | "  - \(.occurred_at): \(.message_details)"'
fi
```

### Node.js

```javascript
const { execSync } = require('child_process');

// Get events from last hour
const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

const events = JSON.parse(
  execSync(
    `marvin event-log list --start-date ${oneHourAgo} --limit 500 --json`,
    { encoding: 'utf-8' }
  )
);

console.log(`Events in last hour: ${events.length}\n`);

// Group by event type
const byType = events.reduce((acc, event) => {
  acc[event.event_type] = (acc[event.event_type] || 0) + 1;
  return acc;
}, {});

console.log('Events by Type:');
Object.entries(byType)
  .sort((a, b) => b[1] - a[1])
  .forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

// Find errors
const errors = events.filter(e => 
  e.event_type.includes('failed') || 
  e.event_type.includes('error')
);

if (errors.length > 0) {
  console.log(`\n⚠️  Found ${errors.length} errors`);
  errors.forEach(e => {
    console.log(`  ${e.occurred_at}: ${e.message_title}`);
  });
}
```

### Python

```python
import subprocess
import json
from datetime import datetime, timedelta
from collections import Counter

# Get events from last 24 hours
start_date = (datetime.now() - timedelta(days=1)).isoformat() + 'Z'

result = subprocess.run(
    ['marvin', 'event-log', 'list', 
     '--start-date', start_date,
     '--limit', '1000',
     '--json'],
    capture_output=True,
    text=True
)

events = json.loads(result.stdout)

print(f"Events in last 24 hours: {len(events)}\n")

# Count by type
event_types = Counter(e['event_type'] for e in events)
print("Top Event Types:")
for event_type, count in event_types.most_common(5):
    print(f"  {event_type}: {count}")

# User activity
user_activity = Counter(
    e['user_id'] for e in events 
    if e.get('user_id')
)

print(f"\nMost Active Users:")
for user_id, count in user_activity.most_common(3):
    print(f"  {user_id}: {count} actions")

# Export to CSV
import csv

with open('events.csv', 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=[
        'event_id', 'event_type', 'occurred_at', 
        'user_id', 'entity_type', 'message_title'
    ])
    writer.writeheader()
    writer.writerows(events)

print("\nExported to events.csv")
```

## Error Handling

### 401 Unauthorized

Not authenticated:

```bash
marvin login
marvin workspace use <workspace>
```

### Invalid Date Format

Use ISO 8601 format:

```bash
# Correct
marvin event-log list --start-date 2026-07-01T00:00:00Z

# Incorrect
marvin event-log list --start-date "July 1, 2026"
```

### Too Many Results

Use pagination with limit and offset:

```bash
# Page 1
marvin event-log list --limit 100 --offset 0

# Page 2
marvin event-log list --limit 100 --offset 100

# Page 3
marvin event-log list --limit 100 --offset 200
```

## Related Commands

- [`marvin webhooks list`](webhooks.md) - Webhook configuration
- [`marvin forms submissions`](forms.md) - Form submissions
- [`marvin workspace use`](workspaces.md) - Set active workspace

## API Reference

This command calls:

```
GET /api/platform/workspaces/{workspace_id}/event-log
GET /api/platform/workspaces/{workspace_id}/event-log/{event_id}
GET /api/platform/workspaces/{workspace_id}/event-log/entity/{entity_id}
GET /api/platform/workspaces/{workspace_id}/event-log/user/{user_id}
```

See [API Mapping](../reference/api-mapping.md) for more details.
