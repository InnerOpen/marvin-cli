# Workspaces

Manage workspaces, switch between workspaces, and configure site tokens for Publishing API access.

## Commands

### List Workspaces

```bash
marvin workspace list
```

### Set Active Workspace

```bash
marvin workspace use <workspace>
```

### Show Current Workspace

```bash
marvin workspace current
```

### Set Site Token

```bash
marvin workspace token <site-token>
```

### Remove Site Token

```bash
marvin workspace token:remove
```

## Description

Workspaces are the top-level organizational unit in Marvin. Each workspace contains its own collections, entries, forms, and settings. The workspace commands allow you to list accessible workspaces, switch between them, and manage site tokens for Publishing API access.

## Authentication

Requires user authentication via `marvin login`.

```bash
marvin login
```

## Options

### `marvin workspace list`

No additional options. Outputs table format showing all accessible workspaces with their roles and active status.

### `marvin workspace use <workspace>`

| Option | Description |
|--------|-------------|
| `<workspace>` | Workspace slug or ID (required) |

### `marvin workspace current`

No additional options. Shows the currently active workspace slug.

### `marvin workspace token <site-token>`

| Option | Description | Default |
|--------|-------------|---------|
| `<site-token>` | Site client token (marvin_sk_...) | Required |
| `--for <slug>` | Workspace slug (defaults to active workspace) | Active workspace |

### `marvin workspace token:remove`

| Option | Description | Default |
|--------|-------------|---------|
| `--for <slug>` | Workspace slug (defaults to active workspace) | Active workspace |

## Examples

### Basic Usage

List all accessible workspaces:

```bash
marvin workspace list
```

Output:

```
Accessible Workspaces:
──────────────────────────────────────────────────────────────────────
My Company (my-company) 🔑
  Role: owner  ✓ ACTIVE
  ID: 01234567-89ab-cdef-0123-456789abcdef

Client Project (client-project)
  Role: editor
  ID: abcdef01-2345-6789-abcd-ef0123456789
```

Note: 🔑 indicates a site token is stored for this workspace.

Set active workspace by slug:

```bash
marvin workspace use my-company
```

Output:

```
✓ Active workspace set to: My Company (my-company)
```

Set active workspace by ID:

```bash
marvin workspace use 01234567-89ab-cdef-0123-456789abcdef
```

Show current active workspace:

```bash
marvin workspace current
```

Output:

```
Active workspace: my-company
```

### Site Token Management

Store site token for Publishing API:

```bash
marvin workspace token marvin_sk_abc123def456
```

Output:

```
✓ Site token saved for workspace: my-company

You can now use Publishing API commands without --site-token flag:
  marvin publish entries
  marvin publish collections
```

Store site token for a specific workspace:

```bash
marvin workspace token marvin_sk_xyz789 --for client-project
```

Remove stored site token:

```bash
marvin workspace token:remove
```

Output:

```
✓ Site token removed for workspace: my-company
```

Remove site token for a specific workspace:

```bash
marvin workspace token:remove --for client-project
```

## Use Cases

### Switch Workspaces in Scripts

```bash
#!/bin/bash

# Switch to production workspace
marvin workspace use production

# Deploy changes
marvin publish entries --json > public/data/entries.json

# Switch to staging workspace
marvin workspace use staging

# Export staging data
marvin publish entries --json > staging/entries.json
```

### Manage Multiple Client Sites

```bash
# List all clients
marvin workspace list

# Set tokens for each client
marvin workspace token marvin_sk_client1_token --for client-1
marvin workspace token marvin_sk_client2_token --for client-2

# Work with client 1
marvin workspace use client-1
marvin publish entries

# Work with client 2
marvin workspace use client-2
marvin publish entries
```

### Verify Workspace Access

```bash
#!/bin/bash

# Check if workspace exists and you have access
if marvin workspace use my-workspace > /dev/null 2>&1; then
  echo "✓ Access confirmed"
  marvin workspace current
else
  echo "✗ No access or workspace doesn't exist"
  exit 1
fi
```

## Scripting Examples

### Bash Script

```bash
#!/bin/bash

# Store current workspace
CURRENT=$(marvin workspace current)

# List all workspaces and extract slugs
WORKSPACES=$(marvin workspace list | grep "Role:" | sed -n 's/.*(\(.*\)).*/\1/p')

echo "Accessible workspaces:"
echo "$WORKSPACES"

# Restore original workspace
if [ -n "$CURRENT" ]; then
  marvin workspace use "$CURRENT" > /dev/null
fi
```

