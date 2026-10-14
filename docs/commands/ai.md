# AI

`marvin platform ai` manages the workspace's AI setup: provider connections and their models, the
catalogue of AI operations (and running them), the execution audit log, and the workspace AI
settings. All commands use the Platform API, so they need a user login or `MARVIN_USER_TOKEN`
(see [Authentication](../reference/authentication.md)).

## Commands

```bash
marvin platform ai providers list
marvin platform ai providers get <id>
marvin platform ai providers create (--data <json|@file|-> | --file <path>)
marvin platform ai providers update <id> (--data <json|@file|-> | --file <path>)
marvin platform ai providers delete <id> --yes
marvin platform ai providers test <id>

marvin platform ai providers models list <provider-id>
marvin platform ai providers models create <provider-id> (--data <json|@file|-> | --file <path>)
marvin platform ai providers models update <provider-id> <model-id> (--data <json|@file|-> | --file <path>)
marvin platform ai providers models delete <provider-id> <model-id> --yes

marvin platform ai operations list
marvin platform ai operations get <slug>
marvin platform ai operations execute <slug> [--data <json|@file|-> | --file <path>]
marvin platform ai operations reindex [--data <json|@file|-> | --file <path>]

marvin platform ai executions list [--operation-slug <slug>] [--status <status>] [--entity-id <id>] [--limit <n>] [--offset <n>]
marvin platform ai executions get <id>
marvin platform ai executions delete <id> --yes

marvin platform ai settings show
marvin platform ai settings update (--data <json|@file|-> | --file <path>)
```

There is no shorter alias for `ai`; it only exists under `platform`.

