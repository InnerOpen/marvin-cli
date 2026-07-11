# Configuration

This guide covers configuring the Marvin CLI with credentials, environment variables, and settings.

!!! info "Security Notice - v2.6.0+"
    Version 2.6.0 introduces enhanced security features including secure credential storage, token masking in CI/CD, and input validation. See [SECURITY.md](../../SECURITY.md) for details.

## Configuration Methods

The CLI supports multiple configuration methods, in order of precedence:

1. **Command-line flags** - Highest priority (⚠️ not for credentials - use environment variables)
2. **Environment variables** - Set in shell or `.env` file
3. **Saved credentials** - Stored in `~/.marvin/credentials.json` (via `marvin login`)
4. **Interactive prompts** - For sensitive input

## Environment Variables

### Core Variables

```bash
# Required: API URL
MARVIN_API_URL=https://your-marvin-instance.com

# Required: Workspace slug
MARVIN_WORKSPACE_SLUG=your-workspace

# Publishing API: Site client token
MARVIN_SITE_TOKEN=site_client_your_token_here

# Platform API: User token (get via 'marvin login')
MARVIN_USER_TOKEN=user_your_token_here
```

!!! warning "Security - Credential Flags Removed (v2.6.0+)"
    For security reasons, the following are NO LONGER supported as CLI flags:
    
    - `--user-token` - Use `MARVIN_USER_TOKEN` environment variable instead
    - Password flags on `marvin user change-password` - Use interactive prompts
    - Token argument on `marvin workspace token` - Use `--from-stdin` or interactive prompt
    
    See [MIGRATION.md](../../MIGRATION.md) for upgrade instructions.

### Optional Variables

```bash
# Default output format
MARVIN_OUTPUT_FORMAT=table  # table, json, yaml, csv

# Request timeout (milliseconds)
MARVIN_TIMEOUT=30000

# Enable debug mode
MARVIN_DEBUG=true

# Disable SSL verification (development only)
MARVIN_INSECURE=true
```

## Using .env Files

Create a `.env` file in your project directory:

```bash
# Copy example file
cp .env.example .env

# Edit with your values
nano .env
```

Example `.env`:

```env
# API Configuration
MARVIN_API_URL=http://localhost:8000
MARVIN_WORKSPACE_SLUG=my-workspace

# Publishing API
MARVIN_SITE_CLIENT_TOKEN=marvin_sk_example_token

# Platform API (optional)
MARVIN_EMAIL=admin@example.com
MARVIN_PASSWORD=secure_password

# Output preferences
MARVIN_OUTPUT_FORMAT=table
```

!!! warning "Security"
    Never commit `.env` files to version control. Add to `.gitignore`:
    ```
    .env
    .env.local
    .env.*.local
    ```

## Command-Line Overrides

Override environment variables with command-line flags:

```bash
# Override API URL
marvin --api-url https://staging.example.com publish entries

# Override workspace
marvin --workspace other-workspace publish entries

# Override output format
marvin --output json publish entries
marvin --json publish entries  # Shortcut

# Multiple overrides
marvin --api-url https://api.example.com --workspace prod --json publish entries
```

## Authentication Setup

### Publishing API (Site Client Token)

1. **Get a site client token** from your Marvin instance:
   - Log into Marvin
   - Navigate to **Settings → Publishing → Site Clients**
   - Click **Create Site Client**
   - Copy the token (starts with `marvin_sk_`)

2. **Set the environment variable**:
   ```bash
   export MARVIN_SITE_CLIENT_TOKEN=marvin_sk_your_token
   ```

3. **Or add to .env**:
   ```env
   MARVIN_SITE_CLIENT_TOKEN=marvin_sk_your_token
   ```

### Platform API (User Authentication)

**Recommended method (v2.6.0+):** Use `marvin login` for secure credential storage.

```bash
# Log in (secure interactive prompt)
marvin login
Enter user token: [hidden]
Validating token...
✓ Token is valid
✓ Logged in successfully

# Check current workspace
marvin workspace current

# Log out
marvin logout
```

The CLI stores your token securely in `~/.marvin/credentials.json` with proper permissions (0600).

**Benefits:**
- Token validated before saving (prevents invalid tokens)
- Never visible in shell history
- Automatic token masking in CI/CD logs
- Atomic file writes prevent corruption

### Platform API (API Client)

For automation, use API client credentials:

1. **Create an API client** in Marvin:
   - Settings → API → API Clients
   - Create a new client
   - Copy ID and secret

2. **Configure**:
   ```env
   MARVIN_API_CLIENT_ID=your_client_id
   MARVIN_API_CLIENT_SECRET=your_client_secret
   ```

### Admin API

For admin operations:

```bash
# Set admin token
export MARVIN_ADMIN_TOKEN=your_admin_token
```

## Configuration Profiles

Use different `.env` files for different environments:

```bash
# Development
.env.development

# Staging
.env.staging

# Production
.env.production
```

Load the appropriate file:

```bash
# Using dotenv-cli
dotenv -e .env.staging -- marvin publish entries

# Or export manually
export $(cat .env.staging | xargs)
marvin publish entries
```

## Workspace Configuration

### Default Workspace

Set a default workspace in `.env`:

```env
MARVIN_WORKSPACE_SLUG=my-default-workspace
```

### Switching Workspaces

Override for a single command:

```bash
marvin --workspace other-workspace publish entries
```

### Multiple Workspace Setup

Create separate `.env` files per workspace:

```bash
# .env.workspace-a
MARVIN_WORKSPACE_SLUG=workspace-a
MARVIN_SITE_CLIENT_TOKEN=marvin_sk_token_a

# .env.workspace-b
MARVIN_WORKSPACE_SLUG=workspace-b
MARVIN_SITE_CLIENT_TOKEN=marvin_sk_token_b
```

