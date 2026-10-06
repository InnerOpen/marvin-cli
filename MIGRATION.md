# Migration Guide

## 3.3.0

3.3.0 adds `marvin events` and removes nothing. One alias is deprecated.

### `platform events` is deprecated (removed in 4.0)

`marvin platform events …` has always been an alias of `marvin platform event-log …`. It still
works throughout 3.x but prints a one-line warning on stderr. Use `platform event-log`:

```bash
marvin platform event-log list --limit 20     # was: marvin platform events list --limit 20
```

The alias is removed in 4.0, so that "events" means one thing: `marvin events`, the Events hub.

### New

- `marvin events list` and `marvin events show <event-type>`: what sends each event type and what
  reacts to it (workspace ADMIN). See [docs/commands/events.md](docs/commands/events.md).

## 3.2.0

3.2.0 adds commands and removes nothing. Two existing commands behave differently.

### `platform assets download` writes the file

`marvin platform assets download <id>` never got the file's bytes from SDK 4.1 on (the SDK read
the response as JSON and got nothing), so it failed. It now writes the bytes:

- with `--out-file <path>`: to that file, then `✓ Wrote <n> bytes to <path>` on stderr, or
  `{"ok": true, "file", "bytes", "contentType"}` on stdout with `--json`;
- without it: raw to stdout, when stdout is redirected or piped (`… download <id> > logo.png`);
- without it and with stdout on a terminal: it refuses before downloading, instead of printing
  binary.

`marvin publish asset <slug> --download` works the same way.

### The 403 message for AUTHOR-level commands

A 403 from `platform tags create` or `platform assets upload` now says "This needs the AUTHOR role
in workspace '…'." instead of the entry-specific text (own drafts vs EDITOR), which only applies to
entries. `--json` errors keep the same fields.

### New

- Review queue: `platform entries list --status/--entry-type/--suggestions/--limit`,
  `platform entries counts`, `apply-suggestion`/`reject-suggestion` on entries, assets and
  resources, `platform entries suggested-assets list|approve|reject`, and `platform dashboard`.
  See [Review Queue](docs/commands/review.md).
- `platform entries update --status/--publish-at/--expire-at` (no `--data` needed).
- `marvin platform blueprints`: list, categories, get, apply (one or several), update. See
  [Blueprints](docs/commands/blueprints.md).
- `marvin platform incoming-webhooks`: CRUD, `mint-token`/`revoke-token`, `signature-schemes`. See
  [Incoming Webhooks](docs/commands/incoming-webhooks.md).
- `marvin platform tags`: CRUD and `attach`/`detach` on entries, assets and resources. See
  [Tags](docs/commands/tags.md).
- Smart collections: `platform collections preview|members|order` and `--smart-rules` on
  `create`/`update`. See [Smart Collections](docs/commands/smart-collections.md).
- `publish entries --tag/--slug/--updated-since/--expand full`, `publish asset --download`.

3.2.0 depends on `@inneropen/marvin-sdk` ^4.3.0. The new commands need Marvin rc.198 or later.

## 3.1.0

3.1.0 makes the CLI safe to script: data on stdout, messages on stderr, and a JSON result from
every write command. Nothing is removed yet, but two flags are renamed and the old spellings are
deprecated.

### `--data` replaces `--json <payload>` (removed in 4.0)

Write commands took their body with `--json '<payload>'`, which collided with the global `--json`
output switch. The body flag is now `--data`, and it reads a file or stdin too:

```bash
# before
marvin platform webhooks create --json '{"name":"n","url":"https://example.com"}'

# after
marvin platform webhooks create --data '{"name":"n","url":"https://example.com"}'
marvin platform webhooks create --data @webhook.json
cat webhook.json | marvin platform webhooks create --data -
```

`--file <path>` still works and is the same as `--data @path`. The old `--json '<payload>'` still
works throughout 3.x: the CLI rewrites it to `--data` and prints a deprecation warning on stderr. It
no longer switches the output to JSON; add `--json` (or `--output json`) separately if you want JSON
back. **`--json <payload>` is removed in 4.0.**

### `--out-file` replaces `-o/--output <file>`