!!! note "Required role"
    Everything under `providers`, including its models, needs **ADMIN** (or OWNER), reads included.
    The other groups have no role gate in the CLI. The backend decides: each operation carries a
    minimum role (`min_role` in `operations get`), and the SDK documents that settings writes need
    ADMIN/OWNER. A 403 is reported with the role it needs. See
    [Workspace roles](../reference/authentication.md#workspace-roles).

Write commands take a JSON body from `--data <json|@file|->` (inline JSON, `@path` to read a file,
or `-` for stdin), from `--file <path>`, or from piped stdin. The body must be a JSON object, with
camelCase keys. `delete` commands refuse to run without `--yes`.

## Providers

A provider is a connection to an LLM service. `providerType` is one of `openai`, `anthropic`,
`google`, `azure`, `ollama` or `custom`.

### List and get

```bash
marvin platform ai providers list
marvin platform ai providers get 3d9c…
```

`list` columns: ID, Name, Slug, Provider Type, Enabled, Is Default. `get` prints the full provider,
including its `models`.

### Create and update

`create` requires `name`, `slug` and `providerType`. Optional: `baseUrl`, `enabled`, `isDefault`,
`metadataJson` and `secretRef`. `update` takes the same keys, all optional, and changes only the ones
you send.

```bash
marvin platform ai providers create --data '{
  "name": "Anthropic",
  "slug": "anthropic",
  "providerType": "anthropic",
  "secretRef": "<secret-reference>",
  "enabled": true,
  "isDefault": true
}'

marvin platform ai providers update 3d9c… --data '{"enabled": false}'
```

#### Credentials

A provider never holds an API key in its own fields. `secretRef` points at a workspace secret, and
the key itself lives in the secret store ([Secrets and variables](secrets-variables.md)). The CLI has
no key flag, so a key does not end up in your shell history through this command, and `get`/`list`
show only the reference. Create the secret first, then put its reference in `secretRef`. Read
bodies from a file or stdin when they hold anything you would not paste into a terminal.

### Test

```bash
marvin platform ai providers test 3d9c…
```

Checks the provider's credentials and connection. The result has `success`, a `message` and
`availableModels` (the model ids the provider reports). Run it after creating a provider or
rotating its secret.

### Delete

```bash
marvin platform ai providers delete 3d9c… --yes
```

With `--json`, prints `{"deleted": "<id>"}`.

## Models

Models are the specific model ids a provider offers, and are managed under their provider.

```bash
marvin platform ai providers models list 3d9c…
marvin platform ai providers models create 3d9c… --data '{
  "name": "Claude Sonnet",
  "modelId": "claude-sonnet-4-5",
  "isDefault": true,
  "supportsTools": true,
  "supportsVision": true
}'
marvin platform ai providers models update 3d9c… 8b21… --data '{"enabled": false}'
marvin platform ai providers models delete 3d9c… 8b21… --yes
```

`list` columns: ID, Name, Model Id, Is Default, Enabled. `create` requires `name` and `modelId`;
optional keys are `isDefault`, `enabled`, `contextWindow`, `maxOutputTokens`, `supportsVision` and
`supportsTools`. `update` takes the same keys, all optional. `<model-id>` in `update` and `delete` is
the model's record id (the `id` column), not its `modelId`.

## Operations

Operations are the built-in AI tasks the backend offers (summaries, tag suggestions, alt text and so
on).

```bash
marvin platform ai operations list
marvin platform ai operations get generate-summary
```

`list` columns: Slug, Name, Description. `get` also returns the operation's `input_schema` and
`output_schema`, `entity_types` it applies to, `min_role`, and `requires_vision`. Read the input
schema before building an execute body.

### Execute

```bash
marvin platform ai operations execute <slug> [--data <json|@file|-> | --file <path>]
```

| Body key | Description |
| --- | --- |
| `entityType` | Type of the entity the operation runs against (see `entity_types` on the operation) |
| `entityId` | Id of that entity |
| `input` | Operation-specific input object, shaped by the operation's `input_schema` |
| `modelOverride` | Use this model for the call instead of the workspace default |
| `source` | Invocation surface; normally set by the calling infrastructure, and checked against the workspace's AI policy |

All keys are optional. With no `--data`/`--file` and an interactive terminal, the CLI sends an empty
body `{}`. When stdin is not a terminal (a script, CI), it reads the body from stdin instead, so
pass `--data '{}'` explicitly there.

```bash
marvin platform ai operations execute generate-summary \
  --data '{"entityType": "entry", "entityId": "6f1c…"}'
```

Execution is synchronous. The command returns the finished execution record, which is also written
to the audit log: `status` (`completed` or `failed`), `outputJson` (the operation's result),
`errorMessage`, `operationSlug`, `providerType`, `modelId`, token counts (`promptTokens`,
`completionTokens`, `totalTokens`), `estimatedCostUsd`, `durationMs` and timestamps. Pull out just
the result with:

```bash
marvin platform ai operations execute generate-tags --file body.json --json | jq '.outputJson'
```

### Reindex

```bash
marvin platform ai operations reindex [--data <json|@file|-> | --file <path>]
```

Rebuilds the RAG embeddings index over the workspace's published content. The optional body can
narrow the work: `entityType`, `entityId`, `scope`, and `force` (default `false`). An empty body
reindexes everything the backend would normally cover.

```bash
marvin platform ai operations reindex
marvin platform ai operations reindex --data '{"entityType": "entry", "force": true}'
```

With `--json` the result is `{"ok": true, …}` plus whatever the backend returns.

## Executions

Every operation run is recorded in the audit log, newest first.

```bash
marvin platform ai executions list --operation-slug generate-summary --status failed --limit 20
marvin platform ai executions get 5e0a…
marvin platform ai executions delete 5e0a… --yes
```

| Option | Description | Default |
| --- | --- | --- |
| `--operation-slug <slug>` | Only runs of this operation | all |
| `--status <status>` | Only runs in this status (`pending`, `running`, `completed`, `failed`, `cancelled`) | all |
| `--entity-id <id>` | Only runs against this entity | all |
| `--limit <number>` | Maximum number of results | not sent |
| `--offset <number>` | Number of results to skip | not sent |

`list` columns: ID, Operation Slug, Status, Entity Type, Entity Id, Created At. `get` prints the full
record, including `outputJson` and `errorMessage`. `delete` removes the audit record only.

## Settings

Workspace-wide AI policy.

```bash
marvin platform ai settings show
marvin platform ai settings update --data '{"enabled": true, "approvalMode": "suggest-only"}'
```

`show` returns the current settings (defaults if none were saved yet). `update` upserts: send only
the keys you want to change.

| Key | Description |
| --- | --- |
| `enabled` | Master switch for AI in this workspace |
| `credentialMode` | `platform`, `workspace` or `disabled` |
| `provider`, `model` | Default provider and model |
| `secretRef` | Reference to the secret holding the workspace's credential (a reference, not a key) |
| `approvalMode` | `suggest-only`, `allow-draft-update` or `allow-automatic-update` |
| `invocationSources`, `operationOverrides`, `budgetConfig`, `loggingConfig`, `moderationConfig` | Policy objects |
| `externalMcpEnabled` | Whether the agent may use tools from registered external MCP servers |
| `assistantName`, `personaPrompt`, `defaultRegister` | Assistant persona: display name, voice/tone prompt, tone register (`auto`, `professional`, `playful`) |
