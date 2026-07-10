# Automation Examples

Real-world automation examples using the Marvin CLI.

## Scheduled Tasks

### Daily Backup

```bash
#!/bin/bash
# Daily content backup script

BACKUP_DIR="/backups/marvin"
DATE=$(date +%Y%m%d)

mkdir -p "$BACKUP_DIR"

echo "Starting daily backup - $(date)"

# Backup all content
marvin publish entries --json > "$BACKUP_DIR/entries-$DATE.json"
marvin publish collections --json > "$BACKUP_DIR/collections-$DATE.json"
marvin publish assets --json > "$BACKUP_DIR/assets-$DATE.json"
marvin publish resources --json > "$BACKUP_DIR/resources-$DATE.json"
marvin publish site --json > "$BACKUP_DIR/site-$DATE.json"

# Compress
tar -czf "$BACKUP_DIR/marvin-backup-$DATE.tar.gz" \
    -C "$BACKUP_DIR" \
    entries-$DATE.json \
    collections-$DATE.json \
    assets-$DATE.json \
    resources-$DATE.json \
    site-$DATE.json

# Cleanup individual files
rm "$BACKUP_DIR"/*.json

# Remove backups older than 30 days
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete

echo "Backup complete: $BACKUP_DIR/marvin-backup-$DATE.tar.gz"
```

Add to crontab for daily execution:

```bash
# Daily backup at 2 AM
0 2 * * * /path/to/daily-backup.sh >> /var/log/marvin-backup.log 2>&1
```

### Content Validation

```bash
#!/bin/bash
# Validate published content

echo "Content Validation - $(date)"
echo "=============================="

ERRORS=0

# Check required pages exist
REQUIRED_PAGES=("homepage" "about" "contact" "privacy" "terms")

for page in "${REQUIRED_PAGES[@]}"; do
  if marvin publish entry "$page" --json >/dev/null 2>&1; then
    echo "✓ $page exists"
  else
    echo "✗ $page is MISSING"
    ERRORS=$((ERRORS + 1))
  fi
done

# Check for entries without descriptions
MISSING_DESC=$(marvin publish entries --json | \
  jq '[.[] | select(.description == null or .description == "")] | length')

if [ "$MISSING_DESC" -gt 0 ]; then
  echo "⚠ $MISSING_DESC entries missing descriptions"
fi

# Exit with error if critical issues found
if [ $ERRORS -gt 0 ]; then
  echo ""
  echo "Validation FAILED: $ERRORS critical errors"
  exit 1
else
  echo ""
  echo "Validation PASSED"
  exit 0
fi
```

Schedule hourly validation:

```bash
# Hourly validation
0 * * * * /path/to/validate-content.sh
```

### Static Site Build

```bash
#!/bin/bash
# Fetch content and trigger static site build

OUTPUT_DIR="src/data"
mkdir -p "$OUTPUT_DIR"

echo "Fetching content from Marvin..."

# Fetch all data
marvin publish site --json > "$OUTPUT_DIR/site.json"
marvin publish entries --json > "$OUTPUT_DIR/entries.json"
marvin publish collections --json > "$OUTPUT_DIR/collections.json"
marvin publish resources --json > "$OUTPUT_DIR/resources.json"

# Verify we got data
ENTRY_COUNT=$(jq 'length' "$OUTPUT_DIR/entries.json")

if [ "$ENTRY_COUNT" -eq 0 ]; then
  echo "ERROR: No entries fetched"
  exit 1
fi

echo "Fetched $ENTRY_COUNT entries"

# Fetch individual entry details
mkdir -p "$OUTPUT_DIR/entries"
jq -r '.[].slug' "$OUTPUT_DIR/entries.json" | while read -r slug; do
  echo "  - Fetching $slug"
  marvin publish entry "$slug" --json > "$OUTPUT_DIR/entries/${slug}.json"
done

echo "Content ready for build"

# Trigger your build process
npm run build
```

## Content Monitoring

### Check for Changes

```bash
#!/bin/bash
# Monitor content changes

SNAPSHOT_DIR="snapshots"
DATE=$(date +%Y%m%d)
mkdir -p "$SNAPSHOT_DIR"

# Take current snapshot
marvin publish entries --json > "$SNAPSHOT_DIR/current.json"

# Compare with previous
if [ -f "$SNAPSHOT_DIR/previous.json" ]; then
  CURRENT_COUNT=$(jq 'length' "$SNAPSHOT_DIR/current.json")
  PREVIOUS_COUNT=$(jq 'length' "$SNAPSHOT_DIR/previous.json")
  
  DIFF=$((CURRENT_COUNT - PREVIOUS_COUNT))
  
  if [ $DIFF -ne 0 ]; then
    echo "Content changed: $DIFF entries"
    
    # Trigger rebuild or notification
    ./trigger-rebuild.sh
  else
    echo "No content changes detected"
  fi
fi

# Save as previous for next run
cp "$SNAPSHOT_DIR/current.json" "$SNAPSHOT_DIR/previous.json"
```

Run every 15 minutes:

```bash
# Check for changes every 15 minutes
*/15 * * * * /path/to/check-changes.sh
```

### Alert on Missing Content

```bash
#!/bin/bash
# Alert if critical content is missing

ALERT_EMAIL="admin@example.com"

# Check homepage exists
if ! marvin publish entry homepage --json >/dev/null 2>&1; then
  echo "ALERT: Homepage is missing!" | \
    mail -s "Critical: Marvin Homepage Missing" "$ALERT_EMAIL"
fi

# Check minimum entry count
COUNT=$(marvin publish entries --json | jq 'length')
MIN_ENTRIES=10

if [ "$COUNT" -lt "$MIN_ENTRIES" ]; then
  echo "ALERT: Only $COUNT entries found (minimum: $MIN_ENTRIES)" | \
    mail -s "Warning: Low Entry Count" "$ALERT_EMAIL"
fi
```

## Data Synchronization

### Sync to Staging

```bash
#!/bin/bash
# Sync production content to staging

PROD_API="https://api.example.com"
STAGING_API="https://staging.example.com"

TEMP_DIR="/tmp/marvin-sync"
mkdir -p "$TEMP_DIR"

echo "Syncing production to staging..."

# Export from production
export MARVIN_API_URL="$PROD_API"
marvin publish entries --json > "$TEMP_DIR/entries.json"
marvin publish collections --json > "$TEMP_DIR/collections.json"

# Import to staging (would use Platform API)
export MARVIN_API_URL="$STAGING_API"

# Process entries
jq -c '.[]' "$TEMP_DIR/entries.json" | while read -r entry; do
  SLUG=$(echo "$entry" | jq -r '.slug')
  echo "Syncing: $SLUG"
  
  # Create/update in staging
  # (Platform API commands would go here)
done

rm -rf "$TEMP_DIR"
echo "Sync complete"
```

### Mirror Assets

```bash
#!/bin/bash
# Download and mirror assets

ASSET_DIR="public/assets"
mkdir -p "$ASSET_DIR"

echo "Mirroring assets..."

marvin publish assets --json | jq -c '.[]' | while read -r asset; do
  URL=$(echo "$asset" | jq -r '.url')
  FILENAME=$(echo "$asset" | jq -r '.filename')
  
  # Skip if already downloaded
  if [ -f "$ASSET_DIR/$FILENAME" ]; then
    continue
  fi
  
  echo "Downloading: $FILENAME"
  curl -s -o "$ASSET_DIR/$FILENAME" "$URL"
done

echo "Asset mirroring complete"
```

## Reporting Automation

### Daily Summary Email

```bash
#!/bin/bash
# Send daily content summary via email

RECIPIENT="team@example.com"
SUBJECT="Daily Marvin Summary - $(date +%Y-%m-%d)"

MESSAGE=$(cat <<EOF
Daily Content Summary
$(date)
=====================

Total Entries: $(marvin publish entries --json | jq 'length')
Total Collections: $(marvin publish collections --json | jq 'length')
Total Assets: $(marvin publish assets --json | jq 'length')

Published Today:
$(marvin publish entries --json | \
  jq --arg today "$(date +%Y-%m-%d)" -r \
     '[.[] | select(.publishedAt | startswith($today))] | 
      if length > 0 then .[] | "  - \(.title)" else "  None" end')

---
Automated report from Marvin CLI
EOF
)

echo "$MESSAGE" | mail -s "$SUBJECT" "$RECIPIENT"
```

Schedule daily at 9 AM:

```bash
0 9 * * * /path/to/daily-summary.sh
```

### Weekly Analytics

```bash
#!/bin/bash
# Generate weekly analytics

WEEK_START=$(date -d 'last Monday' +%Y-%m-%d 2>/dev/null || date -v-Mon +%Y-%m-%d)

ANALYTICS_FILE="analytics/week-$WEEK_START.json"
mkdir -p analytics

# Collect metrics
jq -n \
  --arg week "$WEEK_START" \
  --argjson entries "$(marvin publish entries --json)" \
  --argjson assets "$(marvin publish assets --json)" \
  '{
    week: $week,
    totalEntries: ($entries | length),
    totalAssets: ($assets | length),
    entriesByType: ($entries | group_by(.entryType) | 
      map({type: .[0].entryType, count: length})),
    newThisWeek: ($entries | 
      [.[] | select(.publishedAt >= $week)] | length),
    storage: ($assets | map(.size) | add)
  }' > "$ANALYTICS_FILE"

echo "Analytics saved: $ANALYTICS_FILE"
```

## Content Optimization

### Optimize Images

