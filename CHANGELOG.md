# [2.6.0-next.8](https://github.com/inneropen/marvin-cli/compare/v2.6.0-next.7...v2.6.0-next.8) (2026-07-11)


### Bug Fixes

* **security:** Eliminate critical credential exposure vulnerabilities ([a96a86a](https://github.com/inneropen/marvin-cli/commit/a96a86a4c7f4238828a14b6cbe05160daf5e0543)), closes [HI#priority](https://github.com/HI/issues/priority)

# [2.6.0-next.7](https://github.com/inneropen/marvin-cli/compare/v2.6.0-next.6...v2.6.0-next.7) (2026-07-10)


### Bug Fixes

* Use PUBLISHING_TOKEN parameter name ([1596319](https://github.com/inneropen/marvin-cli/commit/15963195450f0f2658d169abc55b44b10dc16db5))

# [2.6.0-next.6](https://github.com/inneropen/marvin-cli/compare/v2.6.0-next.5...v2.6.0-next.6) (2026-07-10)


### Bug Fixes

* Map INNEROPEN_IO_TOKEN to GITHUB_TOKEN parameter ([7f96be8](https://github.com/inneropen/marvin-cli/commit/7f96be883566fa00ee995e02b2846d5fa0825679))

# [2.6.0-next.5](https://github.com/inneropen/marvin-cli/compare/v2.6.0-next.4...v2.6.0-next.5) (2026-07-10)


### Features

* Add automatic publishing to inneropen.io ([4170b64](https://github.com/inneropen/marvin-cli/commit/4170b6479a97daa1bd9a83145df3e7f2ce205c76))

# [2.6.0-next.4](https://github.com/inneropen/marvin-cli/compare/v2.6.0-next.3...v2.6.0-next.4) (2026-07-10)


### Bug Fixes

* Adding deps to develop ([8a4fb5e](https://github.com/inneropen/marvin-cli/commit/8a4fb5ed2c35d568e4fc50b2720ab2375b865546))


### Features

* Add Forms module to Platform CLI ([d5f52ba](https://github.com/inneropen/marvin-cli/commit/d5f52bad7ec1766ef3531f6026f03945a24bb449))
* Add scheduled-tasks commands to platform CLI ([269523b](https://github.com/inneropen/marvin-cli/commit/269523b259e6161a5df11d755194792b6dc46fa5))

# [2.6.0-next.3](https://github.com/inneropen/marvin-cli/compare/v2.6.0-next.2...v2.6.0-next.3) (2026-07-10)


### Bug Fixes

* Update email templates commands to match CLI patterns and fix type errors ([0153166](https://github.com/inneropen/marvin-cli/commit/01531668691cc60f1610c728fe46c3594b79ca96))


### Features

* Add email templates commands to marvin-cli ([709097b](https://github.com/inneropen/marvin-cli/commit/709097b96aa8c38f6bfd4881286fb5e646a7c65e))

# [2.6.0-next.2](https://github.com/inneropen/marvin-cli/compare/v2.6.0-next.1...v2.6.0-next.2) (2026-07-09)


### Bug Fixes

* Call toJSON() on Collection objects before rendering ([c0942e6](https://github.com/inneropen/marvin-cli/commit/c0942e6d7d5ad56dda074c0bc411bebbea2cc6e7))
* Complete error handling migration in auth commands ([709ebce](https://github.com/inneropen/marvin-cli/commit/709ebce160f8af887e022f940ee18244d5749d4f))
* Correct SDK dependency format in CI workflows ([eeb2909](https://github.com/inneropen/marvin-cli/commit/eeb2909c539cb1386bf3b3cad271819c079a3ad6))
* Update error imports and collection entries display ([91da5ea](https://github.com/inneropen/marvin-cli/commit/91da5ea5a129b30c2b2f482c28a3de313a3661bf))
* Update GitHub Actions workflows to use published SDK ([f9e7c15](https://github.com/inneropen/marvin-cli/commit/f9e7c152d619a8c624fa0714ffc8f3cd22d6b87e))
* Use correct dist-tag format in CI workflows ([42fc506](https://github.com/inneropen/marvin-cli/commit/42fc506af94f33baf9422c1101f38600e1ab0ff8))


### Features

* Add collection entries and reorder commands ([1f63093](https://github.com/inneropen/marvin-cli/commit/1f630939e343535501162d87c52cb3d8376c4e58))
* Add comprehensive error handling for CLI commands ([b0f154b](https://github.com/inneropen/marvin-cli/commit/b0f154b13c04430609df410821b9c481dbd5dc65))
* Add event-log commands to Platform CLI ([c53b38a](https://github.com/inneropen/marvin-cli/commit/c53b38ad8eca2a9d0313467919b7ae737225bd6c))
* Add order column to collection-entries command output ([728fca3](https://github.com/inneropen/marvin-cli/commit/728fca38ff97685bd0ebf38506d07bee1d1416ec))
* Apply error handling to auth commands ([ce20a21](https://github.com/inneropen/marvin-cli/commit/ce20a2194f80117b002162912289e3b84f778ca8))

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
