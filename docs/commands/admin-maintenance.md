# Admin Maintenance

System maintenance operations for platform administrators (requires SUPER_ADMIN role).

## Commands

### Clean Temp Files

```bash
marvin admin maintenance clean-temp
```

### Run Cleanup Operations

```bash
marvin admin maintenance cleanup
```

### Clear Cache

```bash
marvin admin maintenance clear-cache
```

### Optimize Database

```bash
marvin admin maintenance optimize
```

### Get Maintenance Stats

```bash
marvin admin maintenance stats
```

### Get Storage Info

```bash
marvin admin maintenance storage
```

## Description

The admin maintenance commands provide system-level maintenance operations for platform administrators. These commands handle cleanup of temporary files, expired tokens, old events, cache clearing, and database optimization. All commands require the `SUPER_ADMIN` platform role.

## Authentication

Requires user authentication via `marvin login` with `SUPER_ADMIN` platform role.

```bash
marvin login
# You must have SUPER_ADMIN role
```

## Options

### `marvin admin maintenance clean-temp`

No additional options. Cleans temporary files.

### `marvin admin maintenance cleanup`

No additional options. Runs all cleanup operations (events and tokens).

### `marvin admin maintenance clear-cache`

No additional options. Clears application cache.

### `marvin admin maintenance optimize`

No additional options. Optimizes database tables.

### `marvin admin maintenance stats`

| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output as JSON | `false` |
| `--yaml` | Output as YAML | `false` |
| `--output <format>` | Output format: table, json, yaml | `table` |

### `marvin admin maintenance storage`

| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output as JSON | `false` |
| `--yaml` | Output as YAML | `false` |
| `--output <format>` | Output format: table, json, yaml | `table` |

## Examples

### Basic Usage

Clean temporary files:

```bash
marvin admin maintenance clean-temp
```

Output:

```
Cleaned 142 temporary files (1.2 GB freed)
```

Run all cleanup operations:

```bash
marvin admin maintenance cleanup
```

Output:

```
Cleaning up events...
✓ Cleaned up old events (3,245 deleted)

Cleaning up tokens...
✓ Cleaned up expired tokens (89 deleted)
```

Clear application cache:

```bash
marvin admin maintenance clear-cache
```

Output:

```
Application cache cleared successfully
```

Optimize database:

```bash
marvin admin maintenance optimize
```

Output:

```
Database optimization complete (reclaimed 45 MB)
```

### Get Maintenance Stats

View maintenance statistics:

```bash
marvin admin maintenance stats
```

Output:

```
┌─────────────────────┬──────────────────────────────────────┐
│ Metric              │ Value                                │
├─────────────────────┼──────────────────────────────────────┤
│ Temp Files          │ 42 files, 125 MB                     │
│ Old Events          │ 1,234 events (older than 90 days)    │
│ Expired Tokens      │ 18 tokens                            │
│ Cache Size          │ 256 MB                               │
│ Database Bloat      │ 12 MB                                │
│ Last Cleanup        │ 2026-07-09T02:00:00Z                 │
│ Last Optimization   │ 2026-07-07T03:00:00Z                 │
└─────────────────────┴──────────────────────────────────────┘
```

### Get Storage Information

View detailed storage usage:

```bash
marvin admin maintenance storage
```

Output:

```
┌─────────────────────┬──────────────────────────────────────┐
│ Category            │ Size                                 │
├─────────────────────┼──────────────────────────────────────┤
│ Database            │ 512 MB                               │
│ Assets              │ 2.3 GB                               │
│ Temp Files          │ 125 MB                               │
│ Cache               │ 256 MB                               │
│ Backups             │ 1.8 GB                               │
│ Total Used          │ 5.0 GB                               │
│ Available           │ 45 GB                                │
└─────────────────────┴──────────────────────────────────────┘
```

### JSON Output

Get stats as JSON:

```bash
marvin admin maintenance stats --json
```

```json
{
  "temp_files": {
    "count": 42,
    "size_bytes": 131072000,
    "formatted": "125 MB"
  },
  "old_events": {
    "count": 1234,
    "age_threshold_days": 90
  },
  "expired_tokens": {
    "count": 18
  },
  "cache": {
    "size_bytes": 268435456,
    "formatted": "256 MB"
  },
  "database_bloat": {
    "size_bytes": 12582912,
    "formatted": "12 MB"
  },
  "last_cleanup_at": "2026-07-09T02:00:00Z",
  "last_optimization_at": "2026-07-07T03:00:00Z"
}
```

