# Scheduled Tasks

Manage automated scheduled tasks for workspace maintenance and operations.

## Commands

### List Scheduled Tasks

```bash
marvin scheduled-tasks list [options]
```

### Get Scheduled Task

```bash
marvin scheduled-tasks get <id-or-slug>
```

### Create Scheduled Task

```bash
marvin scheduled-tasks create --json <json>
marvin scheduled-tasks create --file <path>
```

### Update Scheduled Task

```bash
marvin scheduled-tasks update <id-or-slug> [options]
```

### Delete Scheduled Task

```bash
marvin scheduled-tasks delete <id-or-slug> --yes
```

### Run Scheduled Task

```bash
marvin scheduled-tasks run <id-or-slug>
```

### View Task History

```bash
marvin scheduled-tasks history <id-or-slug> [options]
```

### List Task Types

```bash
marvin scheduled-tasks types [--detailed]
```

### View Statistics

```bash
marvin scheduled-tasks stats
```

## Description

Scheduled tasks automate recurring operations like cleanup, backups, data synchronization, and custom workflows. Configure tasks to run at intervals, specific times, or on cron schedules.

## Authentication

Requires user authentication via `marvin login` and an active workspace.

```bash
marvin login
marvin workspace use <workspace>
```

## Options

### `marvin scheduled-tasks list`

| Option | Description | Default |
|--------|-------------|---------|
| `--enabled-only` | Show only enabled tasks | `false` |
| `--failed-only` | Show only failed tasks | `false` |
| `--json` | Output as JSON | `false` |
| `--yaml` | Output as YAML | `false` |
| `--output <format>` | Output format: table, json, yaml | `table` |

### `marvin scheduled-tasks get <id-or-slug>`

| Option | Description |
|--------|-------------|
| `<id-or-slug>` | Task ID or slug (required) |
| `--json` | Output as JSON |
| `--output <format>` | Output format: table, json |

### `marvin scheduled-tasks create`

| Option | Description |
|--------|-------------|
| `--json <json>` | Task data as JSON string |
| `--file <path>` | Path to JSON file with task data |

### `marvin scheduled-tasks update <id-or-slug>`

| Option | Description |
|--------|-------------|
| `<id-or-slug>` | Task ID or slug (required) |
| `--json <json>` | Task data as JSON string |
| `--file <path>` | Path to JSON file with task data |
| `--enable` | Enable the task |
| `--disable` | Disable the task |

### `marvin scheduled-tasks delete <id-or-slug>`

| Option | Description | Default |
|--------|-------------|---------|
| `<id-or-slug>` | Task ID or slug (required) | - |
| `--yes` | Skip confirmation prompt | Required |

### `marvin scheduled-tasks run <id-or-slug>`

| Option | Description |
|--------|-------------|
| `<id-or-slug>` | Task ID or slug (required) |

### `marvin scheduled-tasks history <id-or-slug>`

| Option | Description | Default |
|--------|-------------|---------|
| `<id-or-slug>` | Task ID or slug (required) | - |
| `--limit <number>` | Number of records to show | `50` |
| `--failed-only` | Show only failed executions | `false` |
| `--json` | Output as JSON | `false` |
| `--output <format>` | Output format: table, json | `table` |

### `marvin scheduled-tasks types`

| Option | Description | Default |
|--------|-------------|---------|
| `--detailed` | Show detailed metadata including config schemas | `false` |

### `marvin scheduled-tasks stats`

No additional options. Shows task execution statistics.

## Examples

### Basic Usage

List all scheduled tasks:

```bash
marvin scheduled-tasks list
```

Output:

```
┌────────────────┬──────────────┬────────────┬───────────────┬─────────┬───────────┬─────────────────────┐
│ ID             │ Name         │ Task Type  │ Schedule Type │ Enabled │ Status    │ Next Run            │
├────────────────┼──────────────┼────────────┼───────────────┼─────────┼───────────┼─────────────────────┤
│ task_cleanup   │ Daily Cleanup│ cleanup    │ interval      │ true    │ success   │ 2026-07-11 00:00:00 │
│ task_backup    │ Weekly Backup│ backup     │ cron          │ true    │ success   │ 2026-07-14 02:00:00 │
│ task_sync      │ Data Sync    │ sync       │ interval      │ false   │ failed    │ -                   │
└────────────────┴──────────────┴────────────┴───────────────┴─────────┴───────────┴─────────────────────┘
```

Get a specific task:

```bash
marvin scheduled-tasks get task_cleanup
```

