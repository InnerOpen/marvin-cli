# Platform Collections

Collections group content (entries, assets or resources) under a name and a slug. A collection is
either curated by hand or *smart*, in which case rules decide who is in it. This page covers every
`marvin platform collections` command; the rules-driven parts are detailed in
[Smart Collections](smart-collections.md). For the read-only public view, see
[Publishing collections](collections.md).

## Commands

```bash
marvin platform collections list
marvin platform collections get <id>
marvin platform collections create (--data <json|@file|-> | --file <path>) [--smart-rules <json|@file|->]
marvin platform collections update <id> [--data <json|@file|-> | --file <path>] [--smart-rules <json|@file|->]
marvin platform collections delete <id> --yes
marvin platform collections members <id>
marvin platform collections preview --rules <json|@file|-> [--target-type <type>] [--limit <n>]
marvin platform collections order [ids...] [--data <json|@file|-> | --file <path>]
marvin platform collections entries <id>
marvin platform collections reorder <id> (--data <json|@file|-> | --file <path>)
marvin platform collections update-entry <id> <entry-id> [--role <role>] [--metadata <json>] [--data <json|@file|->]
```

`--data` takes inline JSON, `@path` to read a file, or `-` to read stdin; `--file <path>` is the same
as `--data @path`. With neither, `create`, `update` (without `--smart-rules`) and `reorder` read piped
stdin.

