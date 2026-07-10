# Filtering & Querying

Learn how to filter and query your Marvin content with the CLI.

## Overview

The Marvin CLI provides filtering options for most list commands, allowing you to narrow down results by type, collection, status, and more.

## Entry Filtering

### Filter by Entry Type

Filter entries by their entry type slug:

```bash
marvin publish entries --entry-type page
marvin publish entries --entry-type project
marvin publish entries --entry-type article
```

Example output:

```
┌──────────────┬─────────┬──────┬───────────┬────────────┐
│ Title        │ Slug    │ Type │ Status    │ Published  │
├──────────────┼─────────┼──────┼───────────┼────────────┤
│ Homepage     │ home    │ page │ published │ 2026-07-01 │
│ About        │ about   │ page │ published │ 2026-07-02 │
└──────────────┴─────────┴──────┴───────────┴────────────┘
```

### Filter by Collection

Get entries in a specific collection:

```bash
marvin publish entries --collection featured
marvin publish entries --collection blog-posts
```

Or use the dedicated collection-entries command:

```bash
marvin publish collection-entries featured
```

### Limit Results

Limit the number of results returned:

```bash
# First 10 entries
marvin publish entries --limit 10

# First 5 pages
marvin publish entries --entry-type page --limit 5
```

### Combine Filters

Combine multiple filters:

```bash
# First 10 featured pages
marvin publish entries --entry-type page --collection featured --limit 10

# First 20 projects
marvin publish entries --entry-type project --limit 20
```

## Asset Filtering

### Filter by MIME Type

Filter assets by MIME type prefix:

```bash
# All images (image/*)
marvin publish assets --type image

# All videos (video/*)
marvin publish assets --type video

# All audio files (audio/*)
marvin publish assets --type audio

# PDFs
marvin publish assets --type application/pdf
```

### Limit Assets

```bash
# First 50 assets
marvin publish assets --limit 50

# First 20 images
marvin publish assets --type image --limit 20
```

## Resource Filtering

### Find Entries Using a Resource

Get all entries that reference a specific resource:

```bash
marvin publish resource-entries kuroki-s022
```

This shows all entries (projects, articles, etc.) that use the specified resource.

## Post-Processing with jq

For advanced filtering, use jq to process JSON output:

### Filter by Field Value

```bash
# Entries published after a date
marvin publish entries --json | \
  jq '.[] | select(.publishedAt > "2026-07-01")'

# Entries with specific status
marvin publish entries --json | \
  jq '.[] | select(.status == "published")'
```

### Filter by Text Match

```bash
# Entries with "blog" in title
marvin publish entries --json | \
  jq '.[] | select(.title | contains("blog"))'

# Entries with specific slug pattern
marvin publish entries --json | \
  jq '.[] | select(.slug | startswith("blog-"))'
```

### Filter by Nested Fields

```bash
# Entries with specific metadata
marvin publish entries --json | \
  jq '.[] | select(.metadata.featured == true)'

# Assets larger than 1MB
marvin publish assets --json | \
  jq '.[] | select(.size > 1048576)'
```

### Complex Filters

```bash
# Pages published in July 2026
marvin publish entries --json | \
  jq '.[] | select(.entryType == "page" and 
                   .publishedAt | startswith("2026-07"))'

# Images uploaded in last 30 days
marvin publish assets --json | \
  jq --arg date "$(date -d '30 days ago' +%Y-%m-%d)" \
     '.[] | select(.type | startswith("image/") and 
                   .uploadedAt > $date)'
```

## Searching

### Search by Title

```bash
# Case-insensitive title search
marvin publish entries --json | \
  jq '.[] | select(.title | ascii_downcase | contains("about"))'
```

### Search by Slug

```bash
# Find entries matching slug pattern
marvin publish entries --json | \
  jq '.[] | select(.slug | test("^project-"))'
```

### Full-Text Search (if available)

```bash
# Search in title, description, or content
marvin publish entries --json | \
  jq '.[] | select(
    .title, .description, .content | 
    tostring | ascii_downcase | contains("search term")
  )'
```

## Sorting

Sort results using jq:

### Sort by Date

```bash
# Sort by published date (newest first)
marvin publish entries --json | \
  jq 'sort_by(.publishedAt) | reverse'

# Sort by created date
marvin publish entries --json | \
  jq 'sort_by(.createdAt)'
```

### Sort by Title

```bash
# Alphabetical by title
marvin publish entries --json | \
  jq 'sort_by(.title)'

# Reverse alphabetical
marvin publish entries --json | \
  jq 'sort_by(.title) | reverse'
```

