# Changelog

## [1.1.0] - 2026-07-07

### ✨ Added
- **API Clients Commands** - Manage publishing API tokens via Platform API
  - `marvin platform api-clients list` - List all API clients
  - `marvin platform api-clients get <id>` - Get API client details
  - `marvin platform api-clients create` - Create new API client (returns token)
  - `marvin platform api-clients update <id>` - Update API client metadata
  - `marvin platform api-clients delete <id>` - Delete API client
  - `marvin platform api-clients rotate-token <id>` - Generate new token
  - `marvin platform api-clients preview <id>` - Preview token metadata (NEW)

- **Workspace Members Commands** - Manage workspace members and roles
  - `marvin platform workspace-members list <workspace-id>` - List workspace members
  - `marvin platform workspace-members get <workspace-id> <user-id>` - Get member details
  - `marvin platform workspace-members add <workspace-id>` - Add user to workspace
  - `marvin platform workspace-members update-role <workspace-id> <user-id>` - Update member role
  - `marvin platform workspace-members remove <workspace-id> <user-id>` - Remove member

### 🐛 Fixed
- Health check endpoint updated to `/api/app/health` (was `/health`)

### 🔧 Changed
- Updated SDK dependency to `^1.3.0` for workspace members support
- Platform commands now use generated OpenAPI types from SDK

### 📊 Statistics
- Total commands: 47 (was 41)
- Platform API commands: 34 (was 28)
- Publishing API commands: 11 (unchanged)
- System commands: 2 (unchanged)

## [1.0.3] - 2026-07-06

### 🎉 Initial public release
- Publishing API commands (read-only)
- Platform API commands (CRUD)
- Backward compatible root-level aliases
- Credential management with login/logout
- Zero direct HTTP calls (all via SDK)
