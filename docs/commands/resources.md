# Resources

List and retrieve resources, and the entries that reference them, from the Publishing API.

## Commands

```bash
marvin publish resources [--resource-type <type>] [--limit <number>] [--offset <number>]
marvin publish resource <slug>
marvin publish resource-entries <slug>
```

Resources are reusable content elements such as fabrics, tools, suppliers or any custom resource
type. Entries reference them, so one resource can be shown consistently across many entries.

All three commands use a site client token (see [Authentication](#authentication)) and the usual
output flags (`--json`, `--yaml`, `--csv`, `--output <format>`).

## Options

### `marvin publish resources`

| Option | Description | Default |
|--------|-------------|---------|
| `--resource-type <type>` | Filter by resource type | All types |
| `--limit <number>` | Limit number of results | Server default |
| `--offset <number>` | Skip this many results | `0` |

`marvin publish resource <slug>` and `marvin publish resource-entries <slug>` take no options of
their own.

## Examples

### List

```bash
marvin publish resources
marvin publish resources --resource-type fabric --limit 20
```

```
┌─────────────────────┬─────────────┬────────┬───────────────────────────┬────────────────────┐
│ Name                │ Slug        │ Type   │ Description               │ URL                │
├─────────────────────┼─────────────┼────────┼───────────────────────────┼────────────────────┤
│ Kuroki S022 Denim   │ kuroki-s022 │ fabric │ Premium Japanese selvedge │ https://kuroki.com │
│ Union Special 43200 │ union-43200 │ tool   │ Industrial chain stitch   │ https://union.com  │
└─────────────────────┴─────────────┴────────┴───────────────────────────┴────────────────────┘
```

The Description column is cut to 50 characters; use `--json` for the full text.

### Get one resource

```bash
marvin publish resource kuroki-s022
marvin publish resource kuroki-s022 --json
```

The table has the same columns as the list. `--json` prints an array with one element (the full
resource), or `[]` and exit status 1 when the slug is unknown.

```json
[
  {
    "slug": "kuroki-s022",
    "name": "Kuroki S022 Denim",
    "resourceType": "fabric",
    "description": "Premium Japanese selvedge denim",
    "url": "https://kuroki.com",
    "externalId": null,
    "metadataJson": { "sku": "KRK-S022-14OZ", "weight": "14oz" },
    "entries": ["denim-01", "denim-02"],
    "tags": ["denim"]
  }
]
```

### Entries that use a resource

```bash
marvin publish resource-entries kuroki-s022
marvin publish resource-entries kuroki-s022 --json
```

The output is a list of entry **slugs** (a single `Slug` column in table mode, a JSON array of
strings with `--json`), not full entries. Fetch each with [`marvin publish entry`](entries.md). An
unknown resource prints an empty list and exits with status 1.

```
┌──────────┐
│ Slug     │
├──────────┤
│ denim-01 │
│ denim-02 │
└──────────┘
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `slug` | string | Unique URL-friendly identifier |
| `name` | string | Resource name |
| `resourceType` | string | Resource type (fabric, tool, supply, etc.) |
| `description` | string | Resource description |
| `url` | string | External URL |
| `externalId` | string | Identifier in an external system |
| `metadataJson` | object | Custom metadata (SKU, specs, etc.) |
| `entries` | array | Slugs of entries that reference the resource |
| `tags` | array | Tag slugs |

## Use Cases

```bash
# Export and inventory
marvin publish resources --json > resources.json
marvin publish resources --csv > inventory.csv

# Count resources by type
marvin publish resources --json | jq 'group_by(.resourceType) | map({type: .[0].resourceType, count: length})'

# Titles of the entries using a resource
for slug in $(marvin publish resource-entries kuroki-s022 --json | jq -r '.[]'); do
  marvin publish entry "$slug" --json | jq -r '.[0].title'
done

# Find resources that no entry uses
marvin publish resources --json | jq -r '.[] | select((.entries // []) | length == 0) | .slug'

# Does a resource exist? (exit status 1 when it does not)
marvin publish resource kuroki-s022 --json > /dev/null && echo exists
```

## Authentication

Requires a site client token, resolved in this order: `--site-token` / `--token` flag, the token saved
for the active workspace (`marvin workspace token`), then `MARVIN_SITE_CLIENT_TOKEN`.

```bash
export MARVIN_SITE_CLIENT_TOKEN=marvin_sk_your_token
marvin publish resources --site-token marvin_sk_your_token
```

## Related Commands

- [`marvin publish entries`](entries.md) - List published entries
- [`marvin publish assets`](assets.md) - List assets
- [`marvin publish collections`](collections.md) - List collections

## API Reference

```
GET /api/publish/{workspace}/resources
GET /api/publish/{workspace}/resources/{slug}
```

See [API Mapping](../reference/api-mapping.md) for more details.
