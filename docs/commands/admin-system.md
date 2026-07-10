# Admin System

System information and health monitoring for platform administrators (requires SUPER_ADMIN role).

## Commands

### System Info

```bash
marvin admin system info
```

### System Stats

```bash
marvin admin system stats
```

### Health Check

```bash
marvin admin system health
```

## Description

The admin system commands provide platform-wide system information, statistics, and health monitoring. These commands are restricted to users with the `SUPER_ADMIN` platform role and provide insights into system version, configuration, resource usage, and health status.

## Authentication

Requires user authentication via `marvin login` with `SUPER_ADMIN` platform role.

```bash
marvin login
# You must have SUPER_ADMIN role
```

## Options

### `marvin admin system info`

| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output as JSON | `false` |
| `--yaml` | Output as YAML | `false` |
| `--output <format>` | Output format: table, json, yaml | `table` |

### `marvin admin system stats`

| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output as JSON | `false` |
| `--yaml` | Output as YAML | `false` |
| `--output <format>` | Output format: table, json, yaml | `table` |

### `marvin admin system health`

No additional options. Returns health status.

## Examples

### Basic Usage

Get system information:

```bash
marvin admin system info
```

Output:

```
┌─────────────────┬──────────────────────────────────────┐
│ Field           │ Value                                │
├─────────────────┼──────────────────────────────────────┤
│ Version         │ 1.2.0                                │
│ Environment     │ production                           │
│ Database        │ PostgreSQL 16.3                      │
│ Python Version  │ 3.12.4                               │
│ Installed At    │ 2026-01-15T10:00:00Z                 │
│ Uptime          │ 25 days, 14 hours                    │
│ Server Time     │ 2026-07-10T14:30:00Z                 │
└─────────────────┴──────────────────────────────────────┘
```

Get system statistics:

```bash
marvin admin system stats
```

Output:

```
┌──────────────────┬──────────────────────────────────────┐
│ Metric           │ Value                                │
├──────────────────┼──────────────────────────────────────┤
│ Total Users      │ 142                                  │
│ Total Workspaces │ 28                                   │
│ Total Entries    │ 3,845                                │
│ Total Assets     │ 1,203                                │
│ Total Forms      │ 67                                   │
│ Storage Used     │ 2.3 GB                               │
│ Database Size    │ 512 MB                               │
│ Events (24h)     │ 1,248                                │
│ API Requests(24h)│ 45,632                               │
└──────────────────┴──────────────────────────────────────┘
```

Check system health:

```bash
marvin admin system health
```

Output:

```
System status: healthy
```

Or if there are issues:

```
System status: degraded
```

### JSON Output

Get system info as JSON:

```bash
marvin admin system info --json
```

```json
{
  "version": "1.2.0",
  "environment": "production",
  "database": {
    "type": "PostgreSQL",
    "version": "16.3"
  },
  "python": {
    "version": "3.12.4",
    "implementation": "CPython"
  },
  "installedAt": "2026-01-15T10:00:00Z",
  "uptime": {
    "seconds": 2203200,
    "days": 25,
    "hours": 14
  },
  "serverTime": "2026-07-10T14:30:00Z",
  "hostname": "marvin-prod-01",
  "platform": "linux"
}
```

Get system stats as JSON:

```bash
marvin admin system stats --json
```

```json
{
  "users": {
    "total": 142,
    "active": 89,
    "new_this_month": 12
  },
  "workspaces": {
    "total": 28,
    "active": 24
  },
  "entries": {
    "total": 3845,
    "published": 3201,
    "draft": 644
  },
  "assets": {
    "total": 1203,
    "total_size_bytes": 2469606195
  },
  "forms": {
    "total": 67,
    "submissions_total": 8934,
    "submissions_24h": 145
  },
  "storage": {
    "total_bytes": 2469606195,
    "formatted": "2.3 GB"
  },
  "database": {
    "size_bytes": 536870912,
    "formatted": "512 MB"
  },
  "events": {
    "total": 245678,
    "last_24h": 1248,
    "last_7d": 8932
  },
  "api": {
    "requests_24h": 45632,
    "requests_7d": 324589
  }
}
```

## Response Fields

### System Info

| Field | Type | Description |
|-------|------|-------------|
| `version` | string | Marvin version |
| `environment` | string | Environment (production, staging, development) |
| `database` | object | Database information |
| `python` | object | Python runtime information |
| `installedAt` | string | ISO 8601 timestamp of installation |
| `uptime` | object | System uptime |
| `serverTime` | string | Current server time (ISO 8601) |
| `hostname` | string | Server hostname |
| `platform` | string | Operating system platform |

### System Stats

| Field | Type | Description |
|-------|------|-------------|
| `users` | object | User statistics |
| `workspaces` | object | Workspace statistics |
| `entries` | object | Entry statistics |
| `assets` | object | Asset statistics |
| `forms` | object | Form statistics |
| `storage` | object | Storage usage |
| `database` | object | Database size |
| `events` | object | Event log statistics |
| `api` | object | API request statistics |

