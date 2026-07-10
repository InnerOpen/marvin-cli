# Export & Import Workflows

Examples for exporting content from Marvin, transforming data, and preparing imports.

## Basic Export

### Export All Content

```bash
#!/bin/bash
# Complete content export

DATE=$(date +%Y%m%d-%H%M%S)
EXPORT_DIR="marvin-export-$DATE"

mkdir -p "$EXPORT_DIR"

echo "Exporting Marvin content..."

# Export all data types
echo "  - Site config"
marvin publish site --json > "$EXPORT_DIR/site.json"

echo "  - Entries"
marvin publish entries --json > "$EXPORT_DIR/entries.json"

echo "  - Collections"
marvin publish collections --json > "$EXPORT_DIR/collections.json"

echo "  - Resources"
marvin publish resources --json > "$EXPORT_DIR/resources.json"

echo "  - Assets"
marvin publish assets --json > "$EXPORT_DIR/assets.json"

# Create manifest
jq -n \
  --arg date "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --arg version "1.0" \
  --argjson entries "$(jq 'length' < "$EXPORT_DIR/entries.json")" \
  --argjson collections "$(jq 'length' < "$EXPORT_DIR/collections.json")" \
  --argjson assets "$(jq 'length' < "$EXPORT_DIR/assets.json")" \
  '{
    exportDate: $date,
    version: $version,
    counts: {
      entries: $entries,
      collections: $collections,
      assets: $assets
    }
  }' > "$EXPORT_DIR/manifest.json"

# Compress
tar -czf "$EXPORT_DIR.tar.gz" "$EXPORT_DIR"

echo ""
echo "✓ Export complete: $EXPORT_DIR.tar.gz"
echo "  Entries: $(jq 'length' < "$EXPORT_DIR/entries.json")"
echo "  Collections: $(jq 'length' < "$EXPORT_DIR/collections.json")"
echo "  Assets: $(jq 'length' < "$EXPORT_DIR/assets.json")"
```

### Export by Type

```bash
#!/bin/bash
# Export specific content types

mkdir -p exports

# Pages only
marvin publish entries --entry-type page --json > exports/pages.json
echo "Exported $(jq 'length' exports/pages.json) pages"

# Projects only
marvin publish entries --entry-type project --json > exports/projects.json
echo "Exported $(jq 'length' exports/projects.json) projects"

# Blog posts only
marvin publish entries --entry-type article --json > exports/articles.json
echo "Exported $(jq 'length' exports/articles.json) articles"

# Images only
marvin publish assets --type image --json > exports/images.json
echo "Exported $(jq 'length' exports/images.json) images"
```

### Export with Details

```bash
#!/bin/bash
# Export entries with full details

EXPORT_DIR="detailed-export"
mkdir -p "$EXPORT_DIR/entries"

echo "Exporting detailed entry data..."

# Get list of all entry slugs
SLUGS=$(marvin publish entries --json | jq -r '.[].slug')

# Export each entry with full details
for slug in $SLUGS; do
  echo "  - $slug"
  marvin publish entry "$slug" --json > "$EXPORT_DIR/entries/${slug}.json"
done

echo ""
echo "✓ Exported $(ls "$EXPORT_DIR/entries" | wc -l) detailed entries"
```

## Selective Export

### Export by Collection

```bash
#!/bin/bash
# Export entries from specific collections

COLLECTIONS=("featured" "archived" "homepage-content")

for collection in "${COLLECTIONS[@]}"; do
  echo "Exporting collection: $collection"
  
  marvin publish collection-entries "$collection" --json > "${collection}.json"
  
  COUNT=$(jq 'length' "${collection}.json")
  echo "  → $COUNT entries"
done
```

### Export by Date Range

```bash
#!/bin/bash
# Export entries published in a date range

START_DATE="2026-01-01"
END_DATE="2026-06-30"

marvin publish entries --json | \
  jq --arg start "$START_DATE" --arg end "$END_DATE" \
     '[.[] | select(
       .publishedAt >= $start and 
       .publishedAt <= $end
     )]' > "entries-${START_DATE}-to-${END_DATE}.json"

COUNT=$(jq 'length' "entries-${START_DATE}-to-${END_DATE}.json")
echo "Exported $COUNT entries from $START_DATE to $END_DATE"
```

### Export Recent Content

