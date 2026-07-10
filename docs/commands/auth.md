# Authentication Commands

User authentication commands for the Platform and Admin APIs.

## Commands

| Command | Description |
|---------|-------------|
| `marvin auth login` | Log in with email and password |
| `marvin auth logout` | Log out and clear session |
| `marvin auth whoami` | Show current authenticated user |

## Login

Log in with your Marvin user credentials.

### Usage

```bash
marvin auth login [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--email <email>` | User email (prompts if not provided) |
| `--password <password>` | Password (prompts if not provided) |

### Interactive Login

```bash
marvin auth login
```

```
Email: user@example.com
Password: ••••••••••
✓ Logged in as user@example.com
```

### Non-Interactive Login

```bash
marvin auth login --email user@example.com --password mypassword
```

!!! warning "Security"
    Avoid passing passwords on the command line in production. Use interactive login or environment variables instead.

### Environment Variables

```bash
export MARVIN_EMAIL=user@example.com
export MARVIN_PASSWORD=mypassword
marvin auth login
```

### Response

On successful login:

- Session token is stored securely
- User information is cached
- Token is used for subsequent Platform/Admin API calls

### Token Storage

Tokens are stored securely using:

- **macOS**: Keychain
- **Linux**: Secret Service API or encrypted file (`~/.marvin/credentials`)
- **Windows**: Credential Manager

## Logout

Log out and clear your session.

### Usage

```bash
marvin auth logout
```

### Example

```bash
marvin auth logout
```

```
✓ Logged out
```

### Effect

- Removes stored session token
- Clears cached user information
- Invalidates the session on the server

## Whoami

Show information about the currently authenticated user.

### Usage

```bash
marvin auth whoami [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--json` | Output as JSON |
| `--yaml` | Output as YAML |

### Example

```bash
marvin auth whoami
```

Output:

```
┌──────────────┬─────────────────────────────┐
│ Field        │ Value                       │
├──────────────┼─────────────────────────────┤
│ Email        │ user@example.com            │
│ Name         │ John Doe                    │
│ Role         │ ADMIN                       │
│ Verified     │ true                        │
│ Created      │ 2026-01-15T10:30:00Z        │
└──────────────┴─────────────────────────────┘
```

### JSON Output

```bash
marvin auth whoami --json
```

```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "role": "ADMIN",
  "verified": true,
  "createdAt": "2026-01-15T10:30:00Z"
}
```

## Authentication Flow

### First-Time Setup

```bash
# 1. Log in
marvin auth login

# 2. Verify authentication
marvin auth whoami

# 3. Use Platform API commands
marvin platform entries
```

### Checking Authentication Status

```bash
# Check if logged in
if marvin auth whoami >/dev/null 2>&1; then
  echo "Logged in"
else
  echo "Not logged in"
  marvin auth login
fi
```

### Re-authentication

```bash
# Log out
marvin auth logout

# Log in again
marvin auth login
```

## Use Cases

### Development Workflow

```bash
# Log in once per development session
marvin auth login

# Use Platform API
marvin platform entries
marvin platform entry create

# Log out when done
marvin auth logout
```

### CI/CD

For automated workflows, use API client credentials instead of user login:

```bash
# Set API client credentials
export MARVIN_API_CLIENT_ID=your_client_id
export MARVIN_API_CLIENT_SECRET=your_client_secret

# No login needed - credentials are used automatically
marvin platform entries
```

### Multi-User Environment

```bash
# User A logs in
marvin auth login --email usera@example.com

# Check who's logged in
marvin auth whoami

# Switch users
marvin auth logout
marvin auth login --email userb@example.com
```

## Authentication Methods

### User Login (Interactive)

Best for:
- Development
- Manual operations
- Testing

```bash
marvin auth login
```

### User Login (Environment Variables)

Best for:
- Local development
- Personal automation scripts

```bash
export MARVIN_EMAIL=user@example.com
export MARVIN_PASSWORD=mypassword
```

### API Client Credentials

Best for:
- CI/CD pipelines
- Automated workflows
- Production systems

```bash
export MARVIN_API_CLIENT_ID=client_id
export MARVIN_API_CLIENT_SECRET=client_secret
```

### Site Client Token

Best for:
- Publishing API (read-only)
- Public content access
- Frontend applications

```bash
export MARVIN_SITE_CLIENT_TOKEN=marvin_sk_token
```

## Security Best Practices

1. **Use API clients for automation** - Don't store user passwords
2. **Enable 2FA** - Protect your user account
3. **Rotate credentials** - Change passwords and API keys regularly
4. **Limit permissions** - Use least-privilege API clients
5. **Secure storage** - Never commit credentials to git
6. **Log out after use** - Clear sessions when done
7. **Monitor access** - Check audit logs for suspicious activity

## Troubleshooting

### Login Fails

**Invalid credentials**:

```bash
# Verify email and password
marvin auth login

# Check Caps Lock is off
# Try resetting password in Marvin UI
```

**Network error**:

```bash
# Check API URL
echo $MARVIN_API_URL

# Test connection
curl $MARVIN_API_URL/health
```

### Token Expired

```bash
# Log out and log back in
marvin auth logout
marvin auth login
```

### Permission Denied

```bash
# Check user role
marvin auth whoami --json | jq -r '.role'

# Verify required permissions in Marvin UI
```

### Can't Store Token

If token storage fails:

```bash
# Check permissions
ls -la ~/.marvin/

# Recreate credentials directory
mkdir -p ~/.marvin
chmod 700 ~/.marvin
```

## Error Codes

| Code | Message | Solution |
|------|---------|----------|
| 401 | Invalid credentials | Check email/password |
| 403 | Account not verified | Verify email address |
| 429 | Too many login attempts | Wait 15 minutes and try again |
| 500 | Server error | Check Marvin server logs |

## Scripting Examples

### Bash

```bash
#!/bin/bash

# Auto-login if not authenticated
if ! marvin auth whoami >/dev/null 2>&1; then
  echo "Not logged in, logging in..."
  marvin auth login
fi

# Use Platform API
marvin platform entries --json
```

### Node.js

```javascript
const { execSync } = require('child_process');

function ensureAuthenticated() {
  try {
    execSync('marvin auth whoami', { stdio: 'ignore' });
    return true;
  } catch (error) {
    console.log('Not authenticated, please log in');
    execSync('marvin auth login', { stdio: 'inherit' });
    return true;
  }
}

ensureAuthenticated();
```

### Python

```python
import subprocess
import sys

def ensure_authenticated():
    try:
        subprocess.run(['marvin', 'auth', 'whoami'], 
                      check=True, 
                      capture_output=True)
        return True
    except subprocess.CalledProcessError:
        print('Not authenticated, please log in')
        subprocess.run(['marvin', 'auth', 'login'], 
                      check=True)
        return True

ensure_authenticated()
```

## Related

- [Configuration](../getting-started/configuration.md)
- [Environment Variables](../reference/environment-variables.md)
- [Authentication Reference](../reference/authentication.md)
- [Platform API Commands](workspaces.md)