`workspace export`, `workspace backups download`, `platform assets download` and
`admin backups download` wrote to a file with `-o/--output <file>`. The long form clashed with the
global `--output <format>` (which took the file name as an output format), so it is now
`--out-file`. `-o` still works.

```bash
# before
marvin workspace export -o workspace.json

# after
marvin workspace export --out-file workspace.json     # or: -o workspace.json
```

### Messages moved to stderr

`✓ Created…`, `✓ Deleted…`, progress lines and hints now go to stderr. stdout carries only data.
Scripts that grepped stdout for `✓ Created` should read the result instead:

```bash
# before
marvin platform entries create --file entry.json | grep -q "✓ Created"

# after
id=$(marvin platform entries create --data @entry.json --json | jq -r .id)
```

### JSON results for deletes and actions

In JSON, YAML and CSV mode, commands that used to print only a `✓` line now print a result:

| Command | stdout with `--json` |
|---|---|
| delete, remove, revoke | `{"deleted": "<id>"}` |
| run, test, rerun, import (and other actions) | `{"ok": true, ...}` plus the server's response |

In table mode they print only the `✓` line, on stderr. Errors are unchanged:
`{"error": "...", "status": ...}` on stdout and exit code 1.

### `secrets --value` is deprecated

`platform secrets create` and `update` put the value in your shell history. Pipe it in with
`--value-stdin`, or leave the value out in a terminal and the CLI prompts for it (hidden).
`--value` still works but prints a warning.

```bash
# before
marvin platform secrets create --name "Mailgun key" --value "key-123"

# after
pass show mailgun/api-key | marvin platform secrets create --name "Mailgun key" --value-stdin
```

### Paged lists

`platform webhooks list`, `platform invites list` and `admin groups list` returned page 1 only. They
now take `--page`, `--per-page` and `--all`. Without them you still get the first 50. `platform forms
submissions` takes `--limit` (default 100) and `--offset` (default 0).

### New in 3.1

- `marvin platform workflows` (alias `automations`): list, create, validate, preview, run and dry-run
  workflows, and read their run history. See [Workflows](docs/commands/workflows.md).
- `marvin platform integrations`: connections, providers, event subscriptions, the error policy and
  its per-connection overrides, alert routing. See [Integrations](docs/commands/integrations.md).
- `marvin platform site rebuild` / `rebuild-status`: queue a site rebuild and see where it stands.
  See [Site Rebuild](docs/commands/site-rebuild.md).
- `marvin admin system plugins`: the plugin packages installed on the server.

3.1.0 depends on `@inneropen/marvin-sdk` ^4.1.0. The new groups need a matching server: Marvin
rc.198 or later, with the integration SDK installed for `integrations`, and a release that includes
the site rebuild endpoint for `site rebuild`.

## 3.0.0

3.0.0 is a major release because it drops commands and changes how a refused command is reported.
It targets Marvin rc.189 or later and depends on `@inneropen/marvin-sdk` ^4.0.0.

### `marvin platform notifications` is gone

Marvin removed its built-in Apprise notifier, and the API and SDK 4 dropped the notifications
module with it, so `platform notifications list|get|create|update|delete|test` no longer exist.
Send notifications through an integration instead (for example the Apprise integration plugin)
and route events to it from the workspace's automations.

### A 403 now says which role you need

Marvin now enforces workspace roles on settings and content routes: settings (webhooks,
variables, scheduled tasks, SMTP and test email, invites, members, API clients, workspace export
and backups) need ADMIN, entry types and forms need ADMIN to change, and collections, resources
and asset edits need EDITOR. See [Workspace roles](docs/reference/authentication.md#workspace-roles).

When your role is too low the CLI used to print "Authentication Error … check that you're logged
in". It now prints:

```
✗ Permission denied (403)
This needs the ADMIN role in workspace 'acme'.
```

With `--json` the error object changed from `{"error": "Authentication failed: Forbidden"}` to:

```json
{"error": "This needs the ADMIN role in workspace 'acme'.", "status": 403, "requiredRole": "ADMIN", "workspace": "acme"}
```

Scripts that matched the old text should check `status == 403` (and `requiredRole`) instead. The
exit code is still 1, and a 401 is still reported as an authentication error.

## 2.6.0

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
