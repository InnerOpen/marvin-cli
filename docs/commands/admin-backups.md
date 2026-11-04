# Admin Backups

Server-side backups of workspaces: list the backups on the server, download one, create a backup for a
workspace and import backup data into a workspace. For the current workspace's own export and backup
commands see [Workspaces](workspaces.md).

## Commands

```bash
marvin admin backups list
marvin admin backups download <filename> [-o, --out-file <path>]
marvin admin backups create <workspace-id>
marvin admin backups import <workspace-id> (--data <json|@file|-> | --file <path>)
```

!!! note "Required role"
    Every `marvin admin` command needs the **SUPER_ADMIN** platform role. Without it the command fails
    with `Permission denied (403)`.

## List

```bash
marvin admin backups list
```

Columns: `filename`, `size`, `createdAt`.

## Download

```bash
marvin admin backups list
marvin admin backups download acme-20261014 --out-file ./acme-backup
```

| Option | Description | Default |
|--------|-------------|---------|
| `-o, --out-file <path>` | Write the backup content to a file | print to stdout |

Use a filename exactly as `list` shows it. Without `-o` the content is printed to stdout in the selected
output format; with `-o` the command writes the file and prints `Backup written to <path>`.

## Create

```bash
marvin admin backups create 5b0e8c14-2d7f-4a36-b9d1-6e3f0a7c8d25
```

Creates a backup of the given workspace (by id) on the server and prints the result. It shows up in
`list` afterwards.

## Import

```bash
marvin admin backups import 5b0e8c14-2d7f-4a36-b9d1-6e3f0a7c8d25 --file ./backup.json
cat backup.json | marvin admin backups import 5b0e8c14-2d7f-4a36-b9d1-6e3f0a7c8d25 --data -
```

| Option | Description | Default |
|--------|-------------|---------|
| `--data <json\|@file\|->` | Backup data as inline JSON, `@path` to read a file, or `-` for stdin | none |
| `--file <path>` | JSON file with the backup data (same as `--data @path`; `-` for stdin) | none |

Imports the backup data into the target workspace and prints `Imported backup into workspace <id>` (and
any details the server returns); with `--json` the result is `{"ok": true, ...}`. There is no
confirmation prompt, so check the target workspace id first.

## Related

- [Workspaces](workspaces.md) - `workspace export` and `workspace backups` for the active workspace
- [Admin groups & workspace members](admin-groups.md) - find workspace ids with `admin groups list`
