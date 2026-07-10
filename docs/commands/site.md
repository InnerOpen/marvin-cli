# Site Configuration

Get workspace site configuration including title, tagline, logo, and other public settings.

## Command

```bash
marvin publish site [options]
```

## Description

Fetches the public site configuration for the workspace. This includes branding, metadata, and publishing settings that are exposed through the Publishing API.

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output as JSON | `false` |
| `--yaml` | Output as YAML | `false` |
| `--csv` | Output as CSV | `false` |
| `--output <format>` | Output format: table, json, yaml, csv | `table` |

## Examples

### Basic Usage

Get site configuration as a table:

```bash
marvin publish site
```

Output:

```
┌──────────────┬─────────────────────────────────────┐
│ Field        │ Value                               │
├──────────────┼─────────────────────────────────────┤
│ Title        │ My Awesome Site                     │
│ Tagline      │ Built with Marvin CMS               │
│ Description  │ A modern headless CMS solution      │
│ Logo URL     │ https://cdn.example.com/logo.png    │
│ Timezone     │ America/New_York                    │
│ Language     │ en                                  │
└──────────────┴─────────────────────────────────────┘
```

### JSON Output

Get configuration as JSON for scripting:

```bash
marvin publish site --json
```

```json
{
  "title": "My Awesome Site",
  "tagline": "Built with Marvin CMS",
  "description": "A modern headless CMS solution",
  "logoUrl": "https://cdn.example.com/logo.png",
  "timezone": "America/New_York",
  "language": "en",
  "defaultEntryType": "page"
}
```

### Extract Specific Field

Use `jq` to extract a specific field:

```bash
marvin publish site --json | jq -r '.title'
```

Output:

```
My Awesome Site
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Site title |
| `tagline` | string | Site tagline/subtitle |
| `description` | string | Site description |
| `logoUrl` | string | URL to site logo |
| `faviconUrl` | string | URL to favicon |
| `timezone` | string | Default timezone (IANA format) |
| `language` | string | Default language code (ISO 639-1) |
| `defaultEntryType` | string | Default entry type slug |

## Use Cases

### Verify Site Configuration

Check your site settings are correctly configured:

```bash
marvin publish site
```

### Build Metadata

Extract site metadata for static site generation:

```bash
# Get site title for HTML
SITE_TITLE=$(marvin publish site --json | jq -r '.title')
echo "<title>$SITE_TITLE</title>"
```

### Environment Verification

Verify you're connected to the correct workspace:

```bash
marvin publish site --json | jq -r '.title'
```

### Export Site Config

Save site configuration to a file:

```bash
marvin publish site --json > site-config.json
```

## Scripting Examples

### Shell Script

```bash
#!/bin/bash

# Get site configuration
SITE_CONFIG=$(marvin publish site --json)

# Extract fields
TITLE=$(echo $SITE_CONFIG | jq -r '.title')
TAGLINE=$(echo $SITE_CONFIG | jq -r '.tagline')

echo "Site: $TITLE"
echo "Tagline: $TAGLINE"
```

### Node.js

```javascript
const { execSync } = require('child_process');

// Get site config
const output = execSync('marvin publish site --json', { encoding: 'utf-8' });
const config = JSON.parse(output);

console.log(`Site: ${config.title}`);
console.log(`Description: ${config.description}`);
```

### Python

```python
import subprocess
import json

# Get site config
result = subprocess.run(
    ['marvin', 'publish', 'site', '--json'],
    capture_output=True,
    text=True
)

config = json.loads(result.stdout)
print(f"Site: {config['title']}")
print(f"Tagline: {config['tagline']}")
```

## Authentication

Requires a site client token. Set in environment:

```bash
export MARVIN_SITE_CLIENT_TOKEN=marvin_sk_your_token
```

Or pass via command line:

```bash
marvin publish site --site-token marvin_sk_your_token
```

## Error Handling

### 401 Unauthorized

Site client token is invalid or missing:

```bash
export MARVIN_SITE_CLIENT_TOKEN=marvin_sk_your_token
```

### 404 Not Found

Workspace doesn't exist or API URL is incorrect:

```bash
# Check workspace slug
echo $MARVIN_WORKSPACE_SLUG

# Check API URL
echo $MARVIN_API_URL
```

## Related Commands

- [`marvin publish entries`](entries.md) - List published entries
- [`marvin publish collections`](collections.md) - List collections
- [`marvin workspace info`](workspaces.md) - Get workspace details (Platform API)

## API Reference

This command calls:

```
GET /api/{workspace}/site
```

See [API Mapping](../reference/api-mapping.md) for more details.
