# Common Tasks

Practical examples for everyday tasks with the Marvin CLI.

## Content Discovery

### List All Content

```bash
# Get overview of all content
marvin publish entries
marvin publish collections
marvin publish assets
marvin publish resources
```

### Find Specific Entry

```bash
# By slug
marvin publish entry homepage

# Check if entry exists
if marvin publish entry about --json >/dev/null 2>&1; then
  echo "About page exists"
else
  echo "About page not found"
fi
```

### Search by Type

```bash
# All pages
marvin publish entries --entry-type page

# All projects
marvin publish entries --entry-type project

# All blog posts
marvin publish entries --entry-type article
```

### Find Recent Content

```bash
# Last 10 entries
marvin publish entries --limit 10

# Last 5 pages
marvin publish entries --entry-type page --limit 5
```

## Working with Collections

### List Collections

```bash
# All collections
marvin publish collections

# Get specific collection
marvin publish collection featured
```

### Find Collection Members

```bash
# Entries in a collection
marvin publish collection-entries featured

# Count entries in collection
marvin publish collection-entries featured --json | jq 'length'
```

### Filter by Collection

```bash
# Featured entries
marvin publish entries --collection featured

# Archived content
marvin publish entries --collection archived

# Featured pages only
marvin publish entries --entry-type page --collection featured
```

## Asset Management

### Find Assets

```bash
# All assets
marvin publish assets

# Just images
marvin publish assets --type image

# Just videos
marvin publish assets --type video

# PDFs
marvin publish assets --type application/pdf
```

### Get Asset Details

```bash
# All asset URLs
marvin publish assets --json | jq -r '.[].url'

# Image URLs only
marvin publish assets --type image --json | jq -r '.[].url'

# Asset filenames
marvin publish assets --json | jq -r '.[].filename'
```

### Calculate Storage

```bash
# Total asset size
marvin publish assets --json | \
  jq 'map(.size) | add' | \
  numfmt --to=iec-i --suffix=B

# Image storage only
marvin publish assets --type image --json | \
  jq 'map(.size) | add' | \
  numfmt --to=iec-i --suffix=B
```

### Find Large Assets

```bash
# Assets over 1MB
marvin publish assets --json | \
  jq '.[] | select(.size > 1048576) | 
      {filename, size: (.size / 1048576 | round | tostring + "MB")}'

# Top 10 largest assets
marvin publish assets --json | \
  jq 'sort_by(.size) | reverse | .[0:10] | 
      .[] | {filename, size}'
```

## Content Analysis

### Count Content

```bash
# Total entries
marvin publish entries --json | jq 'length'

# Entries by type
marvin publish entries --json | \
  jq 'group_by(.entryType) | 
      map({type: .[0].entryType, count: length})'

# Collections count
marvin publish collections --json | jq 'length'
```

### Content Summary

```bash
# Quick summary
echo "Content Summary"
echo "==============="
echo "Entries: $(marvin publish entries --json | jq 'length')"
echo "Collections: $(marvin publish collections --json | jq 'length')"
echo "Assets: $(marvin publish assets --json | jq 'length')"
echo "Resources: $(marvin publish resources --json | jq 'length')"
```

### Detailed Report

```bash
#!/bin/bash
# Generate detailed content report

echo "Content Report - $(date)"
echo "======================================"
echo ""

# Entry stats
echo "ENTRIES"
echo "-------"
ENTRIES=$(marvin publish entries --json)
TOTAL=$(echo "$ENTRIES" | jq 'length')
echo "Total: $TOTAL"
echo ""

echo "By Type:"
echo "$ENTRIES" | jq -r 'group_by(.entryType) | 
  .[] | "  \(.[0].entryType): \(length)"'
echo ""

# Collection stats
echo "COLLECTIONS"
echo "-----------"
COLLECTIONS=$(marvin publish collections --json)
TOTAL_COLL=$(echo "$COLLECTIONS" | jq 'length')
echo "Total: $TOTAL_COLL"
echo ""

# Asset stats
echo "ASSETS"
echo "------"
ASSETS=$(marvin publish assets --json)
TOTAL_ASSETS=$(echo "$ASSETS" | jq 'length')
TOTAL_SIZE=$(echo "$ASSETS" | jq 'map(.size) | add')

echo "Total: $TOTAL_ASSETS"
echo "Storage: $(echo $TOTAL_SIZE | numfmt --to=iec-i --suffix=B)"
echo ""

echo "By Type:"
echo "$ASSETS" | jq -r 'group_by(.mimeType | split("/")[0]) | 
  .[] | "  \(.[0].mimeType | split("/")[0]): \(length)"'
```

