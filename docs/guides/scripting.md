# Scripting & Automation

Use the Marvin CLI in bash scripts, automation workflows, and scheduled tasks.

## Overview

The Marvin CLI is designed to be script-friendly with:

- **JSON output** for reliable parsing
- **Exit codes** for error handling
- **Environment variables** for configuration
- **Consistent output** across commands

## Basic Scripting

### Simple Bash Script

```bash
#!/bin/bash

# Get all published entries
ENTRIES=$(marvin publish entries --json)

# Count entries
COUNT=$(echo "$ENTRIES" | jq 'length')

echo "Found $COUNT published entries"
```

### With Error Handling

```bash
#!/bin/bash
set -e  # Exit on error

# Check if CLI is installed
if ! command -v marvin &> /dev/null; then
    echo "Error: Marvin CLI not installed"
    exit 1
fi

# Check authentication
if ! marvin auth whoami >/dev/null 2>&1; then
    echo "Not authenticated, logging in..."
    marvin auth login
fi

# Fetch entries
ENTRIES=$(marvin publish entries --json)

# Check if empty
if [ "$(echo "$ENTRIES" | jq 'length')" -eq 0 ]; then
    echo "Warning: No entries found"
    exit 1
fi

echo "Success: Found entries"
```

### Environment Configuration

```bash
#!/bin/bash

# Load environment
export MARVIN_API_URL=https://api.example.com
export MARVIN_WORKSPACE_SLUG=production
export MARVIN_SITE_CLIENT_TOKEN=$PROD_TOKEN

# Or load from .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Run commands
marvin publish entries --json
```

## Exit Codes

The CLI uses standard exit codes:

| Code | Meaning | Action |
|------|---------|--------|
| `0` | Success | Command completed successfully |
| `1` | General error | Check error message |
| `401` | Authentication failed | Check credentials |
| `404` | Not found | Resource doesn't exist |
| `500` | Server error | Check server logs |

### Using Exit Codes

```bash
# Check if entry exists
if marvin publish entry homepage --json >/dev/null 2>&1; then
    echo "Homepage exists"
else
    echo "Homepage not found"
    exit 1
fi

# Store exit code
marvin publish entries --json
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    echo "Failed with exit code: $EXIT_CODE"
    exit $EXIT_CODE
fi
```

## Data Processing

### Extract Values

```bash
#!/bin/bash

# Get site title
TITLE=$(marvin publish site --json | jq -r '.title')
echo "Site: $TITLE"

# Get all entry slugs
SLUGS=$(marvin publish entries --json | jq -r '.[].slug')
echo "Slugs: $SLUGS"

# Get specific field
PUBLISHED_DATE=$(marvin publish entry homepage --json | jq -r '.publishedAt')
echo "Published: $PUBLISHED_DATE"
```

### Process Each Item

```bash
#!/bin/bash

# Get all entries as JSON array
ENTRIES=$(marvin publish entries --json)

# Loop through each entry
echo "$ENTRIES" | jq -c '.[]' | while read -r entry; do
    SLUG=$(echo "$entry" | jq -r '.slug')
    TITLE=$(echo "$entry" | jq -r '.title')
    
    echo "Processing: $TITLE ($SLUG)"
    
    # Do something with each entry
    # e.g., fetch full entry, validate, etc.
done
```

### Generate Reports

```bash
#!/bin/bash

# Generate content report
REPORT_FILE="content-report-$(date +%Y%m%d).txt"

{
    echo "Content Report - $(date)"
    echo "================================"
    echo ""
    
    echo "Published Entries:"
    ENTRY_COUNT=$(marvin publish entries --json | jq 'length')
    echo "  Total: $ENTRY_COUNT"
    
    echo ""
    echo "By Type:"
    marvin publish entries --json | \
        jq -r 'group_by(.entryType) | .[] | "  \(.[0].entryType): \(length)"'
    
    echo ""
    echo "Collections:"
    COLLECTION_COUNT=$(marvin publish collections --json | jq 'length')
    echo "  Total: $COLLECTION_COUNT"
    
    echo ""
    echo "Assets:"
    ASSET_COUNT=$(marvin publish assets --json | jq 'length')
    echo "  Total: $ASSET_COUNT"
    
    echo ""
    echo "Storage:"
    TOTAL_SIZE=$(marvin publish assets --json | jq 'map(.size) | add')
    echo "  Total: $(numfmt --to=iec-i --suffix=B $TOTAL_SIZE)"
    
} > "$REPORT_FILE"

echo "Report saved to: $REPORT_FILE"
```