```bash
#!/bin/bash
# Export content from last N days

DAYS_AGO=30
CUTOFF_DATE=$(date -d "$DAYS_AGO days ago" +%Y-%m-%d)

echo "Exporting content since $CUTOFF_DATE..."

marvin publish entries --json | \
  jq --arg date "$CUTOFF_DATE" \
     '[.[] | select(.publishedAt >= $date)]' > recent-entries.json

COUNT=$(jq 'length' recent-entries.json)
echo "Exported $COUNT entries from last $DAYS_AGO days"
```

### Export Modified Content

```bash
#!/bin/bash
# Export entries modified after a certain date

SINCE_DATE="2026-06-01"

marvin publish entries --json | \
  jq --arg date "$SINCE_DATE" \
     '[.[] | select(.updatedAt >= $date)]' > modified-entries.json

COUNT=$(jq 'length' modified-entries.json)
echo "Exported $COUNT entries modified since $SINCE_DATE"
```

## Format Conversion

### Export to CSV

```bash
#!/bin/bash
# Export entries to CSV format

OUTPUT="entries.csv"

# Create CSV with headers
{
  echo "Title,Slug,Type,Status,Published,Description"
  
  marvin publish entries --json | \
    jq -r '.[] | [
      .title,
      .slug,
      .entryType,
      .status,
      .publishedAt,
      .description // ""
    ] | @csv'
} > "$OUTPUT"

echo "Exported to $OUTPUT ($(wc -l < $OUTPUT) rows)"
```

### Export to YAML

```bash
#!/bin/bash
# Export content to YAML format

# Single file
marvin publish entries --yaml > entries.yaml

# Or convert JSON to YAML
marvin publish entries --json | yq -P > entries.yaml

echo "Exported to entries.yaml"
```

### Export to Markdown

```bash
#!/bin/bash
# Export entries as individual markdown files

EXPORT_DIR="markdown-export"
mkdir -p "$EXPORT_DIR"

marvin publish entries --json | jq -c '.[]' | while read -r entry; do
  SLUG=$(echo "$entry" | jq -r '.slug')
  TITLE=$(echo "$entry" | jq -r '.title')
  PUBLISHED=$(echo "$entry" | jq -r '.publishedAt')
  DESCRIPTION=$(echo "$entry" | jq -r '.description // ""')
  CONTENT=$(echo "$entry" | jq -r '.content.blocks // [] | map(.content // "") | join("\n\n")')
  
  # Create frontmatter
  cat > "$EXPORT_DIR/${SLUG}.md" <<EOF
---
title: "$TITLE"
published: $PUBLISHED
description: "$DESCRIPTION"
---

$CONTENT
EOF

  echo "Exported: ${SLUG}.md"
done

echo ""
echo "✓ Exported $(ls "$EXPORT_DIR" | wc -l) markdown files"
```

### Export to HTML

```bash
#!/bin/bash
# Export entries as HTML files

EXPORT_DIR="html-export"
mkdir -p "$EXPORT_DIR"

marvin publish entries --json | jq -c '.[]' | while read -r entry; do
  SLUG=$(echo "$entry" | jq -r '.slug')
  TITLE=$(echo "$entry" | jq -r '.title')
  DESCRIPTION=$(echo "$entry" | jq -r '.description // ""')
  CONTENT=$(echo "$entry" | jq -r '.content.blocks // [] | map(.content // "") | join("<br><br>")')
  
  cat > "$EXPORT_DIR/${SLUG}.html" <<EOF
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>$TITLE</title>
  <meta name="description" content="$DESCRIPTION">
</head>
<body>
  <h1>$TITLE</h1>
  <p><em>$DESCRIPTION</em></p>
  <hr>
  $CONTENT
</body>
</html>
EOF

  echo "Exported: ${SLUG}.html"
done
```

## Data Transformation

### Transform for WordPress

```bash
#!/bin/bash
# Transform Marvin export to WordPress import format

marvin publish entries --json | \
  jq '.[] | {
    title: .title,
    status: "publish",
    type: "post",
    content: (.content.blocks // [] | map(.content // "") | join("\n\n")),
    excerpt: .description,
    date: .publishedAt,
    slug: .slug,
    categories: [.entryType],
    tags: .collections,
    meta: {
      seo_title: .metadata.seoTitle,
      seo_description: .metadata.seoDescription
    }
  }' | jq -s . > wordpress-import.json

echo "WordPress import file created: wordpress-import.json"
```

