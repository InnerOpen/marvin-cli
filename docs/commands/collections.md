# Collections

List and retrieve collections and their entries from your Marvin workspace.

## Commands

### List Collections

```bash
marvin publish collections [options]
```

### Get Single Collection

```bash
marvin publish collection <slug>
```

### List Collection Entries

```bash
marvin publish collection-entries <slug>
```

## Description

Collections are curated groups of entries in Marvin. They allow you to organize content into categories like "Featured Projects", "Blog Posts", or "Case Studies". The collection commands let you list all collections, get details about a specific collection, and retrieve all entries within a collection.

## Options

### `marvin publish collections`

| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output as JSON | `false` |
| `--yaml` | Output as YAML | `false` |
| `--csv` | Output as CSV | `false` |
| `--output <format>` | Output format: table, json, yaml, csv | `table` |

### `marvin publish collection <slug>`

| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output as JSON | `false` |
| `--yaml` | Output as YAML | `false` |
| `--output <format>` | Output format: table, json | `table` |

### `marvin publish collection-entries <slug>`

| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output as JSON | `false` |
| `--yaml` | Output as YAML | `false` |
| `--csv` | Output as CSV | `false` |
| `--output <format>` | Output format: table, json, yaml, csv | `table` |

## Examples

### Basic Usage

List all collections:

```bash
marvin publish collections
```

Output:

```
┌──────────┬───────────────────┬──────────────────────┬──────────────┐
│ Slug     │ Name              │ Description          │ Entry Count  │
├──────────┼───────────────────┼──────────────────────┼──────────────┤
│ featured │ Featured Projects │ Our best work        │ 5            │
│ archived │ Archive           │ Older content        │ 12           │
│ blog     │ Blog Posts        │ Latest articles      │ 24           │
└──────────┴───────────────────┴──────────────────────┴──────────────┘
```

Get a single collection:

```bash
marvin publish collection featured
```

Output:

```
┌─────────────┬──────────────────────────────────────┐
│ Field       │ Value                                │
├─────────────┼──────────────────────────────────────┤
│ Name        │ Featured Projects                    │
│ Slug        │ featured                             │
│ Description │ Our best work                        │
│ Entry Count │ 5                                    │
│ Created     │ 2026-06-01T10:00:00Z                 │
└─────────────┴──────────────────────────────────────┘
```

List entries in a collection:

```bash
marvin publish collection-entries featured
```

Output:

```
┌──────────────────┬──────────┬─────────┬───────────┬────────────┐
│ Title            │ Slug     │ Type    │ Status    │ Published  │
├──────────────────┼──────────┼─────────┼───────────┼────────────┤
│ Denim Project 01 │ denim-01 │ project │ published │ 2026-07-01 │
│ Denim Project 02 │ denim-02 │ project │ published │ 2026-07-02 │
│ Jacket Project   │ jacket-1 │ project │ published │ 2026-07-03 │
└──────────────────┴──────────┴─────────┴───────────┴────────────┘
```

### JSON Output

List collections as JSON:

```bash
marvin publish collections --json
```

```json
[
  {
    "slug": "featured",
    "name": "Featured Projects",
    "description": "Our best work",
    "entryCount": 5,
    "createdAt": "2026-06-01T10:00:00Z",
    "updatedAt": "2026-07-01T15:30:00Z"
  },
  {
    "slug": "archived",
    "name": "Archive",
    "description": "Older content",
    "entryCount": 12,
    "createdAt": "2026-05-15T08:00:00Z",
    "updatedAt": "2026-06-20T12:00:00Z"
  }
]
```

Get single collection as JSON:

```bash
marvin publish collection featured --json
```

```json
{
  "slug": "featured",
  "name": "Featured Projects",
  "description": "Our best work",
  "entryCount": 5,
  "createdAt": "2026-06-01T10:00:00Z",
  "updatedAt": "2026-07-01T15:30:00Z",
  "metadata": {
    "order": "manual",
    "displayStyle": "grid"
  }
}
```

List collection entries as JSON:

```bash
marvin publish collection-entries featured --json
```