## Automation Tasks

### Daily Backup Script

```bash
#!/bin/bash

BACKUP_DIR="/backups/marvin"
DATE=$(date +%Y%m%d)

mkdir -p "$BACKUP_DIR"

# Backup all entries
echo "Backing up entries..."
marvin publish entries --json > "$BACKUP_DIR/entries-$DATE.json"

# Backup collections
echo "Backing up collections..."
marvin publish collections --json > "$BACKUP_DIR/collections-$DATE.json"

# Backup assets list
echo "Backing up assets..."
marvin publish assets --json > "$BACKUP_DIR/assets-$DATE.json"

# Backup resources
echo "Backing up resources..."
marvin publish resources --json > "$BACKUP_DIR/resources-$DATE.json"

# Backup site config
echo "Backing up site config..."
marvin publish site --json > "$BACKUP_DIR/site-$DATE.json"

echo "Backup complete: $BACKUP_DIR"

# Compress
tar -czf "$BACKUP_DIR/marvin-backup-$DATE.tar.gz" \
    -C "$BACKUP_DIR" \
    entries-$DATE.json \
    collections-$DATE.json \
    assets-$DATE.json \
    resources-$DATE.json \
    site-$DATE.json

# Cleanup old backups (keep 30 days)
find "$BACKUP_DIR" -name "*.json" -mtime +30 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete
```

### Content Validation

```bash
#!/bin/bash

# Validate all published entries
echo "Validating published entries..."

ENTRIES=$(marvin publish entries --json)
INVALID_COUNT=0

echo "$ENTRIES" | jq -c '.[]' | while read -r entry; do
    SLUG=$(echo "$entry" | jq -r '.slug')
    
    # Fetch full entry
    FULL_ENTRY=$(marvin publish entry "$SLUG" --json)
    
    # Validate required fields
    if ! echo "$FULL_ENTRY" | jq -e '.title' >/dev/null; then
        echo "ERROR: Entry $SLUG missing title"
        INVALID_COUNT=$((INVALID_COUNT + 1))
    fi
    
    if ! echo "$FULL_ENTRY" | jq -e '.content' >/dev/null; then
        echo "WARNING: Entry $SLUG missing content"
    fi
done

if [ $INVALID_COUNT -gt 0 ]; then
    echo "Found $INVALID_COUNT invalid entries"
    exit 1
fi

echo "All entries valid"
```

### Sync Script

```bash
#!/bin/bash

# Sync content between environments
SOURCE_ENV="staging"
TARGET_ENV="production"

# Export from staging
echo "Exporting from $SOURCE_ENV..."
export MARVIN_API_URL=https://staging.example.com
ENTRIES=$(marvin publish entries --json)

# Save to file
echo "$ENTRIES" > /tmp/entries-export.json

# Import to production (would use Platform API)
echo "Importing to $TARGET_ENV..."
export MARVIN_API_URL=https://api.example.com

# Process each entry
jq -c '.[]' /tmp/entries-export.json | while read -r entry; do
    SLUG=$(echo "$entry" | jq -r '.slug')
    echo "Processing: $SLUG"
    
    # Create or update entry in production
    # (This would use Platform API create/update commands)
done

rm /tmp/entries-export.json
```

## Scheduled Tasks

### Cron Jobs

```bash
# Daily backup at 2 AM
0 2 * * * /path/to/backup-marvin.sh >> /var/log/marvin-backup.log 2>&1

# Hourly content validation
0 * * * * /path/to/validate-content.sh

# Weekly report on Monday at 9 AM
0 9 * * 1 /path/to/generate-report.sh | mail -s "Marvin Weekly Report" admin@example.com

# Monthly cleanup on 1st at midnight
0 0 1 * * /path/to/cleanup-old-data.sh
```

### systemd Timer (Linux)

```ini
# /etc/systemd/system/marvin-backup.timer
[Unit]
Description=Daily Marvin Backup

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
```

```ini
# /etc/systemd/system/marvin-backup.service
[Unit]
Description=Marvin Backup Service

[Service]
Type=oneshot
ExecStart=/path/to/backup-marvin.sh
User=marvin
Environment="MARVIN_API_URL=https://api.example.com"
Environment="MARVIN_SITE_CLIENT_TOKEN=marvin_sk_token"
```

Enable and start:

