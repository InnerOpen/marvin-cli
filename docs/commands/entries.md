# Entries

List and retrieve published entries from your Marvin workspace.

## Commands

### List Entries

```bash
marvin publish entries [options]
```

### Get Single Entry

```bash
marvin publish entry <slug>
```

## Description

Entries are the primary content type in Marvin. They represent pages, blog posts, projects, or any custom entry type you've defined. The `entries` command lists all published entries with optional filtering, while `entry` retrieves a single entry by its slug.

## Options

### `marvin publish entries`

| Option | Description | Default |
|--------|-------------|---------|
| `--entry-type <slug>` | Filter by entry type (e.g., page, project) | All types |
| `--collection <slug>` | Filter by collection | All entries |
| `--limit <number>` | Limit number of results | All entries |
| `--json` | Output as JSON | `false` |
| `--yaml` | Output as YAML | `false` |
| `--csv` | Output as CSV | `false` |
| `--output <format>` | Output format: table, json, yaml, csv | `table` |

### `marvin publish entry <slug>`

| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output as JSON | `false` |
| `--yaml` | Output as YAML | `false` |
| `--output <format>` | Output format: table, json | `table` |

## Examples

### Basic Usage

List all published entries:

```bash
marvin publish entries
```

Output:

```
┌───────────────┬──────────┬─────────┬───────────┬────────────┐
│ Title         │ Slug     │ Type    │ Status    │ Published  │
├───────────────┼──────────┼─────────┼───────────┼────────────┤
│ About Us      │ about    │ page    │ published │ 2026-07-01 │
│ Contact       │ contact  │ page    │ published │ 2026-07-02 │
│ Denim Project │ denim-01 │ project │ published │ 2026-07-03 │
└───────────────┴──────────┴─────────┴───────────┴────────────┘
```

Get a single entry:

```bash
marvin publish entry about
```

Output:

```
┌─────────────┬──────────────────────────────────────┐
│ Field       │ Value                                │
├─────────────┼──────────────────────────────────────┤
│ Title       │ About Us                             │
│ Slug        │ about                                │
│ Type        │ page                                 │
│ Status      │ published                            │
│ Published   │ 2026-07-01T12:00:00Z                 │
│ Description │ Learn about our company              │
└─────────────┴──────────────────────────────────────┘
```

### JSON Output

List entries as JSON:

```bash
marvin publish entries --json
```

```json
[
  {
    "slug": "about",
    "title": "About Us",
    "entryType": "page",
    "status": "published",
    "publishedAt": "2026-07-01T12:00:00Z",
    "description": "Learn about our company",
    "content": {
      "blocks": [
        {
          "type": "paragraph",
          "content": "We are a company..."
        }
      ]
    },
    "metadata": {
      "seoTitle": "About Us - My Company",
      "seoDescription": "Learn about our company"
    }
  }
]
```

Get single entry as JSON:

```bash
marvin publish entry about --json
```

```json
{
  "slug": "about",
  "title": "About Us",
  "entryType": "page",
  "status": "published",
  "publishedAt": "2026-07-01T12:00:00Z",
  "description": "Learn about our company",
  "content": {
    "blocks": [
      {
        "type": "paragraph",
        "content": "We are a company that builds amazing products..."
      }
    ]
  },
  "metadata": {
    "seoTitle": "About Us - My Company",
    "seoDescription": "Learn about our company"
  },
  "collections": ["featured"],
  "resources": [],
  "assets": []
}
```

### Filtering

Filter by entry type:

```bash
marvin publish entries --entry-type page
marvin publish entries --entry-type project
marvin publish entries --entry-type blog-post
```

Filter by collection:

```bash
marvin publish entries --collection featured
marvin publish entries --collection archived
```

Limit results:

```bash
marvin publish entries --limit 10
marvin publish entries --limit 5 --entry-type page
```

Combine filters:

```bash
marvin publish entries --entry-type project --collection featured --limit 3
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `slug` | string | Unique URL-friendly identifier |
| `title` | string | Entry title |
| `entryType` | string | Entry type slug (page, project, etc.) |
| `status` | string | Publication status (published, draft) |
| `publishedAt` | string | ISO 8601 timestamp of publication |
| `description` | string | Entry description/summary |
| `content` | object | Structured content blocks |
| `metadata` | object | SEO and custom metadata |
| `collections` | array | Collection slugs this entry belongs to |
| `resources` | array | Resources referenced in this entry |
| `assets` | array | Assets attached to this entry |
| `createdAt` | string | ISO 8601 timestamp of creation |
| `updatedAt` | string | ISO 8601 timestamp of last update |

## Use Cases

### Export All Entries

Export all entries to JSON for static site generation:

```bash
marvin publish entries --json > entries.json
```

### Count Entries by Type

Count how many pages exist:

```bash
marvin publish entries --entry-type page --json | jq 'length'
```

Output:

```
12
```

### Get Latest Entries

Get the 5 most recent entries:

```bash
marvin publish entries --limit 5 --json | jq -r '.[].title'
```

Output:

```
Latest Blog Post
New Project Launch
Contact Page Update
About Page
Homepage
```

### Check if Entry Exists

Verify an entry exists before deployment:

```bash
if marvin publish entry about --json > /dev/null 2>&1; then
  echo "✓ About page exists"
