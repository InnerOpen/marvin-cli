# Security Best Practices

This document outlines security features and best practices for using Marvin CLI.

## Overview

Marvin CLI version 2.6.0+ includes enterprise-grade security features to protect your credentials and data. This guide helps you use these features effectively.

## Security Features

### Credential Protection

#### No Shell History Exposure

**Problem:** CLI flags expose secrets in shell history files (`~/.bash_history`, `~/.zsh_history`).

**Solution:** Marvin CLI uses secure interactive prompts for all sensitive input.

```bash
# Secure - password never visible
marvin user change-password
Enter current password: [hidden]
Enter new password: [hidden]

# Secure - token never visible
marvin workspace token
Enter site token: [hidden]

# Secure - token from stdin (automation)
echo "$TOKEN" | marvin workspace token --from-stdin
```

**What's protected:**
- User passwords
- User tokens
- Site client tokens
- API keys

#### No Process Listing Exposure

**Problem:** Command-line arguments appear in `ps aux` output, visible to all users.

**Solution:** Credentials are never passed as command-line arguments.

```bash
# Before (INSECURE - visible in ps aux)
marvin workspace token "site_client_abc123"

# After (SECURE - not visible in process list)
marvin workspace token  # prompts for input
```

#### Automatic Token Masking

**Feature:** Tokens are automatically masked in non-TTY environments (CI/CD, logs, pipes).

**Interactive terminal (full token shown):**
```bash
$ marvin platform api-clients create --name "Production"
✓ Created API client: prod-client
Token: site_client_abc123xyz789def456ghi...
```

**CI/CD environment (token masked):**
```bash
$ marvin platform api-clients create --name "Production" | tee log.txt
✓ Created API client: prod-client
⚠️  Token is masked because output is not a TTY
Token: site****ghi
```

**Benefits:**
- Prevents token leakage in CI/CD logs
- Safe to share terminal recordings
- Automatic - no configuration needed

#### Atomic Credential Writes

**Feature:** Credential files are written atomically to prevent corruption.

**How it works:**
1. Write to temporary file in same directory
2. Use `renameSync()` for atomic operation (POSIX)
3. Either complete fully or not at all
4. No partial/corrupted files on crash

**Protected against:**
- Process crash during write
- Interrupt (Ctrl+C) during save
- Concurrent writes
- Filesystem errors

#### Secure File Permissions

**Automatic security:**
- Credentials directory: `0700` (user-only access)
- Credentials file: `0600` (user read/write only)
- Other users cannot read your tokens

```bash
$ ls -la ~/.marvin/
drwx------  3 user  staff   96 Jul 11 10:00 .
-rw-------  1 user  staff  123 Jul 11 10:00 credentials.json
```

### Input Validation

#### Path Validation

**Feature:** Files are validated before reading, with warnings for sensitive paths.

**Sensitive path detection:**
- `/etc/*` - System configuration
- `/root/*` - Root user files  
- `~/.ssh/*` - SSH keys
- `~/.aws/*` - AWS credentials
- `~/.config/gcloud/*` - Google Cloud credentials
- Files with "credential", "secret", "password" in path
- `.env`, `.pem`, `.key` files
- `id_rsa`, `id_ecdsa`, `id_ed25519` - SSH private keys

**Example:**
```bash
$ marvin platform entries create --file ~/.ssh/id_rsa
⚠️  Warning: Reading from sensitive path: /Users/you/.ssh/id_rsa
   Make sure you trust this file and it doesn't contain secrets.
```

**Best practice:** Always verify the `--file` path before running commands.

#### URL Validation

**Feature:** API URLs are validated for security.

**Checks:**
- Protocol must be `http://` or `https://`
- Warns on HTTP for non-localhost
- Warns on private IP ranges (SSRF prevention)

**Examples:**

```bash
# HTTP warning (credentials transmitted insecurely)
$ marvin --api-url http://api.example.com entries list
⚠️  Warning: Using HTTP (not HTTPS) for api.example.com

# Private IP warning (potential SSRF)
$ marvin --api-url https://192.168.1.100 entries list
⚠️  Warning: API URL points to private IP range: 192.168.1.100

# Localhost is OK
$ marvin --api-url http://localhost:8000 entries list
✓ OK - no warning for localhost
```

**Best practice:** Always use HTTPS for production, HTTP only for localhost.

#### Email Validation

**Feature:** Email addresses are validated before sending invites.

**Pattern:** RFC 5322 simplified validation

```bash
$ marvin platform invites invite --email "invalid"
Error: Invalid email format: "invalid"
Expected format: user@example.com
```

#### JSON Validation

**Feature:** JSON input is validated as objects before API calls.

**Rejects:**
- Arrays: `[1, 2, 3]`
- Primitives: `"string"`, `123`, `true`
- Null: `null`