### Transform for Contentful

```bash
#!/bin/bash
# Transform to Contentful import format

marvin publish entries --json | \
  jq '{
    entries: [.[] | {
      sys: {
        id: .slug,
        contentType: {
          sys: {
            id: .entryType
          }
        }
      },
      fields: {
        title: {
          "en-US": .title
        },
        slug: {
          "en-US": .slug
        },
        description: {
          "en-US": .description
        },
        content: {
          "en-US": .content
        },
        publishedDate: {
          "en-US": .publishedAt
        }
      }
    }]
  }' > contentful-import.json

echo "Contentful import file created"
```

### Transform for Static Site

```bash
#!/bin/bash
# Transform for static site generator (Hugo, Jekyll, etc.)

EXPORT_DIR="static-site-content"
mkdir -p "$EXPORT_DIR/content"

marvin publish entries --json | jq -c '.[]' | while read -r entry; do
  SLUG=$(echo "$entry" | jq -r '.slug')
  TYPE=$(echo "$entry" | jq -r '.entryType')
  TITLE=$(echo "$entry" | jq -r '.title')
  DATE=$(echo "$entry" | jq -r '.publishedAt | split("T")[0]')
  DESCRIPTION=$(echo "$entry" | jq -r '.description // ""')
  TAGS=$(echo "$entry" | jq -r '.collections // [] | join(", ")')
  CONTENT=$(echo "$entry" | jq -r '.content.blocks // [] | map(.content // "") | join("\n\n")')
  
  # Create directory for type
  mkdir -p "$EXPORT_DIR/content/$TYPE"
  
  # Create markdown file with frontmatter
  cat > "$EXPORT_DIR/content/$TYPE/${SLUG}.md" <<EOF
---
title: "$TITLE"
date: $DATE
description: "$DESCRIPTION"
tags: [$TAGS]
type: $TYPE
---

$CONTENT
EOF

  echo "Created: $TYPE/${SLUG}.md"
done
```

### Flatten Nested Data

```bash
# Flatten nested content structure
marvin publish entries --json | \
  jq '.[] | {
    slug: .slug,
    title: .title,
    type: .entryType,
    description: .description,
    published: .publishedAt,
    seoTitle: .metadata.seoTitle,
    seoDescription: .metadata.seoDescription,
    featured: .metadata.featured // false,
    collections: (.collections // [] | join(",")),
    content: (.content.blocks // [] | map(.content // "") | join(" "))
  }' | jq -s . > flattened-entries.json
```

## Asset Export

### Export Asset Metadata

```bash
#!/bin/bash
# Export asset information

marvin publish assets --json | \
  jq '.[] | {
    filename: .filename,
    url: .url,
    mimeType: .mimeType,
    size: .size,
    sizeInMB: (.size / 1048576 | round * 100 / 100),
    alt: .metadata.alt,
    title: .metadata.title,
    uploadedAt: .uploadedAt
  }' | jq -s . > assets-metadata.json

echo "Asset metadata exported"
```

### Download Assets

```bash
#!/bin/bash
# Download all assets

ASSET_DIR="downloaded-assets"
mkdir -p "$ASSET_DIR"

marvin publish assets --json | jq -c '.[]' | while read -r asset; do
  URL=$(echo "$asset" | jq -r '.url')
  FILENAME=$(echo "$asset" | jq -r '.filename')
  
  echo "Downloading: $FILENAME"
  curl -s -o "$ASSET_DIR/$FILENAME" "$URL"
done

echo ""
echo "✓ Downloaded $(ls "$ASSET_DIR" | wc -l) assets"
```

### Download Images Only

```bash
#!/bin/bash
# Download only image assets

IMAGE_DIR="images"
mkdir -p "$IMAGE_DIR"

marvin publish assets --type image --json | jq -c '.[]' | while read -r asset; do
  URL=$(echo "$asset" | jq -r '.url')
  FILENAME=$(echo "$asset" | jq -r '.filename')
  
  echo "Downloading: $FILENAME"
  curl -s -o "$IMAGE_DIR/$FILENAME" "$URL"
done

echo "✓ Downloaded $(ls "$IMAGE_DIR" | wc -l) images"
```

### Create Asset Inventory

