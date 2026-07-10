# Data Pipelines

Build powerful data pipelines with the Marvin CLI by piping, transforming, and combining data from multiple sources.

## Overview

The Marvin CLI excels at data pipeline workflows thanks to:

- **JSON output** - Structured data easy to transform
- **Unix pipe compatibility** - Chain commands together
- **jq integration** - Powerful JSON manipulation
- **Composability** - Mix Marvin commands with standard Unix tools

## Basic Pipelines

### Simple Pipe to jq

```bash
# Extract entry titles
marvin publish entries --json | jq -r '.[].title'

# Get slugs only
marvin publish entries --json | jq -r '.[].slug'

# Count entries
marvin publish entries --json | jq 'length'
```

### Filter then Transform

```bash
# Get page titles
marvin publish entries --entry-type page --json | jq -r '.[].title'

# Get featured entry slugs
marvin publish entries --collection featured --json | jq -r '.[].slug'

# Get first 10 image URLs
marvin publish assets --type image --limit 10 --json | jq -r '.[].url'
```

### Pipe to File

```bash
# Save entries to file
marvin publish entries --json > entries.json

# Save filtered results
marvin publish entries --entry-type page --json > pages.json

# Append to log
marvin publish entries --json | jq 'length' >> entry-count.log
```

## Data Transformation

### Reshape Data

```bash
# Create simplified entry list
marvin publish entries --json | \
  jq '.[] | {title, slug, type: .entryType}'

# Extract specific fields
marvin publish entries --json | \
  jq '.[] | {name: .title, url: .slug, published: .publishedAt}'

# Flatten nested data
marvin publish entries --json | \
  jq '.[] | {title, slug, seoTitle: .metadata.seoTitle}'
```

### Rename Fields

```bash
# Rename for external system
marvin publish entries --json | \
  jq '.[] | {
    id: .slug,
    heading: .title,
    category: .entryType,
    date: .publishedAt
  }'

# Add computed fields
marvin publish entries --json | \
  jq '.[] | . + {
    url: "https://mysite.com/\(.slug)",
    year: (.publishedAt | split("-")[0])
  }'
```

### Enrich Data

```bash
# Add metadata to each entry
marvin publish entries --json | \
  jq '.[] | . + {
    fetchedAt: now | todate,
    source: "marvin-cli"
  }'

# Add computed values
marvin publish assets --json | \
  jq '.[] | . + {
    sizeInMB: (.size / 1048576 | round),
    category: (.mimeType | split("/")[0])
  }'
```

## Combining Data

### Merge Multiple Commands

```bash
# Combine entries and collections
{
  echo '{"entries":'
  marvin publish entries --json
  echo ',"collections":'
  marvin publish collections --json
  echo '}'
} | jq .

# Create full data export
jq -n \
  --argjson entries "$(marvin publish entries --json)" \
  --argjson collections "$(marvin publish collections --json)" \
  --argjson assets "$(marvin publish assets --json)" \
  '{
    entries: $entries,
    collections: $collections,
    assets: $assets,
    exportedAt: now | todate
  }'
```

### Join Data

```bash
# Get entries with full resource details
marvin publish entries --json | \
  jq -c '.[] | select(.resources | length > 0)' | \
  while read -r entry; do
    SLUG=$(echo "$entry" | jq -r '.slug')
    RESOURCES=$(echo "$entry" | jq -r '.resources[]')
    
    # Fetch each resource
    for resource in $RESOURCES; do
      marvin publish resource "$resource" --json
    done | jq -s "{entry: \"$SLUG\", resources: .}"
  done | jq -s .
```

### Cross-Reference

```bash
# Find which entries use each asset
marvin publish assets --json | jq -c '.[]' | while read -r asset; do
  ASSET_ID=$(echo "$asset" | jq -r '.id')
  
  # Find entries with this asset
  ENTRIES=$(marvin publish entries --json | \
    jq --arg id "$ASSET_ID" '[.[] | select(.assets | contains([$id])) | .slug]')
  
  echo "$asset" | jq --argjson entries "$ENTRIES" '. + {usedIn: $entries}'
done | jq -s .
```

## Advanced Transformations

### Group and Aggregate

