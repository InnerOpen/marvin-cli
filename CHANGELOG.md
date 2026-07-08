# [2.6.0-next.1](https://github.com/inneropen/marvin-cli/compare/v2.5.7...v2.6.0-next.1) (2026-07-08)


### Bug Fixes

* Add npm-production environment to release workflow ([c00de05](https://github.com/inneropen/marvin-cli/commit/c00de050fc79ae71d888a7c97fb1c58d1a180a96))
* Update Node.js version to 22.14 in release workflow ([d7247ed](https://github.com/inneropen/marvin-cli/commit/d7247ed92540196c9b529f08ca93b96ad333229f))


### Features

* Add semantic-release automation ([5f199fa](https://github.com/inneropen/marvin-cli/commit/5f199faba7dc72d8caa2800fba75f7200ade118b))

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
