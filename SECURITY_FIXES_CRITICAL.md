# Marvin CLI - Critical Security Fixes

**Date:** 2026-07-11  
**Status:** ✅ All 4 CRITICAL issues fixed

This document summarizes the critical security vulnerabilities fixed in the marvin-cli codebase.

## Overview

Fixed all 4 CRITICAL security issues identified in the security audit:

1. ✅ Password visibility in `change-password` command
2. ✅ Token exposure in `workspace token` command
3. ✅ Token logging to stdout
4. ✅ Broken atomic write in credentials manager

---

## Issue #1: Passwords Visible in Shell History ⚠️ HIGH

**File:** `src/commands/user/password.ts`

**Problem:**
- `change-password` command accepted passwords as CLI flags (`--current` and `--new`)
- Passwords exposed in:
  - Shell history (`~/.bash_history`, `~/.zsh_history`)
  - Process listing (`ps aux`)
  - System logs

**Fix:**
- Removed password flags from command
- Implemented secure interactive prompts using `promptSecure()` utility
- Passwords are now entered with hidden input (no echo to terminal)
- Password confirmation step added to prevent typos
- No shell history exposure

**New Usage:**
```bash
# Interactive prompts (secure)
marvin user change-password
# User is prompted for:
# 1. Current password (hidden)
# 2. New password (hidden)
# 3. Confirm new password (hidden)
```

**Files Modified:**
- `src/commands/user/password.ts` - Removed flags, added secure prompts
- `src/shared/prompt.ts` - NEW: Secure prompting utilities

---

## Issue #2: Token Passed as CLI Argument ⚠️ HIGH

**File:** `src/commands/platform/workspaces.ts`

**Problem:**
- `workspace token <site-token>` accepted token as positional argument
- Token exposed in shell history and process list

**Fix:**
- Removed positional token argument
- Implemented two secure input methods:
  1. Interactive prompt (default) - hidden input
  2. stdin pipe (`--from-stdin`) - for automation

**New Usage:**
```bash
# Interactive (secure, default)
marvin workspace token
# Prompts for token with hidden input

# From stdin (for scripts/automation)
echo "$TOKEN" | marvin workspace token --from-stdin

# For specific workspace
marvin workspace token --for my-workspace
```

**Files Modified:**
- `src/commands/platform/workspaces.ts` - Updated token command
- `src/shared/prompt.ts` - Added `readFromStdin()` utility

---

## Issue #3: Tokens Logged to Stdout ⚠️ HIGH

**Files:**
- `src/commands/platform/api-clients.ts` (lines 79, 155)
- `src/commands/admin/users.ts` (lines 66-67)
- `src/commands/platform/invites.ts` (line 100)

**Problem:**
- Tokens printed to stdout in plaintext
- Captured by:
  - CI/CD job logs
  - Terminal scrollback buffers
  - tmux/screen buffers
  - Logging infrastructure

**Fix:**
- Created security utility module with token masking functions
- Tokens are now:
  - Shown in full ONLY in interactive TTY sessions
  - Masked in non-TTY contexts (CI, logs, pipes)
- Warning displayed when token is masked
- Format: `abcd****wxyz` (shows first/last 4 chars by default)

**Functions Added:**
- `maskToken(token, showChars)` - Mask a token showing only start/end
- `shouldShowFullToken()` - Check if TTY (interactive session)
- `formatTokenForOutput(token)` - Smart format based on context
- `displayTokenWarning()` - Warn users about masked tokens

**Masking Examples:**
```bash
# Interactive terminal (TTY)
$ marvin platform api-clients create --name "Test"
✓ Created API client: abc123
⚠️  Save this token securely - it won't be shown again!
   Token: site_client_abc123xyz789...

# CI/CD environment (non-TTY)
$ marvin platform api-clients create --name "Test"
✓ Created API client: abc123
⚠️  Save this token securely - it won't be shown again!
⚠️  Token is masked because output is not a TTY (CI/logging environment)
   Run this command interactively to see the full token
   Token: site****789
```

**Files Modified:**
- `src/shared/security.ts` - NEW: Token masking utilities
- `src/commands/platform/api-clients.ts` - Applied masking to create/rotate
- `src/commands/admin/users.ts` - Applied masking to password reset
- `src/commands/platform/invites.ts` - Applied masking to invite tokens

---

## Issue #4: Broken Atomic Write ⚠️ HIGH (Data Integrity)

**File:** `src/config/credentials.ts`

