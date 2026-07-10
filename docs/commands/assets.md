# Assets

List and retrieve assets from your Marvin workspace.

## Command

```bash
marvin publish assets [options]
```

## Description

Assets are media files uploaded to Marvin such as images, videos, documents, and other files. The assets command lists all published assets with optional filtering by MIME type.

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--type <type>` | Filter by MIME type prefix (image, video, audio, etc.) | All types |
| `--limit <number>` | Limit number of results | All assets |
| `--json` | Output as JSON | `false` |
| `--yaml` | Output as YAML | `false` |
| `--csv` | Output as CSV | `false` |
| `--output <format>` | Output format: table, json, yaml, csv | `table` |

## Examples

### Basic Usage

List all assets:

```bash
marvin publish assets
```

Output:

```
┌────────────────────────┬──────────────────┬────────────┬────────────┬──────────────────────────────────┐
│ Name                   │ Type             │ Size       │ Uploaded   │ URL                              │
├────────────────────────┼──────────────────┼────────────┼────────────┼──────────────────────────────────┤
│ hero-image.jpg         │ image/jpeg       │ 2.4 MB     │ 2026-07-01 │ https://cdn.example.com/hero.jpg │
│ product-demo.mp4       │ video/mp4        │ 15.2 MB    │ 2026-07-02 │ https://cdn.example.com/demo.mp4 │
│ fabric-texture.png     │ image/png        │ 1.8 MB     │ 2026-06-28 │ https://cdn.example.com/tex.png  │
│ process-guide.pdf      │ application/pdf  │ 850 KB     │ 2026-06-25 │ https://cdn.example.com/guide.pdf│
└────────────────────────┴──────────────────┴────────────┴────────────┴──────────────────────────────────┘
```

### Filtering by Type

Filter by MIME type prefix:

```bash
# Images only
marvin publish assets --type image

# Videos only
marvin publish assets --type video

# PDFs only
marvin publish assets --type application/pdf

# Audio files
marvin publish assets --type audio
```

Output (images):

```
┌────────────────────┬──────────────┬──────────┬────────────┬──────────────────────────────────┐
│ Name               │ Type         │ Size     │ Uploaded   │ URL                              │
├────────────────────┼──────────────┼──────────┼────────────┼──────────────────────────────────┤
│ hero-image.jpg     │ image/jpeg   │ 2.4 MB   │ 2026-07-01 │ https://cdn.example.com/hero.jpg │
│ fabric-texture.png │ image/png    │ 1.8 MB   │ 2026-06-28 │ https://cdn.example.com/tex.png  │
│ logo.svg           │ image/svg+xml│ 12 KB    │ 2026-06-20 │ https://cdn.example.com/logo.svg │
└────────────────────┴──────────────┴──────────┴────────────┴──────────────────────────────────┘
```

### Limit Results

Limit the number of assets returned:

```bash
marvin publish assets --limit 10
marvin publish assets --type image --limit 5
```

### JSON Output

Get assets as JSON:

```bash
marvin publish assets --json
```

```json
[
  {
    "id": "ast_1a2b3c4d",
    "name": "hero-image.jpg",
    "filename": "hero-image.jpg",
    "mimeType": "image/jpeg",
    "size": 2457600,
    "width": 1920,
    "height": 1080,
    "url": "https://cdn.example.com/hero-image.jpg",
    "thumbnailUrl": "https://cdn.example.com/hero-image-thumb.jpg",
    "uploadedAt": "2026-07-01T10:30:00Z",
    "metadata": {
      "alt": "Hero image for homepage",
      "caption": "Our flagship product"
    }
  },
  {
    "id": "ast_2b3c4d5e",
    "name": "product-demo.mp4",
    "filename": "product-demo.mp4",
    "mimeType": "video/mp4",
    "size": 15932416,
    "duration": 120,
    "url": "https://cdn.example.com/product-demo.mp4",
    "thumbnailUrl": "https://cdn.example.com/product-demo-thumb.jpg",
    "uploadedAt": "2026-07-02T14:15:00Z",
    "metadata": {
      "title": "Product demonstration video"
    }
  }
]
```

Filter images as JSON:

```bash
marvin publish assets --type image --json
```

```json
[
  {
    "id": "ast_1a2b3c4d",
    "name": "hero-image.jpg",
    "filename": "hero-image.jpg",
    "mimeType": "image/jpeg",
    "size": 2457600,
    "width": 1920,
    "height": 1080,
    "url": "https://cdn.example.com/hero-image.jpg",
    "thumbnailUrl": "https://cdn.example.com/hero-image-thumb.jpg",
    "uploadedAt": "2026-07-01T10:30:00Z",
    "metadata": {
      "alt": "Hero image for homepage",
      "caption": "Our flagship product"
    }
  }
]
```

### YAML Output

Export assets as YAML:

```bash
marvin publish assets --type image --yaml
```

```yaml
- id: ast_1a2b3c4d
  name: hero-image.jpg
  filename: hero-image.jpg
  mimeType: image/jpeg
  size: 2457600
  width: 1920
  height: 1080
  url: https://cdn.example.com/hero-image.jpg
  thumbnailUrl: https://cdn.example.com/hero-image-thumb.jpg
  uploadedAt: 2026-07-01T10:30:00Z
  metadata:
    alt: Hero image for homepage
    caption: Our flagship product
