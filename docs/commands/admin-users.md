# Admin Users

User management operations for platform administrators (requires SUPER_ADMIN role).

## Commands

### List Users

```bash
marvin admin users list [options]
```

### Get User

```bash
marvin admin users get <user-id>
```

### Reset Password

```bash
marvin admin users reset-password <user-id>
```

### Unlock User

```bash
marvin admin users unlock <user-id>
```

## Description

The admin users commands provide platform-wide user management capabilities. These commands are restricted to users with the `SUPER_ADMIN` platform role and allow viewing all users, generating password reset tokens, and unlocking locked accounts.

## Authentication

Requires user authentication via `marvin login` with `SUPER_ADMIN` platform role.

```bash
marvin login
# You must have SUPER_ADMIN role
```

## Options

### `marvin admin users list`

| Option | Description | Default |
|--------|-------------|---------|
| `--page <number>` | Page number | `1` |
| `--per-page <number>` | Items per page | `50` |
| `--json` | Output as JSON | `false` |
| `--yaml` | Output as YAML | `false` |
| `--output <format>` | Output format: table, json, yaml | `table` |

### `marvin admin users get <user-id>`

| Option | Description |
|--------|-------------|
| `<user-id>` | User ID (required) |
| `--json` | Output as JSON |
| `--output <format>` | Output format: table, json |

### `marvin admin users reset-password <user-id>`

| Option | Description |
|--------|-------------|
| `<user-id>` | User ID (required) |

### `marvin admin users unlock <user-id>`

| Option | Description |
|--------|-------------|
| `<user-id>` | User ID (required) |

## Examples

### Basic Usage

List all users (paginated):

```bash
marvin admin users list
```

Output:

```
┌──────────────────────────────┬────────────┬─────────────┬────────────────────┬──────────────┐
│ ID                           │ Username   │ Full Name   │ Email              │ Platform Role│
├──────────────────────────────┼────────────┼─────────────┼────────────────────┼──────────────┤
│ 01234567-89ab-cdef-0123-4567 │ admin      │ Admin User  │ admin@example.com  │ SUPER_ADMIN  │
│ 89abcdef-0123-4567-89ab-cdef │ jdoe       │ John Doe    │ john@example.com   │ USER         │
│ cdef0123-4567-89ab-cdef-0123 │ jsmith     │ Jane Smith  │ jane@example.com   │ USER         │
└──────────────────────────────┴────────────┴─────────────┴────────────────────┴──────────────┘
```

List with pagination:

```bash
marvin admin users list --page 1 --per-page 25
marvin admin users list --page 2 --per-page 25
```

Get a specific user:

```bash
marvin admin users get 01234567-89ab-cdef-0123-456789abcdef
```

Output:

```
┌──────────────────┬────────────────────────────────────────┐
│ Field            │ Value                                  │
├──────────────────┼────────────────────────────────────────┤
│ ID               │ 01234567-89ab-cdef-0123-456789abcdef   │
│ Username         │ jdoe                                   │
│ Full Name        │ John Doe                               │
│ Email            │ john@example.com                       │
│ Platform Role    │ USER                                   │
│ Email Verified   │ true                                   │
│ Account Locked   │ false                                  │
│ Created At       │ 2026-06-01T10:00:00Z                   │
│ Last Login       │ 2026-07-10T14:30:00Z                   │
└──────────────────┴────────────────────────────────────────┘
```

### Reset Password

Generate a password reset token for a user:

```bash
marvin admin users reset-password 01234567-89ab-cdef-0123-456789abcdef
```

Output:

```
Password reset token: rst_abc123def456ghi789jkl012mno345pqr

User can reset password at: /reset-password?token=rst_abc123def456ghi789jkl012mno345pqr
```

### Unlock User

Unlock a locked user account:

```bash
marvin admin users unlock 01234567-89ab-cdef-0123-456789abcdef
```

Output:

```
✓ User 01234567-89ab-cdef-0123-456789abcdef unlocked successfully
```

### JSON Output

List users as JSON:

```bash
marvin admin users list --json
```

```json
{
  "items": [
    {
      "id": "01234567-89ab-cdef-0123-456789abcdef",
      "username": "jdoe",
      "fullName": "John Doe",
      "email": "john@example.com",
      "platformRole": "USER",
      "emailVerified": true,
      "accountLocked": false,
      "createdAt": "2026-06-01T10:00:00Z",
      "updatedAt": "2026-07-01T15:30:00Z",
      "lastLoginAt": "2026-07-10T14:30:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "perPage": 50
}
```

Get single user as JSON:

```bash
marvin admin users get 01234567-89ab-cdef-0123-456789abcdef --json
```

