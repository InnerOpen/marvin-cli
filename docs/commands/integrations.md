# Integrations

Manage the workspace's integrations: connections to providers such as Slack, Apprise, n8n or
Cloudflare Pages, the event subscriptions that run their actions, and how their errors are handled.

!!! note "Required role"
    Every integration command needs the workspace **ADMIN** (or OWNER) role, except `providers`,
    which any member can run. Without it the command fails with `Permission denied (403)` and names
    the role it needs. See [Workspace roles](../reference/authentication.md#workspace-roles).

!!! note "Server requirement"
    The integration routes only exist when the Marvin server has the integration SDK
    (`marvin-integration-sdk`) installed. Without it every command here answers 404.

Every command that takes `<integration>` accepts the integration's id or its slug (the CLI looks it
up in the list; the API has no single-integration route).

## Commands

```bash
marvin platform integrations list [--needs-attention]
marvin platform integrations get <integration>
marvin platform integrations providers
marvin platform integrations plugins
marvin platform integrations create --data <json|@file|-> [--credential-stdin]
marvin platform integrations update <integration> [--data <json|@file|->] [--credential-stdin]
marvin platform integrations delete <integration> --yes
marvin platform integrations check <integration>
marvin platform integrations resolve <integration> [--alert-id <id>]
marvin platform integrations run <integration> <action> [--data <json|@file|->]
marvin platform integrations options <integration> <action> <input>

marvin platform integrations errors <integration>
marvin platform integrations errors set <integration> <code> [--review|--no-review] [--alert|--no-alert]
marvin platform integrations errors reset <integration> [code]

marvin platform integrations alert-routing
marvin platform integrations alert-routing set [--email-admins|--no-email-admins] [--targets <ids>] [--reminder-hours <n>]

marvin platform integrations subscriptions list [--event <type>]
marvin platform integrations subscriptions create (--data <json> | --integration <id> --event <type> --action <key> [--args <json>])
marvin platform integrations subscriptions update <id> [--enable|--disable] [--args <json>] [--data <json>]
marvin platform integrations subscriptions delete <id> --yes
```

`subscriptions` also answers to `subs`. `--data` takes inline JSON, `@path` to read a file, or `-`
to read stdin; `--file <path>` is the same as `--data @path`.

## List and get

```bash
marvin platform integrations list
marvin platform integrations list --needs-attention --json
```

Columns: ID, Slug, Name, Provider, Enabled, Status (`ok`, `error`, `unconfigured`), and Attention:
the integration's open alerts, e.g. `⚠ 3 (rate_limited)` — how many failures and which error codes.
When any integration needs attention, table mode adds a line on stderr pointing at `get` and
`resolve`. `--needs-attention` keeps only those integrations.

```bash
marvin platform integrations get team-slack --json
```

Prints the integration: config, whether it has a credential, status, last check, open alerts
(`attention`, with sample failures) and `errorOverrides`.

## Providers and plugins

```bash
marvin platform integrations providers
marvin platform integrations plugins
```

`providers` lists what can be connected: slug, name, category, the provider's actions and events,
and its logo. In JSON mode each provider also has a `logoUrl` — the public logo route, built by the
client — when the provider ships a logo (`hasLogo`), otherwise `null` (use `icon`).

`plugins` lists the plugin packages that supply providers, whether each loaded (and why not), the
provider slugs it adds, and its version. Platform admins can see every installed plugin, integration
and AI, with `marvin admin system plugins`.

## Create, update, delete

```bash
pass show slack/bot-token | marvin platform integrations create \
  --data '{"provider":"slack","name":"Team Slack","config":{}}' --credential-stdin

marvin platform integrations update team-slack --data '{"enabled":false}'
pass show slack/bot-token-2 | marvin platform integrations update team-slack --credential-stdin
marvin platform integrations delete team-slack --yes
```

The create body is `{provider, name, slug?, config?, credential?}`; update takes any of `name`,
`enabled`, `config`, `credential`. Pass the credential (API key, token) with `--credential-stdin`
rather than in `--data`, so it stays out of your shell history; it is merged into the body as
`credential`. `--credential-stdin` can't be combined with `--data -` (both read stdin).

`delete` removes the integration and its event subscriptions, and prints `{"deleted": "<id>"}` in
JSON mode.

## Check, resolve, run

```bash
marvin platform integrations check team-slack
```

Tests the connection now and prints `{"ok": <status is ok>, "status": ..., "lastError": ...}` in
JSON mode. **Exits 1 unless the status comes back `ok`.**

```bash
marvin platform integrations resolve team-slack
marvin platform integrations resolve team-slack --alert-id <alert-id>
```

Marks the integration's open alerts resolved ("I fixed it"), or one alert with `--alert-id`. The
resolution is announced through the channels that delivered each alert, and retries parked behind
the alert run again. Prints `{"ok": true, "resolved": <count>}` in JSON mode.

```bash
marvin platform integrations run team-slack post_message --data '{"channel":"C123","text":"Hello"}'
```