Output:

```
┌──────────────────┬────────────────────────────────────┐
│ Field            │ Value                              │
├──────────────────┼────────────────────────────────────┤
│ ID               │ task_cleanup                       │
│ Name             │ Daily Cleanup                      │
│ Task Type        │ cleanup_temp_files                 │
│ Schedule Type    │ interval                           │
│ Enabled          │ true                               │
│ Last Status      │ success                            │
│ Next Run         │ 2026-07-11T00:00:00Z               │
│ Schedule Config  │ { interval_seconds: 86400 }        │
└──────────────────┴────────────────────────────────────┘
```

### Create Scheduled Task

Create interval-based task:

```bash
marvin scheduled-tasks create --json '{
  "name": "Daily Cleanup",
  "description": "Clean up temporary files daily",
  "task_type": "cleanup_temp_files",
  "schedule_type": "interval",
  "schedule_config": {
    "interval_seconds": 86400
  },
  "task_config": {
    "age_hours": 24
  },
  "enabled": true
}'
```

Create cron-based task:

```bash
marvin scheduled-tasks create --json '{
  "name": "Weekly Backup",
  "description": "Backup database every Sunday at 2 AM",
  "task_type": "backup_database",
  "schedule_type": "cron",
  "schedule_config": {
    "cron_expression": "0 2 * * 0"
  },
  "task_config": {
    "compression": true,
    "retention_days": 30
  },
  "enabled": true
}'
```

Create from file:

```bash
cat > task.json <<EOF
{
  "name": "Hourly Sync",
  "description": "Sync external data every hour",
  "task_type": "sync_external_data",
  "schedule_type": "interval",
  "schedule_config": {
    "interval_seconds": 3600
  },
  "task_config": {
    "source": "external_api",
    "batch_size": 100
  },
  "enabled": true
}
EOF

marvin scheduled-tasks create --file task.json
```

Output:

```
✓ Created scheduled task: task_abc123def456
```

### Update Scheduled Task

Update task configuration:

```bash
marvin scheduled-tasks update task_cleanup --json '{
  "task_config": {
    "age_hours": 48
  }
}'
```

Enable or disable a task:

```bash
marvin scheduled-tasks update task_cleanup --enable
marvin scheduled-tasks update task_sync --disable
```

Output:

```
✓ Updated scheduled task: task_cleanup
```

### Delete Scheduled Task

```bash
marvin scheduled-tasks delete task_old_backup --yes
```

Output:

```
✓ Deleted scheduled task: task_old_backup
```

### Run Task Manually

Execute a task immediately (bypasses schedule):

```bash
marvin scheduled-tasks run task_cleanup
```

Output:

```
✓ Task execution triggered: task_cleanup
Check 'history' command for execution results
```

### View Task History

View recent executions:

```bash
marvin scheduled-tasks history task_cleanup
```

Output:

```
┌─────────────────────┬─────────┬─────────────┬───────────────┬──────────────┐
│ Executed At         │ Status  │ Duration ms │ Error Message │ Retry Attempt│
├─────────────────────┼─────────┼─────────────┼───────────────┼──────────────┤
│ 2026-07-10 00:00:00 │ success │ 1250        │ -             │ 0            │
│ 2026-07-09 00:00:00 │ success │ 1180        │ -             │ 0            │
│ 2026-07-08 00:00:00 │ failed  │ 500         │ Timeout       │ 1            │
│ 2026-07-08 00:05:00 │ success │ 1320        │ -             │ 2            │
└─────────────────────┴─────────┴─────────────┴───────────────┴──────────────┘
```

View only failures:

```bash
marvin scheduled-tasks history task_cleanup --failed-only
```

### List Task Types

List available task types:

```bash
marvin scheduled-tasks types
```

Output:

```
Available task types:
  - cleanup_temp_files
  - cleanup_old_events
  - backup_database
  - sync_external_data
  - optimize_database
  - send_digest_emails

Use --detailed for metadata and config schemas
```

Detailed view:

```bash
marvin scheduled-tasks types --detailed
```

Output:

```
┌─────────────────────┬──────────────────────┬─────────────────────────────┐
│ Task Type           │ Name                 │ Description                 │
├─────────────────────┼──────────────────────┼─────────────────────────────┤
│ cleanup_temp_files  │ Cleanup Temp Files   │ Remove old temporary files  │
│ backup_database     │ Backup Database      │ Create database backup      │
│ sync_external_data  │ Sync External Data   │ Sync data from external API │
└─────────────────────┴──────────────────────┴─────────────────────────────┘
```

