# Marvin CLI

Official command-line interface for [Marvin CMS](https://github.com/jmashburn/Marvin) Publishing API.

## Features

- 📊 **Table output by default** - Human-readable tables in your terminal
- 🔄 **Multiple output formats** - Table, JSON, YAML, CSV
- 🔍 **Filter and query** - Filter by entry type, collection, asset type
- 🚀 **Fast** - Direct HTTP calls to publishing API
- 🔐 **Site client tokens** - Uses publishing API (not admin API)
- 👥 **Workspace roles** - Create invitation tokens with specific roles (VIEWER, AUTHOR, EDITOR, ADMIN, OWNER)
- 🔒 **Enterprise-grade security** - Secure credential handling, no shell history exposure, token masking in CI/CD

## Security Notice

**Version 2.6.0+ includes critical security improvements:**

- Credentials are never exposed in shell history
- Tokens are automatically masked in CI/CD environments
- Input validation prevents common security vulnerabilities
- Atomic credential file writes prevent corruption

**If upgrading from an older version**, please see the [Migration Guide](MIGRATION.md) for breaking changes.

## Prerequisites

- Node.js 18+ 
- A running Marvin instance
- A site client token (get from Marvin → Settings → Publishing → Site Clients)

## Installation

### From npm (Recommended)

```bash
npm install -g @inneropen/marvin-cli
```

### From source

```bash
git clone https://github.com/inneropen/marvin-cli.git
cd marvin-cli
npm install
npm run build
npm link
```

## Authentication

The Marvin CLI supports two authentication methods:

### 1. Login (Recommended)

Store your credentials securely:

```bash
marvin login
```

You'll be prompted for your user token (input is hidden for security). The token is validated before being saved to `~/.marvin/credentials.json`.

**Benefits:**
- Token is never visible in shell history
- Automatic token validation
- Works across all commands
- Secure file permissions (0600)

### 2. Environment Variables

For CI/CD and automation:

```bash
# User authentication (Platform API)
export MARVIN_USER_TOKEN="user_..."

# Site client authentication (Publishing API)
export MARVIN_SITE_TOKEN="site_client_..."

# Workspace configuration
export MARVIN_WORKSPACE_SLUG="your-workspace"
export MARVIN_API_URL="https://marvin.example.com"
```

**Security best practices:**
- Never commit tokens to version control
- Use your CI/CD's secret management (GitHub Secrets, GitLab CI Variables)
- Rotate tokens regularly
- Use workspace-specific tokens with minimal permissions

### Setting Workspace Token

To configure a site client token for a specific workspace:

```bash
# Interactive (recommended)
marvin workspace token

# From stdin (for scripts)
echo "$SITE_TOKEN" | marvin workspace token --from-stdin

# For specific workspace
marvin workspace token --for my-workspace
```

**Note:** Tokens are automatically masked in non-TTY environments (CI/CD logs) to prevent exposure.

## Usage

### Basic Commands

```bash
# Get workspace site configuration
marvin site

# List all published entries
marvin entries

# Get a single entry
marvin entry about

# List collections
marvin collections

# Get a collection with its entries
marvin collection featured

# List entries in a collection
marvin collection-entries featured

# List all resources
marvin resources

# Get a single resource
marvin resource kuroki-s022

# Get entries that use a resource
marvin resource-entries kuroki-s022

# List all assets
marvin assets
```

### Filtering

```bash
# Filter entries by type
marvin entries --entry-type page
marvin entries --entry-type project

# Filter entries by collection
marvin entries --collection featured

# Limit results
marvin entries --limit 10

# Filter assets by MIME type
marvin assets --type image
marvin assets --type video
```

### Output Formats

The CLI supports four output formats:

#### Table (default)

```bash
marvin entries
```

Output:
```
┌───────────────┬─────────┬─────────┬───────────┬────────────┐
│ Title         │ Slug    │ Type    │ Status    │ Published  │
├───────────────┼─────────┼─────────┼───────────┼────────────┤
│ About Us      │ about   │ page    │ published │ 2026-07-01 │
│ Contact       │ contact │ page    │ published │ 2026-07-02 │
└───────────────┴─────────┴─────────┴───────────┴────────────┘
```

#### JSON

```bash
marvin entries --json
# or
marvin entries --output json
```

Output:
```json
[
  {
    "slug": "about",
    "title": "About Us",
    "entryType": "page",
    "status": "published",
    "publishedAt": "2026-07-01T12:00:00Z"
  }
]
```

#### YAML

```bash
marvin collections --yaml
```

Output:
```yaml
- slug: featured
  name: Featured Projects
  description: Our best work
  entryCount: 5
```

#### CSV

```bash
marvin resources --csv > resources.csv
```

Output:
```csv
Name,Slug,Type,Description,URL
Kuroki S022 Denim,kuroki-s022,fabric,Premium Japanese selvedge,https://kuroki.com
```

### Command-Line Options

Global options (use before the command):

```bash
marvin --help                    # Show help
marvin --version                 # Show version
marvin --api-url <url>           # Override MARVIN_API_URL
marvin --token <token>           # Override MARVIN_SITE_CLIENT_TOKEN
marvin --workspace <slug>        # Override MARVIN_WORKSPACE_SLUG
marvin --output <format>         # Set output format (table, json, yaml, csv)
marvin --json                    # Shortcut for --output json
marvin --yaml                    # Shortcut for --output yaml
marvin --csv                     # Shortcut for --output csv
```

**Example:**

```bash
# Use a different workspace
marvin --workspace other-workspace entries

# Output as JSON
marvin entries --json

# Override API URL and output CSV
marvin --api-url https://marvin.example.com assets --csv
```

## Commands Reference

### Site

```bash
marvin site [--json|--yaml]
```

Fetch workspace site configuration (title, tagline, logo, etc.).

### Entries

```bash
marvin entries [options]
```

**Options:**
- `--entry-type <slug>` - Filter by entry type (e.g., `page`, `project`)
- `--collection <slug>` - Filter by collection
- `--limit <number>` - Limit results

**Examples:**
```bash
marvin entries                          # All entries
marvin entries --entry-type page        # Only pages
marvin entries --collection featured    # Entries in "featured" collection
marvin entries --limit 5                # First 5 entries
```

### Entry

```bash
marvin entry <slug>
```

Fetch a single entry by slug.

### Collections

```bash
marvin collections
```

List all collections with entry counts.

### Collection

```bash
marvin collection <slug>
```

Fetch a single collection with metadata.

### Collection Entries

```bash
marvin collection-entries <slug>
```

List all entries in a collection.

### Resources

```bash
marvin resources
```

List all resources (fabrics, tools, suppliers, etc.).

### Resource

```bash
marvin resource <slug>
```

Fetch a single resource by slug.

### Resource Entries

```bash
marvin resource-entries <slug>
```

List all entries that reference a resource.

### Assets

```bash
marvin assets [options]
```

**Options:**
- `--type <type>` - Filter by MIME type prefix (e.g., `image`, `video`, `audio`)
- `--limit <number>` - Limit results

**Examples:**
```bash
marvin assets                # All assets
marvin assets --type image   # Only images
marvin assets --type video   # Only videos
```

## Scripting Examples

### Export all entries to JSON

```bash
marvin entries --json > entries.json
```

### Get entry count

```bash
marvin entries --json | jq 'length'
```

### Export resources to CSV for spreadsheet

```bash
marvin resources --csv > resources.csv
```

### Check if a specific entry exists

```bash
if marvin entry about --json > /dev/null 2>&1; then
  echo "About page exists"
else
  echo "About page not found"
fi
```

### List all image assets

```bash
marvin assets --type image --json | jq -r '.[].name'
```

## Security Features

### Credential Protection

**No Shell History Exposure:**
- Passwords and tokens are entered via secure prompts (hidden input)
- No credential flags on command line
- No exposure in `ps aux` or process listings

**Token Masking:**
- Tokens automatically masked in CI/CD environments
- Full tokens shown only in interactive terminals (TTY)
- Format: `site****xyz` (first/last 4 characters)

**Atomic Credential Writes:**
- Credentials file protected by atomic rename operations
- No corruption on crash or interrupt (Ctrl+C)
- Secure permissions: directory 0700, file 0600

### Input Validation

**Path Validation:**
- Files validated before reading
- Warnings for sensitive paths (SSH keys, credentials, etc.)
- Protection against reading from `/etc/`, `~/.ssh/`, `~/.aws/`

**URL Validation:**
- API URLs validated for protocol (http/https only)
- Warnings for HTTP on non-localhost
- Warnings for private IP ranges (SSRF prevention)

**Data Validation:**
- JSON objects validated before API calls
- Email addresses validated (RFC 5322)
- Positive integers validated with explicit radix

### Error Handling

- Graceful shutdown (no data loss)
- No `process.exit(1)` mid-operation
- Cleanup handlers execute properly
- Clear error messages with suggestions

## Troubleshooting

### "MARVIN_API_URL is required"

Make sure you've configured authentication:

```bash
# Option 1: Login
marvin login

# Option 2: Environment variables
export MARVIN_API_URL=https://marvin.example.com
```

### "401 Unauthorized"

Your token is invalid or expired:

```bash
# Re-authenticate
marvin login

# Or generate new token in Marvin UI:
# Settings → Publishing → Site Clients
```

**Note:** The login command validates tokens before saving (v2.6.0+), so you'll know immediately if a token is invalid.

### "User token is required for Platform API"

You need to authenticate for Platform API commands:

```bash
# Option 1: Save credentials
marvin login

# Option 2: Environment variable
export MARVIN_USER_TOKEN="user_..."
marvin platform entries list
```

**Note:** The `--user-token` flag has been removed for security reasons (v2.6.0+). Use environment variables or saved credentials instead.

### "404 Not Found"

Check that:
- Your `MARVIN_API_URL` is correct
- The Marvin server is running
- The workspace slug is correct
- The entry/collection/resource slug exists

### "Command not found: marvin"

Install globally:

```bash
npm install -g @inneropen/marvin-cli
```

Or if using from source:

```bash
npm link
```

### Build Errors

Make sure you're using Node.js 18+:

```bash
node --version  # Should be v18 or higher
```

Reinstall dependencies:

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Security Warnings

**"Warning: Reading from sensitive path"**

You're reading from a potentially sensitive file (e.g., SSH key, credentials). This is usually unintentional.

```bash
# If intentional, proceed
# If not, check your --file path
marvin platform entries create --file ~/correct/path.json
```

**"Warning: Using HTTP (not HTTPS)"**

You're connecting to a non-localhost server over HTTP:

```bash
# Use HTTPS for production
marvin --api-url https://marvin.example.com entries list

# HTTP is OK for localhost
marvin --api-url http://localhost:8000 entries list
```

**"Warning: API URL points to private IP range"**

You're connecting to a private IP address. This is usually intentional for internal services, but could indicate SSRF risk:

```bash
# If this is your internal Marvin server, this is OK
# If unexpected, verify the URL
marvin --api-url https://marvin.internal.company.com entries list
```

## Development

### Run without building

```bash
npm start -- entries --json
```

### Watch mode

```bash
npm run dev
```

Then in another terminal:

```bash
marvin entries
```

### Run tests

```bash
npm test
```

## Architecture

This CLI uses:
- **Commander.js** - CLI framework
- **Native fetch** - HTTP requests to Marvin API
- **dotenv** - Environment configuration
- **TypeScript** - Type safety

The CLI is a thin wrapper around the Marvin Publishing API. It does NOT:
- Import the Python backend
- Start the FastAPI server
- Access the database directly
- Require admin authentication

It ONLY makes HTTP calls to the Publishing API endpoints using site client tokens.

## Related Documentation

- [Migration Guide](MIGRATION.md) - Upgrading from older versions
- [Security Best Practices](SECURITY.md) - Security features and recommendations
- [Marvin SDK](https://github.com/inneropen/marvin-sdk) - TypeScript SDK for Astro/Next.js sites
- [Marvin CMS](https://github.com/jmashburn/Marvin) - Main CMS repository

## Contributing

We welcome contributions! Please see our [Contributing Guide](docs/contributing.md) for details.

## License

MIT License - See main Marvin repository for details.