## Data Export

### Export All Content

```bash
# Create export directory
mkdir -p export
DATE=$(date +%Y%m%d)

# Export all data
marvin publish entries --json > "export/entries-$DATE.json"
marvin publish collections --json > "export/collections-$DATE.json"
marvin publish assets --json > "export/assets-$DATE.json"
marvin publish resources --json > "export/resources-$DATE.json"
marvin publish site --json > "export/site-$DATE.json"

# Compress
tar -czf "export-$DATE.tar.gz" export/
```

### Export by Type

```bash
# Export pages
marvin publish entries --entry-type page --json > pages.json

# Export projects
marvin publish entries --entry-type project --json > projects.json

# Export images
marvin publish assets --type image --json > images.json
```

### Export to CSV

```bash
# Entries to CSV
{
  echo "Title,Slug,Type,Status,Published"
  marvin publish entries --json | \
    jq -r '.[] | [.title, .slug, .entryType, .status, .publishedAt] | @csv'
} > entries.csv

# Assets to CSV
{
  echo "Filename,URL,Type,Size"
  marvin publish assets --json | \
    jq -r '.[] | [.filename, .url, .mimeType, .size] | @csv'
} > assets.csv
```

### Export Individual Entries

```bash
#!/bin/bash
# Export each entry to individual file

mkdir -p entries

marvin publish entries --json | jq -r '.[].slug' | while read -r slug; do
  echo "Exporting: $slug"
  marvin publish entry "$slug" --json > "entries/${slug}.json"
done

echo "Exported $(ls entries/ | wc -l) entries"
```

## Validation

### Check Required Pages

```bash
#!/bin/bash
# Verify required pages exist

REQUIRED_PAGES=("homepage" "about" "contact" "privacy" "terms")

for page in "${REQUIRED_PAGES[@]}"; do
  if marvin publish entry "$page" --json >/dev/null 2>&1; then
    echo "✓ $page"
  else
    echo "✗ $page is missing"
  fi
done
```

### Validate Content Quality

```bash
#!/bin/bash
# Check content quality

echo "Content Quality Check"
echo "===================="

# Check for missing descriptions
MISSING_DESC=$(marvin publish entries --json | \
  jq '[.[] | select(.description == null or .description == "")] | length')

if [ "$MISSING_DESC" -gt 0 ]; then
  echo "⚠ $MISSING_DESC entries missing descriptions:"
  marvin publish entries --json | \
    jq -r '.[] | select(.description == null or .description == "") | 
           "  - \(.title) (\(.slug))"'
else
  echo "✓ All entries have descriptions"
fi

echo ""

# Check for missing SEO titles
MISSING_SEO=$(marvin publish entries --json | \
  jq '[.[] | select(.metadata.seoTitle == null)] | length')

if [ "$MISSING_SEO" -gt 0 ]; then
  echo "⚠ $MISSING_SEO entries missing SEO titles"
else
  echo "✓ All entries have SEO titles"
fi
```

### Find Broken References

```bash
# Find entries referencing missing resources
marvin publish entries --json | jq -c '.[] | select(.resources | length > 0)' | \
while read -r entry; do
  SLUG=$(echo "$entry" | jq -r '.slug')
  RESOURCES=$(echo "$entry" | jq -r '.resources[]')
  
  for resource in $RESOURCES; do
    if ! marvin publish resource "$resource" --json >/dev/null 2>&1; then
      echo "⚠ Entry '$SLUG' references missing resource: $resource"
    fi
  done
done
```

## Monitoring

### Check Site Health

```bash
#!/bin/bash
# Basic site health check

echo "Site Health Check - $(date)"
echo "============================"

# Can we connect?
if marvin publish site >/dev/null 2>&1; then
  echo "✓ API connection OK"
else
  echo "✗ API connection failed"
  exit 1
fi

# Do we have content?
ENTRY_COUNT=$(marvin publish entries --json | jq 'length')
if [ "$ENTRY_COUNT" -gt 0 ]; then
  echo "✓ Content exists ($ENTRY_COUNT entries)"
else
  echo "✗ No published content"
  exit 1
fi

# Are required pages present?
REQUIRED=("homepage" "about")
for page in "${REQUIRED[@]}"; do
  if marvin publish entry "$page" --json >/dev/null 2>&1; then
    echo "✓ Page '$page' exists"
  else
    echo "✗ Page '$page' missing"
  fi
done
```

### Track Content Changes