### Node.js

```javascript
const { execSync } = require('child_process');

// Get current workspace
const current = execSync('marvin workspace current', { 
  encoding: 'utf-8' 
}).trim().replace('Active workspace: ', '');

console.log(`Current workspace: ${current}`);

// Switch workspace
execSync(`marvin workspace use production`);

// Do work...
console.log('Fetching production data...');

// Restore workspace
execSync(`marvin workspace use ${current}`);
```

### Python

```python
import subprocess
import re

def get_current_workspace():
    """Get the active workspace slug"""
    result = subprocess.run(
        ['marvin', 'workspace', 'current'],
        capture_output=True,
        text=True
    )
    
    match = re.search(r'Active workspace: (.+)', result.stdout)
    return match.group(1) if match else None

def switch_workspace(slug):
    """Switch to a different workspace"""
    subprocess.run(['marvin', 'workspace', 'use', slug])

# Example usage
original = get_current_workspace()
print(f"Original workspace: {original}")

# Switch to production
switch_workspace('production')
print("Switched to production")

# Do work...

# Switch back
if original:
    switch_workspace(original)
    print(f"Restored to {original}")
```

### Multi-Workspace Data Export

```bash
#!/bin/bash

# Export data from all accessible workspaces

OUTPUT_DIR="./workspace-exports"
mkdir -p "$OUTPUT_DIR"

# Parse workspace slugs from list command
marvin workspace list | grep "Role:" | while read -r line; do
  # Extract slug from line like: "My Company (my-company) 🔑"
  SLUG=$(echo "$line" | sed -n 's/.*(\(.*\)).*/\1/p' | tr -d ' ')
  
  if [ -n "$SLUG" ]; then
    echo "Exporting workspace: $SLUG"
    
    # Switch to workspace
    marvin workspace use "$SLUG" > /dev/null
    
    # Export data
    mkdir -p "$OUTPUT_DIR/$SLUG"
    marvin publish entries --json > "$OUTPUT_DIR/$SLUG/entries.json"
    marvin publish collections --json > "$OUTPUT_DIR/$SLUG/collections.json"
    
    echo "  ✓ Exported $SLUG"
  fi
done

echo "All exports complete in $OUTPUT_DIR/"
```

## Response Fields

### Workspace List

Each workspace includes:

| Field | Type | Description |
|-------|------|-------------|
| `workspace.id` | string | Unique workspace ID (UUID) |
| `workspace.name` | string | Human-readable workspace name |
| `workspace.slug` | string | URL-friendly identifier |
| `role` | string | Your role (owner, admin, editor, viewer) |
| `isActive` | boolean | Whether this is the active workspace |

## Error Handling

### No Active Workspace

When no workspace is set:

```bash
marvin workspace current
```

Output:

```
No active workspace set
```

Solution:

```bash
marvin workspace use <slug>
```

### Workspace Not Found

When workspace doesn't exist or you don't have access:

```bash
marvin workspace use invalid-workspace
```

Output:

```
Error: Workspace 'invalid-workspace' not found

Try: marvin workspace list
```

### Site Token Without Active Workspace

When trying to set a token without an active workspace:

```bash
marvin workspace token marvin_sk_abc123
```

Output:

```
No active workspace set.
Either:
  1. Set active workspace: marvin workspace use <slug>
  2. Specify workspace: marvin workspace token <token> --for <slug>
```

### Authentication Required

When not logged in:

```bash
marvin workspace list
```

Output:

```
Error: Not authenticated. Please run: marvin login
```

## Related Commands

- [`marvin login`](auth.md) - Authenticate with Marvin
- [`marvin publish entries`](../publish/entries.md) - Publishing API (requires site token)
- [`marvin publish collections`](../publish/collections.md) - Publishing API
- [`marvin platform forms`](forms.md) - Platform API (uses workspace context)

## API Reference

This command calls:

```
GET /api/platform/workspaces
POST /api/platform/workspaces/set-active
GET /api/platform/workspaces/current
```

Site tokens are stored locally in `~/.marvin/credentials.json` and are used for Publishing API calls.
