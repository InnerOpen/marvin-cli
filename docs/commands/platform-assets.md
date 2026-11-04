# Platform assets

Upload, download, edit and delete the workspace's assets (images, documents and other files)
through the Platform API. The Publishing API has no asset routes; published entries carry their
assets, with public URLs, inline (`marvin publish entry <slug> --json | jq .assets`).

## Commands

```bash
marvin platform assets list
marvin platform assets get <id>
marvin platform assets upload <path> --slug <slug> --name <name> [--alt-text <text>] [--description <text>] [--metadata <json>]
marvin platform assets download <id> [-o, --out-file <file>]
marvin platform assets update <id> (--data <json|@file|-> | --file <path>)
marvin platform assets apply-suggestion <id>
marvin platform assets reject-suggestion <id>
marvin platform assets delete <id> --yes
```

!!! note "Required role"
    Any member can list, get and download assets. Uploading needs **AUTHOR**. Update, delete,
    apply-suggestion and reject-suggestion need **EDITOR**. See
    [Workspace roles](../reference/authentication.md#workspace-roles).

## list

Lists every asset. Columns: ID, Name, Slug, Type (MIME type), Dimensions, Alt (first 40 characters).

```bash
marvin platform assets list
marvin platform assets list --json | jq -r '.[] | select(.mimeType | startswith("image/")) | .slug'
```

## get

Shows one asset in full: URL, type, size, checksum, dimensions, `suggestionJson` and so on.

```bash
marvin platform assets get 2b7e4c10-8a1d-4f3b-b6e2-5d9a0c7e1f42
```

## upload

Uploads a local file as a new asset. Reports the file name and size, then the new asset's id, public
URL, type, MIME type, size, checksum and (for images) dimensions, followed by the asset itself in
the chosen output format.

| Option | Description | Default |
|--------|-------------|---------|
| `<path>` | Path of the file to upload | required |
| `--slug <slug>` | Asset slug (URL-friendly identifier) | required |
| `--name <name>` | Asset name | required |
| `--alt-text <text>` | Alt text for accessibility | none |
| `--description <text>` | Description of the asset | none |
| `--metadata <json>` | Custom metadata as a JSON string | none |

```bash
marvin platform assets upload ./hero.jpg --slug hero --name "Hero image" --alt-text "Model in a chore coat"
marvin platform assets upload ./brochure.pdf --slug brochure --name "Brochure" --metadata '{"year": 2026}' --json
```

## download

Downloads an asset's raw file. With `-o` the file is written to that path; without it the bytes go
to stdout when stdout is piped or redirected. On a terminal, with no `--out-file`, the command
refuses before downloading anything.

| Option | Description | Default |
|--------|-------------|---------|
| `-o, --out-file <file>` | Write the file to this path instead of stdout | stdout (piped only) |

With `--out-file` and `--json`/`--yaml`, the result is `{"ok": true, "file": "…", "bytes": …, "contentType": "…"}`;
in table mode a confirmation goes to stderr.

```bash
marvin platform assets download 2b7e… -o hero.jpg
marvin platform assets download 2b7e… > hero.jpg
marvin platform assets download 2b7e… | convert - -resize 400x hero-small.jpg
```

## update

Updates an asset's metadata with the fields in the JSON body (`slug`, `name`, `alt_text`,
`description`, `metadata`, `tag_ids`). It does not replace the file. `--data` takes inline JSON,
`@path`, or `-` for stdin; `--file <path>` is the same as `--data @path`.

```bash
marvin platform assets update 2b7e… --data '{"alt_text": "Model wearing a chore coat"}'
marvin platform assets update 2b7e… --file ./asset-changes.json
```

## apply-suggestion and reject-suggestion

When an AI operation (for example alt-text generation) writes back with approval required, its
proposed changes are staged on the asset as `suggestionJson`. `apply-suggestion` commits them and
clears the suggestion; `reject-suggestion` discards them. Both print the updated asset. See
[Review queue](review.md#ai-suggestions). To review AI-generated assets attached to an entry, use
[`entries suggested-assets`](platform-entries.md#suggested-assets).

```bash
marvin platform assets apply-suggestion 2b7e…
marvin platform assets reject-suggestion 2b7e…
```

## delete

Deletes an asset. Without `--yes` the command refuses and exits with an error.

| Option | Description | Default |
|--------|-------------|---------|
| `--yes` | Confirm the delete | off |

```bash
marvin platform assets delete 2b7e… --yes
```
