# Platform entries

Create, edit, schedule and organize the workspace's entries through the Platform API. For reading
published content use the [Publishing API entries](entries.md) instead.

## Commands

```bash
marvin platform entries list [--status <status>[,<status>…]] [--entry-type <slug>] [--suggestions] [--limit <n>]
marvin platform entries counts
marvin platform entries get <id>
marvin platform entries create (--data <json|@file|-> | --file <path>)
marvin platform entries update <id> [--data <json|@file|-> | --file <path>] [--status <status>] [--publish-at <iso>] [--expire-at <iso>]
marvin platform entries delete <id> --yes
marvin platform entries suggested-assets list <entry-id>
marvin platform entries suggested-assets approve <entry-id> <asset-id>
marvin platform entries suggested-assets reject <entry-id> <asset-id>
marvin platform entries apply-suggestion <id>
marvin platform entries reject-suggestion <id>
marvin platform entries collections <id>
marvin platform entries add-to-collection <entry-id> <collection-id>
marvin platform entries remove-from-collection <entry-id> <collection-id>
```

!!! note "Required role"
    Any member can list, count and get entries, list their collections and list suggested assets.
    Writes need **AUTHOR** for your own draft entries and **EDITOR** for anyone else's entry or to
    approve, publish or schedule one. See
    [Workspace roles](../reference/authentication.md#workspace-roles).

`--data` takes inline JSON, `@path` to read a file, or `-` for stdin. `--file <path>` is the same as
`--data @path`, and piped stdin works with neither flag. Create and update print the saved entry in
the chosen output format.

## list

Lists entries, newest first. The API has no filters, so the CLI fetches the list and filters it.
Columns: ID, Title, Slug, Type, Status, Published.

| Option | Description | Default |
|--------|-------------|---------|
| `--status <status>` | Only entries with this status (`inbox`, `draft`, `needs_review`, `published`, …); comma-separate several | all |
| `--entry-type <slug>` | Only entries of this entry type (slug or id); an unknown type is an error | all |
| `--suggestions` | Only entries with a pending AI suggestion | off |
| `--limit <number>` | At most this many entries, applied after filtering | all |

```bash
marvin platform entries list --status needs_review --entry-type post --limit 20
marvin platform entries list --suggestions --json | jq -r '.[].id'
```

## counts

How many entries are in each status, plus the total. Table and CSV output show Status and Count
rows; JSON and YAML output is the API's object.

```bash
marvin platform entries counts
marvin platform entries counts --json
```

## get

Shows one entry in full, including `suggestionJson` when an AI suggestion is pending.

```bash
marvin platform entries get 6f1c2a9e-3b7d-4e0a-9c55-1d2f8a4b7e10 --json | jq .suggestionJson
```

## create

Creates an entry from a JSON body. The body is the Platform API's entry payload; the required
fields are `entryTypeId`, `title` and `status`. Prints `Created entry: <id>` on stderr, then the
entry.

```bash
marvin platform entries create --data '{
  "entryTypeId": "0b6c7d1e-5a42-4f8e-8d3a-92c1e5a7f301",
  "title": "Spring lookbook",
  "slug": "spring-lookbook",
  "status": "draft"
}'
marvin platform entries create --file ./new-entry.json
```

## update

Updates an entry. The three flags change status and schedule without a JSON body; with only flags
the command does not read stdin. Flags win over the same field in `--data` (`publish_at` or
`publishAt`).

| Option | Description | Default |
|--------|-------------|---------|
| `--data <json\|@file\|->` | Entry fields to change, as JSON, `@path`, or `-` for stdin | none |
| `--file <path>` | JSON file with the fields (same as `--data @path`; `-` for stdin) | none |
| `--status <status>` | Set the status (for example `draft`, `needs_review`, `published`, `archived`) | unchanged |
| `--publish-at <iso>` | Schedule publishing at this ISO 8601 time; `""` (or `none`) clears the schedule | unchanged |
| `--expire-at <iso>` | Unpublish at this ISO 8601 time; `""` (or `none`) clears it | unchanged |

Times that are not valid ISO 8601 are rejected before the API is called.

```bash
marvin platform entries update 6f1c… --status needs_review
marvin platform entries update 6f1c… --publish-at 2026-10-31T09:00:00Z
marvin platform entries update 6f1c… --publish-at ""
marvin platform entries update 6f1c… --data '{"title": "Spring lookbook 2026"}'
```

## delete

Deletes an entry. Without `--yes` the command refuses and exits with an error.

| Option | Description | Default |
|--------|-------------|---------|
| `--yes` | Confirm the delete | off |

```bash
marvin platform entries delete 6f1c… --yes
```

## suggested-assets

AI media operations (for example background removal) can attach the asset they made to an entry as a
*suggestion*. It stays out of published output until someone approves it. These commands are part of
the [review queue](review.md#suggested-assets).

| Command | Purpose |
|---------|---------|
| `suggested-assets list <entry-id>` | The entry's assets that are still suggestions. Columns: ID, Slug, Name, Type, Operation, Derived from |
| `suggested-assets approve <entry-id> <asset-id>` | Keep it: it becomes a normal attached asset and reaches published output |
| `suggested-assets reject <entry-id> <asset-id>` | Drop it: unlink it, and delete the asset if nothing else uses it |

Approve and reject print the updated entry.

```bash
marvin platform entries suggested-assets list 6f1c…
marvin platform entries suggested-assets approve 6f1c… 2b7e4c10-8a1d-4f3b-b6e2-5d9a0c7e1f42
```

## apply-suggestion and reject-suggestion

Commit or discard the entry's pending AI suggestion (the proposed changes staged in
`suggestionJson`). Both print the updated entry. The same pair exists for
[assets](platform-assets.md#apply-suggestion-and-reject-suggestion) and
[resources](platform-resources.md#apply-suggestion-and-reject-suggestion); the workflow is covered
in [Review queue](review.md#ai-suggestions).

```bash
marvin platform entries apply-suggestion 6f1c…
marvin platform entries reject-suggestion 6f1c…
```

## collections, add-to-collection, remove-from-collection

`collections` lists the collections an entry belongs to (columns: ID, Name, Slug, Description).
`add-to-collection` and `remove-from-collection` change membership; in JSON modes they print
`{"ok": true, "entryId": "…", "collectionId": "…"}` (`"removed": true` for removal). Manage the
collections themselves with [platform collections](platform-collections.md).

```bash
marvin platform entries collections 6f1c…
marvin platform entries add-to-collection 6f1c… 3d8e5f20-9b14-4c7a-a0e6-71c4b2d95a08
marvin platform entries remove-from-collection 6f1c… 3d8e5f20-9b14-4c7a-a0e6-71c4b2d95a08
```
