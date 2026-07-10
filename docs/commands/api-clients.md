# API Clients

Manage site client tokens (Publishing API tokens) for your workspace.

## Commands

### List API Clients

```bash
marvin api-clients list
```

### Get API Client

```bash
marvin api-clients get <id>
```

### Create API Client

```bash
marvin api-clients create --name <name>
marvin api-clients create --json <json>
marvin api-clients create --file <path>
```

### Update API Client

```bash
marvin api-clients update <id> --name <name>
marvin api-clients update <id> --json <json>
marvin api-clients update <id> --file <path>
```

### Delete API Client

```bash
marvin api-clients delete <id> --yes
```

### Rotate Token

```bash
marvin api-clients rotate-token <id>
```

### Preview Token

```bash
marvin api-clients preview <id>
```

## Description

API clients (site clients) are Publishing API tokens that allow external applications to access published content from your workspace. Create tokens for different environments (production, staging, development) or different applications consuming your content.

**Important:** Tokens are only shown once when created or rotated. Store them securely.

## Authentication

Requires user authentication via `marvin login` and an active workspace.

```bash
marvin login
marvin workspace use <workspace>
```

## Options

### `marvin api-clients list`

| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output as JSON | `false` |
| `--yaml` | Output as YAML | `false` |
| `--csv` | Output as CSV | `false` |
| `--output <format>` | Output format: table, json, yaml, csv | `table` |

### `marvin api-clients get <id>`

| Option | Description |
|--------|-------------|
| `<id>` | API client ID (required) |
| `--json` | Output as JSON |
| `--output <format>` | Output format: table, json |

### `marvin api-clients create`

| Option | Description |
|--------|-------------|
| `--name <name>` | Client name |
| `--description <description>` | Client description |
| `--json <json>` | Client data as JSON string |
| `--file <path>` | Path to JSON file |

Either `--name`, `--json`, or `--file` is required.

### `marvin api-clients update <id>`

| Option | Description |
|--------|-------------|
| `<id>` | API client ID (required) |
| `--name <name>` | Client name |
| `--description <description>` | Client description |
| `--json <json>` | Client data as JSON string |
| `--file <path>` | Path to JSON file |

### `marvin api-clients delete <id>`

| Option | Description | Default |
|--------|-------------|---------|
| `<id>` | API client ID (required) | - |
| `--yes` | Skip confirmation prompt | Required |

### `marvin api-clients rotate-token <id>`

| Option | Description |
|--------|-------------|
| `<id>` | API client ID (required) |

### `marvin api-clients preview <id>`

| Option | Description |
|--------|-------------|
| `<id>` | API client ID (required) |
| `--json` | Output as JSON |
| `--output <format>` | Output format: table, json |

## Examples

### Basic Usage

List all API clients:

```bash
marvin api-clients list
```

Output:

```
┌──────────────────────────────┬─────────────────┬──────────────────────┬────────────┐
│ ID                           │ Name            │ Description          │ Created    │
├──────────────────────────────┼─────────────────┼──────────────────────┼────────────┤
│ 01234567-89ab-cdef-0123-4567 │ Production      │ Prod site token      │ 2026-06-01 │
│ 89abcdef-0123-4567-89ab-cdef │ Staging         │ Staging environment  │ 2026-06-15 │
│ cdef0123-4567-89ab-cdef-0123 │ Development     │ Local dev            │ 2026-07-01 │
└──────────────────────────────┴─────────────────┴──────────────────────┴────────────┘
```

Get a specific API client:

```bash
marvin api-clients get 01234567-89ab-cdef-0123-456789abcdef
```

Output:

```
┌─────────────┬──────────────────────────────────────────┐
│ Field       │ Value                                    │
├─────────────┼──────────────────────────────────────────┤
│ ID          │ 01234567-89ab-cdef-0123-456789abcdef     │
│ Name        │ Production                               │
│ Description │ Production site token                    │
│ Created     │ 2026-06-01T10:00:00Z                     │
└─────────────┴──────────────────────────────────────────┘
```

### Create API Client

Create with name and description:

```bash
marvin api-clients create --name "Production Site" --description "Token for production website"
```

Output:

```
✓ Created API client: 01234567-89ab-cdef-0123-456789abcdef
⚠️  Save this token securely - it won't be shown again!
   Token: marvin_sk_abc123def456ghi789jkl012mno345pqr
```

Create from JSON:

```bash
marvin api-clients create --json '{
  "name": "Staging Environment",
  "description": "Token for staging site"
}'
```

Create from file:

```bash
cat > client.json <<EOF
{
  "name": "Mobile App",
  "description": "Token for iOS and Android apps"
}
EOF

marvin api-clients create --file client.json
```

### Update API Client

Update name and description:

```bash
marvin api-clients update 01234567-89ab-cdef-0123-4567 \
  --name "Production (Updated)" \
  --description "Main production site"
```

Output:

```
✓ Updated API client: 01234567-89ab-cdef-0123-4567
```

### Delete API Client

Delete a client (requires confirmation):

```bash
marvin api-clients delete 01234567-89ab-cdef-0123-4567 --yes
```

Output:

```
✓ Deleted API client: 01234567-89ab-cdef-0123-4567
```

### Rotate Token

Generate a new token (invalidates the old one):

```bash
marvin api-clients rotate-token 01234567-89ab-cdef-0123-456789abcdef
```

Output:

```
✓ Rotated token for API client: 01234567-89ab-cdef-0123-456789abcdef
⚠️  Save this token securely - it won't be shown again!
   New Token: marvin_sk_xyz987wvu654tsr321qpo098nml765kji
```

### Preview Token

View token prefix without revealing full token:

```bash
marvin api-clients preview 01234567-89ab-cdef-0123-456789abcdef
```

Output:

```
┌─────────────┬──────────────────────────────────────────┐
│ Field       │ Value                                    │
├─────────────┼──────────────────────────────────────────┤
│ ID          │ 01234567-89ab-cdef-0123-456789abcdef     │
│ Name        │ Production                               │
│ Token Preview│ marvin_sk_abc123...                     │
└─────────────┴──────────────────────────────────────────┘
```

### JSON Output

```bash
marvin api-clients list --json
```

```json
[
  {
    "id": "01234567-89ab-cdef-0123-456789abcdef",
    "name": "Production",
    "description": "Production site token",
    "createdAt": "2026-06-01T10:00:00Z",
    "updatedAt": "2026-06-01T10:00:00Z",
    "lastUsedAt": "2026-07-10T14:30:00Z"
  },
  {
    "id": "89abcdef-0123-4567-89ab-cdef01234567",
    "name": "Staging",
    "description": "Staging environment",
    "createdAt": "2026-06-15T08:00:00Z",
    "updatedAt": "2026-06-15T08:00:00Z",
    "lastUsedAt": null
  }
]
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique client ID (UUID) |
| `name` | string | Client name |
| `description` | string | Client description |
| `token` | string | API token (only on create/rotate) |
| `tokenPreview` | string | Token prefix (on preview) |
| `createdAt` | string | ISO 8601 timestamp of creation |
| `updatedAt` | string | ISO 8601 timestamp of last update |
| `lastUsedAt` | string | ISO 8601 timestamp of last use (null if never used) |

## Use Cases

### Environment-Specific Tokens

Create separate tokens for each environment:

```bash
# Production
marvin api-clients create --name "Production" --description "Prod site"

# Staging
marvin api-clients create --name "Staging" --description "Staging site"

# Development
marvin api-clients create --name "Development" --description "Local dev"
```

### Rotate Compromised Token

If a token is compromised, rotate it immediately:

```bash
# Rotate the token
marvin api-clients rotate-token <client-id>

# Update your application with the new token
# The old token is now invalid
```

### List Active Tokens

```bash
marvin api-clients list --json | jq '.[] | select(.lastUsedAt != null)'
```

### Find Unused Tokens

```bash
marvin api-clients list --json | jq '.[] | select(.lastUsedAt == null) | {name, id, createdAt}'
```

### Store Token Locally

After creating a token, store it for CLI use:

```bash
# Create token
TOKEN=$(marvin api-clients create --name "CLI Access" --json | grep "Token:" | awk '{print $2}')

# Store for workspace
marvin workspace token "$TOKEN"
```

## Scripting Examples

### Bash Script

```bash
#!/bin/bash

# List all API clients and their last usage
echo "API Clients:"
marvin api-clients list --json | jq -r '.[] | "\(.name): Last used \(.lastUsedAt // "never")"'

# Find clients not used in 30+ days
CUTOFF=$(date -u -d '30 days ago' +%Y-%m-%dT%H:%M:%SZ)
echo -e "\nUnused tokens (30+ days):"
marvin api-clients list --json | jq -r --arg cutoff "$CUTOFF" '
  .[] | select(.lastUsedAt < $cutoff or .lastUsedAt == null) | .name
'
```

### Node.js

```javascript
const { execSync } = require('child_process');