### View Statistics

```bash
marvin scheduled-tasks stats
```

Output:

```
Scheduled Task Statistics:
  Total tasks:       6
  Enabled:           4
  Disabled:          2
  Never run:         1
  Last status:
    Success:         3
    Failed:          1

⚠️  Some tasks have failed. Run 'list --failed-only' to see them.
```

### JSON Output

```bash
marvin scheduled-tasks list --json
```

```json
[
  {
    "id": "task_cleanup",
    "name": "Daily Cleanup",
    "description": "Clean up temporary files daily",
    "task_type": "cleanup_temp_files",
    "schedule_type": "interval",
    "schedule_config": {
      "interval_seconds": 86400
    },
    "task_config": {
      "age_hours": 24
    },
    "enabled": true,
    "last_status": "success",
    "last_run_at": "2026-07-10T00:00:00Z",
    "next_run_at": "2026-07-11T00:00:00Z",
    "createdAt": "2026-06-01T10:00:00Z",
    "updatedAt": "2026-07-01T15:30:00Z"
  }
]
```

## Task Configuration

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Task name |
| `task_type` | string | Task type identifier |
| `schedule_type` | string | Schedule type (interval, cron, fixed_time) |
| `schedule_config` | object | Schedule configuration |

### Optional Fields

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `description` | string | Task description | - |
| `slug` | string | URL-friendly identifier | Auto-generated |
| `task_config` | object | Task-specific configuration | `{}` |
| `enabled` | boolean | Whether task is active | `true` |
| `retry_on_failure` | boolean | Retry on failure | `true` |
| `max_retries` | number | Maximum retry attempts | `3` |

### Schedule Types

#### Interval

Run at regular intervals:

```json
{
  "schedule_type": "interval",
  "schedule_config": {
    "interval_seconds": 3600
  }
}
```

#### Cron

Run on cron schedule:

```json
{
  "schedule_type": "cron",
  "schedule_config": {
    "cron_expression": "0 2 * * *"
  }
}
```

Cron format: `minute hour day month day_of_week`

#### Fixed Time

Run at specific times:

```json
{
  "schedule_type": "fixed_time",
  "schedule_config": {
    "times": ["02:00", "14:00"]
  }
}
```

## Use Cases

### Daily Cleanup Task

```bash
marvin scheduled-tasks create --json '{
  "name": "Daily Cleanup",
  "task_type": "cleanup_temp_files",
  "schedule_type": "interval",
  "schedule_config": {"interval_seconds": 86400},
  "task_config": {"age_hours": 24},
  "enabled": true
}'
```

### Weekly Backup

```bash
marvin scheduled-tasks create --json '{
  "name": "Weekly Backup",
  "task_type": "backup_database",
  "schedule_type": "cron",
  "schedule_config": {"cron_expression": "0 2 * * 0"},
  "task_config": {"retention_days": 30},
  "enabled": true
}'
```

### Hourly Data Sync

```bash
marvin scheduled-tasks create --json '{
  "name": "Hourly Sync",
  "task_type": "sync_external_data",
  "schedule_type": "interval",
  "schedule_config": {"interval_seconds": 3600},
  "enabled": true
}'
```

### Monitor Failed Tasks

```bash
marvin scheduled-tasks list --failed-only
```

### Disable All Tasks

```bash
marvin scheduled-tasks list --json | jq -r '.[].id' | while read id; do
  marvin scheduled-tasks update $id --disable
  echo "Disabled task: $id"
done
```

## Scripting Examples

### Bash Script

```bash
#!/bin/bash

# Daily health check for scheduled tasks

echo "Scheduled Tasks Health Check"
echo "=============================="

# Get all tasks
TASKS=$(marvin scheduled-tasks list --json)

# Count statuses
TOTAL=$(echo "$TASKS" | jq 'length')
ENABLED=$(echo "$TASKS" | jq '[.[] | select(.enabled == true)] | length')
FAILED=$(echo "$TASKS" | jq '[.[] | select(.last_status == "failed")] | length')

echo "Total tasks: $TOTAL"
echo "Enabled: $ENABLED"
echo "Failed: $FAILED"

# Check failed tasks
if [ "$FAILED" -gt 0 ]; then
  echo -e "\n⚠️  Failed Tasks:"
  echo "$TASKS" | jq -r '.[] | select(.last_status == "failed") | "\(.name) (last run: \(.last_run_at))"'
  
  # Get execution history for failed tasks
  echo -e "\nExecution History:"
  echo "$TASKS" | jq -r '.[] | select(.last_status == "failed") | .id' | while read id; do
    echo "Task: $id"
    marvin scheduled-tasks history $id --failed-only --limit 3
    echo "---"
  done
fi
```