```json
{
  "id": "01234567-89ab-cdef-0123-456789abcdef",
  "username": "jdoe",
  "fullName": "John Doe",
  "email": "john@example.com",
  "platformRole": "USER",
  "emailVerified": true,
  "accountLocked": false,
  "failedLoginAttempts": 0,
  "createdAt": "2026-06-01T10:00:00Z",
  "updatedAt": "2026-07-01T15:30:00Z",
  "lastLoginAt": "2026-07-10T14:30:00Z",
  "workspaces": [
    {
      "workspaceId": "workspace-123",
      "workspaceSlug": "my-workspace",
      "role": "editor"
    }
  ]
}
```

## Response Fields

### User List

| Field | Type | Description |
|-------|------|-------------|
| `items` | array | Array of user objects |
| `total` | number | Total number of users |
| `page` | number | Current page number |
| `perPage` | number | Items per page |

### User Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique user ID (UUID) |
| `username` | string | Username |
| `fullName` | string | User's full name |
| `email` | string | Email address |
| `platformRole` | string | Platform role (SUPER_ADMIN, USER) |
| `emailVerified` | boolean | Whether email is verified |
| `accountLocked` | boolean | Whether account is locked |
| `failedLoginAttempts` | number | Number of failed login attempts |
| `createdAt` | string | ISO 8601 timestamp of creation |
| `updatedAt` | string | ISO 8601 timestamp of last update |
| `lastLoginAt` | string | ISO 8601 timestamp of last login |
| `workspaces` | array | User's workspace memberships (on get) |

## Use Cases

### Find Users by Email

```bash
marvin admin users list --json | jq '.items[] | select(.email | contains("@example.com"))'
```

### Count Total Users

```bash
marvin admin users list --json | jq '.total'
```

Output:

```
42
```

### Find Locked Accounts

```bash
marvin admin users list --json | jq '.items[] | select(.accountLocked == true)'
```

### Find Super Admins

```bash
marvin admin users list --json | jq '.items[] | select(.platformRole == "SUPER_ADMIN")'
```

### Export All Users

```bash
# Paginate through all users
PAGE=1
PER_PAGE=100

while true; do
  USERS=$(marvin admin users list --page $PAGE --per-page $PER_PAGE --json)
  ITEMS=$(echo "$USERS" | jq '.items | length')
  
  if [ "$ITEMS" -eq 0 ]; then
    break
  fi
  
  echo "$USERS" | jq '.items[]' >> all-users.json
  PAGE=$((PAGE + 1))
done

echo "Exported all users to all-users.json"
```

### Send Password Reset Link

```bash
USER_ID="01234567-89ab-cdef-0123-456789abcdef"
TOKEN=$(marvin admin users reset-password $USER_ID | grep "token:" | awk '{print $3}')

echo "Password reset link: https://app.marvin.com/reset-password?token=$TOKEN"
```

## Scripting Examples

### Bash Script

```bash
#!/bin/bash

# User audit report

echo "User Audit Report"
echo "================="

# Get all users (first page)
USERS=$(marvin admin users list --per-page 100 --json)
TOTAL=$(echo "$USERS" | jq '.total')

echo "Total users: $TOTAL"

# Count by role
SUPER_ADMINS=$(echo "$USERS" | jq '[.items[] | select(.platformRole == "SUPER_ADMIN")] | length')
REGULAR_USERS=$(echo "$USERS" | jq '[.items[] | select(.platformRole == "USER")] | length')

echo "Super Admins: $SUPER_ADMINS"
echo "Regular Users: $REGULAR_USERS"

# Find locked accounts
LOCKED=$(echo "$USERS" | jq '[.items[] | select(.accountLocked == true)] | length')

if [ "$LOCKED" -gt 0 ]; then
  echo -e "\n⚠️  Locked Accounts: $LOCKED"
  echo "$USERS" | jq -r '.items[] | select(.accountLocked == true) | "\(.username) (\(.email))"'
fi

# Find users who haven't logged in recently
echo -e "\nUsers inactive for 30+ days:"
CUTOFF=$(date -u -d '30 days ago' +%Y-%m-%dT%H:%M:%SZ)
echo "$USERS" | jq -r --arg cutoff "$CUTOFF" '.items[] | select(.lastLoginAt < $cutoff or .lastLoginAt == null) | "\(.username) - Last login: \(.lastLoginAt // "never")"'
```

### Node.js