Get storage as JSON:

```bash
marvin admin maintenance storage --json
```

```json
{
  "database": {
    "size_bytes": 536870912,
    "formatted": "512 MB"
  },
  "assets": {
    "size_bytes": 2469606195,
    "formatted": "2.3 GB"
  },
  "temp_files": {
    "size_bytes": 131072000,
    "formatted": "125 MB"
  },
  "cache": {
    "size_bytes": 268435456,
    "formatted": "256 MB"
  },
  "backups": {
    "size_bytes": 1932735283,
    "formatted": "1.8 GB"
  },
  "total_used": {
    "size_bytes": 5368709120,
    "formatted": "5.0 GB"
  },
  "total_available": {
    "size_bytes": 48318382080,
    "formatted": "45 GB"
  }
}
```

## Use Cases

### Scheduled Maintenance

Run cleanup operations daily:

```bash
#!/bin/bash
# /etc/cron.daily/marvin-cleanup

marvin admin maintenance cleanup
marvin admin maintenance clean-temp
```

### Pre-Optimization Check

Check stats before optimizing:

```bash
echo "Before optimization:"
marvin admin maintenance stats --json | jq '.database_bloat.formatted'

marvin admin maintenance optimize

echo "After optimization:"
marvin admin maintenance stats --json | jq '.database_bloat.formatted'
```

### Monitor Storage Growth

```bash
marvin admin maintenance storage --json | jq '{
  database: .database.formatted,
  assets: .assets.formatted,
  total: .total_used.formatted
}'
```

Output:

```json
{
  "database": "512 MB",
  "assets": "2.3 GB",
  "total": "5.0 GB"
}
```

### Clear Cache After Deployment

```bash
# After deploying new code
marvin admin maintenance clear-cache
echo "✓ Cache cleared"
```

### Check If Cleanup Needed

```bash
STATS=$(marvin admin maintenance stats --json)

TEMP_SIZE=$(echo "$STATS" | jq '.temp_files.size_bytes')
OLD_EVENTS=$(echo "$STATS" | jq '.old_events.count')

# Cleanup if temp files > 500MB or old events > 5000
if [ "$TEMP_SIZE" -gt 524288000 ] || [ "$OLD_EVENTS" -gt 5000 ]; then
  echo "Running cleanup..."
  marvin admin maintenance cleanup
  marvin admin maintenance clean-temp
fi
```

## Scripting Examples

### Bash Script

```bash
#!/bin/bash

# Weekly maintenance script

echo "Marvin Maintenance - $(date)"
echo "=============================="

# Get pre-maintenance stats
echo "Storage before maintenance:"
BEFORE=$(marvin admin maintenance storage --json)
echo "$BEFORE" | jq '{
  database: .database.formatted,
  temp_files: .temp_files.formatted,
  cache: .cache.formatted
}'

echo -e "\nRunning maintenance tasks..."

# Clean temp files
echo "1. Cleaning temporary files..."
marvin admin maintenance clean-temp

# Cleanup old data
echo "2. Running cleanup operations..."
marvin admin maintenance cleanup

# Clear cache
echo "3. Clearing cache..."
marvin admin maintenance clear-cache

# Optimize database
echo "4. Optimizing database..."
marvin admin maintenance optimize

# Get post-maintenance stats
echo -e "\nStorage after maintenance:"
AFTER=$(marvin admin maintenance storage --json)
echo "$AFTER" | jq '{
  database: .database.formatted,
  temp_files: .temp_files.formatted,
  cache: .cache.formatted
}'

# Calculate space freed
BEFORE_TOTAL=$(echo "$BEFORE" | jq '.total_used.size_bytes')
AFTER_TOTAL=$(echo "$AFTER" | jq '.total_used.size_bytes')
FREED=$(( (BEFORE_TOTAL - AFTER_TOTAL) / 1048576 ))

echo -e "\n✓ Maintenance complete"
echo "Space freed: ${FREED} MB"
```

### Node.js