```

### CSV Output

Export assets to CSV:

```bash
marvin publish assets --csv > assets.csv
```

Output:

```csv
Name,Type,Size,URL,Uploaded
hero-image.jpg,image/jpeg,2457600,https://cdn.example.com/hero-image.jpg,2026-07-01T10:30:00Z
product-demo.mp4,video/mp4,15932416,https://cdn.example.com/product-demo.mp4,2026-07-02T14:15:00Z
fabric-texture.png,image/png,1887436,https://cdn.example.com/fabric-texture.png,2026-06-28T08:00:00Z
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique asset identifier |
| `name` | string | Asset display name |
| `filename` | string | Original filename |
| `mimeType` | string | MIME type (image/jpeg, video/mp4, etc.) |
| `size` | number | File size in bytes |
| `width` | number | Image/video width in pixels (media only) |
| `height` | number | Image/video height in pixels (media only) |
| `duration` | number | Video/audio duration in seconds (media only) |
| `url` | string | Public URL to access the asset |
| `thumbnailUrl` | string | Thumbnail URL (for images/videos) |
| `uploadedAt` | string | ISO 8601 timestamp of upload |
| `metadata` | object | Custom metadata (alt text, captions, etc.) |

## Use Cases

### Export All Assets

Export asset list for inventory:

```bash
marvin publish assets --json > assets.json
```

### Count Assets by Type

Count assets grouped by MIME type:

```bash
marvin publish assets --json | jq 'group_by(.mimeType) | map({type: .[0].mimeType, count: length})'
```

Output:

```json
[
  { "type": "image/jpeg", "count": 24 },
  { "type": "image/png", "count": 12 },
  { "type": "video/mp4", "count": 5 },
  { "type": "application/pdf", "count": 8 }
]
```

### Total Storage Used

Calculate total storage used by all assets:

```bash
marvin publish assets --json | jq '[.[].size] | add'
```

Output:

```
45678912
```

In human-readable format:

```bash
marvin publish assets --json | jq '[.[].size] | add / 1024 / 1024 | floor | "\(.) MB"'
```

Output:

```
"43 MB"
```

### List Image URLs

Get all image URLs for a gallery:

```bash
marvin publish assets --type image --json | jq -r '.[].url'
```

Output:

```
https://cdn.example.com/hero-image.jpg
https://cdn.example.com/fabric-texture.png
https://cdn.example.com/logo.svg
https://cdn.example.com/product-1.jpg
```