```bash
sudo systemctl enable marvin-backup.timer
sudo systemctl start marvin-backup.timer
```

## Node.js Integration

### Execute CLI from Node

```javascript
const { execSync } = require('child_process');

// Get entries
const output = execSync('marvin publish entries --json', { encoding: 'utf-8' });
const entries = JSON.parse(output);

console.log(`Found ${entries.length} entries`);

// Process entries
entries.forEach(entry => {
    console.log(`- ${entry.title} (${entry.slug})`);
});
```

### Async Execution

```javascript
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

async function getEntries() {
    try {
        const { stdout } = await execPromise('marvin publish entries --json');
        return JSON.parse(stdout);
    } catch (error) {
        console.error('Failed to fetch entries:', error);
        throw error;
    }
}

async function main() {
    const entries = await getEntries();
    console.log(`Found ${entries.length} entries`);
}

main();
```

### Child Process with Streaming

```javascript
const { spawn } = require('child_process');

const marvin = spawn('marvin', ['publish', 'entries', '--json']);

let data = '';

marvin.stdout.on('data', (chunk) => {
    data += chunk;
});

marvin.stderr.on('data', (chunk) => {
    console.error(`Error: ${chunk}`);
});

marvin.on('close', (code) => {
    if (code === 0) {
        const entries = JSON.parse(data);
        console.log(`Found ${entries.length} entries`);
    } else {
        console.error(`Process exited with code ${code}`);
    }
});
```

## Python Integration

### Subprocess Module

```python
import subprocess
import json

# Get entries
result = subprocess.run(
    ['marvin', 'publish', 'entries', '--json'],
    capture_output=True,
    text=True,
    check=True
)

entries = json.loads(result.stdout)
print(f"Found {len(entries)} entries")

# Process entries
for entry in entries:
    print(f"- {entry['title']} ({entry['slug']})")
```

### Error Handling

```python
import subprocess
import json
import sys

try:
    result = subprocess.run(
        ['marvin', 'publish', 'entries', '--json'],
        capture_output=True,
        text=True,
        check=True
    )
    
    entries = json.loads(result.stdout)
    print(f"Success: {len(entries)} entries")
    
except subprocess.CalledProcessError as e:
    print(f"Error: {e.stderr}", file=sys.stderr)
    sys.exit(e.returncode)
    
except json.JSONDecodeError as e:
    print(f"Invalid JSON: {e}", file=sys.stderr)
    sys.exit(1)
```

### Pandas Integration

```python
import subprocess
import json
import pandas as pd

# Get entries as JSON
result = subprocess.run(
    ['marvin', 'publish', 'entries', '--json'],
    capture_output=True,
    text=True
)

entries = json.loads(result.stdout)

# Convert to DataFrame
df = pd.DataFrame(entries)

# Analyze
print("Entries by type:")
print(df['entryType'].value_counts())

print("\nEntries by status:")
print(df['status'].value_counts())

# Export to CSV
df.to_csv('entries.csv', index=False)
```

## Best Practices

1. **Always use JSON output** for scripting - table format is for humans
2. **Check exit codes** - handle errors gracefully
3. **Use environment variables** - don't hardcode credentials
4. **Add logging** - track script execution
5. **Handle errors** - assume commands can fail
6. **Validate output** - check JSON before processing
7. **Use timeouts** - don't wait forever for responses
8. **Test scripts** - verify with small datasets first

## Error Handling Patterns

### Retry Logic

```bash
#!/bin/bash

MAX_RETRIES=3
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if marvin publish entries --json > entries.json; then
        echo "Success"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo "Attempt $RETRY_COUNT failed, retrying..."
        sleep 5
    fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "Failed after $MAX_RETRIES attempts"
    exit 1
fi
```

### Timeout Handling

```bash
#!/bin/bash

# Run with timeout
timeout 30 marvin publish entries --json > entries.json

if [ $? -eq 124 ]; then
    echo "Command timed out after 30 seconds"
    exit 1
fi
```

### Cleanup on Exit

```bash
#!/bin/bash

TEMP_FILE=$(mktemp)

# Cleanup on exit
trap "rm -f $TEMP_FILE" EXIT

# Use temp file
marvin publish entries --json > "$TEMP_FILE"

# Process data
jq . "$TEMP_FILE"

# Cleanup happens automatically
```

## Related

- [Filtering Guide](filtering.md)
- [Data Pipelines](pipelines.md)
- [CI/CD Integration](ci-cd.md)
- [Examples](../examples/automation.md)
