# Environment Variables

Complete reference for all environment variables supported by the Marvin CLI.

## Core Variables

### MARVIN_API_URL

**Description:** URL of your Marvin instance

**Required:** Yes

**Format:** Full URL with protocol

**Examples:**
```bash
# Local development
MARVIN_API_URL=http://localhost:8000

# Docker
MARVIN_API_URL=http://marvin:8000

# Production
MARVIN_API_URL=https://api.example.com

# Custom port
MARVIN_API_URL=https://marvin.example.com:3000
```

**Default:** None (must be set)

**Override:** `--api-url <url>`

---

### MARVIN_WORKSPACE_SLUG

**Description:** Workspace slug to use

**Required:** Yes

**Format:** Lowercase alphanumeric with hyphens

**Examples:**
```bash
MARVIN_WORKSPACE_SLUG=my-workspace
MARVIN_WORKSPACE_SLUG=production
MARVIN_WORKSPACE_SLUG=acme-corp
```

**Default:** None (must be set)

**Override:** `--workspace <slug>`

---

## Authentication Variables

### MARVIN_SITE_CLIENT_TOKEN

**Description:** Site client token for Publishing API

**Required:** For Publishing API commands

**Format:** `marvin_sk_<random_string>`

**Example:**
```bash
MARVIN_SITE_CLIENT_TOKEN=marvin_sk_1234567890abcdef
```

**Used by:**
- `marvin publish *` commands

**Override:** `--site-token <token>`

---

### MARVIN_EMAIL

**Description:** User email for authentication

**Required:** Optional (for non-interactive login)

**Example:**
```bash
MARVIN_EMAIL=user@example.com
```

**Used by:**
- `marvin auth login` (if not provided, prompts)

**Security:** Avoid in production, use API client instead

---

### MARVIN_PASSWORD

**Description:** User password for authentication

**Required:** Optional (for non-interactive login)

**Example:**
```bash
MARVIN_PASSWORD=mypassword
```

**Used by:**
- `marvin auth login` (if not provided, prompts)

**Security:** ⚠️ Never hardcode or commit to version control

---

### MARVIN_API_CLIENT_ID

**Description:** API client ID for programmatic access

**Required:** For Platform API automation

**Example:**
```bash
MARVIN_API_CLIENT_ID=client_abc123
```

**Used by:**
- `marvin platform *` commands (when set, no login needed)

---

### MARVIN_API_CLIENT_SECRET

**Description:** API client secret

**Required:** With MARVIN_API_CLIENT_ID

**Example:**
```bash
MARVIN_API_CLIENT_SECRET=secret_xyz789
```

**Used by:**
- `marvin platform *` commands

**Security:** Store securely, rotate regularly

---

### MARVIN_ADMIN_TOKEN

**Description:** Admin token for system operations

**Required:** For Admin API commands

**Example:**
```bash
MARVIN_ADMIN_TOKEN=admin_token_123
```

**Used by:**
- `marvin admin *` commands

**Security:** ⚠️ Extreme caution - full system access

---

## Output Variables

### MARVIN_OUTPUT_FORMAT

**Description:** Default output format

**Required:** No

**Values:** `table`, `json`, `yaml`, `csv`

**Example:**
```bash
MARVIN_OUTPUT_FORMAT=json
```

**Default:** `table`

**Override:** `--output <format>`, `--json`, `--yaml`, `--csv`

---

## Connection Variables

### MARVIN_TIMEOUT

**Description:** Request timeout in milliseconds

**Required:** No

**Format:** Integer (milliseconds)

**Example:**
```bash
MARVIN_TIMEOUT=30000  # 30 seconds
```

**Default:** `30000` (30 seconds)

**Override:** `--timeout <ms>`

---

### MARVIN_INSECURE

**Description:** Disable SSL certificate verification

**Required:** No

**Values:** `true`, `false`

**Example:**
```bash
MARVIN_INSECURE=true  # Development only!
```