// Create a new API client
function createClient(name, description) {
  const result = execSync(
    `marvin api-clients create --name "${name}" --description "${description}" --json`,
    { encoding: 'utf-8' }
  );
  
  // Extract token from output
  const tokenMatch = result.match(/Token: (marvin_sk_\w+)/);
  const token = tokenMatch ? tokenMatch[1] : null;
  
  // Parse JSON response
  const jsonMatch = result.match(/(\{[\s\S]*\})/);
  const client = jsonMatch ? JSON.parse(jsonMatch[1]) : null;
  
  return { client, token };
}

// Example usage
const { client, token } = createClient('New Client', 'Auto-generated');

console.log(`Created client: ${client.id}`);
console.log(`Token: ${token}`);

// Store token securely (example: environment variable)
console.log(`\nAdd to your .env file:`);
console.log(`MARVIN_SITE_CLIENT_TOKEN=${token}`);
```

### Python

```python
import subprocess
import json
import re
from datetime import datetime, timedelta

# Get all API clients
result = subprocess.run(
    ['marvin', 'api-clients', 'list', '--json'],
    capture_output=True,
    text=True
)

clients = json.loads(result.stdout)

# Find stale tokens
stale_cutoff = datetime.now() - timedelta(days=90)

print("Token Audit:")
print("-" * 60)

for client in clients:
    last_used = client.get('lastUsedAt')
    
    if last_used is None:
        status = "⚠️  Never used"
    else:
        last_used_dt = datetime.fromisoformat(last_used.replace('Z', '+00:00'))
        if last_used_dt < stale_cutoff:
            status = "⚠️  Stale (90+ days)"
        else:
            status = "✓ Active"
    
    print(f"{client['name']}: {status}")
    
print("\nConsider rotating or removing unused tokens")
```

### Rotate All Tokens

```bash
#!/bin/bash

# Rotate all API client tokens (emergency procedure)
echo "⚠️  This will rotate ALL API client tokens!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Aborted"
  exit 1
fi

marvin api-clients list --json | jq -r '.[].id' | while read id; do
  echo "Rotating: $id"
  marvin api-clients rotate-token "$id"
  echo "---"
done

echo "All tokens rotated. Update your applications immediately!"
```

## Security Best Practices

### Token Storage

- **Never commit tokens to version control**
- Store in environment variables or secure vaults
- Use different tokens for each environment
- Rotate tokens regularly (quarterly recommended)

### Token Management

```bash
# Create environment-specific tokens
marvin api-clients create --name "Production" --description "Prod only"
marvin api-clients create --name "Staging" --description "Staging only"

# Don't reuse tokens across environments
# Don't share tokens between applications
```

### Audit Token Usage

```bash
# Regular audit
marvin api-clients list --json | jq '.[] | {
  name,
  created: .createdAt,
  lastUsed: .lastUsedAt
}'
```

### Revoke Compromised Tokens

```bash
# If a token is compromised:

# Option 1: Rotate (keeps the client, generates new token)
marvin api-clients rotate-token <client-id>

# Option 2: Delete (removes the client entirely)
marvin api-clients delete <client-id> --yes
```

## Error Handling

### 401 Unauthorized

Not authenticated:

```bash
marvin login
marvin workspace use <workspace>
```

### 404 Not Found

Client doesn't exist:

```bash
# List all clients to find valid IDs
marvin api-clients list --json | jq -r '.[].id'
```

### Delete Without Confirmation

Must provide `--yes` flag:

```bash
marvin api-clients delete <client-id> --yes
```

### Token Already Stored

When trying to store a token that's already configured:

```bash
# Remove old token first
marvin workspace token:remove

# Store new token
marvin workspace token <new-token>
```

## Related Commands

- [`marvin workspace token`](workspaces.md) - Store token for CLI usage
- [`marvin publish entries`](../publish/entries.md) - Use Publishing API
- [`marvin publish collections`](../publish/collections.md) - Use Publishing API

## API Reference

This command calls:

```
GET /api/platform/workspaces/{workspace_id}/api-clients
GET /api/platform/workspaces/{workspace_id}/api-clients/{id}
POST /api/platform/workspaces/{workspace_id}/api-clients
PATCH /api/platform/workspaces/{workspace_id}/api-clients/{id}
DELETE /api/platform/workspaces/{workspace_id}/api-clients/{id}
POST /api/platform/workspaces/{workspace_id}/api-clients/{id}/rotate-token
GET /api/platform/workspaces/{workspace_id}/api-clients/{id}/preview
```

See [API Mapping](../reference/api-mapping.md) for more details.
