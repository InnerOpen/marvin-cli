# Resources

List and retrieve resources and their related entries from your Marvin workspace.

## Commands

### List Resources

```bash
marvin publish resources [options]
```

### Get Single Resource

```bash
marvin publish resource <slug>
```

### List Resource Entries

```bash
marvin publish resource-entries <slug>
```

## Description

Resources are reusable content elements in Marvin such as fabrics, tools, suppliers, materials, or any custom resource type you've defined. Resources can be referenced by multiple entries, making them ideal for maintaining consistent information across your content. The resource commands let you list all resources, get details about a specific resource, and see which entries reference a resource.

## Options

### `marvin publish resources`

| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output as JSON | `false` |
| `--yaml` | Output as YAML | `false` |
| `--csv` | Output as CSV | `false` |
| `--output <format>` | Output format: table, json, yaml, csv | `table` |

### `marvin publish resource <slug>`

| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output as JSON | `false` |
| `--yaml` | Output as YAML | `false` |
| `--output <format>` | Output format: table, json | `table` |

### `marvin publish resource-entries <slug>`

| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output as JSON | `false` |
| `--yaml` | Output as YAML | `false` |
| `--csv` | Output as CSV | `false` |
| `--output <format>` | Output format: table, json, yaml, csv | `table` |

## Examples

### Basic Usage

List all resources:

```bash
marvin publish resources
```

Output:

```
┌────────────────────┬──────────────┬────────┬───────────────────────────────┬──────────────────────┐
│ Name               │ Slug         │ Type   │ Description                   │ URL                  │
├────────────────────┼──────────────┼────────┼───────────────────────────────┼──────────────────────┤
│ Kuroki S022 Denim  │ kuroki-s022  │ fabric │ Premium Japanese selvedge     │ https://kuroki.com   │
│ Union Special 43200│ union-43200  │ tool   │ Industrial chain stitch       │ https://union.com    │
│ YKK Zipper #5      │ ykk-5        │ supply │ Heavy-duty metal zipper       │ https://ykk.com      │
└────────────────────┴──────────────┴────────┴───────────────────────────────┴──────────────────────┘
```

Get a single resource:

```bash
marvin publish resource kuroki-s022
```

Output:

```
┌─────────────┬──────────────────────────────────────┐
│ Field       │ Value                                │
├─────────────┼──────────────────────────────────────┤
│ Name        │ Kuroki S022 Denim                    │
│ Slug        │ kuroki-s022                          │
│ Type        │ fabric                               │
│ Description │ Premium Japanese selvedge            │
│ URL         │ https://kuroki.com                   │
│ SKU         │ KRK-S022-14OZ                        │
│ Created     │ 2026-05-01T10:00:00Z                 │
└─────────────┴──────────────────────────────────────┘
```

List entries that use a resource:

```bash
marvin publish resource-entries kuroki-s022
```

Output:

```
┌──────────────────┬──────────┬─────────┬───────────┬────────────┐
│ Title            │ Slug     │ Type    │ Status    │ Published  │
├──────────────────┼──────────┼─────────┼───────────┼────────────┤
│ Denim Project 01 │ denim-01 │ project │ published │ 2026-07-01 │
│ Denim Project 02 │ denim-02 │ project │ published │ 2026-07-02 │
│ Raw Denim Guide  │ raw-denim│ page    │ published │ 2026-06-15 │
└──────────────────┴──────────┴─────────┴───────────┴────────────┘
```

### JSON Output

List resources as JSON:

```bash
marvin publish resources --json
```

```json
[
  {
    "slug": "kuroki-s022",
    "name": "Kuroki S022 Denim",
    "type": "fabric",
    "description": "Premium Japanese selvedge denim from Kuroki Mills",
    "url": "https://kuroki.com",
    "metadata": {
      "sku": "KRK-S022-14OZ",
      "weight": "14oz",
      "origin": "Japan",
      "color": "Indigo"
    },
    "createdAt": "2026-05-01T10:00:00Z",
    "updatedAt": "2026-06-15T14:30:00Z"
  },
  {
    "slug": "union-43200",
    "name": "Union Special 43200",
    "type": "tool",
    "description": "Industrial chain stitch machine",
    "url": "https://unionspecial.com",
    "metadata": {
      "model": "43200G",
      "manufacturer": "Union Special"
    },
    "createdAt": "2026-05-10T08:00:00Z",
    "updatedAt": "2026-05-10T08:00:00Z"
  }
]
```

Get single resource as JSON:

```bash
marvin publish resource kuroki-s022 --json
```

```json
{
  "slug": "kuroki-s022",
  "name": "Kuroki S022 Denim",
  "type": "fabric",
  "description": "Premium Japanese selvedge denim from Kuroki Mills",
  "url": "https://kuroki.com",
  "metadata": {
    "sku": "KRK-S022-14OZ",
    "weight": "14oz",
    "origin": "Japan",
    "color": "Indigo",
    "width": "31 inches",
    "treatment": "Rope dyed"
  },
  "createdAt": "2026-05-01T10:00:00Z",
  "updatedAt": "2026-06-15T14:30:00Z"
}
```