Runs one of the provider's actions now with the given arguments (`{{SLUG}}` placeholders are
resolved from workspace secrets). The integration must be enabled. Prints `{"ok": ..., "result": {...}}`
and exits 1 when the action reports failure.

```bash
marvin platform integrations options team-slack post_message channel
```

Lists the choices for an action input that offers them (here, the Slack channels), as value/label
pairs.

## Error handling

Each provider declares an error policy: for every error code it can raise (for the provider as a
whole, and per action), what happens when a workflow step fails with it — retry with backoff, send
the entry to review, alert the workspace admins, or treat it as a success.

```bash
marvin platform integrations errors team-slack
```

Prints the policy table for this connection:

| Column | Meaning |
|--------|---------|
| Scope | `provider`, or `action <key>` for an action's own codes |
| Code | The error code |
| Provider default | What the provider does, e.g. `retry 3× (1m, 5m, 30m), then send to review` |
| Review | Whether the entry goes to review, after this connection's overrides |
| Alert | Whether workspace admins are alerted, after this connection's overrides |
| Override | What this connection changed, if anything |

A connection can override two things per code: **review** and **alert** (the API calls it
`notify`). Retries always stay the provider's. An override for a specific code wins; otherwise an
override for `*` applies to every code; otherwise the provider's default.

```bash
# Don't send rate-limited posts to review, but do alert
marvin platform integrations errors set team-slack rate_limited --no-review --alert

# Silence alerts for every code on this connection
marvin platform integrations errors set team-slack '*' --no-alert

# Drop one override, or all of them
marvin platform integrations errors reset team-slack rate_limited
marvin platform integrations errors reset team-slack
```

`errors set` merges into the connection's existing overrides and needs at least one of
`--review/--no-review`, `--alert/--no-alert`. The server rejects a code the provider doesn't
declare. Both `set` and `reset` print the connection's overrides afterwards.

## Alert routing

```bash
marvin platform integrations alert-routing
marvin platform integrations alert-routing set --no-email-admins --targets <id>,<id> --reminder-hours 12
```

Where integration alerts go: email to the workspace admins, and/or notify-capable integrations
(targets). `--targets` replaces the list of integration ids (`--targets ''` clears it);
`--reminder-hours` re-alerts an unresolved problem every n hours.

## Event subscriptions

An event subscription runs an integration action whenever an event happens — for example, post to
Slack when an entry is published. `marvin platform event-log types` lists the event types and the
variables each one carries for `--args` templates.

```bash
marvin platform integrations subscriptions list
marvin platform integrations subscriptions list --event entry_published

marvin platform integrations subscriptions create --integration team-slack \
  --event entry_published --action post_message --args '{"text":"New: {{entry.title}}"}'

marvin platform integrations subs update <id> --disable
marvin platform integrations subs update <id> --args '{"text":"Published: {{entry.title}}"}'
marvin platform integrations subs delete <id> --yes
```

`create` takes either the three flags (`--integration` accepts an id or slug) or a
`{integrationId, eventType, action, args?}` body with `--data`. `update` takes `--enable`,
`--disable`, `--args` and/or `--data '{enabled?, args?}'`.

## Scripting

stdout carries data only; ✓ lines and the attention hint go to stderr.

```bash
# Fail a health check if any integration needs attention
n=$(marvin platform integrations list --needs-attention --json | jq length)
[ "$n" -eq 0 ] || exit 1

# Re-check every enabled integration
marvin platform integrations list --json | jq -r '.[] | select(.enabled) | .slug' |
  while read -r slug; do marvin platform integrations check "$slug" || echo "$slug failed" >&2; done
```

## API Reference

| Command | Endpoint |
|---------|----------|
| `list`, `get` | `GET /api/groups/integrations` |
| `providers` | `GET /api/groups/integrations/providers` |
| `plugins` | `GET /api/groups/integrations/plugins` |
| `create` | `POST /api/groups/integrations` |
| `update` | `PATCH /api/groups/integrations/{id}` |
| `delete` | `DELETE /api/groups/integrations/{id}` |
| `check` | `POST /api/groups/integrations/{id}/check` |
| `resolve` | `POST /api/groups/integrations/{id}/resolve` |
| `run` | `POST /api/groups/integrations/{id}/actions/{action_key}` |
| `options` | `POST /api/groups/integrations/{id}/options` |
| `errors` | `GET /api/groups/integrations` + `GET /api/groups/integrations/providers` |
| `errors set`, `errors reset` | `PUT /api/groups/integrations/{id}/error-overrides` |
| `alert-routing` | `GET` / `PUT /api/groups/integrations/alert-routing` |
| `subscriptions` | `GET` / `POST /api/groups/integrations/subscriptions`, `PATCH` / `DELETE …/subscriptions/{id}` |

## See Also

- [Workflows](workflows.md) — `integration` actions, and the run history that shows how failures were handled
- [Site rebuild](site-rebuild.md) — an integration (e.g. Cloudflare Pages) can be what builds the site