**Problem:**
- Code claimed to do atomic write via temp-file-then-rename
- Line 62 used `writeFileSync(credentialsPath, readFileSync(tempPath))` instead of `renameSync()`
- This is NOT atomic - just a regular write operation
- If process crashes mid-write, credentials file is corrupted
- Temp file was in `/tmp` (different filesystem), preventing atomic rename

**Fix:**
- Replaced `writeFileSync` with `renameSync()` for true atomic operation
- Moved temp file to same directory as credentials (`.marvin/`)
- Added proper cleanup on error
- Set directory permissions to `0700` (user-only access)
- `renameSync()` is atomic on POSIX systems (completes fully or not at all)

**Before (Broken):**
```typescript
const tempPath = join(tmpdir(), `marvin-credentials-${randomBytes(8).toString("hex")}.json`);
writeFileSync(tempPath, JSON.stringify(credentials, null, 2), { mode: 0o600 });
writeFileSync(this.credentialsPath, readFileSync(tempPath, "utf-8")); // NOT ATOMIC!
```

**After (Fixed):**
```typescript
const tempPath = join(this.credentialsDir, `.credentials-${randomBytes(8).toString("hex")}.tmp`);
writeFileSync(tempPath, JSON.stringify(credentials, null, 2), { mode: 0o600 });
renameSync(tempPath, this.credentialsPath); // ATOMIC!
```

**Why This Matters:**
- `renameSync()` within same filesystem is atomic on POSIX
- Either the entire file is written or nothing changes
- No partial/corrupted credentials file on crash/interrupt
- Critical for credential safety

**Files Modified:**
- `src/config/credentials.ts` - Fixed atomic write implementation

---

## New Utility Modules

### `src/shared/prompt.ts`

Secure input prompting utilities:

```typescript
// Secure password/token input (hidden)
const password = await promptSecure("Enter password:");

// Password with confirmation
const password = await promptPassword("Enter new password");

// Read from stdin (for piped input)
const token = await readFromStdin();

// Regular visible input
const name = await prompt("Enter name:", "default");
```

### `src/shared/security.ts`

Token security and masking utilities:

```typescript
// Mask a token
const masked = maskToken("site_client_abc123xyz789", 4); // "site****789"

// Check if TTY
const isTTY = shouldShowFullToken(); // true in terminal, false in CI

// Smart formatting (full in TTY, masked otherwise)
const output = formatTokenForOutput(token);

// Display warning about masking
displayTokenWarning();
```

---

## Testing Recommendations

### Manual Testing

1. **Password Change:**
```bash
marvin user change-password
# Verify:
# - Prompts appear (3 total)
# - Input is hidden
# - Password mismatch detection works
# - Successful change shows confirmation
```

2. **Workspace Token:**
```bash
marvin workspace token
# Verify:
# - Prompt appears
# - Input is hidden
# - Token is saved

echo "test_token" | marvin workspace token --from-stdin
# Verify stdin input works
```

3. **Token Masking:**
```bash
# Interactive test
marvin platform api-clients create --name "Test"
# Should show full token

# Non-TTY test
marvin platform api-clients create --name "Test" | cat
# Should show masked token with warning
```

4. **Atomic Write:**
```bash
# Test credentials save/load cycle
marvin login
marvin workspace use my-workspace
marvin workspace token
# Verify ~/.marvin/credentials.json is valid JSON
# Try interrupting marvin commands mid-execution (Ctrl+C)
# Verify credentials file never corrupted
```

### Automated Testing

**Priority:** Add unit tests for:
- `src/shared/prompt.ts` - Prompt utilities
- `src/shared/security.ts` - Token masking functions
- `src/config/credentials.ts` - Atomic write behavior

**Test Cases:**
1. Token masking with various lengths
2. TTY detection (mock `process.stdout.isTTY`)
3. Credentials atomic write (verify `renameSync` called)
4. Stdin reading for token input
5. Password confirmation mismatch handling

---

## Security Posture Improvement

**Before:**
- ❌ Passwords visible in shell history
- ❌ Tokens visible in shell history
- ❌ Tokens logged to CI/CD systems
- ❌ Credentials file vulnerable to corruption

**After:**
- ✅ Passwords entered via secure prompts only
- ✅ Tokens entered via secure prompts or stdin
- ✅ Tokens automatically masked in non-TTY contexts
- ✅ Credentials file protected by atomic writes