### Find Large Assets

Find assets larger than 5MB:

```bash
marvin publish assets --json | jq '.[] | select(.size > 5242880) | {name, size, type: .mimeType}'
```

Output:

```json
{
  "name": "product-demo.mp4",
  "size": 15932416,
  "type": "video/mp4"
}
```

### Generate Image Gallery

Create an HTML image gallery:

```bash
marvin publish assets --type image --json | jq -r '.[] | "<img src=\"\(.url)\" alt=\"\(.metadata.alt)\" />"'
```

Output:

```html
<img src="https://cdn.example.com/hero-image.jpg" alt="Hero image for homepage" />
<img src="https://cdn.example.com/fabric-texture.png" alt="Japanese selvedge denim texture" />
<img src="https://cdn.example.com/logo.svg" alt="Company logo" />
```

### Download All Images

Download all images to a local directory:

```bash
#!/bin/bash

marvin publish assets --type image --json | jq -r '.[] | "\(.url) \(.filename)"' | while read -r url filename; do
  curl -o "images/$filename" "$url"
  echo "Downloaded: $filename"
done
```

## Scripting Examples

### Bash Script

```bash
#!/bin/bash

# Get all assets
ASSETS=$(marvin publish assets --json)

# Count by type
echo "Assets by type:"
echo "$ASSETS" | jq -r 'group_by(.mimeType) | .[] | "\(.[0].mimeType): \(length)"'

# Calculate total size
TOTAL_SIZE=$(echo "$ASSETS" | jq '[.[].size] | add')
TOTAL_MB=$(echo "scale=2; $TOTAL_SIZE / 1024 / 1024" | bc)

echo ""
echo "Total storage: ${TOTAL_MB} MB"

# List largest assets
echo ""
echo "Top 5 largest assets:"
echo "$ASSETS" | jq -r 'sort_by(.size) | reverse | .[0:5] | .[] | "\(.name): \(.size / 1024 / 1024 | floor) MB"'
```

### Node.js

```javascript
const { execSync } = require('child_process');
const fs = require('fs');

// Get all assets
const assets = JSON.parse(
  execSync('marvin publish assets --json', { encoding: 'utf-8' })
);

console.log(`Total assets: ${assets.length}\n`);

// Group by type
const byType = assets.reduce((acc, asset) => {
  const type = asset.mimeType.split('/')[0]; // image, video, etc.
  if (!acc[type]) acc[type] = [];
  acc[type].push(asset);
  return acc;
}, {});

console.log('Assets by type:');
Object.entries(byType).forEach(([type, items]) => {
  const totalSize = items.reduce((sum, item) => sum + item.size, 0);
  const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
  console.log(`  ${type}: ${items.length} files (${sizeMB} MB)`);
});

// Get only images
const images = JSON.parse(
  execSync('marvin publish assets --type image --json', { encoding: 'utf-8' })
);

// Generate image manifest
const manifest = images.map(img => ({
  url: img.url,
  alt: img.metadata?.alt || img.name,
  width: img.width,
  height: img.height
}));

fs.writeFileSync('image-manifest.json', JSON.stringify(manifest, null, 2));
console.log(`\nGenerated manifest for ${images.length} images`);
```

### Python

