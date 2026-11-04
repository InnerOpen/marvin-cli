# Maintenance & Scheduled Tasks

Storage and statistics for the Marvin server, and the system-wide scheduled tasks that do its
housekeeping. Cleanup is no longer a set of `maintenance` commands: it runs as scheduled tasks, which you
can also trigger by hand with `marvin admin scheduled-tasks run`.

## Commands

```bash
marvin admin maintenance summary
marvin admin maintenance stats
marvin admin maintenance storage

marvin admin scheduled-tasks list
marvin admin scheduled-tasks log [--limit <n>]
marvin admin scheduled-tasks types
marvin admin scheduled-tasks get <id>
marvin admin scheduled-tasks run <id-or-slug>
marvin admin scheduled-tasks history <id> [--limit <n>]
marvin admin scheduled-tasks create (--data <json|@file|-> | --file <path>)
marvin admin scheduled-tasks update <id> (--data <json|@file|-> | --file <path>)
marvin admin scheduled-tasks delete <id> --yes
```

!!! note "Required role"
    Every `marvin admin` command needs the **SUPER_ADMIN** platform role. Without it the command fails
    with `Permission denied (403)`. Tasks that belong to a single workspace are managed with
    [`marvin platform scheduled-tasks`](scheduled-tasks.md) and need the workspace ADMIN role instead.

## Maintenance

These three commands only read; none takes options beyond the [global options](overview.md).

```bash
marvin admin maintenance summary   # dataDirSize: size of the data directory
marvin admin maintenance storage   # tempDirSize, backupsDirSize, seedsDirSize, pluginDirSize
marvin admin maintenance stats     # maintenance statistics as reported by the server
```

```bash
marvin admin maintenance storage --json | jq -r '.tempDirSize'
```

Sizes are strings as formatted by the server. The old `maintenance clean-temp`, `cleanup`,
`clear-cache` and `optimize` commands are gone; use the scheduled tasks below.

## Scheduled tasks

System scheduled tasks span all workspaces. Each has an `id` (UUID), a `slug`, a `taskType`, a schedule
(`scheduleType` of `cron`, `interval` or `once`, plus `scheduleConfig`) and a `taskConfig`.

### List, types and get

```bash
marvin admin scheduled-tasks list
marvin admin scheduled-tasks types
marvin admin scheduled-tasks get 7d1b6a52-0c3e-4f1a-8a47-92e0d5c4b3f1
```

`list` columns: `id`, `name`, `slug`, `taskType`, `enabled`, `lastStatus`, `nextRunAt`. `types` lists the
available task types (task type, name, description) that `create` accepts. `get` takes the task id and
prints the full record: schedule and task config, `retryPolicy`, `lastRunAt`, `lastDurationMs`,
`failureCount` and timestamps.

### Run

```bash
marvin admin scheduled-tasks run cleanup_temp_files
marvin admin scheduled-tasks run optimize_database
marvin admin scheduled-tasks run 7d1b6a52-0c3e-4f1a-8a47-92e0d5c4b3f1
```

Triggers one execution now. The argument is the task id or its slug; a slug is looked up in `list` and
must match exactly one task, otherwise the command fails and asks you to use the id. Prints
`Executed task <id-or-slug>`, or `{"ok": true, "taskId": "<id>"}` with `--json`. Read the outcome
with `history`.

### Log and history

```bash
marvin admin scheduled-tasks log --limit 20
marvin admin scheduled-tasks history 7d1b6a52-0c3e-4f1a-8a47-92e0d5c4b3f1 --limit 5
```

| Option | Description | Default |
|--------|-------------|---------|
| `--limit <n>` | Maximum number of entries | server default |

`log` is the execution log across all tasks; `history` is the same for one task (by id). Columns: `id`,
`taskId`, `status`, `executedAt`, `durationMs`, `errorMessage`.

### Create and update

```bash
marvin admin scheduled-tasks create --data '{
  "name": "Weekly temp cleanup",
  "taskType": "cleanup_temp_files",
  "scheduleType": "cron",
  "scheduleConfig": {"cron_expression": "0 2 * * 0"},
  "taskConfig": {"age_hours": 24},
  "enabled": true
}'

marvin admin scheduled-tasks update 7d1b6a52-0c3e-4f1a-8a47-92e0d5c4b3f1 --data '{"enabled": false}'
```

| Option | Description | Default |
|--------|-------------|---------|
| `--data <json\|@file\|->` | Task data as inline JSON, `@path` to read a file, or `-` for stdin | none |
| `--file <path>` | JSON file with the task data (same as `--data @path`; `-` for stdin) | none |

`create` takes `name`, `taskType` (see `types`), `scheduleType`, `scheduleConfig` and `enabled`, and
optionally `slug`, `description`, `taskConfig` and `retryPolicy`. `update` takes any of `name`,
`description`, `enabled`, `scheduleType`, `scheduleConfig`, `taskConfig` and `retryPolicy`; it does not
accept `slug` or `taskType`. Unlike `platform scheduled-tasks update`, there are no `--enable` / `--disable` flags: set
`enabled` in the payload.

### Delete

```bash
marvin admin scheduled-tasks delete 7d1b6a52-0c3e-4f1a-8a47-92e0d5c4b3f1 --yes
```

`--yes` is required; without it the command exits 1 without calling the API. With `--json` the result is
`{"deleted": "<id>"}`.

## Related

- [Admin system](admin-system.md) - server info, counts and plugins
- [Workspace scheduled tasks](scheduled-tasks.md) - tasks scoped to one workspace