else
  echo "✗ About page not found"
fi
```

### Extract Entry Content

Get entry content for processing:

```bash
marvin publish entry about --json | jq -r '.content.blocks[0].content'
```

### Build Site Map

Generate a sitemap from all entries:

```bash
marvin publish entries --json | jq -r '.[] | "https://mysite.com/\(.slug)"'
```

Output:

```
https://mysite.com/about
https://mysite.com/contact
https://mysite.com/denim-01
```

## Scripting Examples

### Bash Script

```bash
#!/bin/bash

# Get all published pages
PAGES=$(marvin publish entries --entry-type page --json)

# Extract titles
echo "$PAGES" | jq -r '.[] | "\(.title) - \(.slug)"'

# Count total pages
COUNT=$(echo "$PAGES" | jq 'length')
echo "Total pages: $COUNT"
```

### Node.js

```javascript
const { execSync } = require('child_process');

// Get all entries
const output = execSync('marvin publish entries --json', { encoding: 'utf-8' });
const entries = JSON.parse(output);

// Filter by entry type
const pages = entries.filter(e => e.entryType === 'page');
const projects = entries.filter(e => e.entryType === 'project');

console.log(`Pages: ${pages.length}`);
console.log(`Projects: ${projects.length}`);

// Get single entry
const aboutOutput = execSync('marvin publish entry about --json', { encoding: 'utf-8' });
const about = JSON.parse(aboutOutput);

console.log(`Title: ${about.title}`);
console.log(`Published: ${about.publishedAt}`);
```

### Python

```python
import subprocess
import json

# Get all entries
result = subprocess.run(
    ['marvin', 'publish', 'entries', '--json'],
    capture_output=True,
    text=True
)

entries = json.loads(result.stdout)

# Group by entry type
by_type = {}
for entry in entries:
    entry_type = entry['entryType']
    if entry_type not in by_type:
        by_type[entry_type] = []
    by_type[entry_type].append(entry)

# Print summary
for entry_type, items in by_type.items():
    print(f"{entry_type}: {len(items)}")

# Get single entry
result = subprocess.run(
    ['marvin', 'publish', 'entry', 'about', '--json'],
    capture_output=True,
    text=True
)

about = json.loads(result.stdout)
print(f"About page title: {about['title']}")
```

### Static Site Generation (Astro)

```javascript
// scripts/fetch-entries.js
const { execSync } = require('child_process');
const fs = require('fs');

// Fetch all entries
const entries = JSON.parse(
  execSync('marvin publish entries --json', { encoding: 'utf-8' })
);

// Save to data directory
fs.writeFileSync(
  'src/data/entries.json',
  JSON.stringify(entries, null, 2)
);

console.log(`Fetched ${entries.length} entries`);

// Fetch individual entries for SSG
entries.forEach(entry => {
  const detail = execSync(
    `marvin publish entry ${entry.slug} --json`,
    { encoding: 'utf-8' }
  );
  
  fs.writeFileSync(
    `src/data/entries/${entry.slug}.json`,
    detail
  );
});
```

## Authentication

Requires a site client token. Set in environment:

```bash
export MARVIN_SITE_CLIENT_TOKEN=marvin_sk_your_token
```

Or pass via command line:

```bash
marvin publish entries --site-token marvin_sk_your_token
```

## Error Handling

### 401 Unauthorized

Site client token is invalid or missing:

```bash
export MARVIN_SITE_CLIENT_TOKEN=marvin_sk_your_token
```

### 404 Not Found (Single Entry)

Entry with the given slug doesn't exist:

```bash
# List all entries to verify slug
marvin publish entries --json | jq -r '.[].slug'
```

### 403 Forbidden

Entry is not published or site client doesn't have access:

```bash
# Check entry status in admin panel
# Ensure entry is published
```

### Empty Results

No entries match the filters:

```bash
# Check available entry types
marvin publish entries --json | jq -r '.[].entryType' | sort -u

# Check available collections
marvin publish collections --json | jq -r '.[].slug'
```

## Related Commands

- [`marvin publish collections`](collections.md) - List collections
- [`marvin publish collection-entries <slug>`](collections.md#collection-entries) - List entries in a collection
- [`marvin publish resources`](resources.md) - List resources
- [`marvin publish assets`](assets.md) - List assets

## API Reference

This command calls:

```
GET /api/{workspace}/entries
GET /api/{workspace}/entries/{slug}
```

Query parameters for list endpoint:
- `entry_type` - Filter by entry type slug
- `collection` - Filter by collection slug
- `limit` - Limit results

See [API Mapping](../reference/api-mapping.md) for more details.