```bash
# Group entries by type
marvin publish entries --json | \
  jq 'group_by(.entryType) | 
      map({
        type: .[0].entryType,
        count: length,
        entries: map(.slug)
      })'

# Group assets by MIME type with stats
marvin publish assets --json | \
  jq 'group_by(.mimeType) | 
      map({
        type: .[0].mimeType,
        count: length,
        totalSize: (map(.size) | add),
        avgSize: (map(.size) | add / length | round)
      })'
```

### Sort and Rank

```bash
# Most recently published entries
marvin publish entries --json | \
  jq 'sort_by(.publishedAt) | reverse | .[0:5] | 
      map({title, publishedAt})'

# Largest assets
marvin publish assets --json | \
  jq 'sort_by(.size) | reverse | .[0:10] | 
      map({filename, size, mimeType})'

# Alphabetical entry list
marvin publish entries --json | \
  jq 'sort_by(.title) | map({title, slug})'
```

### Filter Complex Conditions

```bash
# Entries published this year with featured flag
YEAR=$(date +%Y)
marvin publish entries --json | \
  jq --arg year "$YEAR" \
     '.[] | select(
       (.publishedAt | startswith($year)) and
       .metadata.featured == true
     )'

# Images larger than 1MB uploaded this month
MONTH=$(date +%Y-%m)
marvin publish assets --json | \
  jq --arg month "$MONTH" \
     '.[] | select(
       (.mimeType | startswith("image/")) and
       .size > 1048576 and
       (.uploadedAt | startswith($month))
     )'
```

## Statistical Analysis

### Count and Sum

```bash
# Count entries by type
marvin publish entries --json | \
  jq 'group_by(.entryType) | 
      map({type: .[0].entryType, count: length})'

# Total asset storage
marvin publish assets --json | \
  jq 'map(.size) | add' | \
  numfmt --to=iec-i --suffix=B

# Average asset size
marvin publish assets --json | \
  jq 'map(.size) | add / length | round'
```

### Min/Max/Average

```bash
# Asset size statistics
marvin publish assets --json | \
  jq '{
    total: (map(.size) | add),
    count: length,
    min: (map(.size) | min),
    max: (map(.size) | max),
    avg: (map(.size) | add / length | round)
  }'

# Entry publication timeline
marvin publish entries --json | \
  jq '{
    earliest: (map(.publishedAt) | min),
    latest: (map(.publishedAt) | max),
    total: length
  }'
```

### Percentiles

```bash
# Asset size distribution
marvin publish assets --json | \
  jq 'map(.size) | sort | . as $arr | 
      {
        p50: $arr[($arr | length * 0.5 | floor)],
        p90: $arr[($arr | length * 0.9 | floor)],
        p95: $arr[($arr | length * 0.95 | floor)],
        p99: $arr[($arr | length * 0.99 | floor)]
      }'
```

## Format Conversion

### JSON to CSV

```bash
# Simple conversion
marvin publish entries --json | \
  jq -r '.[] | [.title, .slug, .entryType, .status] | @csv'

# With headers
{
  echo "Title,Slug,Type,Status"
  marvin publish entries --json | \
    jq -r '.[] | [.title, .slug, .entryType, .status] | @csv'
} > entries.csv
```

### JSON to YAML

```bash
# Convert with yq
marvin publish entries --json | yq -P > entries.yaml

# Or use built-in YAML output
marvin publish entries --yaml > entries.yaml
```

### JSON to HTML

```bash
# Generate HTML table
cat <<'EOF' > entries.html
<html>
<head><title>Entries</title></head>
<body>
<table border="1">
<tr><th>Title</th><th>Slug</th><th>Type</th><th>Published</th></tr>
EOF

marvin publish entries --json | \
  jq -r '.[] | 
    "<tr><td>\(.title)</td><td>\(.slug)</td><td>\(.entryType)</td><td>\(.publishedAt)</td></tr>"' \
  >> entries.html

echo '</table></body></html>' >> entries.html
```

### JSON to Markdown

```bash
# Generate markdown list
{
  echo "# Published Entries"
  echo ""
  marvin publish entries --json | \
    jq -r '.[] | "- **\(.title)** (`\(.slug)`) - \(.entryType)"'
} > entries.md

# Generate markdown table
{
  echo "| Title | Slug | Type | Status |"
  echo "|-------|------|------|--------|"
  marvin publish entries --json | \
    jq -r '.[] | "| \(.title) | \(.slug) | \(.entryType) | \(.status) |"'
} > entries-table.md
```

