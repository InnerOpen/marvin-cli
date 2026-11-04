# Admin System

Read-only information about the Marvin server: version and configuration, record counts, startup
settings, a health check and the installed plugin packages.

## Commands

```bash
marvin admin system info
marvin admin system stats
marvin admin system startup-info
marvin admin system health
marvin admin system plugins
```

None of them take options beyond the [global options](overview.md).

!!! note "Required role"
    Every `marvin admin` command needs the **SUPER_ADMIN** platform role. Without it the command fails
    with `Permission denied (403)`. For an unauthenticated reachability check use
    [`marvin system health`](system.md).

## Info

```bash
marvin admin system info
marvin admin system info --json | jq -r '.version, .versionLatest'
```

Server details as a key/value listing: `version` and `versionLatest`, `buildId`, `production`,
`demoStatus`, `apiPort`, `apiDocs`, `dbType` (and `dbUrl` when the server returns it), `allowSignup`,
`defaultGroup` / `defaultGroupSlug`, and the sign-in and AI switches `enableOidc`, `oidcRedirect`,
`oidcProviderName`, `enableOpenai` and `enableOpenaiImageServices`.

## Stats

```bash
marvin admin system stats
```

Record counts across the whole platform: `users`, `workspaces`, `entries`, `collections`, `resources`
and `assets`.

## Startup info

```bash
marvin admin system startup-info
```

The configuration the server started with, as a key/value listing (for example the version, API port,
database provider, default group and whether sign-up is allowed). Which keys appear depends on the
server version.

## Health

```bash
marvin admin system health
```

Asks the server for its status and prints `System status: <status>` in table mode, or `{"status": "..."}`
with `--json`.

## Plugins

```bash
marvin admin system plugins
```

Lists the installed plugin packages, whether each one loaded, and the integration and AI providers it
adds. Columns: Name, Kind, Version, Loaded (`yes`, or `no: <error>` when the plugin failed to load) and
Providers (`<slug> (<n> ws)`: the provider and how many workspaces use it).

```bash
marvin admin system plugins --json | jq '.[] | select(.ok == false) | {name, error}'
```

## Related

- [Maintenance & scheduled tasks](admin-maintenance.md) - storage figures and housekeeping runs
- [Health & version](system.md) - `marvin system health` and `marvin system version`