List resource entries as JSON:

```bash
marvin publish resource-entries kuroki-s022 --json
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
    "resources": ["kuroki-s022", "union-43200"]
  },
  {
    "slug": "denim-02",
    "title": "Denim Project 02",
    "entryType": "project",
    "status": "published",
    "publishedAt": "2026-07-02T14:00:00Z",
    "description": "Raw denim workwear",
    "resources": ["kuroki-s022", "ykk-5"]
  }
]
```

### CSV Output

Export resources to CSV:

```bash
marvin publish resources --csv > resources.csv
```

Output:

```csv
Name,Slug,Type,Description,URL
Kuroki S022 Denim,kuroki-s022,fabric,Premium Japanese selvedge,https://kuroki.com
Union Special 43200,union-43200,tool,Industrial chain stitch,https://unionspecial.com
YKK Zipper #5,ykk-5,supply,Heavy-duty metal zipper,https://ykk.com
```

## Response Fields

### Resources List

| Field | Type | Description |
|-------|------|-------------|
| `slug` | string | Unique URL-friendly identifier |
| `name` | string | Resource name |
| `type` | string | Resource type (fabric, tool, supply, etc.) |
| `description` | string | Resource description |
| `url` | string | External URL for more information |
| `metadata` | object | Custom resource metadata |
| `createdAt` | string | ISO 8601 timestamp of creation |
| `updatedAt` | string | ISO 8601 timestamp of last update |

### Single Resource

| Field | Type | Description |
|-------|------|-------------|
| `slug` | string | Unique URL-friendly identifier |
| `name` | string | Resource name |
| `type` | string | Resource type |
| `description` | string | Resource description |
| `url` | string | External URL |
| `metadata` | object | Custom metadata (SKU, specs, etc.) |
| `createdAt` | string | ISO 8601 timestamp of creation |
| `updatedAt` | string | ISO 8601 timestamp of last update |

### Resource Entries

| Field | Type | Description |
|-------|------|-------------|
| `slug` | string | Entry slug |
| `title` | string | Entry title |
| `entryType` | string | Entry type slug |
| `status` | string | Publication status |
| `publishedAt` | string | ISO 8601 timestamp of publication |
| `description` | string | Entry description |
| `resources` | array | All resource slugs used by this entry |

## Use Cases

### Export Resources

Export all resources for documentation:

```bash
marvin publish resources --json > resources.json
```

### Resource Inventory

Create a CSV inventory for spreadsheet:

```bash
marvin publish resources --csv > inventory.csv
```

### Count Resources by Type

Count resources grouped by type:

```bash
marvin publish resources --json | jq 'group_by(.type) | map({type: .[0].type, count: length})'
```

Output:

```json
[
  { "type": "fabric", "count": 12 },
  { "type": "tool", "count": 8 },
  { "type": "supply", "count": 15 }
]
```

### Find Resource Usage

See which entries use a specific resource:

```bash
marvin publish resource-entries kuroki-s022 --json | jq -r '.[].title'
```

Output:

```
Denim Project 01
Denim Project 02
Raw Denim Guide
```

### Check Resource Exists

Verify a resource exists before referencing:

```bash
if marvin publish resource kuroki-s022 --json > /dev/null 2>&1; then
  echo "✓ Resource exists"
else
  echo "✗ Resource not found"
fi
```

### Build Resource Index

Generate a resource reference page:

```bash
marvin publish resources --json | jq -r '.[] | "### \(.name)\n\n\(.description)\n\n- Type: \(.type)\n- URL: \(.url)\n"'
```

Output:

```markdown
### Kuroki S022 Denim

Premium Japanese selvedge denim from Kuroki Mills

- Type: fabric
- URL: https://kuroki.com

### Union Special 43200

Industrial chain stitch machine

- Type: tool
- URL: https://unionspecial.com
```

### Find Unused Resources

Find resources not used in any entries:

```bash
#!/bin/bash

ALL_RESOURCES=$(marvin publish resources --json | jq -r '.[].slug')

for resource in $ALL_RESOURCES; do
  COUNT=$(marvin publish resource-entries "$resource" --json | jq 'length')
  if [ "$COUNT" -eq 0 ]; then
    echo "Unused: $resource"
  fi
done
```

## Scripting Examples

### Bash Script

```bash
#!/bin/bash

# Get all resources
RESOURCES=$(marvin publish resources --json)

# Group by type
echo "Resources by Type:"
echo "$RESOURCES" | jq -r 'group_by(.type) | .[] | "\(.[0].type): \(length)"'

echo ""
echo "Resource Usage:"

# Check usage for each resource
echo "$RESOURCES" | jq -r '.[].slug' | while read -r slug; do
  ENTRIES=$(marvin publish resource-entries "$slug" --json)
  COUNT=$(echo "$ENTRIES" | jq 'length')
  NAME=$(echo "$RESOURCES" | jq -r ".[] | select(.slug == \"$slug\") | .name")
  
  echo "  $NAME: $COUNT entries"
done
```