## Stream Processing

### Process Large Datasets

```bash
# Stream processing with jq (memory efficient)
marvin publish entries --json | \
  jq -c '.[]' | \
  while IFS= read -r entry; do
    # Process each entry individually
    SLUG=$(echo "$entry" | jq -r '.slug')
    TITLE=$(echo "$entry" | jq -r '.title')
    
    echo "Processing: $TITLE ($SLUG)"
    
    # Do something with entry
    echo "$entry" | jq . > "output/$SLUG.json"
  done
```

### Batch Processing

```bash
# Process entries in batches of 10
marvin publish entries --json | \
  jq -c '.[]' | \
  xargs -n 10 -P 4 bash -c '
    for entry in "$@"; do
      echo "$entry" | jq -r ".slug"
    done
  ' _
```

### Parallel Processing

```bash
# Fetch full entry details in parallel
marvin publish entries --json | \
  jq -r '.[].slug' | \
  xargs -P 10 -I {} sh -c \
    'marvin publish entry {} --json > "entries/{}.json"'
```

## Data Validation

### Validate Required Fields

```bash
# Check all entries have required fields
marvin publish entries --json | \
  jq -r '.[] | 
    select(
      (.title | length) == 0 or
      (.slug | length) == 0 or
      (.content | length) == 0
    ) | 
    "Missing fields: \(.slug)"'
```

### Check Data Quality

```bash
# Find entries with missing descriptions
marvin publish entries --json | \
  jq -r '.[] | 
    select((.description | length) == 0) | 
    "No description: \(.title) (\(.slug))"'

# Find assets with no alt text
marvin publish assets --json | \
  jq -r '.[] | 
    select(.metadata.alt == null or .metadata.alt == "") | 
    "Missing alt text: \(.filename)"'
```

### Generate Reports

```bash
# Data quality report
{
  echo "Data Quality Report - $(date)"
  echo "=============================="
  echo ""
  
  TOTAL=$(marvin publish entries --json | jq 'length')
  echo "Total Entries: $TOTAL"
  
  NO_DESC=$(marvin publish entries --json | \
    jq '[.[] | select(.description == "" or .description == null)] | length')
  echo "Missing Description: $NO_DESC"
  
  NO_SEO=$(marvin publish entries --json | \
    jq '[.[] | select(.metadata.seoTitle == null)] | length')
  echo "Missing SEO Title: $NO_SEO"
  
  echo ""
  echo "Issues:"
  marvin publish entries --json | \
    jq -r '.[] | 
      select(.description == null or .description == "") | 
      "  - \(.title) (\(.slug))"'
} > quality-report.txt
```

## Real-World Pipelines

### Static Site Generation

```bash
#!/bin/bash
# Fetch all content for static site build

OUTPUT_DIR="src/data"
mkdir -p "$OUTPUT_DIR"

# Fetch site config
echo "Fetching site config..."
marvin publish site --json > "$OUTPUT_DIR/site.json"

# Fetch all entries
echo "Fetching entries..."
marvin publish entries --json > "$OUTPUT_DIR/entries.json"

# Fetch collections
echo "Fetching collections..."
marvin publish collections --json > "$OUTPUT_DIR/collections.json"

# Fetch resources
echo "Fetching resources..."
marvin publish resources --json > "$OUTPUT_DIR/resources.json"

# Create entry pages
echo "Creating entry pages..."
marvin publish entries --json | jq -r '.[].slug' | while read -r slug; do
  marvin publish entry "$slug" --json > "$OUTPUT_DIR/entries/${slug}.json"
done

echo "Build data ready in $OUTPUT_DIR"
```

### Content Migration