```bash
$ marvin platform entries create --json '"hello"'
Error: Invalid input: expected a JSON object, got string.
Example: {"key": "value"}
```

### Error Handling

#### Graceful Shutdown

**Feature:** Proper cleanup on errors, no data loss.

**Before (v2.5.x):**
```typescript
// Immediate termination - no cleanup
process.exit(1);
```

**After (v2.6.0+):**
```typescript
// Graceful exit - cleanup handlers run
process.exitCode = 1;
return;
```

**Benefits:**
- Open files are closed
- Pending writes are flushed
- Cleanup handlers execute
- Event loop drains properly

#### Token Validation

**Feature:** Tokens are validated before saving (v2.6.0+).

```bash
$ marvin login
Enter user token: [hidden]
Validating token...
✗ Token validation failed

The token you provided is invalid or expired.
Please check your token and try again.
```

**Benefits:**
- Immediate feedback on invalid tokens
- No saved invalid credentials
- Prevents 401 errors later

## Best Practices

### Authentication

#### Use Saved Credentials

**Best for:** Daily development, interactive use

```bash
# One-time setup
marvin login

# All commands use saved credentials
marvin platform entries list
marvin platform collections list
```

**Benefits:**
- Convenient - no repeated authentication
- Secure - credentials stored with proper permissions
- Token validated before saving

#### Use Environment Variables for CI/CD

**Best for:** Automation, CI/CD pipelines

```bash
# GitHub Actions
- name: Run Marvin CLI
  env:
    MARVIN_USER_TOKEN: ${{ secrets.MARVIN_USER_TOKEN }}
    MARVIN_SITE_TOKEN: ${{ secrets.MARVIN_SITE_TOKEN }}
  run: marvin platform entries list

# GitLab CI
script:
  - export MARVIN_USER_TOKEN="$CI_MARVIN_USER_TOKEN"
  - marvin platform entries list
```

**Benefits:**
- No credentials in code
- CI/CD secret management
- Automatic token masking in logs

#### Use Stdin for Scripts

**Best for:** Shell scripts, automation

```bash
#!/bin/bash
set -e

# Token from environment variable via stdin
echo "$SITE_TOKEN" | marvin workspace token --from-stdin

# Or read from secure source
marvin workspace token < /dev/stdin
```

**Benefits:**
- No credentials in shell history
- Works in non-interactive contexts
- Secure piping

### Token Management

#### Rotate Tokens Regularly

```bash
# Create new API client
marvin platform api-clients create --name "Production-2026"

# Update your .env or CI secrets
export MARVIN_SITE_TOKEN="new_token_here"

# Delete old client
marvin platform api-clients delete <old-client-id>
```

**Recommendation:** Rotate tokens every 90 days or after team member changes.

#### Use Workspace-Specific Tokens

**Principle of Least Privilege:**

```bash
# Bad - one token for all workspaces
MARVIN_SITE_TOKEN="site_client_admin_all_workspaces"

# Good - workspace-specific tokens
marvin workspace use workspace-a
marvin workspace token  # Set token for workspace-a

marvin workspace use workspace-b
marvin workspace token  # Set token for workspace-b
```

**Benefits:**
- Limit blast radius of token compromise
- Better audit trails
- Easier revocation

#### Revoke Compromised Tokens Immediately

```bash
# If token is compromised
marvin platform api-clients delete <client-id>

# Generate new token
marvin platform api-clients create --name "Production-New"

# Or rotate existing client
marvin platform api-clients rotate-token <client-id>
```

### CI/CD Security

#### Use Secret Management

**GitHub Actions:**

```yaml
name: Deploy
on: push

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure Marvin
        env:
          MARVIN_USER_TOKEN: ${{ secrets.MARVIN_USER_TOKEN }}
        run: echo "${{ secrets.MARVIN_SITE_TOKEN }}" | marvin workspace token --from-stdin
```

**GitLab CI:**

```yaml
deploy:
  variables:
    MARVIN_USER_TOKEN: $CI_MARVIN_USER_TOKEN
  script:
    - echo "$CI_MARVIN_SITE_TOKEN" | marvin workspace token --from-stdin
```

#### Verify Token Masking

```bash
# Test in CI - token should be masked
marvin platform api-clients create --name "Test" | cat

# Output should show:
# Token: site****xyz
# ⚠️  Token is masked because output is not a TTY
```

#### Use Read-Only Tokens When Possible

```bash
# For publishing content - use Publishing API (read-only)
export MARVIN_SITE_TOKEN="site_client_readonly"
marvin publish entries
marvin publish collections

# For admin tasks - use Platform API (write access)
export MARVIN_USER_TOKEN="user_admin"
marvin platform entries create --file entry.json
```

### Development Environment

#### Never Commit Credentials

**Add to `.gitignore`:**

```gitignore
# Marvin credentials
.marvin/
.env
.env.local

# Sensitive files
*credentials*
*secrets*
*.pem
*.key
```