**Default:** `false`

**Security:** ⚠️ Never use in production

---

## Debug Variables

### MARVIN_DEBUG

**Description:** Enable debug logging

**Required:** No

**Values:** `true`, `false`

**Example:**
```bash
MARVIN_DEBUG=true
```

**Default:** `false`

**Output includes:**
- HTTP requests/responses
- Authentication flow
- API endpoints
- Response times

---

### DEBUG

**Description:** Enable detailed debug output (npm debug module)

**Required:** No

**Values:** Namespace pattern

**Examples:**
```bash
# All marvin debug output
DEBUG=marvin:*

# Specific modules
DEBUG=marvin:api,marvin:auth

# All debug output
DEBUG=*
```

---

## Configuration Files

### .env File

Load variables from a `.env` file:

```bash
# .env
MARVIN_API_URL=https://api.example.com
MARVIN_WORKSPACE_SLUG=production
MARVIN_SITE_CLIENT_TOKEN=marvin_sk_token
MARVIN_OUTPUT_FORMAT=json
```

The CLI automatically loads `.env` from the current directory.

### Multiple .env Files

Use different files for different environments:

```bash
# .env.development
MARVIN_API_URL=http://localhost:8000
MARVIN_WORKSPACE_SLUG=dev

# .env.staging
MARVIN_API_URL=https://staging.example.com
MARVIN_WORKSPACE_SLUG=staging

# .env.production
MARVIN_API_URL=https://api.example.com
MARVIN_WORKSPACE_SLUG=production
```

Load specific file:

```bash
# Using dotenv-cli
dotenv -e .env.staging -- marvin publish entries

# Or manually
export $(cat .env.staging | grep -v '^#' | xargs)
marvin publish entries
```

---

## Variable Priority

Variables are resolved in this order (highest priority first):

1. **Command-line flags** - `--api-url`, `--workspace`, etc.
2. **Environment variables** - Exported in shell
3. **`.env` file** - In current directory
4. **Default values** - Built-in defaults

Example:

```bash
# .env file
MARVIN_API_URL=http://localhost:8000

# Environment variable (overrides .env)
export MARVIN_API_URL=https://staging.example.com

# Command-line flag (overrides everything)
marvin --api-url https://api.example.com publish entries
# Uses: https://api.example.com
```

---

## Setting Variables

### Shell Export

```bash
# Single session
export MARVIN_API_URL=https://api.example.com
export MARVIN_SITE_CLIENT_TOKEN=marvin_sk_token

# Verify
echo $MARVIN_API_URL
```

### Shell Profile

Add to `~/.bashrc`, `~/.zshrc`, or `~/.profile`:

```bash
# Marvin CLI configuration
export MARVIN_API_URL=https://api.example.com
export MARVIN_WORKSPACE_SLUG=my-workspace
export MARVIN_SITE_CLIENT_TOKEN=marvin_sk_token
```

Reload:

```bash
source ~/.bashrc
```

### Per-Command

```bash
# Inline environment
MARVIN_OUTPUT_FORMAT=json marvin publish entries

# Multiple variables
MARVIN_API_URL=https://staging.example.com \
MARVIN_WORKSPACE_SLUG=staging \
marvin publish entries
```

---

## Security Best Practices

### 1. Never Commit Credentials

```bash
# .gitignore
.env
.env.*
!.env.example
```

### 2. Use .env.example

Create a template without secrets:

```bash
# .env.example
MARVIN_API_URL=http://localhost:8000
MARVIN_WORKSPACE_SLUG=your-workspace-slug
MARVIN_SITE_CLIENT_TOKEN=marvin_sk_your_token_here
```

### 3. Restrict File Permissions

```bash
chmod 600 .env
```

### 4. Use Secret Managers in Production