```javascript
const { execSync } = require('child_process');

console.log('Marvin Maintenance Operations\n');

// Get current stats
const stats = JSON.parse(
  execSync('marvin admin maintenance stats --json', { encoding: 'utf-8' })
);

console.log('Current Status:');
console.log(`  Temp Files: ${stats.temp_files.formatted}`);
console.log(`  Old Events: ${stats.old_events.count.toLocaleString()}`);
console.log(`  Expired Tokens: ${stats.expired_tokens.count}`);
console.log(`  Cache: ${stats.cache.formatted}`);
console.log(`  Database Bloat: ${stats.database_bloat.formatted}`);

// Determine what needs cleaning
const needsCleanup = [];

if (stats.temp_files.size_bytes > 104857600) { // > 100MB
  needsCleanup.push('temp files');
}

if (stats.old_events.count > 1000) {
  needsCleanup.push('old events');
}

if (stats.cache.size_bytes > 536870912) { // > 512MB
  needsCleanup.push('cache');
}

if (stats.database_bloat.size_bytes > 10485760) { // > 10MB
  needsCleanup.push('database');
}

if (needsCleanup.length === 0) {
  console.log('\n✓ No maintenance needed');
  process.exit(0);
}

console.log(`\n⚠️  Maintenance needed: ${needsCleanup.join(', ')}`);
console.log('\nRunning maintenance...');

// Run maintenance
if (needsCleanup.includes('temp files')) {
  console.log('  Cleaning temp files...');
  execSync('marvin admin maintenance clean-temp');
}

if (needsCleanup.includes('old events') || needsCleanup.includes('expired tokens')) {
  console.log('  Running cleanup...');
  execSync('marvin admin maintenance cleanup');
}

if (needsCleanup.includes('cache')) {
  console.log('  Clearing cache...');
  execSync('marvin admin maintenance clear-cache');
}

if (needsCleanup.includes('database')) {
  console.log('  Optimizing database...');
  execSync('marvin admin maintenance optimize');
}

console.log('\n✓ Maintenance complete');

// Get updated stats
const afterStats = JSON.parse(
  execSync('marvin admin maintenance stats --json', { encoding: 'utf-8' })
);

console.log('\nResults:');
console.log(`  Temp Files: ${afterStats.temp_files.formatted}`);
console.log(`  Old Events: ${afterStats.old_events.count.toLocaleString()}`);
console.log(`  Cache: ${afterStats.cache.formatted}`);
console.log(`  Database Bloat: ${afterStats.database_bloat.formatted}`);
```

### Python

```python
import subprocess
import json
from datetime import datetime

def run_command(cmd):
    """Run command and return output"""
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.stdout.strip()

def get_maintenance_stats():
    """Get maintenance statistics"""
    return json.loads(run_command(
        ['marvin', 'admin', 'maintenance', 'stats', '--json']
    ))

def get_storage_info():
    """Get storage information"""
    return json.loads(run_command(
        ['marvin', 'admin', 'maintenance', 'storage', '--json']
    ))

# Get current state
print("Marvin Maintenance Report")
print("=" * 60)

stats = get_maintenance_stats()
storage = get_storage_info()

# Display current stats
print(f"\nMaintenance Statistics:")
print(f"  Temp Files: {stats['temp_files']['formatted']} ({stats['temp_files']['count']} files)")
print(f"  Old Events: {stats['old_events']['count']:,}")
print(f"  Expired Tokens: {stats['expired_tokens']['count']}")
print(f"  Cache: {stats['cache']['formatted']}")
print(f"  Database Bloat: {stats['database_bloat']['formatted']}")

print(f"\nStorage Usage:")
print(f"  Database: {storage['database']['formatted']}")
print(f"  Assets: {storage['assets']['formatted']}")
print(f"  Total: {storage['total_used']['formatted']} / {storage['total_available']['formatted']}")

# Calculate usage percentage
usage_pct = (storage['total_used']['size_bytes'] / 
             (storage['total_used']['size_bytes'] + storage['total_available']['size_bytes']) * 100)
print(f"  Usage: {usage_pct:.1f}%")

# Determine maintenance actions
actions = []

if stats['temp_files']['size_bytes'] > 100 * 1024 * 1024:  # > 100MB
    actions.append('clean-temp')

if stats['old_events']['count'] > 5000:
    actions.append('cleanup')

if stats['cache']['size_bytes'] > 512 * 1024 * 1024:  # > 512MB
    actions.append('clear-cache')

if stats['database_bloat']['size_bytes'] > 50 * 1024 * 1024:  # > 50MB
    actions.append('optimize')

if not actions:
    print("\n✓ No maintenance required")
    exit(0)

print(f"\n⚠️  Recommended actions: {', '.join(actions)}")
print("\nRun maintenance? (y/n): ", end='')

# In automated script, you'd skip this prompt
response = input().lower()

if response == 'y':
    print("\nRunning maintenance...")
    
    for action in actions:
        print(f"  Running: {action}")
        subprocess.run(['marvin', 'admin', 'maintenance', action])
    
    print("\n✓ Maintenance complete")
    
    # Show updated stats
    new_stats = get_maintenance_stats()
    print(f"\nUpdated Statistics:")
    print(f"  Temp Files: {new_stats['temp_files']['formatted']}")
    print(f"  Old Events: {new_stats['old_events']['count']:,}")
    print(f"  Cache: {new_stats['cache']['formatted']}")
else:
    print("Maintenance cancelled")
```

