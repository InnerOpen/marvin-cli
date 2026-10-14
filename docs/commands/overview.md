# Commands Overview

The Marvin CLI is organised into a handful of command groups that map to different Marvin APIs, plus a few top-level commands for signing in.

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

| Group | Purpose | Credential |
|-------|---------|------------|
| `login`, `logout`, `register`, `forgot-password`, `reset-password` | Sign in, sign out, create an account, reset a password | None (they save or clear credentials) |
| `workspace` | Switch workspace, site tokens, export, import, backups, preferences, stats | User token |
| `publish` | Read-only Publishing API | Site client token |
| `platform` | Workspace content and configuration (create, read, update, delete) | User token |
| `admin` | Instance administration | User token of a SUPER_ADMIN |
| `user` | Your own profile and personal API tokens | User token |
| `events` | What sends each event type and what reacts to it | User token |
| `system` | Health and version of the server | None |

`publish` is hidden from `marvin --help` until a site token is available, and `workspace`, `platform`,
`admin`, `user` and `events` are hidden until a user token is available; hidden commands still run.
See [Authentication](auth.md) for how tokens are saved and resolved.

### Sign in (top level)

```bash
marvin login                      # prompts for a user token
marvin login --site-token <token> --workspace <slug>
marvin logout [--site-token | --all]
marvin register
marvin forgot-password <email>
marvin reset-password --token <token> --password <newPassword>
```

There is no `marvin auth` group and no `whoami`; use `marvin user profile show`.

**Learn more**: [Authentication Commands](auth.md)

### Workspace (`workspace`)

```bash
marvin workspace current | use <workspace> | list
marvin workspace token | token:remove
marvin workspace export | import
marvin workspace preferences [update] | stats
marvin workspace backups list | create | download <filename>
```

**Learn more**: [Workspaces](workspaces.md)

### Publishing API (`publish`)

Read-only commands for accessing published content. Uses a site client token (`--site-token`,
a token saved with `marvin workspace token`, or `MARVIN_SITE_CLIENT_TOKEN`).

| Command | Description |
|---------|-------------|
| `site` | Get workspace site configuration |
| `entries` | List published entries |
| `entry <slug>` | Get a single entry |
| `collections` | List collections |
| `collection <slug>` | Get a collection |
| `collection-entries <slug>` | List entries in a collection |
| `resources` | List resources |
| `resource <slug>` | Get a resource |
| `resource-entries <slug>` | List entry slugs that use a resource |
| `assets` | List assets |
| `asset <slug>` | Get an asset, or download its file with `--download` |
| `renderers` | List the renderers the workspace needs |

**Learn more**: [Site](site.md), [Entries](entries.md), [Collections](collections.md),
[Resources](resources.md), [Assets](assets.md), [Renderers](renderers.md)

### Platform API (`platform`)

Full CRUD for workspace content and configuration. Uses a user token (`MARVIN_USER_TOKEN` or
`marvin login`) and the active workspace.

| Group | Description | Page |
|-------|-------------|------|
| `entries` | Manage entries (all statuses) | [Platform Entries](platform-entries.md) |
| `collections` | Manage collections (including smart collections) | [Platform Collections](platform-collections.md), [Smart Collections](smart-collections.md) |
| `resources` | Manage resources | [Platform Resources](platform-resources.md) |
| `assets` | Manage assets | [Platform Assets](platform-assets.md) |
| `entry-types` | Manage entry types | [Entry Types](entry-types.md) |
| `tags` | The shared tag vocabulary | [Tags](tags.md) |
| `forms` | Form definitions and submissions | [Forms](forms.md) |
| `webhooks` | Outgoing webhooks | [Webhooks](webhooks.md) |
| `incoming-webhooks` | URLs outside services POST to, to trigger workflows | [Incoming Webhooks](incoming-webhooks.md) |
| `workflows` | Triggers, conditions, actions and runs | [Workflows](workflows.md) |
| `integrations` | Provider connections, event subscriptions, error handling | [Integrations](integrations.md) |
| `scheduled-tasks` | Scheduled task automation | [Scheduled Tasks](scheduled-tasks.md) |
| `api-clients` | Publishing API tokens | [API Clients](api-clients.md) |
| `workspace-members`, `invites` | Members, roles and invitation tokens | [Workspace Members & Invites](workspace-members.md) |
| `email-templates` | Workspace email templates | [Email Templates](email-templates.md) |
| `email`, `email-subscriptions` | Email settings, SMTP and event subscriptions | [Email](email.md) |
| `secrets`, `variables` | Write-only secrets and plain-text variables | [Secrets & Variables](secrets-variables.md) |
| `event-log` | Event log and audit trail | [Event Log](event-log.md) |
| `site` | Request a site rebuild and check its status | [Site Rebuild](site-rebuild.md) |
| `blueprints` | Ready-made collections, entry types, tasks and workflows | [Blueprints](blueprints.md) |
| `ai` | Providers, models, operations, executions and AI settings | [AI](ai.md) |
| `dashboard` | What needs attention: inbox, drafts, review, AI suggestions, failures | [Review Queue](review.md) |

