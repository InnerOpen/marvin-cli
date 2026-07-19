# Renderers

View entry type renderer declarations and capabilities for your workspace.

## Commands

### List Renderers

```bash
marvin publish renderers [options]
```

## Description

Lists entry types with their rendering metadata — renderer name, package, and capabilities (publishable, routable). By default, only entry types with `isRendered: true` are shown. Use `--all` to include all entry types.

This command uses the Publishing API (`/api/publish/{workspace}/entry-types`) via the SDK's `renderers.list()` method.

## Authentication

Requires a site client token. Set via `marvin login`, `marvin workspace token`, or the `MARVIN_SITE_TOKEN` environment variable.

## Options

### `marvin publish renderers`

| Option | Description | Default |
|--------|-------------|---------|
| `--all` | Include entry types without a declared renderer | `false` |
| `--json` | Output as JSON | `false` |
| `--yaml` | Output as YAML | `false` |
| `--csv` | Output as CSV | `false` |
| `--output <format>` | Output format: table, json, yaml, csv | `table` |

## Examples

### Basic Usage

List rendered entry types:

```bash
marvin publish renderers
```

Output:

```
┌──────────────────┬─────────────────┬───────────┬──────────────────────────────────┬─────────────┬──────────┐
│ Name             │ Slug            │ Renderer  │ Package                          │ Publishable │ Routable │
├──────────────────┼─────────────────┼───────────┼──────────────────────────────────┼─────────────┼──────────┤
│ Page             │ page            │ page      │ @inneropen/marvin-renderers-core │ true        │ true     │
│ Article          │ article         │ article   │ @inneropen/marvin-renderers-core │ true        │ true     │
│ FAQ              │ faq             │ faq       │ @inneropen/marvin-renderers-core │ true        │ true     │
│ Navigation Item  │ navigation-item │ navigation│ @inneropen/marvin-renderers-core │ true        │ false    │
└──────────────────┴─────────────────┴───────────┴──────────────────────────────────┴─────────────┴──────────┘
```

### Include All Entry Types

```bash
marvin publish renderers --all
```

Shows all entry types, including those without `isRendered: true`. Non-rendered types will show empty renderer and package columns.

### JSON Output

```bash
marvin publish renderers --json
```

```json
[
  {
    "name": "Page",
    "slug": "page",
    "isRendered": true,
    "rendering": {
      "renderer": "page",
      "package": "@inneropen/marvin-renderers-core"
    },
    "capabilities": {
      "publishable": true,
      "submittable": false,
      "routable": true
    }
  }
]
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Human-readable entry type name |
| `slug` | string | URL-friendly identifier |
| `isRendered` | boolean | Whether this type has a frontend renderer |
| `rendering.renderer` | string | Renderer component name (e.g., `page`, `article`, `faq`) |
| `rendering.package` | string | npm package providing the renderer |
| `rendering.version` | string | Semver range for the required package version |
| `rendering.config` | object | Renderer-specific configuration |
| `capabilities.publishable` | boolean | Can transition through publishing workflow |
| `capabilities.submittable` | boolean | Accepts external data submission |
| `capabilities.routable` | boolean | Has its own URL path on the frontend |

## Use Cases

### Check Which Renderers a Site Needs

```bash
marvin publish renderers --json | jq -r '.[].rendering.renderer'
```

Output:

```
page
article
faq
navigation
```

### Find Non-Routable Entry Types

```bash
marvin publish renderers --json | jq '.[] | select(.capabilities.routable == false) | .slug'
```

### Count Rendered vs Total Entry Types

```bash
echo "Rendered: $(marvin publish renderers --json | jq 'length')"
echo "Total: $(marvin publish renderers --all --json | jq 'length')"
```

## Relationship to entry-types

The `entry-types` command (under the Platform API) shows entry type schemas and field definitions. The `publish renderers` command (under the Publishing API) focuses on rendering metadata — which renderers are needed and what capabilities each type has.

| Command | API | Focus |
|---------|-----|-------|
| `marvin entry-types list` | Platform | Schema, fields, validation |
| `marvin publish renderers` | Publishing | Renderer, package, capabilities |

## Related Commands

- [`marvin entry-types list`](entry-types.md) - View entry type schemas (Platform API)
- [`marvin entries`](entries.md) - List entries (can filter by entry type)

## API Reference

This command calls:

```
GET /api/publish/{workspace}/entry-types
```