## Use Cases

### Monitor System Version

```bash
marvin admin system info --json | jq -r '.version'
```

Output:

```
1.2.0
```

### Check System Health

```bash
if marvin admin system health | grep -q "healthy"; then
  echo "✓ System is healthy"
else
  echo "⚠️ System health degraded"
  exit 1
fi
```

### Monitor Storage Usage

```bash
marvin admin system stats --json | jq '.storage.formatted'
```

Output:

```
"2.3 GB"
```

### Count Active Users

```bash
marvin admin system stats --json | jq '.users.active'
```

Output:

```
89
```

### Get API Request Count

```bash
marvin admin system stats --json | jq '.api.requests_24h'
```

Output:

```
45632
```

### Monitor Database Growth

```bash
marvin admin system stats --json | jq '{
  database_size: .database.formatted,
  total_entries: .entries.total,
  total_assets: .assets.total
}'
```

Output:

```json
{
  "database_size": "512 MB",
  "total_entries": 3845,
  "total_assets": 1203
}
```

## Scripting Examples

### Bash Script

```bash
#!/bin/bash

# System status report

echo "Marvin System Status Report"
echo "============================"

# Get system info
INFO=$(marvin admin system info --json)
VERSION=$(echo "$INFO" | jq -r '.version')
UPTIME_DAYS=$(echo "$INFO" | jq -r '.uptime.days')

echo "Version: $VERSION"
echo "Uptime: $UPTIME_DAYS days"

# Get statistics
STATS=$(marvin admin system stats --json)

echo -e "\nResource Usage:"
echo "  Storage: $(echo "$STATS" | jq -r '.storage.formatted')"
echo "  Database: $(echo "$STATS" | jq -r '.database.formatted')"

echo -e "\nContent Statistics:"
echo "  Users: $(echo "$STATS" | jq -r '.users.total')"
echo "  Workspaces: $(echo "$STATS" | jq -r '.workspaces.total')"
echo "  Entries: $(echo "$STATS" | jq -r '.entries.total')"
echo "  Assets: $(echo "$STATS" | jq -r '.assets.total')"

echo -e "\nActivity (Last 24h):"
echo "  Events: $(echo "$STATS" | jq -r '.events.last_24h')"
echo "  API Requests: $(echo "$STATS" | jq -r '.api.requests_24h')"
echo "  Form Submissions: $(echo "$STATS" | jq -r '.forms.submissions_24h')"

# Health check
echo -e "\nHealth Status:"
if marvin admin system health | grep -q "healthy"; then
  echo "  ✓ System is healthy"
else
  echo "  ⚠️ System health degraded"
fi
```

### Node.js

```javascript
const { execSync } = require('child_process');

// Get system information
const info = JSON.parse(
  execSync('marvin admin system info --json', { encoding: 'utf-8' })
);

const stats = JSON.parse(
  execSync('marvin admin system stats --json', { encoding: 'utf-8' })
);

console.log('Marvin System Dashboard\n');

// System info
console.log('System Information:');
console.log(`  Version: ${info.version}`);
console.log(`  Environment: ${info.environment}`);
console.log(`  Uptime: ${info.uptime.days} days, ${info.uptime.hours % 24} hours`);
console.log(`  Database: ${info.database.type} ${info.database.version}`);

// Resource usage
console.log('\nResource Usage:');
console.log(`  Storage: ${stats.storage.formatted}`);
console.log(`  Database: ${stats.database.formatted}`);

// Content statistics
console.log('\nContent Statistics:');
console.log(`  Total Users: ${stats.users.total} (${stats.users.active} active)`);
console.log(`  Total Workspaces: ${stats.workspaces.total}`);
console.log(`  Total Entries: ${stats.entries.total} (${stats.entries.published} published)`);
console.log(`  Total Assets: ${stats.assets.total}`);

// Recent activity
console.log('\nRecent Activity (24h):');
console.log(`  Events: ${stats.events.last_24h.toLocaleString()}`);
console.log(`  API Requests: ${stats.api.requests_24h.toLocaleString()}`);
console.log(`  Form Submissions: ${stats.forms.submissions_24h}`);

// Calculate growth
const entriesPerWorkspace = (stats.entries.total / stats.workspaces.total).toFixed(1);
const assetsPerEntry = (stats.assets.total / stats.entries.total).toFixed(1);

console.log('\nAverages:');
console.log(`  Entries per Workspace: ${entriesPerWorkspace}`);
console.log(`  Assets per Entry: ${assetsPerEntry}`);
```

### Python