```json
[
  {
    "slug": "denim-01",
    "title": "Denim Project 01",
    "entryType": "project",
    "status": "published",
    "publishedAt": "2026-07-01T12:00:00Z",
    "description": "Premium selvedge denim project",
    "collections": ["featured"]
  },
  {
    "slug": "denim-02",
    "title": "Denim Project 02",
    "entryType": "project",
    "status": "published",
    "publishedAt": "2026-07-02T14:00:00Z",
    "description": "Raw denim workwear",
    "collections": ["featured", "archived"]
  }
]
```

### YAML Output

Export collections as YAML:

```bash
marvin publish collections --yaml
```

```yaml
- slug: featured
  name: Featured Projects
  description: Our best work
  entryCount: 5
  createdAt: 2026-06-01T10:00:00Z
  updatedAt: 2026-07-01T15:30:00Z
- slug: archived
  name: Archive
  description: Older content
  entryCount: 12
  createdAt: 2026-05-15T08:00:00Z
  updatedAt: 2026-06-20T12:00:00Z
```

## Response Fields

### Collections List

| Field | Type | Description |
|-------|------|-------------|
| `slug` | string | Unique URL-friendly identifier |
| `name` | string | Collection display name |
| `description` | string | Collection description |
| `entryCount` | number | Number of entries in collection |
| `createdAt` | string | ISO 8601 timestamp of creation |
| `updatedAt` | string | ISO 8601 timestamp of last update |

### Single Collection

| Field | Type | Description |
|-------|------|-------------|
| `slug` | string | Unique URL-friendly identifier |
| `name` | string | Collection display name |
| `description` | string | Collection description |
| `entryCount` | number | Number of entries in collection |
| `metadata` | object | Custom collection metadata |
| `createdAt` | string | ISO 8601 timestamp of creation |
| `updatedAt` | string | ISO 8601 timestamp of last update |

### Collection Entries

| Field | Type | Description |
|-------|------|-------------|
| `slug` | string | Entry slug |
| `title` | string | Entry title |
| `entryType` | string | Entry type slug |
| `status` | string | Publication status |
| `publishedAt` | string | ISO 8601 timestamp of publication |
| `description` | string | Entry description |
| `collections` | array | Collection slugs this entry belongs to |

## Use Cases

### Export Collections

Export all collections for documentation:

```bash
marvin publish collections --json > collections.json
```

### Count Collections

Count total number of collections:

```bash
marvin publish collections --json | jq 'length'
```

Output:

```
3
```

### Find Largest Collection

Find the collection with the most entries:

```bash
marvin publish collections --json | jq 'sort_by(.entryCount) | reverse | .[0]'
```

Output:

```json
{
  "slug": "blog",
  "name": "Blog Posts",
  "description": "Latest articles",
  "entryCount": 24
}
```

### Build Collection Index

Generate an index page for all collections:

```bash
marvin publish collections --json | jq -r '.[] | "- [\(.name)](\(.slug)) - \(.entryCount) entries"'
```

Output:

```markdown
- [Featured Projects](featured) - 5 entries
- [Archive](archived) - 12 entries
- [Blog Posts](blog) - 24 entries
```

### Verify Collection Exists

Check if a collection exists before querying:

```bash
if marvin publish collection featured --json > /dev/null 2>&1; then
  echo "✓ Featured collection exists"
else
  echo "✗ Featured collection not found"
fi
```

### Export Collection Entries

Export all entries from a specific collection:

```bash
marvin publish collection-entries featured --json > featured-entries.json
```

### Count Collection Entries

Count entries in a collection:

```bash
marvin publish collection-entries featured --json | jq 'length'
```

## Scripting Examples

### Bash Script

```bash
#!/bin/bash

# Get all collections
COLLECTIONS=$(marvin publish collections --json)

# Loop through each collection
echo "$COLLECTIONS" | jq -c '.[]' | while read -r collection; do
  SLUG=$(echo "$collection" | jq -r '.slug')
  NAME=$(echo "$collection" | jq -r '.name')
  COUNT=$(echo "$collection" | jq -r '.entryCount')
  
  echo "Collection: $NAME ($SLUG)"
  echo "Entries: $COUNT"
  echo "---"
  
  # Get entries in collection
  marvin publish collection-entries "$SLUG" --json | jq -r '.[].title' | sed 's/^/  - /'
  echo ""
done
```

### Node.js

