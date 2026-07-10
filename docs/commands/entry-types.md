# Entry Types

View entry type definitions and schemas for your workspace.

## Commands

### List Entry Types

```bash
marvin entry-types list
```

### Get Entry Type

```bash
marvin entry-types get <id>
```

## Description

Entry types define the structure and schema for different kinds of content in your workspace. Common entry types include pages, blog posts, projects, and products. Each entry type has a unique schema that defines what fields are available when creating or editing entries of that type.

Entry types are read-only through the CLI and API. They are managed through workspace configuration files, not via API commands.

## Authentication

Requires user authentication via `marvin login` and an active workspace.

```bash
marvin login
marvin workspace use <workspace>
```

## Options

### `marvin entry-types list`

| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output as JSON | `false` |
| `--yaml` | Output as YAML | `false` |
| `--csv` | Output as CSV | `false` |
| `--output <format>` | Output format: table, json, yaml, csv | `table` |

### `marvin entry-types get <id>`

| Option | Description | Default |
|--------|-------------|---------|
| `<id>` | Entry type ID (required) | - |
| `--json` | Output as JSON | `false` |
| `--yaml` | Output as YAML | `false` |
| `--output <format>` | Output format: table, json | `table` |

## Examples

### Basic Usage

List all entry types:

```bash
marvin entry-types list
```

Output:

```
┌──────────────────────────────┬────────────┬───────┐
│ ID                           │ Name       │ Slug  │
├──────────────────────────────┼────────────┼───────┤
│ 01234567-89ab-cdef-0123-4567 │ Page       │ page  │
│ 89abcdef-0123-4567-89ab-cdef │ Project    │ project│
│ cdef0123-4567-89ab-cdef-0123 │ Blog Post  │ blog  │
└──────────────────────────────┴────────────┴───────┘
```

Get a specific entry type:

```bash
marvin entry-types get 01234567-89ab-cdef-0123-4567
```

Output:

```
┌─────────────┬──────────────────────────────────────┐
│ Field       │ Value                                │
├─────────────┼──────────────────────────────────────┤
│ ID          │ 01234567-89ab-cdef-0123-4567         │
│ Name        │ Page                                 │
│ Slug        │ page                                 │
│ Description │ Standard page content                │
└─────────────┴──────────────────────────────────────┘
```

### JSON Output

List entry types as JSON:

```bash
marvin entry-types list --json
```

```json
[
  {
    "id": "01234567-89ab-cdef-0123-4567",
    "name": "Page",
    "slug": "page",
    "description": "Standard page content",
    "schema": {
      "fields": [
        {
          "name": "title",
          "type": "text",
          "required": true
        },
        {
          "name": "body",
          "type": "richtext",
          "required": true
        },
        {
          "name": "seoTitle",
          "type": "text",
          "required": false
        }
      ]
    },
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-06-10T14:30:00Z"
  },
  {
    "id": "89abcdef-0123-4567-89ab-cdef",
    "name": "Project",
    "slug": "project",
    "description": "Portfolio project",
    "schema": {
      "fields": [
        {
          "name": "title",
          "type": "text",
          "required": true
        },
        {
          "name": "description",
          "type": "textarea",
          "required": true
        },
        {
          "name": "images",
          "type": "assets",
          "required": false
        }
      ]
    }
  }
]
```

Get single entry type as JSON:

```bash
marvin entry-types get 01234567-89ab-cdef-0123-4567 --json
```

```json
{
  "id": "01234567-89ab-cdef-0123-4567",
  "name": "Page",
  "slug": "page",
  "description": "Standard page content",
  "schema": {
    "fields": [
      {
        "name": "title",
        "type": "text",
        "required": true,
        "validations": {
          "maxLength": 200
        }
      },
      {
        "name": "body",
        "type": "richtext",
        "required": true
      },
      {
        "name": "seoTitle",
        "type": "text",
        "required": false
      },
      {
        "name": "seoDescription",
        "type": "textarea",
        "required": false,
        "validations": {
          "maxLength": 300
        }
      }
    ]
  },
  "createdAt": "2026-01-15T10:00:00Z",
  "updatedAt": "2026-06-10T14:30:00Z"
}
```

## Response Fields

### Entry Type List

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique entry type ID (UUID) |
| `name` | string | Human-readable name |
| `slug` | string | URL-friendly identifier |
| `description` | string | Entry type description |
| `schema` | object | Field definitions and validations |
| `createdAt` | string | ISO 8601 timestamp of creation |
| `updatedAt` | string | ISO 8601 timestamp of last update |

### Entry Type Schema

| Field | Type | Description |
|-------|------|-------------|
| `fields` | array | Array of field definitions |
| `fields[].name` | string | Field identifier |
| `fields[].type` | string | Field type (text, richtext, textarea, number, etc.) |
| `fields[].required` | boolean | Whether field is required |
| `fields[].validations` | object | Field validation rules |

## Use Cases

### List Available Entry Types

See what content types are available before creating entries:

```bash
marvin entry-types list --json | jq -r '.[].slug'
```

Output:

```
page
project
blog
product
```

### Inspect Entry Type Schema

View field definitions before creating an entry:

```bash
marvin entry-types get 01234567-89ab-cdef-0123-4567 --json | jq '.schema.fields'
```

Output:

```json
[
  {
    "name": "title",
    "type": "text",
    "required": true,
    "validations": {
      "maxLength": 200
    }
  },
  {
    "name": "body",
    "type": "richtext",
    "required": true
  }
]
```

### Find Entry Type by Slug

```bash
marvin entry-types list --json | jq '.[] | select(.slug == "page")'
```

### Count Entry Types

```bash
marvin entry-types list --json | jq 'length'
```

Output:

```
4
```

### Extract Required Fields

```bash
marvin entry-types get <id> --json | jq '.schema.fields[] | select(.required == true) | .name'
```

Output:

```
"title"
"body"
```

## Scripting Examples

### Bash Script

```bash
#!/bin/bash

# List all entry types and their slugs
echo "Available Entry Types:"
marvin entry-types list --json | jq -r '.[] | "\(.slug) - \(.name)"'

# Get detailed info for each type
echo -e "\nDetailed Schemas:"
marvin entry-types list --json | jq -r '.[].id' | while read -r id; do
  marvin entry-types get "$id" --json | jq '{
    slug: .slug,
    fields: [.schema.fields[].name]
  }'
done
```

### Node.js

```javascript
const { execSync } = require('child_process');

// Get all entry types
const entryTypes = JSON.parse(
  execSync('marvin entry-types list --json', { encoding: 'utf-8' })
);

console.log(`Found ${entryTypes.length} entry types:\n`);

// Process each entry type
entryTypes.forEach(type => {
  console.log(`${type.name} (${type.slug})`);
  console.log(`  ID: ${type.id}`);
  
  // Get detailed schema
  const detail = JSON.parse(
    execSync(`marvin entry-types get ${type.id} --json`, { 
      encoding: 'utf-8' 
    })
  );
  
  const requiredFields = detail.schema.fields
    .filter(f => f.required)
    .map(f => f.name);
  
  console.log(`  Required fields: ${requiredFields.join(', ')}`);
  console.log('');
});
```

### Python

```python
import subprocess
import json

# Get all entry types
result = subprocess.run(
    ['marvin', 'entry-types', 'list', '--json'],
    capture_output=True,
    text=True
)

entry_types = json.loads(result.stdout)

# Build a mapping of slug to schema
schemas = {}

for entry_type in entry_types:
    # Get detailed schema
    result = subprocess.run(
        ['marvin', 'entry-types', 'get', entry_type['id'], '--json'],
        capture_output=True,
        text=True
    )
    
    detail = json.loads(result.stdout)
    schemas[entry_type['slug']] = detail['schema']

# Print field counts by type
for slug, schema in schemas.items():
    field_count = len(schema['fields'])
    print(f"{slug}: {field_count} fields")
```

### Generate Type Documentation

```javascript
// scripts/document-types.js
const { execSync } = require('child_process');
const fs = require('fs');

const entryTypes = JSON.parse(
  execSync('marvin entry-types list --json', { encoding: 'utf-8' })
);

let markdown = '# Entry Types\n\n';

entryTypes.forEach(type => {
  const detail = JSON.parse(
    execSync(`marvin entry-types get ${type.id} --json`, { 
      encoding: 'utf-8' 
    })
  );
  
  markdown += `## ${type.name}\n\n`;
  markdown += `**Slug:** \`${type.slug}\`\n\n`;
  if (type.description) {
    markdown += `${type.description}\n\n`;
  }
  
  markdown += '### Fields\n\n';
  markdown += '| Name | Type | Required |\n';
  markdown += '|------|------|----------|\n';
  
  detail.schema.fields.forEach(field => {
    markdown += `| ${field.name} | ${field.type} | ${field.required ? 'Yes' : 'No'} |\n`;
  });
  
  markdown += '\n';
});

fs.writeFileSync('ENTRY_TYPES.md', markdown);
console.log('Documentation generated: ENTRY_TYPES.md');
```

## Error Handling

### 401 Unauthorized

Not authenticated or no active workspace:

```bash
marvin login
marvin workspace use <workspace>
```

### 404 Not Found

Entry type with the given ID doesn't exist:

```bash
# List all entry types to find valid IDs
marvin entry-types list --json | jq -r '.[].id'
```

### Empty Results

No entry types defined in workspace:

```bash
marvin entry-types list
# Returns: empty table or []
```

This is unusual and may indicate a configuration issue. Entry types are typically defined during workspace setup.

## Related Commands

- [`marvin workspace use`](workspaces.md) - Set active workspace
- [`marvin entries list`](entries.md) - List entries (can filter by entry type)
- [`marvin publish entries`](../publish/entries.md) - Publish API entries

## Notes

- Entry types are **read-only** via the CLI and API
- They are managed through workspace configuration files
- Changes to entry types require workspace reconfiguration
- Deleting or modifying entry types may affect existing entries
- The schema defines validation rules enforced when creating/updating entries

## API Reference

This command calls:

```
GET /api/platform/workspaces/{workspace_id}/entry-types
GET /api/platform/workspaces/{workspace_id}/entry-types/{id}
```

See [API Mapping](../reference/api-mapping.md) for more details.
