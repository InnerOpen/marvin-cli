# Commands Overview

The Marvin CLI provides three main command groups that map to different Marvin APIs.

## Command Structure

```bash
marvin [global-options] <command-group> <command> [command-options]
```

## Global Options

Available on all commands:

| Option | Description | Default |
|--------|-------------|---------|
| `--api-url <url>` | Override Marvin API URL | `MARVIN_API_URL` |
| `--workspace <slug>` | Override workspace slug | `MARVIN_WORKSPACE_SLUG` |
| `--output <format>` | Output format: table, json, yaml, csv | `table` |
| `--json` | Shortcut for `--output json` | - |
| `--yaml` | Shortcut for `--output yaml` | - |
| `--csv` | Shortcut for `--output csv` | - |
| `--help` | Show help | - |
| `--version` | Show version | - |

## Command Groups

### Publishing API (`publish`)

Read-only commands for accessing published content. Uses site client tokens.

**Authentication**: Site client token (`MARVIN_SITE_CLIENT_TOKEN`)

```bash
marvin publish [command]
```

| Command | Description |
|---------|-------------|
| `site` | Get workspace site configuration |
| `entries` | List all published entries |
| `entry <slug>` | Get a single entry |
| `collections` | List all collections |
| `collection <slug>` | Get a collection |
| `collection-entries <slug>` | List entries in a collection |
| `resources` | List all resources |
| `resource <slug>` | Get a resource |
| `resource-entries <slug>` | List entries using a resource |
| `assets` | List all assets |

**Learn more**: [Publishing API Commands](site.md)

### Platform API (`platform`)

Full CRUD operations for workspace management. Requires user authentication.

**Authentication**: User login (`marvin auth login`) or API client credentials

```bash
marvin platform [command]
```

| Command | Description |
|---------|-------------|
| `workspaces` | Manage workspaces |
| `entries` | Manage entries (all statuses) |
| `entry-types` | Manage entry types |
| `collections` | Manage collections |
| `resources` | Manage resources |
| `assets` | Manage assets |
| `email-templates` | Manage email templates |
| `webhooks` | Manage webhooks |
| `forms` | Manage forms |
| `api-clients` | Manage API clients |
| `event-log` | View event log |
| `notifications` | Manage notifications |
| `scheduled-tasks` | Manage scheduled tasks |
| `workspace-members` | Manage workspace members |
| `invites` | Manage workspace invites |

**Learn more**: [Platform API Commands](workspaces.md)

### Admin API (`admin`)

System administration commands. Requires admin privileges.

**Authentication**: Admin token (`MARVIN_ADMIN_TOKEN`)

```bash
marvin admin [command]
```

| Command | Description |
|---------|-------------|
| `users` | Manage users |
| `system` | System information and settings |
| `maintenance` | Maintenance operations |

**Learn more**: [Admin API Commands](admin-users.md)

### Authentication (`auth`)

User authentication commands.

```bash
marvin auth [command]
```

| Command | Description |
|---------|-------------|
| `login` | Log in with email/password |
| `logout` | Log out |
| `whoami` | Show current user |

**Learn more**: [Authentication Commands](auth.md)

## Quick Reference

### Most Common Commands

```bash
# Get published content
marvin publish entries
marvin publish entry homepage
marvin publish collections
marvin publish assets

# Export data
marvin publish entries --json > entries.json
marvin publish assets --csv > assets.csv

# Filter results
marvin publish entries --entry-type page
marvin publish entries --collection featured
marvin publish assets --type image

# Platform operations
marvin auth login
marvin workspace list
marvin platform entries
marvin platform entry create
```

### By Use Case

#### Content Publishing

```bash
marvin publish site              # Site config
marvin publish entries           # Published entries
marvin publish collections       # Collections
marvin publish assets            # Assets
```

#### Content Management

```bash
marvin platform entries          # All entries (any status)
marvin platform entry create     # Create entry
marvin platform entry update     # Update entry
marvin platform entry publish    # Publish entry
```

#### Data Export

```bash
marvin publish entries --json    # JSON export
marvin publish assets --csv      # CSV export
marvin publish resources --yaml  # YAML export
```

#### Workspace Administration

```bash
marvin workspace list            # List workspaces
marvin workspace info            # Current workspace
marvin workspace members         # Members
marvin workspace invites         # Invitations
```

## Output Formats

All commands support multiple output formats:

### Table (Default)

Human-readable tables in the terminal:

```bash
marvin publish entries
```

```
┌────────────┬─────────┬──────┬───────────┬────────────┐
│ Title      │ Slug    │ Type │ Status    │ Published  │
├────────────┼─────────┼──────┼───────────┼────────────┤
│ Homepage   │ home    │ page │ published │ 2026-07-01 │
└────────────┴─────────┴──────┴───────────┴────────────┘
```

### JSON

Machine-readable JSON:

```bash
marvin publish entries --json
```

```json
[
  {
    "slug": "home",
    "title": "Homepage",
    "entryType": "page",
    "status": "published",
    "publishedAt": "2026-07-01T00:00:00Z"
  }
]
```

### YAML

Human-readable YAML:

```bash
marvin publish entries --yaml
```

```yaml
- slug: home
  title: Homepage
  entryType: page
  status: published
  publishedAt: 2026-07-01T00:00:00Z
```

### CSV

Spreadsheet-compatible CSV:

```bash
marvin publish entries --csv
```

```csv
Title,Slug,Type,Status,Published
Homepage,home,page,published,2026-07-01
```

**Learn more**: [Output Formats](output-formats.md)

## Command Help

Get help for any command:

```bash
# General help
marvin --help

# Command group help
marvin publish --help
marvin platform --help

# Specific command help
marvin publish entries --help
marvin platform entry create --help
```

## Next Steps

- **Get started**: [Quick Start Guide](../getting-started/quickstart.md)
- **Learn filtering**: [Filtering & Querying](../guides/filtering.md)
- **See examples**: [Common Tasks](../examples/common-tasks.md)
- **Reference**: [API Mapping](../reference/api-mapping.md)

## Command Index

### Publishing API

- [Site Configuration](site.md)
- [Entries](entries.md)
- [Collections](collections.md)
- [Resources](resources.md)
- [Assets](assets.md)

### Platform API

- [Workspaces](workspaces.md)
- [Entry Types](entry-types.md)
- [Email Templates](email-templates.md)
- [Webhooks](webhooks.md)
- [Forms](forms.md)
- [API Clients](api-clients.md)
- [Event Log](event-log.md)
- [Notifications](notifications.md)
- [Scheduled Tasks](scheduled-tasks.md)

### Admin API

- [Users](admin-users.md)
- [System](admin-system.md)
- [Maintenance](admin-maintenance.md)

### Other

- [Authentication](auth.md)
- [Output Formats](output-formats.md)
