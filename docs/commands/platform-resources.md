# Platform resources

Create, edit and delete the workspace's resources (links, files and other external references that
entries point to) through the Platform API. For reading published resources use the
[Publishing API resources](resources.md) instead.

## Commands

```bash
marvin platform resources list
marvin platform resources get <id>
marvin platform resources create (--data <json|@file|-> | --file <path>)
marvin platform resources update <id> (--data <json|@file|-> | --file <path>)
marvin platform resources delete <id> --yes
marvin platform resources apply-suggestion <id>
marvin platform resources reject-suggestion <id>
```

!!! note "Required role"
    Any member can list and get resources. Create, update, delete, apply-suggestion and
    reject-suggestion need the workspace **EDITOR** role. See
    [Workspace roles](../reference/authentication.md#workspace-roles).

`--data` takes inline JSON, `@path` to read a file, or `-` for stdin. `--file <path>` is the same as
`--data @path`, and piped stdin works with neither flag.

## list

Lists every resource. Columns: ID, Name, Slug, Type, Description (first 50 characters), URL.

```bash
marvin platform resources list
marvin platform resources list --json | jq -r '.[] | select(.resourceType == "link") | .slug'
```

## get

Shows one resource in full, including `suggestionJson` when an AI suggestion is pending.

```bash
marvin platform resources get 9a40d7c2-1e5b-4a36-8f02-c3b7e6d41a95
```

## create

Creates a resource from a JSON body. The required fields are `slug`, `name` and `resourceType`;
`description`, `url`, `externalId`, `metadata` and `tag_ids` are optional. Prints
`Created resource: <id>` on stderr, then the resource.

```bash
marvin platform resources create --data '{
  "slug": "lookbook-pdf",
  "name": "Spring lookbook (PDF)",
  "resourceType": "link",
  "url": "https://example.com/lookbook.pdf"
}'
```

## update

Updates a resource with the fields in the JSON body. Prints `Updated resource: <id>`, then the
resource.

```bash
marvin platform resources update 9a40… --data '{"name": "Spring lookbook 2026 (PDF)"}'
echo '{"description": "Print-ready"}' | marvin platform resources update 9a40…
```

## delete

Deletes a resource. Without `--yes` the command refuses and exits with an error.

| Option | Description | Default |
|--------|-------------|---------|
| `--yes` | Confirm the delete | off |

```bash
marvin platform resources delete 9a40… --yes
```

## apply-suggestion and reject-suggestion

When an AI operation writes back with approval required, its proposed changes are staged on the
resource as `suggestionJson`. `apply-suggestion` commits them and clears the suggestion;
`reject-suggestion` discards them. Both print the updated resource. See
[Review queue](review.md#ai-suggestions).

```bash
marvin platform resources get 9a40… --json | jq .suggestionJson
marvin platform resources apply-suggestion 9a40…
marvin platform resources reject-suggestion 9a40…
```
