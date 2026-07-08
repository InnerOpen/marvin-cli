# npm Release Process

## Overview

We use **npm dist tags** to manage releases:
- `@next` - Development/preview releases (auto-published from main)
- `@latest` - Stable releases (manually promoted)

## Automatic Publishing (@next)

When you push to `main`, GitHub Actions automatically publishes to `@next`:

```bash
git push origin main
# → Publishes to @next tag
```

Users can install with:
```bash
npm install @inneropen/marvin-sdk@next
```

## Promoting to Stable (@latest)

When a version is ready for general use, promote it to `@latest`:

### 1. Verify the version works
```bash
# Install and test
npm install @inneropen/marvin-sdk@next
```

### 2. Promote to @latest
```bash
# Get current @next version
npm view @inneropen/marvin-sdk dist-tags

# Promote (example with v1.4.0)
npm dist-tag add @inneropen/marvin-sdk@1.4.0 latest
```

### 3. Verify
```bash
# Check tags
npm view @inneropen/marvin-sdk dist-tags

# Should show:
# latest: 1.4.0
# next: 1.4.0 (or newer if more commits)

# Install without tag (should get @latest)
npm install @inneropen/marvin-sdk
```

## Version Numbering

Follow semantic versioning:
- **Patch** (1.4.0 → 1.4.1): Bug fixes
- **Minor** (1.4.0 → 1.5.0): New features, backward compatible
- **Major** (1.4.0 → 2.0.0): Breaking changes

## Workflow

1. **Develop** - Make changes, commit to main
2. **Auto-publish** - GitHub Actions publishes to `@next`
3. **Accumulate** - Repeat steps 1-2 for multiple features
4. **Test** - Install `@next` and verify
5. **Promote** - Run `npm dist-tag add` to move to `@latest`
6. **Announce** - Update changelog, notify users

## Example Flow

```bash
# Day 1: Add feature A
git commit -m "feat: Add feature A"
git push origin main
# → Auto-publishes 1.4.0@next

# Day 2: Add feature B
git commit -m "feat: Add feature B"
git push origin main
# → Auto-publishes 1.5.0@next

# Day 3: Fix bug in feature B
git commit -m "fix: Fix feature B bug"
git push origin main
# → Auto-publishes 1.5.1@next

# Day 4: Ready for stable release
npm dist-tag add @inneropen/marvin-sdk@1.5.1 latest
# → Users get 1.5.1 with npm install
```

## Checking Current Tags

```bash
# View all tags
npm view @inneropen/marvin-sdk dist-tags

# View latest versions
npm view @inneropen/marvin-sdk versions --json | tail -5
```

## Rollback

If a version has issues:

```bash
# Promote previous stable version back to @latest
npm dist-tag add @inneropen/marvin-sdk@1.4.0 latest

# The problematic version stays published but isn't default
```

## Notes

- `@next` is always the most recent push to main
- `@latest` is manually controlled (only promote tested versions)
- Both tags can point to the same version
- Old versions remain available: `npm install @inneropen/marvin-sdk@1.3.0`