!!! note "Required role"
    Any member can run `list`, `get`, `members` and `entries`. `create`, `update`, `delete`,
    `preview`, `order`, `reorder` and `update-entry` need the workspace **EDITOR** role. See
    [Workspace roles](../reference/authentication.md#workspace-roles).

## list

List the workspace's collections.

```bash
marvin platform collections list
```

Columns: ID, Name, Slug, Description (first 50 characters).

## get

Print one collection in full.

```bash
marvin platform collections get 3c9e5a10-7d4b-4f0e-9a21-5b8c1d2e6f70 --json
```

| Argument | Description |
|----------|-------------|
| `<id>` | Collection ID |

## create

Create a collection from a JSON body: `name` is required; `slug`, `description`, `icon`, `color`,
`sortOrder`, `isPublic`, `targetType` (`entry`, `asset` or `resource`), `metadataJson` and
`entryIds` are optional.

```bash
marvin platform collections create --data '{"name": "Spring Lookbook", "slug": "spring-lookbook"}'
marvin platform collections create --data '{"name": "News"}' --smart-rules '{"tags": ["news"]}'
```

| Option | Description | Default |
|--------|-------------|---------|
| `--data <json\|@file\|->` | Collection data as JSON, `@path` to read a file, or `-` for stdin | |
| `--file <path>` | JSON file with the collection data (same as `--data @path`) | |
| `--smart-rules <json\|@file\|->` | Smart-collection rules; makes the collection smart (`isSmart: true`) | |

Prints `✓ Created collection: <id>` on stderr and the new collection on stdout.

## update

Change a collection's fields. The body holds only the fields to change.

```bash
marvin platform collections update spring-lookbook --data '{"description": "Spring 2027 picks"}'
marvin platform collections update 3c9e5a10-… --smart-rules @rules.json
```

| Argument | Description |
|----------|-------------|
| `<id>` | Collection ID |

| Option | Description | Default |
|--------|-------------|---------|
| `--data <json\|@file\|->` | Collection data as JSON, `@path` to read a file, or `-` for stdin | |
| `--file <path>` | JSON file with the collection data (same as `--data @path`) | |
| `--smart-rules <json\|@file\|->` | Replace the smart rules (and make the collection smart); needs no `--data` | |

## delete

Delete a collection.

```bash
marvin platform collections delete 3c9e5a10-… --yes
```

| Option | Description | Default |
|--------|-------------|---------|
| `--yes` | Confirm the deletion; the command refuses to run without it | |

In `--json` mode the result is `{"deleted": "<id>"}`.

## members

List a collection's members, whatever it groups: entries, assets or resources.

```bash
marvin platform collections members 3c9e5a10-…
```

Columns: ID, Type, Label, Slug. See [Smart Collections](smart-collections.md#members).

## preview

Show what smart-collection rules would match, without saving anything. Needs `--rules`.

```bash
marvin platform collections preview --rules '{"tags": ["news"], "statuses": ["published"]}' --limit 5
```

| Option | Description | Default |
|--------|-------------|---------|
| `--rules <json\|@file\|->` | The rules, as a collection's `smartRules` (required) | |
| `--target-type <type>` | What the rules select: `entry`, `asset` or `resource` | `entry` |
| `--limit <number>` | How many matches to list (at most 50); the total counts them all | `10` |

Details and output in [Smart Collections](smart-collections.md#preview-rules).

## order

Set the order collections are listed in, system collections included. Give the ids in the order you
want, or `--data` with explicit `sortOrder` values; not both.

```bash
marvin platform collections order 3c9e5a10-… 7a21b3c4-… 0f4d9e88-…
marvin platform collections order --data '[{"id": "3c9e5a10-…", "sortOrder": 10}, {"id": "7a21b3c4-…", "sortOrder": 20}]'
```

| Argument | Description |
|----------|-------------|
| `[ids...]` | Collection IDs, in the order you want (`sortOrder` 0, 1, 2, …) |

| Option | Description | Default |
|--------|-------------|---------|
| `--data <json\|@file\|->` | An array of `{id, sortOrder}` as JSON, `@path` to read a file, or `-` for stdin | |
| `--file <path>` | JSON file with the array (same as `--data @path`) | |

Ids that don't belong to a collection in this workspace are skipped, and the command says how many.
With `--json` it prints `{"ok": true, "updated": <n>}`.

## entries

List the entries in an (entry) collection, in the collection's order.

```bash
marvin platform collections entries spring-lookbook
```

Columns: Order, ID, Title, Status, Published. Unlike `members`, this lists entries only, with the
fields of an entry row.

## reorder

Reorder the entries in a collection. The body is a non-empty array of `{entryId, sortOrder}`.

```bash
marvin platform collections reorder 3c9e5a10-… --data '[{"entryId": "6f1c…", "sortOrder": 0}, {"entryId": "a82d…", "sortOrder": 1}]'
```

| Argument | Description |
|----------|-------------|
| `<id>` | Collection ID |

| Option | Description | Default |
|--------|-------------|---------|
| `--data <json\|@file\|->` | An array of `{entryId, sortOrder}` as JSON, `@path` to read a file, or `-` for stdin | |
| `--file <path>` | JSON file with the array (same as `--data @path`) | |

With `--json` it prints `{"ok": true, "reordered": <n>, "collectionId": "<id>"}`. Don't reorder a
smart collection by hand: its rules own the membership.

## update-entry

Set the junction fields of one entry within one collection: its `role` and `metadataJson`. Give
`--role`, `--metadata` or `--data`.

```bash
marvin platform collections update-entry spring-lookbook 6f1c… --role hero
marvin platform collections update-entry spring-lookbook 6f1c… --metadata '{"caption": "Opening look"}'
```

| Argument | Description |
|----------|-------------|
| `<id>` | Collection ID |
| `<entry-id>` | Entry ID |

| Option | Description | Default |
|--------|-------------|---------|
| `--role <role>` | Role of the entry within the collection | |
| `--metadata <json>` | Junction metadata as a JSON string (sent as `metadataJson`) | |
| `--data <json\|@file\|->` | Full junction payload; overrides `--role` and `--metadata` | |

With none of the three the command exits 1 with `Provide --role, --metadata, or --data`.

## See Also

- [Smart Collections](smart-collections.md) - rules, `preview`, `members` and `order` in detail
- [Platform entries](platform-entries.md) - `add-to-collection` and `remove-from-collection`
