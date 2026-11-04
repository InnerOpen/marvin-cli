# Webhooks

Webhooks are the workspace's outgoing HTTP calls: Marvin sends a request to a URL when an event
happens or at a scheduled time. These commands manage the webhook definitions and read their
delivery logs. For webhooks Marvin *receives*, see [Incoming webhooks](incoming-webhooks.md).

## Commands

```bash
marvin platform webhooks list [--page <n>] [--per-page <n>] [--all]
marvin platform webhooks get <id>
marvin platform webhooks create (--data <json|@file|-> | --file <path>)
marvin platform webhooks update <id> (--data <json|@file|-> | --file <path>)
marvin platform webhooks delete <id> --yes
marvin platform webhooks test <id>
marvin platform webhooks types
marvin platform webhooks rerun
marvin platform webhooks log [--limit <n>]
marvin platform webhooks logs <id> [--limit <n>]
```

!!! note "Required role"
    Every webhook command except `types`, reads included, needs the workspace **ADMIN** (or OWNER)
    role. Without it the command fails with `Permission denied (403)` and names the role it needs.
    See [Workspace roles](../reference/authentication.md#workspace-roles).

`--data` takes inline JSON, `@path` to read a file, or `-` to read stdin; `--file <path>` is the same
as `--data @path`. With neither, `create` and `update` read piped stdin.

## The webhook object

| Field | Description | Default |
|-------|-------------|---------|
| `name` | Webhook name (required) | |
| `url` | Target URL (required) | |
| `method` | `GET` or `POST` | `POST` |
| `webhookType` | When it fires and what it sends: `generic`, `user`, `entries`, `event_driven`, `workflow`. `marvin platform webhooks types` lists what the server offers | `generic` |
| `enabled` | Whether the webhook fires | `true` |
| `scheduledTime` | Time of day for scheduled types | none |
| `headers` | Extra request headers, an object of strings | none |
| `subscribedEvents` | Event types an `event_driven` webhook listens for | none |
| `customPayload` | Object sent as the body instead of the default payload | none |

`update` sends the whole body to the server, so include `name` and `url` again along with the fields
you change. Fetch the current definition with `get --json` to start from.

## List and get

```bash
marvin platform webhooks list
marvin platform webhooks get 3f2a9c10-4b7e-4c55-9a1d-2e6f0b8d7a11 --json
```

`list` shows one page (50 by default); `--all` fetches every page and ignores `--page`.

| Option | Description | Default |
|--------|-------------|---------|
| `--page <number>` | Page number | `1` |
| `--per-page <number>` | Items per page | `50` |
| `--all` | Fetch every page | off |

Columns: ID, Name, URL, Method, Enabled.

## Create and update

```bash
marvin platform webhooks create --data '{
  "name": "Rebuild site",
  "url": "https://hooks.example.com/rebuild",
  "webhookType": "event_driven",
  "subscribedEvents": ["entry_published"],
  "headers": {"Authorization": "Bearer abc123"}
}'

marvin platform webhooks update 3f2a9c10-4b7e-4c55-9a1d-2e6f0b8d7a11 --file rebuild.json
```

Both print `Created webhook: <id>` / `Updated webhook: <id>` on stderr and the webhook on stdout.

## Delete

```bash
marvin platform webhooks delete 3f2a9c10-4b7e-4c55-9a1d-2e6f0b8d7a11 --yes
```

`--yes` is required; without it the command exits 1 with `Delete requires --yes confirmation flag`.
With `--json` the result is `{"deleted": "<id>"}`.

## Test, rerun and types

```bash
marvin platform webhooks test 3f2a9c10-4b7e-4c55-9a1d-2e6f0b8d7a11
marvin platform webhooks rerun
marvin platform webhooks types
```

- `test` schedules a test delivery and returns at once (`Webhook test scheduled`); read the outcome with `logs <id>`.
- `rerun` re-fires today's scheduled webhooks (everything due since 00:00 UTC) in the background and prints the server's message and `Requeued: <n> webhooks`.
- `types` prints the webhook types the server supports.

## Delivery logs

```bash
marvin platform webhooks log --limit 20
marvin platform webhooks logs 3f2a9c10-4b7e-4c55-9a1d-2e6f0b8d7a11 --json | jq '.[] | {status, httpStatusCode, errorMessage}'
```

`log` covers every webhook in the workspace; `logs <id>` one webhook.

| Option | Description | Default |
|--------|-------------|---------|
| `--limit <number>` | Maximum number of entries to return | `50` |

Columns: ID, Webhook (id), Status, HTTP (status code), Executed. `--json` also carries
`errorMessage`, `retryAttempt`, `requestPayload` and `responseBody`.