```javascript
const { execSync } = require('child_process');

// Get all collections
const collections = JSON.parse(
  execSync('marvin publish collections --json', { encoding: 'utf-8' })
);

console.log(`Total collections: ${collections.length}\n`);

// Process each collection
collections.forEach(collection => {
  console.log(`${collection.name} (${collection.slug})`);
  console.log(`  Entries: ${collection.entryCount}`);
  console.log(`  Description: ${collection.description}`);
  
  // Get collection entries
  const entries = JSON.parse(
    execSync(`marvin publish collection-entries ${collection.slug} --json`, {
      encoding: 'utf-8'
    })
  );
  
  console.log(`  First entry: ${entries[0]?.title || 'None'}`);
  console.log('');
});

// Get single collection details
const featured = JSON.parse(
  execSync('marvin publish collection featured --json', { encoding: 'utf-8' })
);

console.log('Featured Collection Details:');
console.log(JSON.stringify(featured, null, 2));
```

### Python

```python
import subprocess
import json

# Get all collections
result = subprocess.run(
    ['marvin', 'publish', 'collections', '--json'],
    capture_output=True,
    text=True
)

collections = json.loads(result.stdout)

print(f"Total collections: {len(collections)}\n")

# Group by entry count
by_size = {
    'small': [],  # 0-5 entries
    'medium': [], # 6-15 entries
    'large': []   # 16+ entries
}

for collection in collections:
    count = collection['entryCount']
    if count <= 5:
        by_size['small'].append(collection)
    elif count <= 15:
        by_size['medium'].append(collection)
    else:
        by_size['large'].append(collection)

print("Collections by size:")
for size, items in by_size.items():
    print(f"  {size}: {len(items)}")

# Get entries from a specific collection
result = subprocess.run(
    ['marvin', 'publish', 'collection-entries', 'featured', '--json'],
    capture_output=True,
    text=True
)

entries = json.loads(result.stdout)
print(f"\nFeatured collection has {len(entries)} entries")
for entry in entries:
    print(f"  - {entry['title']}")
```

### Static Site Generation

```javascript
// scripts/fetch-collections.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Fetch all collections
const collections = JSON.parse(
  execSync('marvin publish collections --json', { encoding: 'utf-8' })
);

// Create output directory
const outputDir = 'src/data/collections';
fs.mkdirSync(outputDir, { recursive: true });

// Save collections index
fs.writeFileSync(
  path.join(outputDir, 'index.json'),
  JSON.stringify(collections, null, 2)
);

// Fetch entries for each collection
collections.forEach(collection => {
  const entries = JSON.parse(
    execSync(`marvin publish collection-entries ${collection.slug} --json`, {
      encoding: 'utf-8'
    })
  );
  
  // Save collection with entries
  fs.writeFileSync(
    path.join(outputDir, `${collection.slug}.json`),
    JSON.stringify({
      ...collection,
      entries
    }, null, 2)
  );
  
  console.log(`Saved ${collection.name} with ${entries.length} entries`);
});

console.log(`Fetched ${collections.length} collections`);
```

## Authentication

Requires a site client token. Set in environment:

```bash
export MARVIN_SITE_CLIENT_TOKEN=marvin_sk_your_token
```

Or pass via command line:

```bash
marvin publish collections --site-token marvin_sk_your_token
```

## Error Handling

### 401 Unauthorized

Site client token is invalid or missing:

```bash
export MARVIN_SITE_CLIENT_TOKEN=marvin_sk_your_token
```

### 404 Not Found

Collection with the given slug doesn't exist:

```bash
# List all collections to verify slug
marvin publish collections --json | jq -r '.[].slug'
```

### Empty Collection

Collection exists but has no entries:

```bash
marvin publish collection-entries empty-collection --json
# Returns: []
```

Check entry count first:

```bash
marvin publish collection empty-collection --json | jq -r '.entryCount'
```

## Related Commands

- [`marvin publish entries`](entries.md) - List all entries
- [`marvin publish entries --collection <slug>`](entries.md) - Filter entries by collection
- [`marvin publish entry <slug>`](entries.md) - Get single entry
- [`marvin publish site`](site.md) - Get site configuration

## API Reference

This command calls:

```
GET /api/{workspace}/collections
GET /api/{workspace}/collections/{slug}
GET /api/{workspace}/collections/{slug}/entries
```

See [API Mapping](../reference/api-mapping.md) for more details.