### Node.js

```javascript
const { execSync } = require('child_process');

// Get all tasks
const tasks = JSON.parse(
  execSync('marvin scheduled-tasks list --json', { encoding: 'utf-8' })
);

console.log('Scheduled Tasks Summary\n');

// Statistics
const stats = {
  total: tasks.length,
  enabled: tasks.filter(t => t.enabled).length,
  disabled: tasks.filter(t => !t.enabled).length,
  failed: tasks.filter(t => t.last_status === 'failed').length,
  neverRun: tasks.filter(t => !t.last_run_at).length
};

Object.entries(stats).forEach(([key, value]) => {
  console.log(`${key}: ${value}`);
});

// Check for tasks that haven't run in 24+ hours
const oneDayAgo = new Date(Date.now() - 86400000);

tasks
  .filter(t => t.enabled && t.last_run_at)
  .forEach(task => {
    const lastRun = new Date(task.last_run_at);
    if (lastRun < oneDayAgo) {
      console.log(`\n⚠️  ${task.name} hasn't run in 24+ hours`);
      console.log(`   Last run: ${task.last_run_at}`);
    }
  });
```

### Python

```python
import subprocess
import json
from datetime import datetime, timedelta

# Get all tasks
result = subprocess.run(
    ['marvin', 'scheduled-tasks', 'list', '--json'],
    capture_output=True,
    text=True
)

tasks = json.loads(result.stdout)

print("Scheduled Tasks Report")
print("=" * 60)

# Analyze by schedule type
by_schedule = {}
for task in tasks:
    schedule = task['schedule_type']
    by_schedule[schedule] = by_schedule.get(schedule, 0) + 1

print("\nBy Schedule Type:")
for schedule, count in by_schedule.items():
    print(f"  {schedule}: {count}")

# Find tasks with failures
failed_tasks = [t for t in tasks if t.get('last_status') == 'failed']

if failed_tasks:
    print(f"\n⚠️  {len(failed_tasks)} failed tasks:")
    for task in failed_tasks:
        print(f"\n  {task['name']}:")
        
        # Get failure history
        history_result = subprocess.run(
            ['marvin', 'scheduled-tasks', 'history', task['id'], 
             '--failed-only', '--limit', '5', '--json'],
            capture_output=True,
            text=True
        )
        
        history = json.loads(history_result.stdout)
        for h in history:
            print(f"    - {h['executed_at']}: {h['error_message']}")
```

## Error Handling

### 401 Unauthorized

Not authenticated:

```bash
marvin login
marvin workspace use <workspace>
```

### 404 Not Found

Task doesn't exist:

```bash
# List all tasks to find valid IDs
marvin scheduled-tasks list --json | jq -r '.[].id'
```

### Invalid Cron Expression

Use valid cron syntax:

```bash
# Valid examples:
# 0 * * * *     (every hour)
# 0 2 * * *     (daily at 2 AM)
# 0 2 * * 0     (Sundays at 2 AM)
# */15 * * * *  (every 15 minutes)
```

### Delete Without Confirmation

Must provide `--yes` flag:

```bash
marvin scheduled-tasks delete <task-id> --yes
```

## Related Commands

- [`marvin event-log list`](event-log.md) - View task execution events
- [`marvin workspace use`](workspaces.md) - Set active workspace
- [`marvin admin maintenance`](admin-maintenance.md) - Manual maintenance operations

## API Reference

This command calls:

```
GET /api/platform/workspaces/{workspace_id}/scheduled-tasks
GET /api/platform/workspaces/{workspace_id}/scheduled-tasks/{id}
POST /api/platform/workspaces/{workspace_id}/scheduled-tasks
PATCH /api/platform/workspaces/{workspace_id}/scheduled-tasks/{id}
DELETE /api/platform/workspaces/{workspace_id}/scheduled-tasks/{id}
POST /api/platform/workspaces/{workspace_id}/scheduled-tasks/{id}/execute
GET /api/platform/workspaces/{workspace_id}/scheduled-tasks/{id}/history
GET /api/platform/workspaces/{workspace_id}/scheduled-tasks/types
```

See [API Mapping](../reference/api-mapping.md) for more details.