### Node.js

```javascript
const { execSync } = require('child_process');

// Get all resources
const resources = JSON.parse(
  execSync('marvin publish resources --json', { encoding: 'utf-8' })
);

console.log(`Total resources: ${resources.length}\n`);

// Group by type
const byType = resources.reduce((acc, resource) => {
  if (!acc[resource.type]) acc[resource.type] = [];
  acc[resource.type].push(resource);
  return acc;
}, {});

console.log('Resources by type:');
Object.entries(byType).forEach(([type, items]) => {
  console.log(`  ${type}: ${items.length}`);
});

// Get resource details
const kuroki = JSON.parse(
  execSync('marvin publish resource kuroki-s022 --json', { encoding: 'utf-8' })
);

console.log(`\nResource: ${kuroki.name}`);
console.log(`Type: ${kuroki.type}`);
console.log(`SKU: ${kuroki.metadata.sku}`);

// Get entries using this resource
const entries = JSON.parse(
  execSync('marvin publish resource-entries kuroki-s022 --json', {
    encoding: 'utf-8'
  })
);

console.log(`\nUsed in ${entries.length} entries:`);
entries.forEach(entry => {
  console.log(`  - ${entry.title}`);
});
```

### Python

```python
import subprocess
import json
from collections import defaultdict

# Get all resources
result = subprocess.run(
    ['marvin', 'publish', 'resources', '--json'],
    capture_output=True,
    text=True
)

resources = json.loads(result.stdout)

print(f"Total resources: {len(resources)}\n")

# Group by type
by_type = defaultdict(list)
for resource in resources:
    by_type[resource['type']].append(resource)

print("Resources by type:")
for resource_type, items in by_type.items():
    print(f"  {resource_type}: {len(items)}")

# Check usage for each resource
print("\nResource usage analysis:")
for resource in resources[:5]:  # First 5 for demo
    result = subprocess.run(
        ['marvin', 'publish', 'resource-entries', resource['slug'], '--json'],
        capture_output=True,
        text=True
    )
    
    entries = json.loads(result.stdout)
    print(f"  {resource['name']}: {len(entries)} entries")

# Get single resource details
result = subprocess.run(
    ['marvin', 'publish', 'resource', 'kuroki-s022', '--json'],
    capture_output=True,
    text=True
)

resource = json.loads(result.stdout)
print(f"\nResource Details: {resource['name']}")
print(f"  Description: {resource['description']}")
print(f"  Metadata: {json.dumps(resource['metadata'], indent=4)}")
```

### Static Site Generation

```javascript
// scripts/fetch-resources.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Fetch all resources
const resources = JSON.parse(
  execSync('marvin publish resources --json', { encoding: 'utf-8' })
);

// Create output directory
const outputDir = 'src/data/resources';
fs.mkdirSync(outputDir, { recursive: true });

// Save resources index
fs.writeFileSync(
  path.join(outputDir, 'index.json'),
  JSON.stringify(resources, null, 2)
);

// Fetch details and entries for each resource
resources.forEach(resource => {
  // Get full resource details
  const detail = JSON.parse(
    execSync(`marvin publish resource ${resource.slug} --json`, {
      encoding: 'utf-8'
    })
  );
  
  // Get entries that use this resource
  const entries = JSON.parse(
    execSync(`marvin publish resource-entries ${resource.slug} --json`, {
      encoding: 'utf-8'
    })
  );
  
  // Save combined data
  fs.writeFileSync(
    path.join(outputDir, `${resource.slug}.json`),
    JSON.stringify({
      ...detail,
      usedInEntries: entries
    }, null, 2)
  );
  
  console.log(`Saved ${resource.name} (used in ${entries.length} entries)`);
});

console.log(`Fetched ${resources.length} resources`);
```

## Authentication

Requires a site client token. Set in environment:

```bash
export MARVIN_SITE_CLIENT_TOKEN=marvin_sk_your_token
```

Or pass via command line:

```bash
marvin publish resources --site-token marvin_sk_your_token
```

## Error Handling

### 401 Unauthorized

Site client token is invalid or missing:

```bash
export MARVIN_SITE_CLIENT_TOKEN=marvin_sk_your_token
```

### 404 Not Found

Resource with the given slug doesn't exist:

```bash
# List all resources to verify slug
marvin publish resources --json | jq -r '.[].slug'
```

### Resource Not Used

Resource exists but is not referenced in any entries:

```bash
marvin publish resource-entries unused-resource --json
# Returns: []
```

This is not an error - it means the resource exists but isn't currently used.

## Related Commands

- [`marvin publish entries`](entries.md) - List all entries
- [`marvin publish entry <slug>`](entries.md) - Get single entry with resources
- [`marvin publish collections`](collections.md) - List collections
- [`marvin publish assets`](assets.md) - List assets

## API Reference

This command calls:

```
GET /api/{workspace}/resources
GET /api/{workspace}/resources/{slug}
GET /api/{workspace}/resources/{slug}/entries
```

See [API Mapping](../reference/api-mapping.md) for more details.