```python
import subprocess
import json
from datetime import datetime

# Get system info and stats
info = json.loads(subprocess.run(
    ['marvin', 'admin', 'system', 'info', '--json'],
    capture_output=True, text=True
).stdout)

stats = json.loads(subprocess.run(
    ['marvin', 'admin', 'system', 'stats', '--json'],
    capture_output=True, text=True
).stdout)

print("Marvin System Report")
print("=" * 60)

# System info
print(f"\nVersion: {info['version']}")
print(f"Environment: {info['environment']}")
print(f"Uptime: {info['uptime']['days']} days")

# Health check
health = subprocess.run(
    ['marvin', 'admin', 'system', 'health'],
    capture_output=True, text=True
).stdout

health_status = "✓ Healthy" if "healthy" in health else "⚠️ Degraded"
print(f"Health: {health_status}")

# Resource usage
print(f"\nStorage: {stats['storage']['formatted']}")
print(f"Database: {stats['database']['formatted']}")

# Growth metrics
print(f"\nGrowth Metrics:")
print(f"  New users this month: {stats['users']['new_this_month']}")
print(f"  Active workspaces: {stats['workspaces']['active']}/{stats['workspaces']['total']}")
print(f"  Published entries: {stats['entries']['published']}/{stats['entries']['total']}")

# Activity metrics
print(f"\nActivity (Last 24h):")
print(f"  Events: {stats['events']['last_24h']:,}")
print(f"  API Requests: {stats['api']['requests_24h']:,}")
print(f"  Form Submissions: {stats['forms']['submissions_24h']}")

# Calculate ratios
user_to_workspace = stats['users']['total'] / stats['workspaces']['total']
entries_per_user = stats['entries']['total'] / stats['users']['active']

print(f"\nRatios:")
print(f"  Users per Workspace: {user_to_workspace:.1f}")
print(f"  Entries per Active User: {entries_per_user:.1f}")

# Export to JSON for monitoring
report = {
    'timestamp': datetime.now().isoformat(),
    'version': info['version'],
    'health': 'healthy' if 'healthy' in health else 'degraded',
    'metrics': {
        'users': stats['users']['total'],
        'workspaces': stats['workspaces']['total'],
        'entries': stats['entries']['total'],
        'storage_bytes': stats['storage']['total_bytes'],
        'api_requests_24h': stats['api']['requests_24h']
    }
}

with open('system-report.json', 'w') as f:
    json.dump(report, f, indent=2)

print("\nReport saved to system-report.json")
```

### Monitoring Script

```bash
#!/bin/bash

# Continuous system monitoring (run in cron)

LOG_FILE="/var/log/marvin-monitor.log"

timestamp() {
  date '+%Y-%m-%d %H:%M:%S'
}

# Check health
HEALTH=$(marvin admin system health)

if ! echo "$HEALTH" | grep -q "healthy"; then
  echo "[$(timestamp)] ⚠️  HEALTH CHECK FAILED: $HEALTH" >> "$LOG_FILE"
  
  # Send alert (example)
  # curl -X POST https://hooks.slack.com/... -d "{'text': 'Marvin health degraded'}"
fi

# Get statistics
STATS=$(marvin admin system stats --json)

# Check storage threshold (warn if > 80%)
STORAGE_BYTES=$(echo "$STATS" | jq '.storage.total_bytes')
# Assuming 10GB limit
STORAGE_LIMIT=10737418240
USAGE_PCT=$(( STORAGE_BYTES * 100 / STORAGE_LIMIT ))

if [ "$USAGE_PCT" -gt 80 ]; then
  echo "[$(timestamp)] ⚠️  STORAGE WARNING: ${USAGE_PCT}% used" >> "$LOG_FILE"
fi

# Check API requests (warn if > 100k/day)
API_REQUESTS=$(echo "$STATS" | jq '.api.requests_24h')

if [ "$API_REQUESTS" -gt 100000 ]; then
  echo "[$(timestamp)] ℹ️  HIGH API USAGE: $API_REQUESTS requests/24h" >> "$LOG_FILE"
fi

# Log metrics
echo "[$(timestamp)] Metrics: users=$(echo "$STATS" | jq '.users.total'), storage=${USAGE_PCT}%, api=$API_REQUESTS" >> "$LOG_FILE"
```

## Error Handling

### 401 Unauthorized

Not authenticated:

```bash
marvin login
```

### 403 Forbidden

Requires `SUPER_ADMIN` role:

```
Error: Insufficient permissions. SUPER_ADMIN role required.
```

Only users with the `SUPER_ADMIN` platform role can access admin system commands.

## Related Commands

- [`marvin admin users`](admin-users.md) - User management
- [`marvin admin maintenance`](admin-maintenance.md) - Maintenance operations
- [`marvin event-log list`](event-log.md) - Event audit trail

## API Reference

This command calls:

```
GET /api/admin/system/about
GET /api/admin/system/statistics
GET /api/admin/system/health
```

See [API Mapping](../reference/api-mapping.md) for more details.
