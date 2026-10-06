# Smart Collections

A smart collection's members come from rules — entry types, statuses, tags and the like — and the
server keeps its membership up to date as content changes. Preview rules before saving them, create
or change a collection's rules, see who's in it, and set the order collections are listed in.

## Commands

```bash
marvin platform collections preview --rules <json|@file|-> [--target-type entry|asset|resource] [--limit <n>]
marvin platform collections create --data <json|@file|-> [--smart-rules <json|@file|->]
marvin platform collections update <id> [--smart-rules <json|@file|->] [--data <json|@file|->]
marvin platform collections members <id>
marvin platform collections order <id> [<id>…]
marvin platform collections order --data '[{"id": "…", "sortOrder": 0}, …]'
```

!!! note "Required role"
    `preview`, `create`, `update` and `order` need the workspace **EDITOR** role; any member lists
    members. See [Workspace roles](../reference/authentication.md#workspace-roles).

## Preview rules

```bash
marvin platform collections preview --rules '{"tags": ["news"], "statuses": ["published"]}'
```

```text
Matching entries: 12 (showing 10)
┌─────────┬──────────┬─────────┬──────────────┬──────────────┐
│ (index) │ ID       │ Type    │ Label        │ Slug         │
…
```

Nothing is saved. The rules are evaluated by the same code that fills the collection on save, so
the count is exactly what the collection would hold. `--limit` (default 10, at most 50) caps the
listed matches; the total counts them all. `--target-type` picks what the rules select (`entry` by
default). Rules this target type doesn't read are listed as ignored; an empty rule set matches
nothing, and the command says so.

`--rules` takes inline JSON, `@path` to read a file, or `-` for stdin. With `--json` you get
`{total, items: [{id, label, slug, type}], ignoredKeys, note}`.

## Create or change a smart collection

```bash
marvin platform collections create --data '{"name": "News"}' --smart-rules '{"tags": ["news"]}'
marvin platform collections update 3c9e… --smart-rules @rules.json
```

`--smart-rules` sets the collection's rules and makes it smart (`isSmart: true`). On `update` it
needs no `--data`; with `--data` too, `--smart-rules` wins over any `smartRules` in the body. Don't
add or reorder entries on a smart collection by hand: the rules own its membership.

## Members

```bash
marvin platform collections members 3c9e…
```

Columns: ID, Type, Label (the entry's title or the asset's or resource's name), Slug — the same
for entry, asset and resource collections. (`collections entries <id>` still lists an entry
collection's entries in their collection order, with every entry field.)

## Order collections

```bash
marvin platform collections order 3c9e… 7a21… 0f4d…         # in this order (sortOrder 0, 1, 2)
marvin platform collections order --data @order.json        # [{"id": "…", "sortOrder": 10}, …]
```

Sets the order collections are listed in, system collections included. Ids that don't belong to a
collection in this workspace are skipped; the command says how many. With `--json` it prints
`{"ok": true, "updated": <n>}`.
