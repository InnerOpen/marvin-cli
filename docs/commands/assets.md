# Assets

List and retrieve published assets (images, videos, documents and other files), and download the
files themselves, through the Publishing API.

## Commands

```bash
marvin publish assets [--type <type>] [--limit <number>] [--offset <number>]
marvin publish asset <slug> [--download [-o, --out-file <file>]]
```

Both commands use a site client token (see [Authentication](#authentication)) and the usual output
flags (`--json`, `--yaml`, `--csv`, `--output <format>`).

## Options

### `marvin publish assets`

| Option | Description | Default |
|--------|-------------|---------|
| `--type <type>` | Filter by asset type (the `assetType` value shown in `--json` output) | All types |
| `--limit <number>` | Limit number of results | Server default |
| `--offset <number>` | Skip this many results | `0` |

### `marvin publish asset <slug>`

| Option | Description | Default |
|--------|-------------|---------|
| `--download` | Download the file instead of printing its metadata | `false` |
| `-o, --out-file <file>` | With `--download`: write the file here. Without `--download` it is rejected. | none |

## Examples

### List

```bash
marvin publish assets
marvin publish assets --type image --limit 10
```

```
┌────────────────┬────────────────┬─────────────────┬────────────┬────────────────────────┐
│ Name           │ Slug           │ Type            │ Dimensions │ Alt                    │
├────────────────┼────────────────┼─────────────────┼────────────┼────────────────────────┤
│ hero-image.jpg │ hero-image     │ image/jpeg      │ 1920x1080  │ Hero image for homepage│
│ process-guide  │ process-guide  │ application/pdf │            │                        │
└────────────────┴────────────────┴─────────────────┴────────────┴────────────────────────┘
```

The Type column shows the MIME type; Dimensions is empty for non-images; Alt is cut to 40
characters. Use `--json` for everything else.

### Get one asset

```bash
marvin publish asset hero-image
marvin publish asset hero-image --json
```

The table has the same columns as the list. With `--json` you get an array with one element, or
`[]` and exit status 1 when the slug is unknown.

```json
[
  {
    "slug": "hero-image",
    "name": "hero-image.jpg",
    "mimeType": "image/jpeg",
    "assetType": "image",
    "fileSize": 2457600,
    "width": 1920,
    "height": 1080,
    "altText": "Hero image for homepage",
    "description": null,
    "publicUrl": "https://cdn.example.com/hero-image.jpg",
    "metadataJson": null,
    "tags": ["homepage"]
  }
]
```

### Download a file

`--download` fetches the file itself through the publishing API (the site client token needs
`read:assets`). It writes to `--out-file`, or to stdout when stdout is redirected or piped; it
refuses to print binary to a terminal.

```bash
marvin publish asset hero-image --download --out-file hero.jpg
marvin publish asset hero-image --download > hero.jpg
marvin publish asset hero-image --download | convert - -resize 50% hero-small.jpg
```

With `--out-file`, the command reports what it wrote; with `--json` that is
`{"ok": true, "file": "hero.jpg", "bytes": 2457600, "contentType": "image/jpeg"}`.

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `slug` | string | Unique URL-friendly identifier |
| `name` | string | Asset name |
| `mimeType` | string | MIME type (image/jpeg, video/mp4, etc.) |
| `assetType` | string | Asset type, the value `--type` filters on |
| `fileSize` | number | File size in bytes |
| `width`, `height` | number | Pixel dimensions (images and video) |
| `altText` | string | Alt text |
| `description` | string | Description |
| `publicUrl` | string | Public URL of the file |
| `metadataJson` | object | Custom metadata |
| `tags` | array | Tag slugs |

## Use Cases

```bash
# Inventory
marvin publish assets --json > assets.json

# Public URLs of all assets of one type
marvin publish assets --type image --json | jq -r '.[].publicUrl'

# Total storage in bytes
marvin publish assets --json | jq '[.[].fileSize] | add'

# Assets larger than 5 MB
marvin publish assets --json | jq -r '.[] | select(.fileSize > 5242880) | .slug'

# Images without alt text
marvin publish assets --json | jq -r '.[] | select(.mimeType | startswith("image/")) | select((.altText // "") == "") | .slug'

# Download every image
mkdir -p images
for slug in $(marvin publish assets --type image --json | jq -r '.[].slug'); do
  marvin publish asset "$slug" --download --out-file "images/$slug"
done
```

## Authentication

Requires a site client token, resolved in this order: `--site-token` / `--token` flag, the token saved
for the active workspace (`marvin workspace token`), then `MARVIN_SITE_CLIENT_TOKEN`.

```bash
export MARVIN_SITE_CLIENT_TOKEN=marvin_sk_your_token
marvin publish assets --site-token marvin_sk_your_token
```

## Related Commands

- [`marvin publish entries`](entries.md) - List published entries
- [`marvin publish resources`](resources.md) - List resources
- [`marvin platform assets`](platform-assets.md) - Manage assets (Platform API)

## API Reference

```
GET /api/publish/{workspace}/assets
GET /api/publish/{workspace}/assets/{slug}
```

See [API Mapping](../reference/api-mapping.md) for more details.