```bash
#!/bin/bash
# Download and optimize images

IMAGE_DIR="optimized-images"
mkdir -p "$IMAGE_DIR"

marvin publish assets --type image --json | jq -c '.[]' | while read -r image; do
  URL=$(echo "$image" | jq -r '.url')
  FILENAME=$(echo "$image" | jq -r '.filename')
  SIZE=$(echo "$image" | jq -r '.size')
  
  # Skip small images
  if [ "$SIZE" -lt 1048576 ]; then
    continue
  fi
  
  echo "Optimizing: $FILENAME ($(echo $SIZE | numfmt --to=iec-i))B)"
  
  # Download
  curl -s -o "/tmp/$FILENAME" "$URL"
  
  # Optimize (requires imagemagick)
  convert "/tmp/$FILENAME" -quality 85 -strip "$IMAGE_DIR/$FILENAME"
  
  ORIGINAL=$(stat -f%z "/tmp/$FILENAME" 2>/dev/null || stat -c%s "/tmp/$FILENAME")
  OPTIMIZED=$(stat -f%z "$IMAGE_DIR/$FILENAME" 2>/dev/null || stat -c%s "$IMAGE_DIR/$FILENAME")
  SAVED=$((ORIGINAL - OPTIMIZED))
  
  echo "  Saved: $(echo $SAVED | numfmt --to=iec-i)B"
  
  rm "/tmp/$FILENAME"
done
```

### Generate Metadata

```bash
#!/bin/bash
# Generate metadata files for entries

METADATA_DIR="metadata"
mkdir -p "$METADATA_DIR"

marvin publish entries --json | jq -c '.[]' | while read -r entry; do
  SLUG=$(echo "$entry" | jq -r '.slug')
  
  # Extract and save metadata
  echo "$entry" | jq '{
    slug: .slug,
    title: .title,
    description: .description,
    type: .entryType,
    published: .publishedAt,
    seo: .metadata
  }' > "$METADATA_DIR/$SLUG.json"
done

echo "Metadata generated for $(ls "$METADATA_DIR" | wc -l) entries"
```

## Integration Workflows

### Slack Notifications

```bash
#!/bin/bash
# Post content updates to Slack

SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Check for new content today
NEW_TODAY=$(marvin publish entries --json | \
  jq --arg today "$(date +%Y-%m-%d)" \
     '[.[] | select(.publishedAt | startswith($today))] | length')

if [ "$NEW_TODAY" -gt 0 ]; then
  MESSAGE="{\"text\": \"$NEW_TODAY new entries published today!\"}"
  curl -X POST -H 'Content-type: application/json' \
    --data "$MESSAGE" "$SLACK_WEBHOOK"
fi
```

### GitHub Actions Integration

```bash
#!/bin/bash
# Trigger GitHub Actions workflow

GITHUB_TOKEN="your_github_token"
REPO="owner/repo"

# Check if content changed
if ./check-content-changed.sh; then
  echo "Content changed, triggering build..."
  
  curl -X POST \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/repos/$REPO/actions/workflows/build.yml/dispatches" \
    -d '{"ref":"main"}'
  
  echo "Build triggered"
fi
```

## Maintenance Tasks

### Cleanup Old Backups

```bash
#!/bin/bash
# Clean up old backup files

BACKUP_DIR="/backups/marvin"
KEEP_DAYS=30

echo "Cleaning up backups older than $KEEP_DAYS days..."

DELETED=$(find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$KEEP_DAYS -delete -print | wc -l)

echo "Deleted $DELETED old backups"
```

### Archive Old Content

```bash
#!/bin/bash
# Archive entries older than 1 year

CUTOFF=$(date -d '365 days ago' +%Y-%m-%d 2>/dev/null || date -v-365d +%Y-%m-%d)
ARCHIVE_DIR="archived-content"
mkdir -p "$ARCHIVE_DIR"

echo "Archiving content older than $CUTOFF..."

marvin publish entries --json | \
  jq --arg date "$CUTOFF" \
     '[.[] | select(.publishedAt < $date)]' > "$ARCHIVE_DIR/old-entries-$(date +%Y%m%d).json"

COUNT=$(jq 'length' "$ARCHIVE_DIR/old-entries-$(date +%Y%m%d).json")
echo "Archived $COUNT entries"
```

## Best Practices

### Error Handling

```bash
#!/bin/bash
set -e  # Exit on error
set -o pipefail  # Catch errors in pipes

# Add error trap
trap 'echo "Error on line $LINENO"' ERR

# Your automation code here
marvin publish entries --json > entries.json
```

### Logging

```bash
#!/bin/bash
LOG_FILE="/var/log/marvin-automation.log"

# Log with timestamp
log() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log "Starting automation..."
marvin publish entries --json > entries.json
log "Automation complete"
```

### Retries

```bash
#!/bin/bash
# Retry failed commands

MAX_RETRIES=3
RETRY_DELAY=5

for i in $(seq 1 $MAX_RETRIES); do
  if marvin publish entries --json > entries.json; then
    echo "Success on attempt $i"
    break
  else
    echo "Attempt $i failed"
    if [ $i -lt $MAX_RETRIES ]; then
      sleep $RETRY_DELAY
    else
      echo "Failed after $MAX_RETRIES attempts"
      exit 1
    fi
  fi
done
```

## Related

- [CI/CD Integration Guide](../guides/ci-cd.md)
- [Scripting Guide](../guides/scripting.md)
- [Common Tasks](common-tasks.md)
- [Export/Import Examples](export-import.md)
