# Migration Guide

This guide helps you migrate from older versions of Marvin CLI to version 2.6.0+, which includes critical security improvements.

## Overview

Version 2.6.0 introduces **breaking changes** to eliminate credential exposure vulnerabilities. All changes prioritize security over backward compatibility.

**If you're upgrading:** Please review this guide carefully and update your scripts and workflows.

## Breaking Changes

### 1. Password Change Command (v2.6.0+)

**What Changed:** The `marvin user change-password` command no longer accepts CLI flags for passwords.

#### Before (v2.5.x and earlier) - INSECURE

```bash
marvin user change-password --current "$OLD_PASSWORD" --new "$NEW_PASSWORD"
```

**Problem:** Passwords visible in shell history (`~/.bash_history`, `~/.zsh_history`) and process listings.

#### After (v2.6.0+) - SECURE

```bash
marvin user change-password
```

You'll be prompted interactively:
```
Enter current password: [hidden]
Enter new password: [hidden]
Confirm new password: [hidden]
```

**Migration:**
- Remove `--current` and `--new` flags from scripts
- Password changes now require interactive user input (cannot be automated)
- This is intentional for security - password changes should always be user-initiated

---

### 2. Workspace Token Command (v2.6.0+)

**What Changed:** The `marvin workspace token` command no longer accepts tokens as positional arguments.

#### Before (v2.5.x and earlier) - INSECURE

```bash
marvin workspace token "$SITE_TOKEN"
```

**Problem:** Token visible in shell history and process listings.

#### After (v2.6.0+) - SECURE

**Option 1: Interactive prompt (recommended)**

```bash
marvin workspace token
```

You'll be prompted:
```
Enter site token: [hidden]
```

**Option 2: Stdin input (for automation)**

```bash
echo "$SITE_TOKEN" | marvin workspace token --from-stdin
```

**Option 3: For specific workspace**

```bash
marvin workspace token --for my-workspace
# or
echo "$SITE_TOKEN" | marvin workspace token --for my-workspace --from-stdin
```

**Migration:**

```bash
# OLD (insecure)
marvin workspace token "$SITE_TOKEN"

# NEW (interactive - for manual use)
marvin workspace token

# NEW (stdin - for scripts/CI)
echo "$SITE_TOKEN" | marvin workspace token --from-stdin
```

---

### 3. User Token Flag Removed (v2.6.0+)

**What Changed:** The `--user-token` flag has been removed entirely.

#### Before (v2.5.x and earlier) - NEVER WORKED

```bash
marvin platform entries list --user-token "$USER_TOKEN"
```

**Problem:** This flag was referenced in types but never actually worked. If it had worked, it would expose tokens in shell history.

#### After (v2.6.0+) - PROPERLY SUPPORTED

**Option 1: Save credentials (recommended)**

```bash
marvin login
marvin platform entries list
```

**Option 2: Environment variable**

```bash
export MARVIN_USER_TOKEN="user_..."
marvin platform entries list
```

**Option 3: Inline environment variable**

```bash
MARVIN_USER_TOKEN="user_..." marvin platform entries list
```

**Migration:**

```bash
# OLD (never worked)
marvin platform entries list --user-token "$USER_TOKEN"

# NEW (environment variable)
export MARVIN_USER_TOKEN="$USER_TOKEN"
marvin platform entries list

# NEW (one-time)
MARVIN_USER_TOKEN="$USER_TOKEN" marvin platform entries list

# NEW (saved credentials - best)
marvin login
marvin platform entries list
```

---

## Non-Breaking Changes

These changes improve security and UX but don't require migration:

### Token Masking in CI/CD (v2.6.0+)

Tokens are automatically masked in non-TTY environments (CI/CD, logs, pipes).

**Interactive terminal (TTY):**
```bash
$ marvin platform api-clients create --name "Test"
Token: site_client_abc123xyz789def456ghi...
```

**CI/CD environment (non-TTY):**
```bash
$ marvin platform api-clients create --name "Test" | cat
Token: site****ghi
⚠️  Token is masked because output is not a TTY (CI/logging environment)
   Run this command interactively to see the full token
```

**Migration:** No action required - works automatically.

### Token Validation on Login (v2.6.0+)

The `marvin login` command now validates tokens before saving.

**Before (v2.5.x):**
- Invalid tokens were saved
- Commands failed with 401 errors later
- Required logout/login to fix

**After (v2.6.0+):**
```bash
$ marvin login
Enter user token: [hidden]
Validating token...
✗ Token validation failed

The token you provided is invalid or expired.
Please check your token and try again.
```

**Migration:** No action required - better user experience.

### Input Validation (v2.6.0+)

Comprehensive validation has been added:

**Path validation:**
```bash
$ marvin platform entries create --file ~/.ssh/id_rsa
⚠️  Warning: Reading from sensitive path: /Users/you/.ssh/id_rsa
   Make sure you trust this file and it doesn't contain secrets.
```

**URL validation:**
```bash
$ marvin --api-url http://api.example.com entries list
⚠️  Warning: Using HTTP (not HTTPS) for api.example.com
   Your credentials may be transmitted insecurely over the network.
```

**Migration:** No action required - warnings are informational only.

---

## CI/CD Migration Examples

### GitHub Actions

#### Before (v2.5.x)

```yaml
- name: Set workspace token
  run: marvin workspace token "${{ secrets.SITE_TOKEN }}"
```

#### After (v2.6.0+)

