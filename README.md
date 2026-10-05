# Marvin CLI

[![npm version](https://img.shields.io/npm/v/@inneropen/marvin-cli)](https://www.npmjs.com/package/@inneropen/marvin-cli)
[![Test](https://github.com/inneropen/marvin-cli/actions/workflows/test.yml/badge.svg?branch=develop)](https://github.com/inneropen/marvin-cli/actions/workflows/test.yml)
[![npm downloads](https://img.shields.io/npm/dm/@inneropen/marvin-cli)](https://www.npmjs.com/package/@inneropen/marvin-cli)
[![license](https://img.shields.io/npm/l/@inneropen/marvin-cli)](./LICENSE)

Official command-line interface for [Marvin CMS](https://github.com/jmashburn/Marvin): read published content through the Publishing API and manage workspaces through the Platform API.

## Features

- 📊 **Table output by default** - Human-readable tables in your terminal
- 🔄 **Multiple output formats** - Table, JSON, YAML, CSV
- 🔍 **Filter and query** - Filter by entry type, collection, asset type
- 🎨 **Renderer inspection** - View entry type renderers and capabilities
- 🚀 **Fast** - Direct HTTP calls through the Marvin SDK
- 🔐 **Two token types** - Site client tokens for the Publishing API, user tokens for workspace management
- 🧰 **Script-safe** - Data on stdout, messages on stderr; every write command has a JSON result
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
export MARVIN_SITE_CLIENT_TOKEN="site_client_..."

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

The CLI has three families of commands, one per API:

| Group | API | Auth | What it's for |
|---|---|---|---|
| `marvin publish …` | Publishing API (read-only) | site client token | What a site renders: site config, published entries, collections, resources, assets |
| `marvin platform …`, `marvin workspace …`, `marvin user …` | Platform API | user token (`marvin login`) | Managing a workspace: content, structure, webhooks, secrets, workflows, integrations… |
| `marvin admin …` | Platform API, admin routes | user token with SUPER_ADMIN | Instance administration: users, groups, backups, maintenance |

`marvin system health` and `marvin system version` need no token. Commands whose group you can't use
(no site token, or no user token) are hidden from `marvin --help`. Every command takes `--help`, and a
command that needs a workspace role says so in its help text, e.g. "(needs workspace ADMIN)".

### Publishing API

```bash
marvin publish site                          # workspace site configuration
marvin publish entries                       # published entries
marvin publish entries --entry-type page     # …of one entry type
marvin publish entries --collection featured --limit 10
marvin publish entry about                   # one entry by slug
marvin publish collections                   # collections
marvin publish collection featured           # one collection
marvin publish collection-entries featured   # its entries, in order
marvin publish resources                     # resources
marvin publish resource kuroki-s022          # one resource
marvin publish resource-entries kuroki-s022  # entries that use it
marvin publish assets --type image           # assets, filtered by type
marvin publish asset hero-image              # one asset
marvin publish renderers                     # renderers the workspace needs
```

### Platform API (workspace management)

```bash
marvin login                                 # save your user token (prompted, hidden)
marvin workspace list                        # workspaces you belong to
marvin workspace use my-site                 # set the active workspace

marvin platform entries list
marvin platform entries create --data @entry.json
marvin platform entries update <id> --data '{"title":"New title"}'
marvin platform collections list
marvin platform webhooks list --all          # every page
marvin platform secrets create --name "Mailgun key" --value-stdin < key.txt
marvin platform event-log list --limit 20
marvin workspace export --out-file workspace.json
```

`marvin platform --help` lists every group: entries, collections, resources, assets, entry-types,
forms, webhooks, invites, api-clients, workspace-members, variables, secrets, email templates and
subscriptions, scheduled tasks, the event log, and AI (providers, models, operations, settings).

### Admin (SUPER_ADMIN)

```bash
marvin admin users list
marvin admin groups list --all
marvin admin backups list
marvin admin maintenance summary
```

### Request bodies: `--data`

Write commands take their JSON body with `--data`:

```bash
marvin platform entries create --data '{"title":"Hello","entryType":"page"}'   # inline
marvin platform entries create --data @entry.json                              # from a file
cat entry.json | marvin platform entries create --data -                       # from stdin
cat entry.json | marvin platform entries create                                # piped stdin also works
```

`--file <path>` is the same as `--data @path`. The old `--json '<payload>'` spelling still works in
3.x with a deprecation warning and is **removed in 4.0** (see [MIGRATION.md](MIGRATION.md)).

### Output formats

Every command takes `--output table|json|yaml|csv` (or the `--json`, `--yaml`, `--csv` shortcuts).
Table is the default.

```bash
marvin publish entries                   # table
marvin publish entries --json            # JSON
marvin publish collections --yaml        # YAML
marvin publish resources --csv > resources.csv
```

**stdout carries data only.** Confirmations ("✓ Created…"), progress and warnings go to stderr, so
`--json | jq` always gets clean JSON. In JSON/YAML/CSV mode:

- create/update commands print the created or updated resource;
- delete, remove and revoke commands print `{"deleted": "<id>"}`;
- run, test, rerun and import commands print `{"ok": true, …}` with whatever the server returned;
- errors print `{"error": "…", "status": 403, …}` and exit with code 1.

```bash
id=$(marvin platform entries create --data @entry.json --json | jq -r .id)
marvin platform entries delete "$id" --yes --json      # {"deleted": "<id>"}
```

### Global options

```bash
marvin --help                    # show help
marvin --version                 # show version
marvin --api-url <url>           # override MARVIN_API_URL
marvin --workspace <slug>        # override the active workspace / MARVIN_WORKSPACE_SLUG
marvin --output <format>         # table, json, yaml, csv
marvin --json | --yaml | --csv   # shortcuts for --output
marvin publish --site-token <t>  # site token for one publish command (alias: --token)
```

Global options can go before or after the command: `marvin --json publish entries` and
`marvin publish entries --json` are the same.

## Scripting Examples

```bash
# Export all published entries
marvin publish entries --json > entries.json

# Count them
marvin publish entries --json | jq 'length'

# Does an entry exist?
if marvin publish entry about --json > /dev/null 2>&1; then echo "exists"; fi

# Names of all image assets
marvin publish assets --type image --json | jq -r '.[].name'

# Every webhook, across all pages
marvin platform webhooks list --all --json | jq -r '.[].name'
```

See [docs/guides/scripting.md](docs/guides/scripting.md) for more.

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
marvin --api-url https://marvin.example.com publish entries

# HTTP is OK for localhost
marvin --api-url http://localhost:8000 publish entries
```

**"Warning: API URL points to private IP range"**

You're connecting to a private IP address. This is usually intentional for internal services, but could indicate SSRF risk:

```bash
# If this is your internal Marvin server, this is OK
# If unexpected, verify the URL
marvin --api-url https://marvin.internal.company.com publish entries
```

## Development

### Run without building

```bash
npm start -- publish entries --json
```

### Watch mode

```bash
npm run dev
```

Then in another terminal:

```bash
marvin publish entries
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

The CLI is a thin wrapper around the Marvin API, through [`@inneropen/marvin-sdk`](https://www.npmjs.com/package/@inneropen/marvin-sdk). It does NOT:
- Import the Python backend
- Start the FastAPI server
- Access the database directly

It only makes HTTP calls: Publishing API endpoints with a site client token, Platform API
endpoints with a user token.

## Related Documentation

- [Migration Guide](MIGRATION.md) - Upgrading from older versions
- [Security Best Practices](SECURITY.md) - Security features and recommendations
- [Marvin SDK](https://github.com/inneropen/marvin-sdk) - TypeScript SDK for Astro/Next.js sites
- [Marvin CMS](https://github.com/jmashburn/Marvin) - Main CMS repository

## Contributing

We welcome contributions! Please see our [Contributing Guide](docs/contributing.md) for details.

## License

MIT License - See main Marvin repository for details.