Workspace-level commands (`marvin workspace ...`) are on the [Workspaces](workspaces.md) page.

### Events (`events`)

`marvin events list` and `marvin events show <event-type>` show what sends each event type and what
reacts to it. See [Events](events.md).

### Admin API (`admin`)

Instance administration. Requires a user token belonging to a **SUPER_ADMIN**.

| Group | Description | Page |
|-------|-------------|------|
| `users` | Manage users | [Users](admin-users.md) |
| `system` | System information and settings | [System](admin-system.md) |
| `maintenance`, `scheduled-tasks` | Maintenance information and system-wide scheduled tasks | [Maintenance & Scheduled Tasks](admin-maintenance.md) |
| `backups` | System backups | [Backups](admin-backups.md) |
| `email` | System email settings and templates | [Admin Email](admin-email.md) |
| `groups`, `workspace-members` | Workspaces and their memberships | [Groups & Members](admin-groups.md) |

### User (`user`)

Self-service commands for the signed-in user: `user profile`, `user tokens` and `user change-password`.
See [User Account](user.md).

### System (`system`)

`marvin system health` and `marvin system version` need no credentials. See
[Health & Version](system.md).

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
marvin login
marvin workspace list
marvin platform entries list
marvin platform entries create --data @entry.json
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
marvin platform entries list              # All entries (any status)
marvin platform entries create --data @entry.json
marvin platform entries update <id> --data @changes.json
marvin platform site rebuild              # Rebuild the static site
```

#### Data Export

```bash
marvin publish entries --json    # JSON export
marvin publish assets --csv      # CSV export
marvin publish resources --yaml  # YAML export
```

#### Workspace Administration

```bash
marvin workspace list                        # List workspaces
marvin workspace current                     # Active workspace
marvin platform workspace-members list <workspace-id>   # Members
marvin platform invites list                 # Invitations
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
marvin platform entries create --help
```

## Next Steps

- **Get started**: [Quick Start Guide](../getting-started/quickstart.md)
- **Learn filtering**: [Filtering & Querying](../guides/filtering.md)
- **See examples**: [Common Tasks](../examples/common-tasks.md)
- **Reference**: [API Mapping](../reference/api-mapping.md)

## Command Index

### Sign in and workspaces

- [Authentication](auth.md)
- [Workspaces](workspaces.md)

### Publishing API

- [Site Configuration](site.md)
- [Entries](entries.md)
- [Collections](collections.md)
- [Resources](resources.md)
- [Assets](assets.md)
- [Renderers](renderers.md)

### Platform API

- [Platform Entries](platform-entries.md)
- [Platform Collections](platform-collections.md)
- [Platform Resources](platform-resources.md)
- [Platform Assets](platform-assets.md)
- [Entry Types](entry-types.md)
- [Tags](tags.md)
- [Smart Collections](smart-collections.md)
- [Forms](forms.md)
- [Webhooks](webhooks.md)
- [Incoming Webhooks](incoming-webhooks.md)
- [Workflows](workflows.md)
- [Integrations](integrations.md)
- [Scheduled Tasks](scheduled-tasks.md)
- [API Clients](api-clients.md)
- [Workspace Members & Invites](workspace-members.md)
- [Email Templates](email-templates.md)
- [Email](email.md)
- [Secrets & Variables](secrets-variables.md)
- [Event Log](event-log.md)
- [Events](events.md)
- [Site Rebuild](site-rebuild.md)
- [Review Queue](review.md)
- [Blueprints](blueprints.md)
- [AI](ai.md)

### Admin, user and system

- [Admin Users](admin-users.md)
- [Admin System](admin-system.md)
- [Admin Maintenance & Scheduled Tasks](admin-maintenance.md)
- [Admin Backups](admin-backups.md)
- [Admin Email](admin-email.md)
- [Admin Groups & Members](admin-groups.md)
- [User Account](user.md)
- [Health & Version](system.md)

### Other

- [Output Formats](output-formats.md)
