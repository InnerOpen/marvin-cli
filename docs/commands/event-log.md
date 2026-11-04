# Event Log

The workspace's audit trail: a record of what happened to which entity, and who did it. Filter the
log, follow one entity or one user, and list the event types that subscriptions and workflows can
react to. The commands are `marvin platform event-log …`.

!!! warning "`platform events` is deprecated"
    `marvin platform events …` is an old alias of `platform event-log`. It still works in 3.x with a
    warning on stderr and is removed in 4.0. `marvin events` is a different command: the
    [Events hub](events.md), what sends each event type and what reacts to it.

## Commands

```bash
marvin platform event-log list [--event-type <type>] [--entity-type <type>] [--entity-id <id>] [--user-id <id>] [--start-date <date>] [--end-date <date>] [--limit <n>] [--offset <n>]
marvin platform event-log get <event-id>
marvin platform event-log entity <entity-id> [--entity-type <type>] [--limit <n>] [--offset <n>]
marvin platform event-log user <user-id> [--event-type <type>] [--start-date <date>] [--end-date <date>] [--limit <n>] [--offset <n>]
marvin platform event-log types
```

Any workspace member can run these commands. Dates are ISO 8601 (`2026-07-01` or
`2026-07-01T00:00:00Z`).

## list

List events, newest first, optionally filtered.

```bash
marvin platform event-log list --event-type entry.published --limit 20
marvin platform event-log list --user-id 8a1f… --start-date 2026-07-01 --end-date 2026-07-31
```

| Option | Description | Default |
|--------|-------------|---------|
| `--event-type <type>` | Filter by event type (e.g. `entry.published`) | |
| `--entity-type <type>` | Filter by entity type (e.g. `entry`, `asset`) | |
| `--entity-id <id>` | Filter by entity ID | |
| `--user-id <id>` | Filter by user ID | |
| `--start-date <date>` | Only events on or after this date | |
| `--end-date <date>` | Only events on or before this date | |
| `--limit <number>` | Maximum number of events to return | `50` |
| `--offset <number>` | Number of events to skip | `0` |

Columns: ID (the event id), Event, Occurred, User, Entity Type, Title.

## get

Print one event in full, including its `eventData` payload.

```bash
marvin platform event-log get 5d0c2b7e-3f1a-4c8e-9b64-0a7e12f4d3c1 --json | jq '.eventData'
```

| Argument | Description |
|----------|-------------|
| `<event-id>` | Event ID (the ID column of `list`) |

## entity

Show the complete event history of one entity, such as an entry or an asset.

```bash
marvin platform event-log entity 6f1c9a40-… --entity-type entry
```

| Argument | Description |
|----------|-------------|
| `<entity-id>` | ID of the entry, asset or other entity |

| Option | Description | Default |
|--------|-------------|---------|
| `--entity-type <type>` | Filter by entity type (e.g. `entry`, `asset`) | |
| `--limit <number>` | Maximum number of events to return | `100` |
| `--offset <number>` | Number of events to skip | `0` |

Columns: ID, Event, Occurred, User, Title.

## user

Show what one user did.

```bash
marvin platform event-log user 8a1f… --start-date 2026-07-01 --event-type entry.published
```

| Argument | Description |
|----------|-------------|
| `<user-id>` | User ID |

| Option | Description | Default |
|--------|-------------|---------|
| `--event-type <type>` | Filter by event type (e.g. `entry.published`) | |
| `--start-date <date>` | Only events on or after this date | |
| `--end-date <date>` | Only events on or before this date | |
| `--limit <number>` | Maximum number of events to return | `100` |
| `--offset <number>` | Number of events to skip | `0` |

Columns: ID, Event, Occurred, Entity Type, Entity ID, Title.

## types

List the subscribable event types and the variables each one carries. These are the events that
email subscriptions, integration subscriptions and workflow triggers react to.

```bash
marvin platform event-log types
marvin platform event-log types --json | jq -r '.[].value'
```

Columns: value, label, category, description. `--json` also includes each type's variables.

## Paging

`--limit` and `--offset` page through a long log:

```bash
marvin platform event-log list --limit 50 --offset 0     # page 1
marvin platform event-log list --limit 50 --offset 50    # page 2
```

## Scripting

```bash
# Events per type since the start of the month
marvin platform event-log list --start-date 2026-07-01 --limit 1000 --json \
  | jq -r '.[].eventType' | sort | uniq -c | sort -rn

# Who published what, as CSV
marvin platform event-log list --event-type entry.published --csv
```

## See Also

- [Events hub](events.md) - what sends each event type and what reacts to it
- [Workflows](workflows.md) - triggers that react to these events
- [Integrations](integrations.md) - integration subscriptions to event types
