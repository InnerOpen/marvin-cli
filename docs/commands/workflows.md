# Workflows

Manage the workspace's workflows: a trigger, optional conditions and target query, and a list of
actions that run on an event, on a schedule, or on demand. The API and the SDK call them
*automations*; the CLI uses the manual's name, and `marvin platform automations` works as an alias.

!!! note "Required role"
    Every workflow command, reads included, needs the workspace **ADMIN** (or OWNER) role. Without it
    the command fails with `Permission denied (403)` and names the role it needs. See
    [Workspace roles](../reference/authentication.md#workspace-roles).

Every command that takes `<workflow>` accepts the workflow's id or its slug.

## Commands

```bash
marvin platform workflows list
marvin platform workflows get <workflow>
marvin platform workflows options
marvin platform workflows create --data <json|@file|->
marvin platform workflows update <workflow> --data <json|@file|->
marvin platform workflows delete <workflow> --yes
marvin platform workflows enable <workflow>
marvin platform workflows disable <workflow>
marvin platform workflows validate [workflow] [--data <json|@file|->]
marvin platform workflows preview [workflow] [--data <json|@file|->] [--payload <json>]
marvin platform workflows run <workflow> [--dry-run] [--entry-id <id> | --event-id <id>]
marvin platform workflows samples <workflow> [--limit <n>]
marvin platform workflows executions <workflow> [--status <status>] [--limit <n>]
marvin platform workflows execution <workflow> <execution-id>
```

`--data` takes inline JSON, `@path` to read a file, or `-` to read stdin. `--file <path>` is the
same as `--data @path`.

## The definition

A workflow is `{name, slug?, enabled?, definition}`. The definition has four parts:

| Part | What it does |
|------|--------------|
| `trigger` | When it runs: `type` is one of `event`, `manual`, `schedule`, `chained`, `on_error`, `incoming_webhook`, `mcp`; an `event` trigger also names the `event` (e.g. `entry_published`) |
| `target` | Optional. A query (`{"entity": "entry", "query": {...}}`) that selects the entities to act on; without one the actions run on whatever the trigger handed over |
| `conditions` | Optional. `{field, op, value}` checks (ops: `eq`, `neq`, `contains`, `in`, `starts_with`, `exists`, `changed`, `changed_from`, `changed_to`), combinable with `all` / `any` / `not` |
| `actions` | The steps, in order. `kind` is one of the registered executors (`operation`, `integration`, `webhook`, `entry`, `emit_event`, `handler`) |

`marvin platform workflows options` prints the full vocabulary the server accepts — trigger types,
condition fields per trigger, action kinds, AI operations, webhooks — and the definition's JSON
schema.

Example, `tag-new-posts.json`:

```json
{
  "name": "Tag new posts",
  "slug": "tag-new-posts",
  "definition": {
    "trigger": { "type": "event", "event": "entry_published" },
    "conditions": [{ "field": "entry.entry_type", "op": "eq", "value": "post" }],
    "actions": [{ "kind": "operation", "op": "generate_tags", "write_back": true }]
  }
}
```

## List and get

```bash
marvin platform workflows list
```

Columns: ID, Slug, Name, Enabled, Trigger (type and event/schedule), Steps (number of actions).

```bash
marvin platform workflows get tag-new-posts --json
```

Prints the workflow with its full definition.

## Create, update, delete

```bash
marvin platform workflows create --data @tag-new-posts.json
marvin platform workflows update tag-new-posts --data '{"name":"Tag published posts"}'
marvin platform workflows delete tag-new-posts --yes
```

A workflow is **created disabled** unless the body sets `"enabled": true`; the ✓ line on stderr says
so. `update` takes any of `name`, `enabled` and `definition`. `delete` needs `--yes` and prints
`{"deleted": "<id>"}` in JSON mode.

## Enable and disable

```bash
marvin platform workflows enable tag-new-posts
marvin platform workflows disable tag-new-posts
```

A disabled workflow's trigger doesn't fire, and `run` refuses it (a dry run still works). Both print
the updated workflow.

## Validate

```bash
marvin platform workflows validate tag-new-posts            # the saved definition
marvin platform workflows validate --data @definition.json  # a definition, or a workflow body with one
```

An advisory check for steps that use data the trigger doesn't provide, such as `entry.*` conditions
under a webhook trigger. The server never rejects the definition; it returns `issues`, each with a
`level` (`warning` or `error`), `where` (`trigger`, `condition`, `action`), `index` and `message`.

The command **exits 1 when any issue has level `error`**, so it can gate a CI job:

```bash
marvin platform workflows validate --data @workflows/tag-new-posts.json --json
```

## Preview

```bash
marvin platform workflows preview nightly-cleanup
marvin platform workflows preview --data @definition.json --payload '{"slug":"hello"}'
```

Resolves the definition's target query (with an optional test payload for `$event.*` values) and
shows which entities it would act on, without running anything. The result has `total` (the full
match count), `capped` (the run is limited to the first 250), and `matches` (the capped set that
also passes the conditions). A definition without a target query has nothing to preview.

## Run

```bash
marvin platform workflows run tag-new-posts                      # run now
marvin platform workflows run tag-new-posts --dry-run            # what it would do
marvin platform workflows run tag-new-posts --dry-run --entry-id <entry-id>
marvin platform workflows run tag-new-posts --dry-run --event-id <event-id>
```

A real run is the Manual trigger: it skips the trigger and the conditions and runs the actions now.
It prints `{"ok": ..., "status": "ran", "ran": <targets>, "result": {...}}` in JSON mode and
**exits 1 when the run isn't ok**. A disabled workflow can't be run (409).

`--dry-run` evaluates the target and conditions and resolves each action's inputs, but executes
nothing (no AI call, no change, no webhook POST) and records nothing. It works on a disabled
workflow. The result's `plan` lists each step with its resolved inputs and status (`success` = would
run, `failed` = a gate or resolve error stopped it).