```bash
#!/bin/bash
# Create detailed asset inventory

cat > asset-inventory.csv <<EOF
Filename,Type,Size (MB),URL,Alt Text,Uploaded
EOF

marvin publish assets --json | jq -r '.[] | [
  .filename,
  .mimeType,
  (.size / 1048576 | round * 100 / 100 | tostring),
  .url,
  .metadata.alt // "",
  .uploadedAt
] | @csv' >> asset-inventory.csv

echo "Asset inventory created: $(wc -l < asset-inventory.csv) assets"
```

## Incremental Export

### Export Changes Since Last Export

```bash
#!/bin/bash
# Track and export only new/changed content

LAST_EXPORT="last-export.json"
CURRENT_EXPORT="current-export.json"

# Get current state
marvin publish entries --json > "$CURRENT_EXPORT"

# If no previous export, use current as baseline
if [ ! -f "$LAST_EXPORT" ]; then
  cp "$CURRENT_EXPORT" "$LAST_EXPORT"
  echo "Baseline export created"
  exit 0
fi

# Find new entries
jq -r '.[].slug' "$CURRENT_EXPORT" | sort > /tmp/current-slugs.txt
jq -r '.[].slug' "$LAST_EXPORT" | sort > /tmp/last-slugs.txt

NEW_SLUGS=$(comm -13 /tmp/last-slugs.txt /tmp/current-slugs.txt)

if [ -n "$NEW_SLUGS" ]; then
  echo "New entries found:"
  echo "$NEW_SLUGS" | while read -r slug; do
    echo "  - $slug"
    jq --arg slug "$slug" '.[] | select(.slug == $slug)' "$CURRENT_EXPORT"
  done > new-entries.json
  
  COUNT=$(echo "$NEW_SLUGS" | wc -l)
  echo ""
  echo "Exported $COUNT new entries to new-entries.json"
else
  echo "No new entries since last export"
fi

# Update baseline
cp "$CURRENT_EXPORT" "$LAST_EXPORT"
```

### Diff Between Exports

```bash
#!/bin/bash
# Compare two exports

EXPORT1="export-old.json"
EXPORT2="export-new.json"

if [ ! -f "$EXPORT1" ] || [ ! -f "$EXPORT2" ]; then
  echo "Error: Both export files required"
  exit 1
fi

# Count differences
OLD_COUNT=$(jq 'length' "$EXPORT1")
NEW_COUNT=$(jq 'length' "$EXPORT2")
DIFF=$((NEW_COUNT - OLD_COUNT))

echo "Comparison Report"
echo "================="
echo "Old export: $OLD_COUNT entries"
echo "New export: $NEW_COUNT entries"
echo "Difference: $DIFF"
echo ""

# Find added entries
jq -r '.[].slug' "$EXPORT1" | sort > /tmp/old-slugs.txt
jq -r '.[].slug' "$EXPORT2" | sort > /tmp/new-slugs.txt

ADDED=$(comm -13 /tmp/old-slugs.txt /tmp/new-slugs.txt)
REMOVED=$(comm -23 /tmp/old-slugs.txt /tmp/new-slugs.txt)

if [ -n "$ADDED" ]; then
  echo "Added entries:"
  echo "$ADDED" | sed 's/^/  - /'
  echo ""
fi

if [ -n "$REMOVED" ]; then
  echo "Removed entries:"
  echo "$REMOVED" | sed 's/^/  - /'
  echo ""
fi
```

## Multi-Workspace Export

### Export from Multiple Workspaces

```bash
#!/bin/bash
# Export content from multiple workspaces

WORKSPACES=("workspace-1" "workspace-2" "workspace-3")
EXPORT_DIR="multi-workspace-export"
mkdir -p "$EXPORT_DIR"

for workspace in "${WORKSPACES[@]}"; do
  echo "Exporting workspace: $workspace"
  
  WS_DIR="$EXPORT_DIR/$workspace"
  mkdir -p "$WS_DIR"
  
  # Export with workspace context
  marvin --workspace "$workspace" publish entries --json > "$WS_DIR/entries.json"
  marvin --workspace "$workspace" publish collections --json > "$WS_DIR/collections.json"
  marvin --workspace "$workspace" publish assets --json > "$WS_DIR/assets.json"
  
  COUNT=$(jq 'length' "$WS_DIR/entries.json")
  echo "  → $COUNT entries"
done

echo ""
echo "✓ Multi-workspace export complete"
```