```javascript
const { execSync } = require('child_process');

async function getAllUsers() {
  const users = [];
  let page = 1;
  const perPage = 100;
  
  while (true) {
    const result = JSON.parse(
      execSync(
        `marvin admin users list --page ${page} --per-page ${perPage} --json`,
        { encoding: 'utf-8' }
      )
    );
    
    users.push(...result.items);
    
    if (result.items.length < perPage) {
      break;
    }
    
    page++;
  }
  
  return users;
}

// Example usage
getAllUsers().then(users => {
  console.log(`Total users: ${users.length}\n`);
  
  // Group by platform role
  const byRole = users.reduce((acc, user) => {
    acc[user.platformRole] = (acc[user.platformRole] || 0) + 1;
    return acc;
  }, {});
  
  console.log('Users by Role:');
  Object.entries(byRole).forEach(([role, count]) => {
    console.log(`  ${role}: ${count}`);
  });
  
  // Find inactive users (no login in 90+ days)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000);
  const inactive = users.filter(u => {
    if (!u.lastLoginAt) return true;
    return new Date(u.lastLoginAt) < ninetyDaysAgo;
  });
  
  if (inactive.length > 0) {
    console.log(`\n⚠️  ${inactive.length} inactive users (90+ days)`);
    inactive.slice(0, 5).forEach(u => {
      console.log(`  ${u.username} - ${u.lastLoginAt || 'never'}`);
    });
  }
});
```

### Python

```python
import subprocess
import json
from datetime import datetime, timedelta

def get_all_users():
    """Fetch all users with pagination"""
    users = []
    page = 1
    per_page = 100
    
    while True:
        result = subprocess.run(
            ['marvin', 'admin', 'users', 'list',
             '--page', str(page),
             '--per-page', str(per_page),
             '--json'],
            capture_output=True,
            text=True
        )
        
        data = json.loads(result.stdout)
        users.extend(data['items'])
        
        if len(data['items']) < per_page:
            break
        
        page += 1
    
    return users

# Get all users
users = get_all_users()

print(f"Total Users: {len(users)}\n")

# Analyze by platform role
from collections import Counter

roles = Counter(u['platformRole'] for u in users)
print("Users by Role:")
for role, count in roles.items():
    print(f"  {role}: {count}")

# Find users with unverified emails
unverified = [u for u in users if not u.get('emailVerified')]
print(f"\nUnverified Emails: {len(unverified)}")

# Find locked accounts
locked = [u for u in users if u.get('accountLocked')]
if locked:
    print(f"\n⚠️  Locked Accounts: {len(locked)}")
    for user in locked:
        print(f"  {user['username']} ({user['email']})")
        print(f"    Failed attempts: {user.get('failedLoginAttempts', 0)}")

# Export to CSV
import csv

with open('users-audit.csv', 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=[
        'id', 'username', 'email', 'platformRole',
        'emailVerified', 'accountLocked', 'lastLoginAt'
    ])
    writer.writeheader()
    
    for user in users:
        writer.writerow({
            'id': user['id'],
            'username': user['username'],
            'email': user['email'],
            'platformRole': user['platformRole'],
            'emailVerified': user.get('emailVerified'),
            'accountLocked': user.get('accountLocked'),
            'lastLoginAt': user.get('lastLoginAt', '')
        })

print("\nExported to users-audit.csv")
```

## Error Handling

### 401 Unauthorized

Not authenticated:

```bash
marvin login
```

### 403 Forbidden

Requires `SUPER_ADMIN` role:

```
Error: Insufficient permissions. SUPER_ADMIN role required.
```

Only users with the `SUPER_ADMIN` platform role can access admin user commands.

### 404 Not Found

User doesn't exist:

```bash
# List users to find valid IDs
marvin admin users list --json | jq -r '.items[].id'
```

### Unlock Already Unlocked Account

Unlocking an already unlocked account succeeds (idempotent operation):

```bash
marvin admin users unlock <user-id>
# ✓ User <user-id> unlocked successfully
```

## Security Considerations

- **Admin Access Only**: These commands require `SUPER_ADMIN` platform role
- **Password Reset Tokens**: Tokens are single-use and expire after 24 hours
- **Account Unlocking**: Only unlocks the account; doesn't reset failed login attempts
- **Audit Trail**: All admin actions are logged in the event log
- **User Privacy**: Passwords are never visible; only reset tokens can be generated

## Related Commands

- [`marvin login`](auth.md) - Authenticate with Marvin
- [`marvin event-log list`](event-log.md) - View user activity
- [`marvin admin system`](admin-system.md) - System information

## API Reference

This command calls:

```
GET /api/admin/users
GET /api/admin/users/{user_id}
POST /api/admin/users/{user_id}/reset-password
POST /api/admin/users/{user_id}/unlock
```

See [API Mapping](../reference/api-mapping.md) for more details.