```yaml
- name: Set workspace token
  run: echo "${{ secrets.SITE_TOKEN }}" | marvin workspace token --from-stdin
```

### GitLab CI

#### Before (v2.5.x)

```yaml
script:
  - marvin workspace token "$SITE_TOKEN"
```

#### After (v2.6.0+)

```yaml
script:
  - echo "$SITE_TOKEN" | marvin workspace token --from-stdin
```

### Docker

#### Before (v2.5.x)

```dockerfile
RUN marvin workspace token "$SITE_TOKEN"
```

#### After (v2.6.0+)

```dockerfile
# Option 1: Stdin
RUN echo "$SITE_TOKEN" | marvin workspace token --from-stdin

# Option 2: Environment variable
ENV MARVIN_SITE_TOKEN=$SITE_TOKEN
RUN marvin workspace use my-workspace
```

---

## Shell Script Migration

### Before (v2.5.x)

```bash
#!/bin/bash
set -e

# Insecure - credentials in command line
OLD_PASS="current123"
NEW_PASS="new456"
SITE_TOKEN="site_client_abc123"

marvin user change-password --current "$OLD_PASS" --new "$NEW_PASS"
marvin workspace token "$SITE_TOKEN"
```

### After (v2.6.0+)

```bash
#!/bin/bash
set -e

# Secure - no credentials on command line
echo "Password change requires interactive input (security requirement)"
marvin user change-password

# Token from stdin
echo "$SITE_TOKEN" | marvin workspace token --from-stdin

# Or use environment variables
export MARVIN_USER_TOKEN="$USER_TOKEN"
export MARVIN_SITE_TOKEN="$SITE_TOKEN"
marvin platform entries list
```

---

## Dependency Updates

### SDK Version

Version 2.6.0+ pins the SDK to a stable version.

#### Before (v2.5.x)

```json
{
  "dependencies": {
    "@inneropen/marvin-sdk": "develop"
  }
}
```

#### After (v2.6.0+)

```json
{
  "dependencies": {
    "@inneropen/marvin-sdk": "^2.0.1"
  }
}
```

**Migration:** Run `npm install` to update to the stable SDK version.

---

## Testing Your Migration

### 1. Test Password Change

```bash
marvin user change-password
# Verify: prompts appear, input is hidden
```

### 2. Test Workspace Token

```bash
# Interactive
marvin workspace token
# Verify: prompt appears, input is hidden

# Stdin (for automation)
echo "test_token" | marvin workspace token --from-stdin
# Verify: token is saved without prompting
```

### 3. Test User Authentication

```bash
# Saved credentials
marvin login
marvin platform entries list
# Verify: works without additional auth

# Environment variable
export MARVIN_USER_TOKEN="user_..."
marvin platform entries list
# Verify: works without login
```

### 4. Test Token Masking

```bash
# Interactive (should show full token)
marvin platform api-clients create --name "Test"

# Non-interactive (should mask token)
marvin platform api-clients create --name "Test" | cat
```

---

## Rollback Instructions

If you need to temporarily rollback:

```bash
# Install previous version
npm install -g @inneropen/marvin-cli@2.5.7

# Or pin in package.json
{
  "dependencies": {
    "@inneropen/marvin-cli": "2.5.7"
  }
}
```

**Warning:** Previous versions have known security vulnerabilities. Only rollback if absolutely necessary and migrate as soon as possible.

---

## Getting Help

### Migration Issues

If you encounter issues during migration:

1. Check this guide for your specific use case
2. Review the [Security Best Practices](SECURITY.md)
3. Check the [README](README.md) for updated examples
4. [Open an issue](https://github.com/inneropen/marvin-cli/issues) with:
   - Your previous version
   - The command that's not working
   - Error message
   - Your use case (manual, script, CI/CD)

### Security Questions

For security-related questions:

- Review [SECURITY.md](SECURITY.md) for best practices
- See [SECURITY_AUDIT_COMPLETE.md](SECURITY_AUDIT_COMPLETE.md) for details on fixes
- Email security concerns to: contact@inneropen.com

---

## Migration Checklist

- [ ] Updated password change commands (removed `--current` and `--new` flags)
- [ ] Updated workspace token commands (added `--from-stdin` or interactive prompts)
- [ ] Removed `--user-token` flags (using environment variables instead)
- [ ] Updated CI/CD pipelines (using stdin or environment variables)
- [ ] Updated shell scripts (no credentials on command line)
- [ ] Tested interactive prompts work
- [ ] Tested stdin input works for automation
- [ ] Verified tokens are masked in CI/CD logs
- [ ] Ran `npm install` to update SDK dependency

---

## Version History

### v2.6.0 (2026-07-11)

**Security improvements:**
- Fixed 15 out of 17 security issues (88% resolution)
- Eliminated all CRITICAL and MEDIUM priority vulnerabilities
- Risk level reduced from HIGH to LOW

**Breaking changes:**
- `marvin user change-password` - removed password flags
- `marvin workspace token` - removed positional argument
- `--user-token` flag removed entirely

**New features:**
- Secure interactive prompts with hidden input
- Token masking in CI/CD environments
- Comprehensive input validation
- Token validation before saving
- Atomic credential file writes

See [SECURITY_AUDIT_COMPLETE.md](SECURITY_AUDIT_COMPLETE.md) for complete details.

---

**Last updated:** 2026-07-11  
**Applies to:** v2.6.0 and later
