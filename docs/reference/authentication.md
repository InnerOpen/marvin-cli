# Authentication Reference

Complete reference for authenticating with the Marvin CLI.

## Authentication Methods

The Marvin CLI supports four authentication methods depending on which API you're using:

| Method | API Access | Use Case |
|--------|-----------|----------|
| **Site Client Token** | Publishing API (read-only) | Public content, frontend apps |
| **User Login** | Platform & Admin APIs | Development, manual operations |
| **API Client Credentials** | Platform API | Automation, CI/CD |
| **Admin Token** | Admin API | System administration |

## Site Client Token

### Overview

Site client tokens provide read-only access to the Publishing API for accessing published content.

### Format

```
marvin_sk_<random_string>
```

Example: `marvin_sk_1234567890abcdef`

### Creating a Token

1. Log into Marvin
2. Navigate to **Settings → Publishing → Site Clients**
3. Click **Create Site Client**
4. Enter a name and description
5. Copy the generated token

!!! warning "Token Security"
    The token is only shown once. Store it securely. If lost, create a new token.

### Configuration

Set in environment:

```bash
export MARVIN_SITE_CLIENT_TOKEN=marvin_sk_your_token
```

Or in `.env`:

```env
MARVIN_SITE_CLIENT_TOKEN=marvin_sk_your_token
```

Or pass on command line:

```bash
marvin publish site --site-token marvin_sk_your_token
```

### Usage

```bash
# Publishing API commands
marvin publish site
marvin publish entries
marvin publish collections
marvin publish assets
marvin publish resources
```

### Permissions

Site client tokens have:

- ✅ Read published entries
- ✅ Read collections
- ✅ Read assets
- ✅ Read resources
- ✅ Read site configuration
- ❌ No access to drafts
- ❌ No write operations
- ❌ No platform/admin APIs

### Rotating Tokens

Best practice: Rotate tokens every 90 days.

```bash
# 1. Create new token in Marvin UI
# 2. Update environment
export MARVIN_SITE_CLIENT_TOKEN=marvin_sk_new_token
# 3. Test
marvin publish site
# 4. Delete old token in Marvin UI
```

## User Login

### Overview

User login provides full access to Platform and Admin APIs based on your user role.

### Interactive Login

```bash
marvin auth login
```

Prompts for:
- Email address
- Password

### Non-Interactive Login

Using command-line flags:

```bash
marvin auth login --email user@example.com --password mypassword
```

Using environment variables:

```bash
export MARVIN_EMAIL=user@example.com
export MARVIN_PASSWORD=mypassword
marvin auth login
```

!!! danger "Security Warning"
    Never pass passwords on command line in production. Use interactive login or API client credentials instead.

### Session Storage

After login, session tokens are stored securely:

- **macOS**: Keychain (keychain-access)
- **Linux**: Secret Service API (libsecret) or encrypted file
- **Windows**: Credential Manager

Location (when file storage is used):
```
~/.marvin/credentials
```

### Session Duration

Sessions expire after:
- 24 hours of inactivity
- 7 days maximum
- When explicitly logged out

### Checking Login Status

```bash
# Check if logged in
marvin auth whoami

# In scripts
if marvin auth whoami >/dev/null 2>&1; then
    echo "Logged in"
else
    echo "Not logged in"
fi
```

### Logging Out

```bash
marvin auth logout
```

Clears:
- Session token
- Cached user information
- Stored credentials

### Permissions

User login permissions depend on workspace role:

| Role | Permissions |
|------|------------|
| **VIEWER** | Read-only access |
| **AUTHOR** | Create/edit own entries |
| **EDITOR** | Manage all entries |
| **ADMIN** | Full workspace access |
| **OWNER** | Everything + billing |

## API Client Credentials

### Overview

API clients provide programmatic access for automation without user credentials.

### Creating API Client

1. Log into Marvin
2. Navigate to **Settings → API → API Clients**
3. Click **Create API Client**
4. Enter name and description
5. Select permissions
6. Copy client ID and secret

!!! warning "Secret Security"
    The secret is only shown once. Store it securely.

### Configuration

Set in environment:

```bash
export MARVIN_API_CLIENT_ID=your_client_id
export MARVIN_API_CLIENT_SECRET=your_client_secret
```

Or in `.env`:

```env
MARVIN_API_CLIENT_ID=your_client_id
MARVIN_API_CLIENT_SECRET=your_client_secret
```

### Usage

When credentials are set, they're used automatically:

```bash
# No login needed
marvin platform entries
marvin platform entry create
```

### Permissions

Configure granular permissions:

- Read/write entries
- Manage collections
- Upload assets
- Manage resources
- Access webhooks
- View event logs

### Best Practices

1. **Create separate clients** for different services
2. **Use minimal permissions** for each client
3. **Rotate secrets** every 90 days
4. **Monitor usage** in event logs
5. **Revoke unused clients** immediately

