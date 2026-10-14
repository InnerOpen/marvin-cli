# Workspaces

Switch between workspaces, store site tokens for the Publishing API, and export, back up, import and
inspect the current workspace.

## Commands

```bash
marvin workspace current
marvin workspace use <workspace>
marvin workspace list
marvin workspace token [--for <slug>] [--from-stdin]
marvin workspace token:remove [--for <slug>]
marvin workspace export [-o, --out-file <file>] [--include-system-types] [--no-pretty]
marvin workspace import --file <path> [--overwrite]
marvin workspace preferences
marvin workspace preferences update (--data <json|@file|-> | --file <path>)
marvin workspace stats
marvin workspace backups list
marvin workspace backups create
marvin workspace backups download <filename> [-o, --out-file <file>]
```

All commands except `current`, `token` and `token:remove` call the Platform API and need a user token
(`marvin login`, see [Authentication](auth.md)); those three only read and write the local
credentials file.

!!! note "Required role"
    `workspace export` and `workspace backups` need the workspace **ADMIN** (or OWNER) role; without
    it the command fails with `Permission denied (403)` and names the role it needs. `workspace
    import` is restricted to a workspace **OWNER** (or a super admin) by the API. See
    [Workspace roles](../reference/authentication.md#workspace-roles).

## workspace current

Prints the active workspace slug from the local credentials; no network call. With `--json` /
`--yaml` it prints `{"slug": "<slug>"}` (`null` when none is set).

```bash
marvin workspace current          # Active workspace: acme
marvin workspace current --json | jq -r '.slug'
```

## workspace use

Sets the active workspace by slug or ID, on the server session and in the local credentials. An unknown
workspace prints the error and suggests `marvin workspace list`.

```bash
marvin workspace use acme
```

## workspace list

Lists the workspaces you can access. Table mode prints each as `name (slug)` with your role, an
`ACTIVE` marker, the workspace ID, and a key symbol when a site token is stored for it. With
`--json` you get an array of `{workspace: {id, slug, name}, role, isActive}`.

```bash
marvin workspace list
marvin workspace list --json | jq -r '.[].workspace.slug'
```

## workspace token

`workspace token` stores a site client token (for `marvin publish ...`) for a workspace. The token is **not** a
command argument: you are prompted with hidden input, or pass `--from-stdin` to read it from a
pipe. `workspace token:remove` deletes the stored token (and says so if none is stored).

| Option | Description | Default |
|--------|-------------|---------|
| `--for <slug>` | Workspace slug | Active workspace |
| `--from-stdin` | (`token` only) Read the token from stdin | `false` |

```bash
marvin workspace token                                    # prompts
echo "$SITE_TOKEN" | marvin workspace token --from-stdin --for client-project
marvin workspace token:remove --for client-project
```

The stored token is used by `marvin publish` ahead of the `MARVIN_SITE_CLIENT_TOKEN` variable. You can
also save one with `marvin login --site-token <token> --workspace <slug>`.

## workspace export

Exports the whole workspace as a JSON seed (content, structure, settings, integrations, workflows)
for restore or migration. For a restorable ZIP use `workspace backups create`.

| Option | Description | Default |
|--------|-------------|---------|
| `-o, --out-file <file>` | Write to a file instead of stdout | stdout |
| `--include-system-types` | Include system entry types | `false` |
| `--no-pretty` | Compact JSON instead of pretty-printed | pretty |

```bash
marvin workspace export --out-file workspace.json
marvin workspace export --include-system-types --no-pretty > workspace.json
```

## workspace import

Imports a workspace bundle (a ZIP from `workspace backups create` / `download`).

| Option | Description | Default |
|--------|-------------|---------|
| `--file <path>` | Path to the ZIP bundle (required) | none |
| `--overwrite` | Overwrite existing records matched by slug | `false` |

!!! warning
    `--overwrite` updates entries, collections, resources and assets that match by slug, and rebuilds
    their junction rows.

```bash
marvin workspace import --file backup.zip
marvin workspace import --file backup.zip --overwrite
```

It prints the number imported per record type.

## workspace preferences

`marvin workspace preferences` shows the current workspace's preferences. `preferences update`
changes them from a JSON payload (`--data` inline, `@file` or `-` for stdin, or `--file <path>`);
only the fields you send change, and the updated preferences are printed.

Fields include `siteTitle`, `siteTagline`, `siteDescription`, `siteCanonicalUrl`, `siteLogo`,
`siteFavicon`, `siteLocale`, `siteTimezone`, `siteContactEmail`, `siteAutoRebuild`, `siteSocialJson`,
`siteMetadataJson`, `submissionProtectionJson`, `privateGroup`, `firstDayOfWeek` and
`scheduledPublishRequiresApproval`.

```bash
marvin workspace preferences
marvin workspace preferences update --data '{"siteTitle":"Acme","siteTimezone":"Europe/London"}'
marvin workspace preferences update --file prefs.json
```

## workspace stats

Shows platform-level counts for the current workspace (for example entries, assets, collections,
webhooks, scheduled tasks, secrets, variables, members and AI usage).

```bash
marvin workspace stats
marvin workspace stats --json
```

## workspace backups

Server-side backups of the current workspace.

| Command | What it does |
|---------|--------------|
| `backups list` | List available backups |
| `backups create` | Create a new backup and print the result |
| `backups download <filename> [-o, --out-file <file>]` | Download a backup by filename. Use `--out-file` for the ZIP; without it the data goes to stdout. |

```bash
marvin workspace backups create
marvin workspace backups list
marvin workspace backups download acme-2026-10-14.zip --out-file backup.zip
```

## Examples

```bash
# Switch workspace and publish its content
marvin workspace use production
marvin publish entries --json > public/data/entries.json

# Run one command against another workspace without switching
marvin --workspace staging platform entries list
```

## Related Commands

- [`marvin login`](auth.md#login) - Authenticate and save credentials
- [`marvin publish site`](site.md) - Publishing API (uses the stored site token)
- [Workspace members](workspace-members.md) - Manage members and roles