```bash
#!/bin/bash
# Save current state for comparison

DATE=$(date +%Y%m%d)
SNAPSHOT_DIR="snapshots/$DATE"
mkdir -p "$SNAPSHOT_DIR"

# Take snapshot
marvin publish entries --json > "$SNAPSHOT_DIR/entries.json"

# Compare with previous snapshot
PREV=$(ls -t snapshots/ | sed -n '2p')

if [ -n "$PREV" ]; then
  PREV_COUNT=$(jq 'length' "snapshots/$PREV/entries.json")
  CURR_COUNT=$(jq 'length' "$SNAPSHOT_DIR/entries.json")
  DIFF=$((CURR_COUNT - PREV_COUNT))
  
  if [ $DIFF -gt 0 ]; then
    echo "+$DIFF entries since $PREV"
  elif [ $DIFF -lt 0 ]; then
    echo "$DIFF entries since $PREV"
  else
    echo "No change since $PREV"
  fi
fi
```

## Static Site Generation

### Fetch Content for Build

```bash
#!/bin/bash
# Fetch all content for static site

OUTPUT_DIR="src/data"
mkdir -p "$OUTPUT_DIR"

echo "Fetching content from Marvin..."

# Site config
echo "  - Site config"
marvin publish site --json > "$OUTPUT_DIR/site.json"

# All entries
echo "  - Entries"
marvin publish entries --json > "$OUTPUT_DIR/entries.json"

# Collections
echo "  - Collections"
marvin publish collections --json > "$OUTPUT_DIR/collections.json"

# Resources
echo "  - Resources"
marvin publish resources --json > "$OUTPUT_DIR/resources.json"

# Assets
echo "  - Assets"
marvin publish assets --json > "$OUTPUT_DIR/assets.json"

# Individual entry files
echo "  - Individual entries"
mkdir -p "$OUTPUT_DIR/entries"
marvin publish entries --json | jq -r '.[].slug' | while read -r slug; do
  marvin publish entry "$slug" --json > "$OUTPUT_DIR/entries/${slug}.json"
done

ENTRY_COUNT=$(ls "$OUTPUT_DIR/entries" | wc -l)
echo ""
echo "✓ Content ready for build ($ENTRY_COUNT entries)"
```

### Generate Sitemap

```bash
#!/bin/bash
# Generate sitemap from entries

SITE_URL="https://example.com"
OUTPUT="sitemap.txt"

{
  echo "$SITE_URL/"
  marvin publish entries --json | jq -r ".[] | \"$SITE_URL/\(.slug)\""
} > "$OUTPUT"

echo "Sitemap generated: $OUTPUT ($(wc -l < $OUTPUT) URLs)"
```

### Generate XML Sitemap

```bash
#!/bin/bash
# Generate XML sitemap

SITE_URL="https://example.com"

cat > sitemap.xml <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
EOF

marvin publish entries --json | jq -r '.[] | 
  "<url>
    <loc>\(env.SITE_URL)/\(.slug)</loc>
    <lastmod>\(.publishedAt | split("T")[0])</lastmod>
    <priority>0.8</priority>
  </url>"' >> sitemap.xml

echo "</urlset>" >> sitemap.xml

echo "XML sitemap generated"
```

### Create RSS Feed

```bash
#!/bin/bash
# Generate RSS feed from entries

SITE_URL="https://example.com"
SITE_TITLE=$(marvin publish site --json | jq -r '.title')

cat > rss.xml <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>$SITE_TITLE</title>
    <link>$SITE_URL</link>
    <description>Latest content from $SITE_TITLE</description>
EOF

marvin publish entries --limit 20 --json | jq -r '.[] |
  "<item>
    <title>\(.title)</title>
    <link>\(env.SITE_URL)/\(.slug)</link>
    <description>\(.description // "")</description>
    <pubDate>\(.publishedAt)</pubDate>
  </item>"' >> rss.xml

cat >> rss.xml <<EOF
  </channel>
</rss>
EOF

echo "RSS feed generated"
```

## Data Transformation

### Convert for External API

```bash
# Transform for external system
marvin publish entries --json | \
  jq '.[] | {
    id: .slug,
    heading: .title,
    summary: .description,
    body: .content,
    category: .entryType,
    tags: .collections,
    published: .publishedAt,
    seo: {
      title: .metadata.seoTitle,
      description: .metadata.seoDescription
    }
  }' | jq -s . > external-format.json
```

### Create Search Index

```bash
# Generate search index
marvin publish entries --json | \
  jq '.[] | {
    id: .slug,
    title: .title,
    text: (.description + " " + (.content.blocks // [] | map(.content // "") | join(" "))),
    type: .entryType,
    url: "/\(.slug)"
  }' | jq -s . > search-index.json

echo "Search index created with $(jq 'length' search-index.json) documents"
```