## Admin Token

### Overview

Admin tokens provide system-level access for administrative operations.

### Creating Admin Token

1. Log into Marvin as admin
2. Navigate to **Admin → System → API Tokens**
3. Create new admin token
4. Copy the token

### Configuration

```bash
export MARVIN_ADMIN_TOKEN=your_admin_token
```

### Usage

```bash
marvin admin users
marvin admin system
marvin admin maintenance
```

### Permissions

Admin tokens have full system access:

- User management
- System configuration
- Maintenance operations
- Cross-workspace access

!!! danger "Extreme Caution"
    Admin tokens have unrestricted access. Use sparingly and rotate frequently.

## Authentication Flow

### Publishing API Flow

```
1. Get site client token from Marvin UI
2. Set MARVIN_SITE_CLIENT_TOKEN
3. Run publish commands
```

### Platform API Flow (User Login)

```
1. Run: marvin auth login
2. Enter email/password
3. Token stored in keychain
4. Run platform commands
5. Session expires or logout
```

### Platform API Flow (API Client)

```
1. Create API client in Marvin UI
2. Set MARVIN_API_CLIENT_ID and MARVIN_API_CLIENT_SECRET
3. Run platform commands
4. Credentials used automatically
```

### Admin API Flow

```
1. Get admin token from Marvin UI
2. Set MARVIN_ADMIN_TOKEN
3. Run admin commands
```

## Security Best Practices

### Token Management

1. **Never commit credentials** to version control
2. **Use secret managers** in production (AWS Secrets Manager, Vault, etc.)
3. **Rotate regularly** - every 30-90 days
4. **Revoke immediately** when compromised
5. **Monitor usage** in audit logs

### Access Control

1. **Principle of least privilege** - minimum permissions needed
2. **Separate credentials** per environment (dev, staging, prod)
3. **Different tokens** for different services
4. **Audit regularly** - review active tokens

### Development vs Production

**Development:**
```bash
# User login is fine
marvin auth login

# Or site token in .env
MARVIN_SITE_CLIENT_TOKEN=marvin_sk_dev_token
```

**Production:**
```bash
# Use API client credentials
MARVIN_API_CLIENT_ID=prod_client_id
MARVIN_API_CLIENT_SECRET=prod_client_secret

# Never use user credentials
```

### CI/CD Security

```yaml
# GitHub Actions - use secrets
- name: Fetch Content
  env:
    MARVIN_API_URL: ${{ secrets.MARVIN_API_URL }}
    MARVIN_SITE_CLIENT_TOKEN: ${{ secrets.MARVIN_SITE_TOKEN }}
  run: marvin publish entries --json
```

Never:
```yaml
# DON'T DO THIS
- run: marvin publish site --site-token marvin_sk_hardcoded_token
```

### .env File Security

```bash
# Add to .gitignore
echo ".env" >> .gitignore
echo ".env.*" >> .gitignore
echo "!.env.example" >> .gitignore

# Set restrictive permissions
chmod 600 .env
```

## Troubleshooting

### Invalid Token

**Symptom:** 401 Unauthorized

**Solutions:**
```bash
# Check token is set
echo $MARVIN_SITE_CLIENT_TOKEN

# Verify token format
# Should start with marvin_sk_ for site tokens

# Create new token in Marvin UI
# Update environment
export MARVIN_SITE_CLIENT_TOKEN=marvin_sk_new_token
```

### Session Expired

**Symptom:** 401 Unauthorized after previous success

**Solutions:**
```bash
# Log out and back in
marvin auth logout
marvin auth login

# Check session
marvin auth whoami
```

### Permission Denied

**Symptom:** 403 Forbidden

**Solutions:**
```bash
# Check user role
marvin auth whoami --json | jq -r '.role'

# Verify required permissions in Marvin UI
# Contact workspace admin if needed
```

### Token Storage Failed

**Symptom:** Cannot save credentials

**Solutions:**
```bash
# Check directory permissions
ls -la ~/.marvin/

# Create directory if missing
mkdir -p ~/.marvin
chmod 700 ~/.marvin

# On macOS, grant keychain access if prompted
```

## Environment Variable Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `MARVIN_SITE_CLIENT_TOKEN` | Site client token | `marvin_sk_abc123` |
| `MARVIN_EMAIL` | User email | `user@example.com` |
| `MARVIN_PASSWORD` | User password | `mypassword` |
| `MARVIN_API_CLIENT_ID` | API client ID | `client_123` |
| `MARVIN_API_CLIENT_SECRET` | API client secret | `secret_abc` |
| `MARVIN_ADMIN_TOKEN` | Admin token | `admin_xyz` |

## Related

- [Configuration Guide](../getting-started/configuration.md)
- [Environment Variables](environment-variables.md)
- [Auth Commands](../commands/auth.md)
