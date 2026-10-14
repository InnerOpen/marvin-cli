# Scheduled Tasks

Scheduled tasks run built-in maintenance jobs for the workspace on a schedule: an interval, a cron
expression, or once. These commands create and edit them, trigger a run on demand, and read their
execution history.

## Commands

```bash
marvin platform scheduled-tasks list [--enabled-only] [--failed-only]
marvin platform scheduled-tasks get <id-or-slug>
marvin platform scheduled-tasks create (--data <json|@file|-> | --file <path>)
marvin platform scheduled-tasks update <id-or-slug> [--data <json|@file|-> | --file <path>] [--enable | --disable]
marvin platform scheduled-tasks delete <id-or-slug> --yes
marvin platform scheduled-tasks run <id-or-slug>
marvin platform scheduled-tasks history <id-or-slug> [--limit <n>] [--failed-only]
marvin platform scheduled-tasks types [--detailed]
marvin platform scheduled-tasks log [--limit <n>]
marvin platform scheduled-tasks stats
```

`platform tasks` is an alias for `platform scheduled-tasks`, and `execute` is an alias for `run`.

!!! note "Required role"
    Every scheduled-task command except `types`, reads included, needs the workspace **ADMIN** (or
    OWNER) role. Without it the command fails with `Permission denied (403)` and names the role it
    needs. See [Workspace roles](../reference/authentication.md#workspace-roles).

Commands that take `<id-or-slug>` accept either the task's id or its slug. `--data` takes inline JSON,
`@path` to read a file, or `-` for stdin; `--file <path>` is the same as `--data @path`.

## The task object

| Field | Description |
|-------|-------------|
| `name` | Task name (required) |
| `description` | Free text |
| `task_type` | What the task does; `marvin platform scheduled-tasks types` lists them (required) |
| `schedule_type` | `cron`, `interval` or `once` (required) |
| `schedule_config` | Settings for the schedule type, for example `{"interval_seconds": 86400}` (required) |
| `task_config` | Settings for the task type; `types --detailed` shows each type's config schema |
| `enabled` | Whether the task runs |
| `retry_policy` | Retry settings, optional |

Without `--data` or `--file`, `create` prints an example body and exits 1.

## List, get, stats

```bash
marvin platform scheduled-tasks list
marvin platform scheduled-tasks list --failed-only
marvin platform scheduled-tasks get daily-cleanup
marvin platform scheduled-tasks stats
```

| Option (`list`) | Description |
|-----------------|-------------|
| `--enabled-only` | Show only enabled tasks |
| `--failed-only` | Show only tasks whose last status is `failed` |

Columns: id, name, task_type, schedule_type, enabled, last_status, next_run_at.

`stats` counts the workspace's tasks: total, enabled, disabled, never run, and how many last
succeeded or failed. Table output is a short summary (with a hint to run `list --failed-only` when
any failed); `--json` gives `{total, enabled, disabled, never_run, failed, success}`.

## Create

```bash
marvin platform scheduled-tasks create --data '{
  "name": "Daily Cleanup",
  "description": "Clean up old files",
  "task_type": "cleanup_temp_files",
  "schedule_type": "interval",
  "schedule_config": {"interval_seconds": 86400},
  "task_config": {"age_hours": 24},
  "enabled": true
}'
```

Prints `Created scheduled task: <id>` on stderr and the task on stdout.

## Update

```bash
marvin platform scheduled-tasks update daily-cleanup --disable
marvin platform scheduled-tasks update daily-cleanup --data '{"schedule_config": {"interval_seconds": 43200}}'
```

| Option | Description |
|--------|-------------|
| `--data`, `--file` | Fields to change |
| `--enable` | Set `enabled` to true (applied after `--data`; wins over it) |
| `--disable` | Set `enabled` to false |

With none of the four options the command exits 1.

## Delete

```bash
marvin platform scheduled-tasks delete daily-cleanup --yes
```

`--yes` is required; without it the command exits 1. With `--json` it prints `{"deleted": "<id-or-slug>"}`.

## Run now

```bash
marvin platform scheduled-tasks run daily-cleanup
```

Triggers the task immediately, bypassing its schedule, and returns once the run is triggered
(`Task execution triggered`, with `{"ok": true, "task": "<id-or-slug>"}` under `--json`). Read the
outcome with `history`.

## History and log

```bash
marvin platform scheduled-tasks history daily-cleanup --limit 10
marvin platform scheduled-tasks history daily-cleanup --failed-only
marvin platform scheduled-tasks log --limit 100
```

`history` shows one task's executions; `log` shows executions of every task in the workspace.

| Option | Description | Default |
|--------|-------------|---------|
| `--limit <number>` | Records to fetch (`history`: "Number of records to show"; `log`: maximum entries) | `50` |
| `--failed-only` | `history` only: keep failed executions. Applied after `--limit`, so it filters those records | off |

`history` columns: executed_at, status, duration_ms, error_message, retry_attempt. `log` columns:
executed_at, task_id, status, duration_ms, error_message. An empty result prints
`No execution history found` / `No execution log entries found` in table mode.

## Types

```bash
marvin platform scheduled-tasks types
marvin platform scheduled-tasks types --detailed --json
```

| Option | Description |
|--------|-------------|
| `--detailed` | Show detailed metadata including config schemas |

Without `--detailed`, table output is a list of task type names and `--json` an array of names. With
it, a table of task_type, name, description; `--json` adds each type's `config_schema`. Any member can
run `types`.