```bash
#!/bin/bash
# Export content for migration to another system

DATE=$(date +%Y%m%d)
EXPORT_DIR="export-$DATE"
mkdir -p "$EXPORT_DIR"

# Export entries with transformed structure
marvin publish entries --json | \
  jq '.[] | {
    id: .slug,
    title: .title,
    body: .content,
    category: .entryType,
    published_at: .publishedAt,
    meta: .metadata,
    tags: .collections
  }' | \
  jq -s . > "$EXPORT_DIR/entries.json"

# Export assets with URLs
marvin publish assets --json | \
  jq '.[] | {
    filename: .filename,
    url: .url,
    type: .mimeType,
    size: .size,
    alt: .metadata.alt
  }' | \
  jq -s . > "$EXPORT_DIR/assets.json"

# Create manifest
jq -n \
  --arg date "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --argjson entries "$(jq length < "$EXPORT_DIR/entries.json")" \
  --argjson assets "$(jq length < "$EXPORT_DIR/assets.json")" \
  '{
    exportDate: $date,
    counts: {
      entries: $entries,
      assets: $assets
    }
  }' > "$EXPORT_DIR/manifest.json"

tar -czf "$EXPORT_DIR.tar.gz" "$EXPORT_DIR"
echo "Export complete: $EXPORT_DIR.tar.gz"
```

### Search Index Generation

```bash
#!/bin/bash
# Generate search index from Marvin content

# Create searchable documents
marvin publish entries --json | \
  jq '.[] | {
    id: .slug,
    title: .title,
    description: .description,
    content: (.content.blocks // [] | map(.content // "") | join(" ")),
    type: .entryType,
    url: "/\(.slug)",
    published: .publishedAt
  }' | \
  jq -s . > search-index.json

# Create type-specific indexes
for type in page project article; do
  marvin publish entries --entry-type "$type" --json | \
    jq '.[] | {
      id: .slug,
      title: .title,
      excerpt: .description,
      url: "/\(.slug)"
    }' | \
    jq -s . > "search-${type}.json"
done

echo "Search indexes created"
```

### Analytics Data Prep

```bash
#!/bin/bash
# Prepare data for analytics system

# Entry stats by type
marvin publish entries --json | \
  jq 'group_by(.entryType) | 
      map({
        type: .[0].entryType,
        count: length,
        published: [.[] | select(.status == "published")] | length,
        avgTitleLength: (map(.title | length) | add / length | round)
      })' > analytics/entry-stats.json

# Asset stats by type
marvin publish assets --json | \
  jq 'group_by(.mimeType | split("/")[0]) | 
      map({
        category: .[0].mimeType | split("/")[0],
        count: length,
        totalSize: (map(.size) | add),
        avgSize: (map(.size) | add / length | round)
      })' > analytics/asset-stats.json

# Publication timeline
marvin publish entries --json | \
  jq 'map(.publishedAt | split("T")[0]) | 
      group_by(.) | 
      map({date: .[0], count: length})' > analytics/timeline.json
```

## Performance Tips

1. **Filter early** - Use CLI filters before piping to jq
   ```bash
   # Good
   marvin publish entries --entry-type page --limit 10 --json | jq .
   
   # Less efficient
   marvin publish entries --json | jq '.[] | select(.entryType == "page") | .[0:10]'
   ```

2. **Use streaming** - Process large datasets item by item
   ```bash
   marvin publish entries --json | jq -c '.[]' | while read -r entry; do
     # Process one at a time
   done
   ```

3. **Parallelize** - Use xargs for concurrent processing
   ```bash
   marvin publish entries --json | jq -r '.[].slug' | \
     xargs -P 10 -I {} marvin publish entry {} --json
   ```

4. **Cache results** - Save intermediate results to files
   ```bash
   # Fetch once
   marvin publish entries --json > entries.json
   
   # Process multiple times
   jq '.[] | select(.entryType == "page")' entries.json
   jq 'length' entries.json
   ```

## Pipeline Debugging

### Add Logging

```bash
# Log each step
marvin publish entries --json | tee entries-raw.json | \
  jq '.[] | select(.entryType == "page")' | tee entries-pages.json | \
  jq 'length'
```

### Validate JSON

```bash
# Check if output is valid JSON
if marvin publish entries --json | jq empty 2>/dev/null; then
  echo "Valid JSON"
else
  echo "Invalid JSON"
fi
```

### Error Handling

```bash
# Catch errors in pipeline
set -e
set -o pipefail

marvin publish entries --json | \
  jq '.[] | select(.entryType == "page")' | \
  jq -s 'length' || {
    echo "Pipeline failed"
    exit 1
  }
```

## Related

- [Filtering Guide](filtering.md)
- [Scripting Guide](scripting.md)
- [CI/CD Integration](ci-cd.md)
- [Examples: Common Tasks](../examples/common-tasks.md)
- [Examples: Export/Import](../examples/export-import.md)
