# Tags

Tags are the workspace's shared labels. Entries, assets and resources carry them; smart-collection
rules and the publishing API's `--tag` filter match on their slugs.

## Commands

```bash
marvin platform tags list
marvin platform tags get <tag>
marvin platform tags create (--name <name> [--slug <slug>] [--color <color>] | --data <json|@file|->)
marvin platform tags update <tag> (--name <name> | --color <color> | --data <json|@file|->)
marvin platform tags delete <tag> --yes
marvin platform tags attach <tag> (--entry <id> | --asset <id> | --resource <id>)
marvin platform tags detach <tag> (--entry <id> | --asset <id> | --resource <id>)
```

Every command that takes `<tag>` accepts its id or its slug.

!!! note "Required role"
    Any member lists tags. An **AUTHOR** creates tags and tags their own draft entries. Renaming or
    deleting a tag, and tagging anyone else's entry, an asset or a resource, needs **EDITOR**. See
    [Workspace roles](../reference/authentication.md#workspace-roles).

## List

```bash
marvin platform tags list
```

Columns: ID, Slug, Name, Color, Entries (entries carrying the tag), Uses (entries, assets and
resources together).

## Create, rename, delete

```bash
marvin platform tags create --name "Chore Coat"            # slug: chore-coat
marvin platform tags create --name "News" --color "#FF5733"
marvin platform tags update chore-coat --name "Chore coats"
marvin platform tags delete chore-coat --yes
```

`create` is find-or-create by slug: creating a tag whose slug already exists returns the existing
tag, so a script can call it without checking first. A tag's slug never changes; `update` renames or
recolors it. Deleting a tag removes it from everything that carried it.

## Tag and untag

```bash
marvin platform tags attach news --entry 6f1c…
marvin platform tags attach news --asset 2b7e…
marvin platform tags detach news --resource 9a40…
```

Name exactly one target. Attaching is idempotent. With `--json` the result is
`{"ok": true, "tagId": "…", "entryId": "…", "attached": true}` (or `assetId`/`resourceId`,
`detached`). Detaching a tag the item doesn't carry is a not-found error. Tagging an entry
re-evaluates the smart collections it could belong to.

Tag everything a query finds:

```bash
marvin platform entries list --status published --entry-type post --json | jq -r '.[].id' |
  xargs -I{} marvin platform tags attach news --entry {}
```