**Risk Reduction:**
- **Shell History Exposure:** Eliminated
- **Process Listing Exposure:** Eliminated
- **CI/CD Log Leakage:** Mitigated (tokens masked)
- **Data Corruption:** Eliminated (atomic writes)

---

## Backwards Compatibility

**Breaking Changes:**

1. `marvin user change-password` - No longer accepts flags
   - **Old:** `marvin user change-password --current old --new new`
   - **New:** `marvin user change-password` (interactive prompts)

2. `marvin workspace token` - No longer accepts positional argument
   - **Old:** `marvin workspace token <site-token>`
   - **New:** `marvin workspace token` (interactive) or `echo $TOKEN | marvin workspace token --from-stdin`

**Migration Guide:**

Scripts using old CLI interface must be updated:

```bash
# OLD (insecure)
marvin user change-password --current "$OLD_PASS" --new "$NEW_PASS"
marvin workspace token "$SITE_TOKEN"

# NEW (secure)
# Option 1: Interactive
marvin user change-password  # User prompted securely

# Option 2: Stdin (for scripts)
echo "$SITE_TOKEN" | marvin workspace token --from-stdin
```

**Note:** Password change cannot be automated via stdin (by design - requires user interaction)

---

## Next Steps

### Immediate
- ✅ All CRITICAL fixes implemented
- 🔜 Test fixes in development environment
- 🔜 Update documentation/README

### Short-term (MAJOR issues)
- 🔜 Fix path validation on `--file` option (Issue #5)
- 🔜 Add input validation on user-supplied JSON (Issue #6)
- 🔜 Add email validation before sending invites (Issue #7)
- 🔜 Fix inconsistent `process.exit(1)` usage (Issue #8)
- 🔜 Validate `--api-url` for SSRF prevention (Issue #9)
- 🔜 Register missing `--user-token` global option (Issue #10)

### Medium-term (MINOR issues)
- 🔜 Add test coverage (currently 0%)
- 🔜 Pin SDK to specific version (not `develop` branch)
- 🔜 Add token validation before saving (login command)
- 🔜 Remove `dist/` from git
- 🔜 Fix TypeScript `as any` casts
- 🔜 Add `parseInt` radix parameters

---

## Files Changed

**New Files:**
- `src/shared/prompt.ts` - Secure input prompting utilities
- `src/shared/security.ts` - Token masking and security utilities
- `SECURITY_FIXES_CRITICAL.md` - This document

**Modified Files:**
- `src/commands/user/password.ts` - Secure password prompts
- `src/commands/platform/workspaces.ts` - Secure token input
- `src/commands/platform/api-clients.ts` - Token masking
- `src/commands/admin/users.ts` - Token masking
- `src/commands/platform/invites.ts` - Token masking
- `src/config/credentials.ts` - Atomic write fix

**Total:** 3 new files, 6 modified files

---

## Review Checklist

- [x] Issue #1: Password exposure fixed
- [x] Issue #2: Token exposure fixed
- [x] Issue #3: Token logging fixed
- [x] Issue #4: Atomic write fixed
- [x] New utility modules created
- [x] Code syntax validated
- [ ] Manual testing completed
- [ ] Automated tests added
- [ ] Documentation updated
- [ ] Ready for commit

---

## Commit Message

```
fix(security): Eliminate critical credential exposure vulnerabilities

CRITICAL security fixes addressing 4 HIGH-priority vulnerabilities:

1. Password visibility in shell history
   - Removed password CLI flags from change-password command
   - Implemented secure interactive prompts with hidden input
   - Added password confirmation to prevent typos

2. Token exposure in workspace token command
   - Removed positional token argument
   - Added secure prompt and stdin options
   - No shell history or process list exposure

3. Token logging to stdout
   - Created token masking utilities
   - Tokens shown in full only in interactive TTY
   - Masked in CI/logs (e.g., site****789)
   - Warning displayed when masked

4. Broken atomic write in credentials manager
   - Fixed non-atomic write bug (was using writeFileSync)
   - Now uses renameSync for true atomic operation
   - Prevents credential corruption on crash/interrupt
   - Temp file in same directory for atomic guarantee

New utilities:
- src/shared/prompt.ts - Secure input prompting
- src/shared/security.ts - Token masking functions

BREAKING CHANGES:
- `marvin user change-password` now prompts interactively (no flags)
- `marvin workspace token` now prompts interactively (use --from-stdin for scripts)

Files changed: 9 (3 new, 6 modified)
Risk level: HIGH → LOW
Security posture: Significantly improved
```