### Compare Workspaces

```bash
#!/bin/bash
# Compare content between workspaces

WS1="production"
WS2="staging"

echo "Comparing workspaces: $WS1 vs $WS2"

# Export from both
PROD=$(marvin --workspace "$WS1" publish entries --json)
STAGING=$(marvin --workspace "$WS2" publish entries --json)

# Compare counts
PROD_COUNT=$(echo "$PROD" | jq 'length')
STAGING_COUNT=$(echo "$STAGING" | jq 'length')

echo "$WS1: $PROD_COUNT entries"
echo "$WS2: $STAGING_COUNT entries"
echo ""

# Find differences
echo "$PROD" | jq -r '.[].slug' | sort > /tmp/prod-slugs.txt
echo "$STAGING" | jq -r '.[].slug' | sort > /tmp/staging-slugs.txt

echo "In $WS2 but not $WS1:"
comm -13 /tmp/prod-slugs.txt /tmp/staging-slugs.txt | sed 's/^/  - /'

echo ""
echo "In $WS1 but not $WS2:"
comm -23 /tmp/prod-slugs.txt /tmp/staging-slugs.txt | sed 's/^/  - /'
```

## Backup & Restore

### Create Versioned Backup

```bash
#!/bin/bash
# Create timestamped backup with versioning

BACKUP_BASE="backups"
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="$BACKUP_BASE/backup-$DATE"

mkdir -p "$BACKUP_DIR"

echo "Creating backup: $DATE"

# Export all content
marvin publish site --json > "$BACKUP_DIR/site.json"
marvin publish entries --json > "$BACKUP_DIR/entries.json"
marvin publish collections --json > "$BACKUP_DIR/collections.json"
marvin publish resources --json > "$BACKUP_DIR/resources.json"
marvin publish assets --json > "$BACKUP_DIR/assets.json"

# Create manifest with checksums
{
  echo "{"
  echo "  \"date\": \"$DATE\","
  echo "  \"checksums\": {"
  for file in "$BACKUP_DIR"/*.json; do
    if [ "$file" != "$BACKUP_DIR/manifest.json" ]; then
      CHECKSUM=$(shasum -a 256 "$file" | cut -d' ' -f1)
      FILENAME=$(basename "$file" .json)
      echo "    \"$FILENAME\": \"$CHECKSUM\","
    fi
  done | sed '$ s/,$//'
  echo "  }"
  echo "}"
} > "$BACKUP_DIR/manifest.json"

# Compress
tar -czf "$BACKUP_DIR.tar.gz" "$BACKUP_DIR"
rm -rf "$BACKUP_DIR"

echo "✓ Backup created: $BACKUP_DIR.tar.gz"

# Keep only last 10 backups
ls -t "$BACKUP_BASE"/backup-*.tar.gz | tail -n +11 | xargs rm -f 2>/dev/null
echo "✓ Old backups cleaned up (keeping last 10)"
```

### Restore from Backup

```bash
#!/bin/bash
# Restore content from backup (metadata only, not actual import)

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup-file.tar.gz>"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found"
  exit 1
fi

RESTORE_DIR="restore-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$RESTORE_DIR"

echo "Extracting backup..."
tar -xzf "$BACKUP_FILE" -C "$RESTORE_DIR"

BACKUP_DIR=$(ls "$RESTORE_DIR")

# Verify checksums
echo "Verifying backup integrity..."
cd "$RESTORE_DIR/$BACKUP_DIR"

jq -r '.checksums | to_entries[] | "\(.value)  \(.key).json"' manifest.json | \
  shasum -a 256 -c -

if [ $? -eq 0 ]; then
  echo "✓ Backup verified"
  echo ""
  echo "Backup contents:"
  echo "  Entries: $(jq 'length' entries.json)"
  echo "  Collections: $(jq 'length' collections.json)"
  echo "  Assets: $(jq 'length' assets.json)"
  echo ""
  echo "Files available in: $RESTORE_DIR/$BACKUP_DIR"
else
  echo "✗ Backup verification failed"
  exit 1
fi
```

## Related

- [Common Tasks](common-tasks.md)
- [Automation Examples](automation.md)
- [Reporting Examples](reporting.md)
- [Data Pipelines Guide](../guides/pipelines.md)
- [Scripting Guide](../guides/scripting.md)