## Output Configuration

### Default Output Format

Set a default format:

```env
MARVIN_OUTPUT_FORMAT=json
```

### Per-Command Override

```bash
marvin publish entries --json
marvin publish entries --yaml
marvin publish entries --csv
marvin publish entries --output table
```

## Connection Settings

### API URL

Point to different Marvin instances:

```bash
# Local development
MARVIN_API_URL=http://localhost:8000

# Docker
MARVIN_API_URL=http://marvin:8000

# Remote
MARVIN_API_URL=https://api.example.com

# Custom port
MARVIN_API_URL=https://marvin.example.com:3000
```

### Timeout Configuration

Set request timeout (milliseconds):

```env
MARVIN_TIMEOUT=30000  # 30 seconds
```

Override per command:

```bash
marvin --timeout 60000 publish entries
```

### SSL/TLS Configuration

For development with self-signed certificates:

```env
# Disable SSL verification (development only!)
MARVIN_INSECURE=true
```

!!! danger "Production Warning"
    Never use `MARVIN_INSECURE=true` in production. This disables SSL certificate verification and is insecure.

## Debug Mode

Enable debug output:

```env
MARVIN_DEBUG=true
```

Or per command:

```bash
DEBUG=marvin:* marvin publish entries
```

Debug output includes:

- HTTP request/response details
- Authentication flow
- API endpoint URLs
- Response times

## Configuration Validation

Validate your configuration:

```bash
# Check environment variables
marvin config check

# Show current configuration
marvin config show

# Test connection
marvin publish site
```

## Example Configurations

### Local Development

```env
# .env
MARVIN_API_URL=http://localhost:8000
MARVIN_WORKSPACE_SLUG=dev-workspace
MARVIN_SITE_CLIENT_TOKEN=marvin_sk_dev_token
MARVIN_DEBUG=true
MARVIN_OUTPUT_FORMAT=table
```

### Production

```env
# .env.production
MARVIN_API_URL=https://api.example.com
MARVIN_WORKSPACE_SLUG=production
MARVIN_SITE_CLIENT_TOKEN=marvin_sk_prod_token
MARVIN_OUTPUT_FORMAT=json
MARVIN_TIMEOUT=60000
```

### CI/CD

```bash
# GitHub Actions secrets
MARVIN_API_URL=https://api.example.com
MARVIN_WORKSPACE_SLUG=production
MARVIN_API_CLIENT_ID=${{ secrets.MARVIN_CLIENT_ID }}
MARVIN_API_CLIENT_SECRET=${{ secrets.MARVIN_CLIENT_SECRET }}
```

## Troubleshooting

### Missing Configuration

If you see "MARVIN_API_URL is required":

```bash
# Check environment
echo $MARVIN_API_URL

# Load .env file
export $(cat .env | xargs)

# Or set manually
export MARVIN_API_URL=https://your-marvin-instance.com
```

### Invalid Credentials

If authentication fails:

```bash
# Verify token
echo $MARVIN_SITE_CLIENT_TOKEN

# Re-login for platform API
marvin auth logout
marvin auth login

# Check token expiration
marvin auth whoami
```

### Wrong Workspace

If you get 404 errors:

```bash
# Check workspace slug
echo $MARVIN_WORKSPACE_SLUG

# Verify workspace exists
marvin workspace list

# Use correct slug
export MARVIN_WORKSPACE_SLUG=correct-slug
```

## Security Best Practices

!!! tip "Security Features (v2.6.0+)"
    Marvin CLI includes enterprise-grade security features:
    
    - ✅ No shell history exposure (secure prompts)
    - ✅ Automatic token masking in CI/CD
    - ✅ Token validation before saving
    - ✅ Atomic credential writes (no corruption)
    - ✅ Input validation (paths, URLs, emails, JSON)
    - ✅ Graceful error handling
    
    See [SECURITY.md](../../SECURITY.md) for complete security documentation.

### Essential Security Practices

1. **Never commit credentials** to version control
   ```gitignore
   .marvin/
   .env
   .env.local
   *credentials*
   *secrets*
   ```

2. **Use environment variables** for CI/CD
   ```yaml
   # GitHub Actions
   env:
     MARVIN_USER_TOKEN: ${{ secrets.MARVIN_USER_TOKEN }}
   ```

3. **Use saved credentials** for development
   ```bash
   marvin login  # one-time setup
   ```

4. **Rotate tokens regularly**
   ```bash
   # Create new token
   marvin platform api-clients create --name "Production-2026"
   
   # Update credentials
   marvin login
   
   # Delete old token
   marvin platform api-clients delete <old-id>
   ```

5. **Verify credential file permissions**
   ```bash
   ls -la ~/.marvin/
   # Should show: drwx------ (700) and -rw------- (600)
   ```

6. **Use workspace-specific tokens** (principle of least privilege)
   ```bash
   marvin workspace token --for workspace-a
   marvin workspace token --for workspace-b
   ```

7. **Never use `--user-token` flag** (removed for security in v2.6.0)
   ```bash
   # WRONG (removed)
   marvin platform entries list --user-token "$TOKEN"
   
   # RIGHT (environment variable)
   export MARVIN_USER_TOKEN="$TOKEN"
   marvin platform entries list
   
   # RIGHT (saved credentials)
   marvin login
   marvin platform entries list
   ```

## Related

- [Installation Guide](installation.md)
- [Quick Start](quickstart.md)
- [Environment Variables Reference](../reference/environment-variables.md)
- [Authentication Reference](../reference/authentication.md)