```bash
# AWS Secrets Manager
MARVIN_SITE_CLIENT_TOKEN=$(aws secretsmanager get-secret-value \
  --secret-id marvin/site-token \
  --query SecretString \
  --output text)

# HashiCorp Vault
MARVIN_SITE_CLIENT_TOKEN=$(vault kv get -field=token secret/marvin)
```

### 5. Separate Credentials per Environment

```bash
# Development
.env.development

# Staging
.env.staging

# Production
.env.production (use secret manager instead)
```

---

## Validation

Check your configuration:

```bash
# Show all Marvin variables
env | grep MARVIN

# Test connection
marvin publish site

# Verify workspace
echo "API: $MARVIN_API_URL"
echo "Workspace: $MARVIN_WORKSPACE_SLUG"
```

---

## Common Configurations

### Local Development

```bash
MARVIN_API_URL=http://localhost:8000
MARVIN_WORKSPACE_SLUG=dev-workspace
MARVIN_SITE_CLIENT_TOKEN=marvin_sk_dev_token
MARVIN_DEBUG=true
MARVIN_OUTPUT_FORMAT=table
```

### Production

```bash
MARVIN_API_URL=https://api.example.com
MARVIN_WORKSPACE_SLUG=production
MARVIN_API_CLIENT_ID=prod_client_id
MARVIN_API_CLIENT_SECRET=prod_client_secret
MARVIN_TIMEOUT=60000
MARVIN_OUTPUT_FORMAT=json
```

### CI/CD

```bash
MARVIN_API_URL=https://api.example.com
MARVIN_WORKSPACE_SLUG=production
MARVIN_SITE_CLIENT_TOKEN=${SITE_TOKEN}  # From CI secrets
MARVIN_OUTPUT_FORMAT=json
```

---

## Troubleshooting

### Variable Not Set

**Symptom:** "MARVIN_API_URL is required"

**Solution:**
```bash
# Check variable
echo $MARVIN_API_URL

# Set variable
export MARVIN_API_URL=https://api.example.com

# Or create .env file
cat > .env << EOF
MARVIN_API_URL=https://api.example.com
MARVIN_WORKSPACE_SLUG=my-workspace
EOF
```

### Variable Not Loaded from .env

**Symptom:** CLI doesn't use .env values

**Solution:**
```bash
# Verify .env exists
ls -la .env

# Check .env format (no spaces around =)
cat .env

# Reload if using dotenv-cli
dotenv -- marvin publish entries
```

### Wrong Environment

**Symptom:** Connected to wrong instance

**Solution:**
```bash
# Check current values
env | grep MARVIN

# Override temporarily
marvin --api-url https://correct-url.com publish entries

# Or switch .env file
cp .env.production .env
```

---

## Quick Reference Table

| Variable | Required | Type | Default | Description |
|----------|----------|------|---------|-------------|
| `MARVIN_API_URL` | Yes | URL | - | Marvin API endpoint |
| `MARVIN_WORKSPACE_SLUG` | Yes | String | - | Workspace identifier |
| `MARVIN_SITE_CLIENT_TOKEN` | Conditional | Token | - | Publishing API token |
| `MARVIN_EMAIL` | No | Email | - | User email |
| `MARVIN_PASSWORD` | No | String | - | User password |
| `MARVIN_API_CLIENT_ID` | No | String | - | API client ID |
| `MARVIN_API_CLIENT_SECRET` | No | String | - | API client secret |
| `MARVIN_ADMIN_TOKEN` | Conditional | Token | - | Admin token |
| `MARVIN_OUTPUT_FORMAT` | No | Enum | `table` | Output format |
| `MARVIN_TIMEOUT` | No | Number | `30000` | Request timeout (ms) |
| `MARVIN_INSECURE` | No | Boolean | `false` | Disable SSL verification |
| `MARVIN_DEBUG` | No | Boolean | `false` | Enable debug mode |

---

## Related

- [Configuration Guide](../getting-started/configuration.md)
- [Authentication Reference](authentication.md)
- [Quick Start](../getting-started/quickstart.md)
