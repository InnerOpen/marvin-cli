# Entry Types

Entry types define the kinds of content in a workspace (pages, posts, products, ...): their schema,
how they render, what they can do, and their authoring recipe. List and inspect them, or create,
change and delete your own.

## Commands

```bash
marvin platform entry-types list
marvin platform entry-types get <id>
marvin platform entry-types create (--data <json|@file|-> | --file <path>)
marvin platform entry-types update <id> (--data <json|@file|-> | --file <path>)
marvin platform entry-types delete <id> --yes
```

`--data` takes inline JSON, `@path` to read a file, or `-` to read stdin; `--file <path>` is the same
as `--data @path`. With neither, `create` and `update` read piped stdin.

!!! note "Required role"
    Listing and reading entry types is open to any workspace member. Creating, updating or deleting
    one needs the workspace **ADMIN** (or OWNER) role. Without it the command fails with
    `Permission denied (403)` and names the role it needs. See
    [Workspace roles](../reference/authentication.md#workspace-roles).

## list

List the workspace's entry types.

```bash
marvin platform entry-types list
marvin platform entry-types list --json | jq -r '.[].slug'
```

Columns: ID, Name, Slug, System, Renderer, Package, Publishable (`yes`/`no`), Routable
(`yes`/`no`). Renderer and Package come from the type's `renderingJson`, Publishable and Routable
from its `capabilitiesJson`; a type with no capabilities shows them blank.

## get

Print one entry type with its full definition.

```bash
marvin platform entry-types get 01234567-89ab-cdef-0123-456789abcdef --json | jq '.schemaJson'
```

| Argument | Description |
|----------|-------------|
| `<id>` | Entry type ID |

The record carries `name`, `slug`, `description`, `icon`, `color`, `sortOrder`, `isSystem`,
`isRendered`, and the JSON blocks `schemaJson` (field definitions), `renderingJson`,
`capabilitiesJson` and `recipeJson`.

## create

Create an entry type from a JSON body. `name` is required; `slug`, `description`, `icon`, `color`,
`sortOrder`, `isRendered`, `schemaJson`, `renderingJson`, `capabilitiesJson` and `recipeJson` are
optional.

```bash
marvin platform entry-types create --data '{"name": "Lookbook", "slug": "lookbook"}'
marvin platform entry-types create --file lookbook.json
```

| Option | Description | Default |
|--------|-------------|---------|
| `--data <json\|@file\|->` | Entry type data as JSON, `@path` to read a file, or `-` for stdin | |
| `--file <path>` | JSON file with the entry type data (same as `--data @path`) | |

Prints `✓ Created entry type: <id>` on stderr and the new entry type on stdout.

## update

Change an entry type. The body holds only the fields to change.

```bash
marvin platform entry-types update 01234567-89ab-cdef-0123-456789abcdef --data '{"description": "Seasonal lookbooks"}'
```

| Argument | Description |
|----------|-------------|
| `<id>` | Entry type ID |

| Option | Description | Default |
|--------|-------------|---------|
| `--data <json\|@file\|->` | Entry type data as JSON, `@path` to read a file, or `-` for stdin | |
| `--file <path>` | JSON file with the entry type data (same as `--data @path`) | |

## delete

Delete an entry type.

```bash
marvin platform entry-types delete 01234567-89ab-cdef-0123-456789abcdef --yes
```

| Argument | Description |
|----------|-------------|
| `<id>` | Entry type ID |

| Option | Description | Default |
|--------|-------------|---------|
| `--yes` | Confirm the deletion; the command refuses to run without it | |

In `--json` mode the result is `{"deleted": "<id>"}`.

## Scripting

```bash
# Slug and name of every entry type
marvin platform entry-types list --json | jq -r '.[] | "\(.slug)\t\(.name)"'

# Entry types that can't be published
marvin platform entry-types list --json | jq -r '.[] | select(.capabilitiesJson.publishable == false) | .slug'
```

## See Also

- [Renderers](renderers.md) - the renderer packages an entry type's `renderingJson` points at
- [Platform entries](platform-entries.md) - creating entries of a given type