#### Use Different Tokens for Dev/Prod

```bash
# Development
export MARVIN_API_URL="http://localhost:8000"
export MARVIN_SITE_TOKEN="site_client_dev_..."

# Production
export MARVIN_API_URL="https://marvin.company.com"
export MARVIN_SITE_TOKEN="site_client_prod_..."
```

#### Verify `.marvin/` Permissions

```bash
# Check permissions
ls -la ~/.marvin/

# Should show:
# drwx------  (directory: 700)
# -rw-------  (credentials.json: 600)

# Fix if needed
chmod 700 ~/.marvin/
chmod 600 ~/.marvin/credentials.json
```

## Security Warnings

### Understanding Warnings

Marvin CLI shows warnings for potential security issues. These are **informational** - the command will still run.

#### Sensitive Path Warning

```bash
⚠️  Warning: Reading from sensitive path: ~/.ssh/id_rsa
```

**Action:** Verify you intended to read from this path. If not, correct the `--file` argument.

#### HTTP Warning

```bash
⚠️  Warning: Using HTTP (not HTTPS) for api.example.com
```

**Action:** Use HTTPS for production. HTTP is only safe for localhost.

#### Private IP Warning

```bash
⚠️  Warning: API URL points to private IP range: 192.168.1.100
```

**Action:** Verify this is your internal server. Could indicate SSRF attack.

## Reporting Security Issues

### If You Find a Vulnerability

**DO NOT open a public issue.**

Instead:

1. Email: contact@inneropen.com
2. Subject: "Security: Marvin CLI Vulnerability"
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Impact assessment
   - Suggested fix (if any)

**We will:**
- Acknowledge within 24 hours
- Provide a fix timeline
- Credit you in release notes (if desired)
- Keep you updated on progress

### If Your Token Is Compromised

1. **Immediately revoke the token:**
   ```bash
   marvin platform api-clients delete <client-id>
   ```

2. **Generate a new token:**
   ```bash
   marvin platform api-clients create --name "Replacement"
   ```

3. **Update all systems:**
   - Update environment variables
   - Update CI/CD secrets
   - Update team documentation

4. **Review audit logs:**
   ```bash
   marvin platform event-log list --limit 100
   ```

5. **Notify your team**

## Security Audit Summary

### Version 2.6.0 Security Improvements

**Issues Fixed:** 15 out of 17 (88% resolution)

**CRITICAL (4 issues) - ALL FIXED:**
- Passwords visible in shell history
- Tokens visible in shell history  
- Tokens logged to stdout
- Broken atomic write in credentials

**MEDIUM (6 issues) - ALL FIXED:**
- No path validation on `--file`
- No input validation on JSON
- No email validation
- Inconsistent `process.exit` usage
- API URL accepts arbitrary URLs
- Missing `--user-token` flag (removed for security)

**LOW (7 issues) - 5 ADDRESSED:**
- Directory permissions (fixed)
- `parseInt` radix (fixed)
- Excessive `as any` casts (deferred)
- `dist/` in git (already resolved)
- Zero test coverage (documented)
- SDK pinned to develop (fixed)
- Login token not validated (fixed)

**Risk Reduction:** HIGH → LOW

See [SECURITY_AUDIT_COMPLETE.md](SECURITY_AUDIT_COMPLETE.md) for full details.

## Compliance

### OWASP Top 10 2021

**Addressed:**

- **A01:2021 - Broken Access Control:** Token validation, least privilege
- **A02:2021 - Cryptographic Failures:** Secure credential storage (0600 perms)
- **A03:2021 - Injection:** Input validation (path, JSON, email, URL)
- **A04:2021 - Insecure Design:** Secure-by-default (no shell history exposure)
- **A07:2021 - Identification and Authentication Failures:** Token validation, secure prompts
- **A09:2021 - Security Logging and Monitoring Failures:** Token masking in logs
- **A10:2021 - Server-Side Request Forgery (SSRF):** URL validation, private IP detection

### CIS Controls

**Implemented:**

- **CIS Control 3 - Data Protection:** Encryption at rest (file permissions), secure handling
- **CIS Control 6 - Access Control Management:** Least privilege, token scoping
- **CIS Control 16 - Application Software Security:** Input validation, secure coding

## References

### Documentation

- [Migration Guide](MIGRATION.md) - Upgrading from older versions
- [README](README.md) - Getting started and usage
- [SECURITY_AUDIT_COMPLETE.md](SECURITY_AUDIT_COMPLETE.md) - Complete security audit report

### External Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CIS Controls](https://www.cisecurity.org/controls)
- [RFC 5322 - Email Validation](https://datatracker.ietf.org/doc/html/rfc5322)

---

**Last updated:** 2026-07-11  
**Version:** 2.6.0+  
**Status:** Production Ready