### Generate Navigation

```bash
# Create navigation from pages
marvin publish entries --entry-type page --json | \
  jq 'sort_by(.metadata.order // 999) | 
      map({
        title: .title,
        url: "/\(.slug)",
        order: .metadata.order // 999
      })' > navigation.json
```

## Comparison

### Compare Environments

```bash
#!/bin/bash
# Compare content between environments

echo "Comparing environments..."

# Fetch from staging
export MARVIN_API_URL=https://staging.example.com
STAGING=$(marvin publish entries --json)

# Fetch from production
export MARVIN_API_URL=https://api.example.com
PRODUCTION=$(marvin publish entries --json)

# Compare counts
STAGING_COUNT=$(echo "$STAGING" | jq 'length')
PROD_COUNT=$(echo "$PRODUCTION" | jq 'length')

echo "Staging: $STAGING_COUNT entries"
echo "Production: $PROD_COUNT entries"
echo "Difference: $((STAGING_COUNT - PROD_COUNT))"

# Find differences
echo "$STAGING" | jq -r '.[].slug' | sort > /tmp/staging-slugs.txt
echo "$PRODUCTION" | jq -r '.[].slug' | sort > /tmp/prod-slugs.txt

echo ""
echo "In staging but not production:"
comm -23 /tmp/staging-slugs.txt /tmp/prod-slugs.txt

echo ""
echo "In production but not staging:"
comm -13 /tmp/staging-slugs.txt /tmp/prod-slugs.txt
```

### Track Content Drift

```bash
#!/bin/bash
# Check for content changes

BASELINE="content-baseline.json"

# Create baseline if doesn't exist
if [ ! -f "$BASELINE" ]; then
  marvin publish entries --json > "$BASELINE"
  echo "Baseline created"
  exit 0
fi

# Get current state
CURRENT=$(marvin publish entries --json)

# Compare
BASELINE_COUNT=$(jq 'length' "$BASELINE")
CURRENT_COUNT=$(echo "$CURRENT" | jq 'length')

if [ "$BASELINE_COUNT" -ne "$CURRENT_COUNT" ]; then
  echo "⚠ Content count changed: $BASELINE_COUNT → $CURRENT_COUNT"
  echo ""
  
  # Find what changed
  jq -r '.[].slug' "$BASELINE" | sort > /tmp/baseline-slugs.txt
  echo "$CURRENT" | jq -r '.[].slug' | sort > /tmp/current-slugs.txt
  
  ADDED=$(comm -13 /tmp/baseline-slugs.txt /tmp/current-slugs.txt | wc -l)
  REMOVED=$(comm -23 /tmp/baseline-slugs.txt /tmp/current-slugs.txt | wc -l)
  
  echo "Added: $ADDED"
  echo "Removed: $REMOVED"
else
  echo "✓ No content changes"
fi
```

## Utilities

### Create Content Index

```bash
# Generate index of all content
{
  echo "# Content Index"
  echo ""
  echo "Generated: $(date)"
  echo ""
  
  echo "## Entries"
  marvin publish entries --json | \
    jq -r 'sort_by(.title) | .[] | "- **\(.title)** (\(.slug)) - \(.entryType)"'
  
  echo ""
  echo "## Collections"
  marvin publish collections --json | \
    jq -r 'sort_by(.name) | .[] | "- **\(.name)** (\(.slug))"'
} > content-index.md
```

### Find Content by Date

```bash
# Entries published this month
MONTH=$(date +%Y-%m)
marvin publish entries --json | \
  jq --arg month "$MONTH" \
     '.[] | select(.publishedAt | startswith($month))'

# Entries published this year
YEAR=$(date +%Y)
marvin publish entries --json | \
  jq --arg year "$YEAR" \
     '.[] | select(.publishedAt | startswith($year))'

# Entries published today
TODAY=$(date +%Y-%m-%d)
marvin publish entries --json | \
  jq --arg today "$TODAY" \
     '.[] | select(.publishedAt | startswith($today))'
```

### Check Content Freshness

```bash
# Find oldest content
marvin publish entries --json | \
  jq 'sort_by(.publishedAt) | .[0:5] | 
      .[] | {title, slug, published: .publishedAt}'

# Find newest content
marvin publish entries --json | \
  jq 'sort_by(.publishedAt) | reverse | .[0:5] | 
      .[] | {title, slug, published: .publishedAt}'
```

## Related

- [Export/Import Examples](export-import.md)
- [Automation Examples](automation.md)
- [Reporting Examples](reporting.md)
- [Filtering Guide](../guides/filtering.md)
- [Scripting Guide](../guides/scripting.md)