```python
import subprocess
import json
from collections import defaultdict

# Get all assets
result = subprocess.run(
    ['marvin', 'publish', 'assets', '--json'],
    capture_output=True,
    text=True
)

assets = json.loads(result.stdout)

print(f"Total assets: {len(assets)}\n")

# Group by MIME type
by_type = defaultdict(list)
for asset in assets:
    mime_type = asset['mimeType']
    by_type[mime_type].append(asset)

print("Assets by MIME type:")
for mime_type, items in sorted(by_type.items()):
    total_size = sum(item['size'] for item in items)
    size_mb = total_size / 1024 / 1024
    print(f"  {mime_type}: {len(items)} files ({size_mb:.2f} MB)")

# Calculate statistics
total_size = sum(asset['size'] for asset in assets)
avg_size = total_size / len(assets) if assets else 0

print(f"\nTotal storage: {total_size / 1024 / 1024:.2f} MB")
print(f"Average file size: {avg_size / 1024:.2f} KB")

# Get images only
result = subprocess.run(
    ['marvin', 'publish', 'assets', '--type', 'image', '--json'],
    capture_output=True,
    text=True
)

images = json.loads(result.stdout)

print(f"\nImages: {len(images)}")
if images:
    avg_width = sum(img.get('width', 0) for img in images) / len(images)
    avg_height = sum(img.get('height', 0) for img in images) / len(images)
    print(f"Average dimensions: {avg_width:.0f}x{avg_height:.0f}px")
```

### Static Site Generation

```javascript
// scripts/fetch-assets.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Fetch all assets
const assets = JSON.parse(
  execSync('marvin publish assets --json', { encoding: 'utf-8' })
);

// Create output directory
const outputDir = 'src/data/assets';
fs.mkdirSync(outputDir, { recursive: true });

// Save all assets
fs.writeFileSync(
  path.join(outputDir, 'all.json'),
  JSON.stringify(assets, null, 2)
);

// Group by type
const byType = {
  images: [],
  videos: [],
  documents: [],
  other: []
};

assets.forEach(asset => {
  if (asset.mimeType.startsWith('image/')) {
    byType.images.push(asset);
  } else if (asset.mimeType.startsWith('video/')) {
    byType.videos.push(asset);
  } else if (asset.mimeType.includes('pdf') || asset.mimeType.includes('document')) {
    byType.documents.push(asset);
  } else {
    byType.other.push(asset);
  }
});

// Save grouped assets
Object.entries(byType).forEach(([type, items]) => {
  fs.writeFileSync(
    path.join(outputDir, `${type}.json`),
    JSON.stringify(items, null, 2)
  );
  console.log(`Saved ${items.length} ${type}`);
});

// Generate image srcset data
const imageSrcsets = byType.images.map(img => ({
  url: img.url,
  width: img.width,
  height: img.height,
  alt: img.metadata?.alt || img.name,
  thumbnail: img.thumbnailUrl
}));

fs.writeFileSync(
  path.join(outputDir, 'image-srcsets.json'),
  JSON.stringify(imageSrcsets, null, 2)
);

console.log(`\nFetched ${assets.length} total assets`);
```

## Authentication

Requires a site client token. Set in environment:

```bash
export MARVIN_SITE_CLIENT_TOKEN=marvin_sk_your_token
```

Or pass via command line:

```bash
marvin publish assets --site-token marvin_sk_your_token
```

## Error Handling

### 401 Unauthorized

Site client token is invalid or missing:

```bash
export MARVIN_SITE_CLIENT_TOKEN=marvin_sk_your_token
```

### No Assets Found

No assets exist or none match the filter:

```bash
marvin publish assets --json
# Returns: []
```

Check if filter is too restrictive:

```bash
# List all types available
marvin publish assets --json | jq -r '.[].mimeType' | sort -u
```

### Connection Error

Cannot reach Marvin API:

```bash
# Check API URL
echo $MARVIN_API_URL

# Test connection
curl $MARVIN_API_URL/api/health
```

## Related Commands

- [`marvin publish entries`](entries.md) - List entries
- [`marvin publish entry <slug>`](entries.md) - Get entry with embedded assets
- [`marvin publish site`](site.md) - Get site configuration (includes logo/favicon)

## API Reference

This command calls:

```
GET /api/{workspace}/assets
```

Query parameters:
- `type` - Filter by MIME type prefix (e.g., `image`, `video`)
- `limit` - Limit number of results

See [API Mapping](../reference/api-mapping.md) for more details.