### Automated Monitoring

```bash
#!/bin/bash

# Cron job: 0 2 * * * /usr/local/bin/marvin-maintenance.sh

LOG_FILE="/var/log/marvin-maintenance.log"
ALERT_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

timestamp() {
  date '+%Y-%m-%d %H:%M:%S'
}

log() {
  echo "[$(timestamp)] $1" >> "$LOG_FILE"
}

alert() {
  curl -s -X POST "$ALERT_WEBHOOK" \
    -H 'Content-Type: application/json' \
    -d "{\"text\": \"$1\"}" > /dev/null
}

log "Starting maintenance"

# Get storage info
STORAGE=$(marvin admin maintenance storage --json)
TOTAL_BYTES=$(echo "$STORAGE" | jq '.total_used.size_bytes')
AVAILABLE_BYTES=$(echo "$STORAGE" | jq '.total_available.size_bytes')
USAGE_PCT=$(( TOTAL_BYTES * 100 / (TOTAL_BYTES + AVAILABLE_BYTES) ))

log "Storage usage: ${USAGE_PCT}%"

# Alert if storage > 80%
if [ "$USAGE_PCT" -gt 80 ]; then
  alert "⚠️ Marvin storage usage high: ${USAGE_PCT}%"
fi

# Run cleanup
log "Running cleanup operations"
marvin admin maintenance cleanup >> "$LOG_FILE" 2>&1
marvin admin maintenance clean-temp >> "$LOG_FILE" 2>&1

# Clear cache weekly (on Sundays)
if [ "$(date +%u)" -eq 7 ]; then
  log "Weekly cache clear"
  marvin admin maintenance clear-cache >> "$LOG_FILE" 2>&1
fi

# Optimize database monthly (on 1st)
if [ "$(date +%d)" -eq 1 ]; then
  log "Monthly database optimization"
  marvin admin maintenance optimize >> "$LOG_FILE" 2>&1
fi

log "Maintenance complete"

# Get final stats
STATS=$(marvin admin maintenance stats --json)
TEMP_SIZE=$(echo "$STATS" | jq -r '.temp_files.formatted')
OLD_EVENTS=$(echo "$STATS" | jq '.old_events.count')

log "Post-maintenance: temp=${TEMP_SIZE}, old_events=${OLD_EVENTS}"
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

Only users with the `SUPER_ADMIN` platform role can run maintenance commands.

### Database Lock

If database is locked during optimization:

```
Error: Database is locked. Retry later or stop other operations.
```

Wait and retry, or check for long-running queries.

## Best Practices

### Scheduled Maintenance

- Run cleanup daily (off-peak hours)
- Clear cache after deployments
- Optimize database weekly/monthly
- Monitor storage usage regularly

### Automation

```bash
# Daily cleanup (2 AM)
0 2 * * * /usr/local/bin/marvin admin maintenance cleanup

# Weekly cache clear (Sunday 3 AM)
0 3 * * 0 /usr/local/bin/marvin admin maintenance clear-cache

# Monthly optimization (1st, 4 AM)
0 4 1 * * /usr/local/bin/marvin admin maintenance optimize
```

### Monitoring

- Alert when storage > 80%
- Alert when temp files > 1GB
- Alert when old events > 10,000
- Track maintenance execution time

## Related Commands

- [`marvin admin system stats`](admin-system.md) - System statistics
- [`marvin admin system health`](admin-system.md) - Health check
- [`marvin scheduled-tasks list`](scheduled-tasks.md) - Automated tasks

## API Reference

This command calls:

```
POST /api/admin/maintenance/clean-temp
POST /api/admin/maintenance/cleanup-events
POST /api/admin/maintenance/cleanup-tokens
POST /api/admin/maintenance/clear-cache
POST /api/admin/maintenance/optimize-database
GET /api/admin/maintenance/stats
GET /api/admin/maintenance/storage
```

See [API Mapping](../reference/api-mapping.md) for more details.