### Sort by Multiple Fields

```bash
# Sort by type, then title
marvin publish entries --json | \
  jq 'sort_by(.entryType, .title)'
```

## Pagination

Handle large datasets with pagination:

### Basic Pagination

```bash
# Page 1 (first 20)
marvin publish entries --limit 20 --json | jq '.[:20]'

# Page 2 (next 20)
marvin publish entries --limit 40 --json | jq '.[20:40]'

# Page 3 (next 20)
marvin publish entries --limit 60 --json | jq '.[40:60]'
```

### Pagination Loop

```bash
#!/bin/bash

PAGE_SIZE=20
OFFSET=0

while true; do
  LIMIT=$((OFFSET + PAGE_SIZE))
  PAGE=$(marvin publish entries --limit $LIMIT --json | \
         jq ".[$OFFSET:$LIMIT]")
  
  if [ "$PAGE" = "[]" ]; then
    break
  fi
  
  echo "$PAGE" | jq .
  OFFSET=$((OFFSET + PAGE_SIZE))
done
```

## Counting and Aggregation

### Count Results

```bash
# Total entries
marvin publish entries --json | jq 'length'

# Entries by type
marvin publish entries --json | \
  jq 'group_by(.entryType) | 
      map({type: .[0].entryType, count: length})'

# Assets by type
marvin publish assets --json | \
  jq 'group_by(.mimeType) | 
      map({type: .[0].mimeType, count: length})'
```

### Sum and Statistics

```bash
# Total asset size
marvin publish assets --json | \
  jq 'map(.size) | add'

# Average asset size
marvin publish assets --json | \
  jq 'map(.size) | add / length'

# Min/max asset size
marvin publish assets --json | \
  jq 'map(.size) | min, max'
```

## Field Selection

Extract only the fields you need:

### Select Specific Fields

```bash
# Just titles and slugs
marvin publish entries --json | \
  jq '.[] | {title, slug}'

# Custom field mapping
marvin publish entries --json | \
  jq '.[] | {name: .title, url: .slug}'
```

### Extract Arrays

```bash
# Array of titles
marvin publish entries --json | jq -r '.[].title'

# Array of slugs
marvin publish entries --json | jq -r '.[].slug'

# CSV of specific fields
marvin publish entries --json | \
  jq -r '.[] | [.title, .slug, .status] | @csv'
```

## Advanced Filtering Examples

### Multi-Condition Filters

```bash
# Featured pages published this year
marvin publish entries --json | \
  jq '.[] | select(
    .entryType == "page" and
    .metadata.featured == true and
    .publishedAt | startswith("2026")
  )'
```

### Conditional Logic

```bash
# Entries that are either featured OR published this week
marvin publish entries --json | \
  jq --arg week "$(date +%Y-%W)" \
     '.[] | select(
       .metadata.featured == true or 
       (.publishedAt | strptime("%Y-%m-%d") | strftime("%Y-%W")) == $week
     )'
```

### Array Filtering

```bash
# Entries with specific tag
marvin publish entries --json | \
  jq '.[] | select(.tags | contains(["featured"]))'

# Entries with multiple tags
marvin publish entries --json | \
  jq '.[] | select(.tags | contains(["featured", "new"]))'
```

## Performance Tips

1. **Use CLI filters first** - Filter at the API level before processing with jq
2. **Limit results** - Use `--limit` to reduce data transfer
3. **Stream processing** - Use jq's streaming parser for huge datasets
4. **Cache results** - Save filtered results to avoid re-querying

```bash
# Good: Filter at API level
marvin publish entries --entry-type page --limit 10

# Less efficient: Filter after fetching all
marvin publish entries --json | jq '.[] | select(.entryType == "page") | .[0:10]'
```

## Filtering Cheat Sheet

| Task | Command |
|------|---------|
| Filter by type | `--entry-type <slug>` |
| Filter by collection | `--collection <slug>` |
| Limit results | `--limit <number>` |
| Filter assets by MIME | `--type <type>` |
| Filter in jq | `jq '.[] \| select(.field == "value")'` |
| Search text | `jq '.[] \| select(.field \| contains("text"))'` |
| Sort results | `jq 'sort_by(.field)'` |
| Count results | `jq 'length'` |
| Group by field | `jq 'group_by(.field)'` |

## Related

- [Scripting Guide](scripting.md)
- [Data Pipelines](pipelines.md)
- [Commands Overview](../commands/overview.md)
- [Examples](../examples/common-tasks.md)