An event-triggered workflow is dry-run against a sample event. By default the server uses the latest
matching event; `--entry-id` tests against that entry's latest event of the trigger's type (or one
built for it), `--event-id` against a specific event-log row. The result then also says whether the
trigger matched, whether the conditions pass, and whether a real run would fire. `--entry-id` and
`--event-id` only apply with `--dry-run`, and only one at a time.

## Samples

```bash
marvin platform workflows samples tag-new-posts --limit 5
```

The events (and, for entry triggers, recent entries no event covers) a dry run can test against,
newest first, with whether each passes the conditions. Pass an id from here to
`run --dry-run --event-id` or `--entry-id`.

## Run history

```bash
marvin platform workflows executions tag-new-posts                 # alias: runs
marvin platform workflows executions tag-new-posts --status failed --limit 50
```

Recent runs, newest first: status, trigger, start time, duration, targets run/matched, steps ok/total,
error. `--limit` (default 20) is how many runs to fetch; `--status` filters those: `running`,
`success`, `partial`, `failed`, or `handled` (runs whose failures the integration error policy took
care of). The API has no status filter, so `--limit` counts before filtering.

```bash
marvin platform workflows execution tag-new-posts <execution-id>   # alias: run-detail
```

One run in full. In table mode: a summary (status, trigger, timing, targets, step counts, the run it
retried, the error), a table of per-step records with how the error policy handled each failure, the
retry chain (earlier runs this one retries), and any integration retries still queued. `--json`
prints the API's record, including `actions`, `retryChain`, `retries` and `definitionSnapshot`.

## Walkthrough: dry run, then enable

```bash
# 1. Create it (disabled)
marvin platform workflows create --data @tag-new-posts.json

# 2. Check the definition makes sense for its trigger
marvin platform workflows validate tag-new-posts

# 3. Pick a sample event and see what a run would do
marvin platform workflows samples tag-new-posts
marvin platform workflows run tag-new-posts --dry-run --event-id <event-id>

# 4. Turn it on, and watch its runs
marvin platform workflows enable tag-new-posts
marvin platform workflows executions tag-new-posts
```

## Scripting

stdout carries data only; ✓ lines and dry-run summaries go to stderr.

```bash
# Ids of every disabled workflow
marvin platform workflows list --json | jq -r '.[] | select(.enabled | not) | .id'

# Fail a deploy step if a workflow's latest run failed
status=$(marvin platform workflows executions tag-new-posts --limit 1 --json | jq -r '.[0].status')
[ "$status" = "success" ] || exit 1
```

## API Reference

| Command | Endpoint |
|---------|----------|
| `list` | `GET /api/automations` |
| `get` | `GET /api/automations/{id}` |
| `options` | `GET /api/automations/options` |
| `create` | `POST /api/automations` |
| `update`, `enable`, `disable` | `PATCH /api/automations/{id}` |
| `delete` | `DELETE /api/automations/{id}` |
| `validate` | `POST /api/automations/validate` |
| `preview` | `POST /api/automations/preview` |
| `run` | `POST /api/automations/{id}/run` (`?dry_run=true&entry_id=…&event_id=…`) |
| `samples` | `GET /api/automations/{id}/samples` |
| `executions` | `GET /api/automations/{id}/executions` |
| `execution` | `GET /api/automations/{id}/executions/{execution_id}` |

## See Also

- [Integrations](integrations.md) — the providers that `integration` actions call, and their error policies
- [Event Log](event-log.md) — `event-log types` lists the events a workflow can trigger on
