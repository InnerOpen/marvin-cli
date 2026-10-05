# Site Rebuild

Ask Marvin to rebuild the workspace's static site, and see where the rebuild stands. These are
Platform API commands (user token); the read-only site configuration is
[`marvin publish site`](site.md).

!!! note "Required role"
    Both commands need the workspace **EDITOR** role or above — the same role that publishes.
    Without it the command fails with `Permission denied (403)`.

!!! note "Server requirement"
    `POST/GET /api/platform/site/rebuild` is new: the server needs a Marvin release that includes the
    site rebuild endpoint (newer than rc.198). An older server answers 404.

## Commands

```bash
marvin platform site rebuild [--reason <text>]
marvin platform site rebuild-status
```

## How a rebuild is sent

Marvin doesn't build the site itself. A rebuild goes to whatever the workspace has set up to build
it, on the **Webhook Triggered** event: an outgoing webhook (your host's deploy hook), or an
integration action subscribed to that event (for example Cloudflare Pages → Deploy).

Rebuild requests coalesce. A request joins the workspace's pending rebuild if there is one, and the
pending rebuild is sent once requests have been quiet for the server's `SITE_REBUILD_QUIET_SECONDS`
(and no later than its maximum wait after the first request). Calling `site rebuild` ten times in a
minute costs one build.

## Request a rebuild

```bash
marvin platform site rebuild
marvin platform site rebuild --reason "Nightly content sync"
```

`--reason` (at most 200 characters) goes into the build log; without it the server uses
"Rebuild requested by <your name>".

Table mode prints the outcome on stderr:

```
✓ Rebuild queued (joins 1 earlier request(s)): sends at 2026-10-05T10:01:05Z
  via Pages (integration: cloudflare_pages → deploy)
  reason: Nightly content sync
```

With `--json`, stdout gets:

```json
{
  "ok": true,
  "requested": true,
  "queuedAt": "2026-10-05T10:00:00Z",
  "lastRequestedAt": "2026-10-05T10:00:05Z",
  "expectedSendAt": "2026-10-05T10:01:05Z",
  "requestCount": 2,
  "reason": "Nightly content sync",
  "target": null,
  "targets": [
    { "kind": "integration", "id": "…", "name": "Pages", "provider": "cloudflare_pages", "action": "deploy" }
  ]
}
```

`requestCount` above 1 means the request joined a pending rebuild; `queuedAt` stays the first
request's time. When nothing is set up to build the site the server answers **409** with what to
configure, nothing is queued, and the command exits 1.

## Rebuild status

```bash
marvin platform site rebuild-status
marvin platform site rebuild-status --json
```

```
Configured:  yes
Builds via:  Deploy hook (webhook)
Quiet time:  60s (sent at most 600s after the first request)
Pending:     none
Last sent:   2026-10-05T09:00:00Z — Rebuild requested by Jo
Last build:  deployment completed at 2026-10-05T09:02:00Z — Deployed
```

The JSON has `configured`, `target`/`targets`, `quietSeconds`, `maxWaitSeconds`, `pending` (the
queued rebuild: request count, first and last request, expected send time, reason, the changes it
covers), `lastSent` (the last Webhook Triggered event) and `lastBuild` (the newest
`site_build_*` / `site_deployment_*` status a host reported back), each `null` when there is none.

## Scripting

```bash
# Rebuild after an import, and fail the job if nothing builds the site
marvin workspace import --file bundle.zip
marvin platform site rebuild --reason "Import from staging" --json | jq -r .expectedSendAt
```

## API Reference

| Command | Endpoint |
|---------|----------|
| `rebuild` | `POST /api/platform/site/rebuild` (202) |
| `rebuild-status` | `GET /api/platform/site/rebuild` |
