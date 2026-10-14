# Blueprints

Blueprints are ready-made pieces of workspace structure — collections, entry types, scheduled tasks
and workflows — that Marvin ships and installed integrations contribute. Browse the catalog, then
apply what you want. Applying creates what's missing and never overwrites what exists, so running
it twice is safe.

## Commands

```bash
marvin platform blueprints list [--kind <kind>] [--category <name>] [--source <source>] [--integration-id <id>]
marvin platform blueprints categories
marvin platform blueprints get <slug> [--source <source>]
marvin platform blueprints apply <slug> [<slug>…] [--params <json|@file|->] [--source <source>] [--integration-id <id>]
marvin platform blueprints update <slug> [--params <json|@file|->] [--source <source>]
```

!!! note "Required role"
    Any member browses the catalog. `apply` and `update` change workspace structure and need the
    workspace **ADMIN** (or OWNER) role. See [Workspace roles](../reference/authentication.md#workspace-roles).

## list

```bash
marvin platform blueprints list
marvin platform blueprints list --kind collection --category Media
marvin platform blueprints list --source square --integration-id 0b6f…
```

| Option | Description | Default |
|--------|-------------|---------|
| `--kind <kind>` | Only this kind: `collection`, `entry_type`, `scheduled_task`, `workflow`, … | |
| `--category <name>` | Only this category (see `categories`) | |
| `--source <source>` | Only from this source: `core`, or an integration provider's slug | |
| `--integration-id <id>` | Check per-integration blueprints against this connection | |

Columns: Slug, Kind, Name, Category, Source (`core` or an integration's provider slug), Applied
(`yes`, `yes (outdated)` when the workspace has an older version, or `no`), Available (`no: needs …`
when the workspace lacks something it requires), Params (`?` marks an optional one).

`--integration-id` checks per-integration blueprints against one connection, for workspaces with
several connections to the same provider.

## categories

```bash
marvin platform blueprints categories
```

Lists the blueprint categories, core's first, then each integration's. No options.

## get

```bash
marvin platform blueprints get all-{{entry_type}} --json
marvin platform blueprints get tag-new-posts --source buttondown
```

| Argument / option | Description | Default |
|-------------------|-------------|---------|
| `<slug>` | Blueprint slug | |
| `--source <source>` | Pick the blueprint from this source when several share the slug | |

Prints the blueprint with its parameters (`key`, `label`, `kind`, `required`, `default`, `help`)
and its payload.

## apply

| Argument / option | Description | Default |
|-------------------|-------------|---------|
| `<slugs...>` | One or more blueprint slugs | |
| `--params <json\|@file\|->` | Parameter values: `{key: value}` for one blueprint, `{slug: {key: value}}` for several; inline JSON, `@path` or `-` for stdin | |
| `--data <json\|@file\|->` | Same as `--params` | |
| `--source <source>` | Pick blueprints from this source when several share a slug | |
| `--integration-id <id>` | The integration connection to apply per-integration blueprints for | |

One blueprint, with its parameters:

```bash
marvin platform blueprints apply recently-published
marvin platform blueprints apply 'all-{{entry_type}}' --params '{"entry_type": "post"}'
```

Several at once — entry types are created before the collections and tasks that use them, whatever
order you list them in. `--params` is then keyed by blueprint slug:

```bash
marvin platform blueprints apply post 'published-{{entry_type}}' \
  --params '{"published-{{entry_type}}": {"entry_type": "post"}}'
marvin platform blueprints apply post featured --params @params.json
```

Table mode prints a result per blueprint (Created, Updated,
Detail) and a summary on stderr, e.g. `✓ Created 1 of 2 blueprint(s); the rest were already in
place`. With `--json`, one slug prints the result object and several print an array:

```json
{ "slug": "recently-published", "kind": "collection", "created": true, "updated": false, "detail": "", "name": "Recently published" }
```

A blueprint that can't be applied comes back with `created: false` and the reason in `detail`
(e.g. `no entry type 'post' in this workspace`); the command still exits 0.

## update

```bash
marvin platform blueprints update tag-new-posts
marvin platform blueprints update tag-new-posts --params '{"channel": "C123"}' --source slack
```

| Argument / option | Description | Default |
|-------------------|-------------|---------|
| `<slug>` | Blueprint slug of an applied workflow | |
| `--params <json\|@file\|->` | Parameter values as `{key: value}` | |
| `--data <json\|@file\|->` | Same as `--params` | |
| `--source <source>` | Pick the blueprint from this source when several share the slug | |

Replaces an applied workflow's steps with what its integration declares now — what `Applied: yes
(outdated)` asks for. Other kinds answer with `updated: false` and say why.
