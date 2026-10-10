# Admin Maintenance

Storage use and system statistics for platform administrators (requires SUPER_ADMIN role). These commands
only read; cleanup runs as **system scheduled tasks** (below).

## Commands

```bash
marvin admin maintenance summary   # data directory size
marvin admin maintenance stats     # counts (users, workspaces, entries, assets, tokens, webhooks) and sizes
marvin admin maintenance storage   # temp, backups, seeds and plugins directory sizes
```

Each takes the global output options (`--json`, `--yaml`, `--output table|json|yaml`).

## Cleanup

Marvin cleans up on a schedule, and each run is recorded in the task's history. To run one now, by slug:

```bash
marvin admin scheduled-tasks run cleanup_temp_files     # temporary uploads older than age_hours (24)
marvin admin scheduled-tasks run prune_revoked_tokens   # API tokens / site clients revoked over age_days (30) ago
marvin admin scheduled-tasks run prune_event_logs       # audit events past retention
marvin admin scheduled-tasks run optimize_database      # VACUUM + ANALYZE (disabled by default: on demand)
marvin admin scheduled-tasks history <id>               # what a run did
```

`marvin admin scheduled-tasks list` shows every system task with its schedule and last run. The old
`admin maintenance clean-temp`, `cleanup`, `clear-cache` and `optimize` commands are gone, with the endpoints
they called.

## Related Commands

- [`marvin admin system stats`](admin-system.md) - System statistics
- [`marvin scheduled-tasks`](scheduled-tasks.md) - Workspace scheduled tasks

## API Reference

```
GET /api/admin/maintenance
GET /api/admin/maintenance/stats
GET /api/admin/maintenance/storage
GET /api/admin/scheduled-tasks
POST /api/admin/scheduled-tasks/{task_id}/execute
```
