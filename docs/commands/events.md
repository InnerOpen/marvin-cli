# Events

The Events hub answers two questions about every event type in a workspace: what sends it, and what
happens when it does. It is the CLI side of the admin app's Events page.

`marvin events` is about event *types*. To read the individual events that happened, use
[`marvin platform event-log`](event-log.md). Its old alias `platform events` is deprecated and
removed in 4.0.

## Commands

```bash
marvin events list [--category <name>] [--connected | --unused]
marvin events show <event-type> [--limit <n>]
```

!!! note "Required role"
    Both commands need the workspace **ADMIN** (or OWNER) role: they show the workspace's
    workflows, integrations, webhooks and email subscriptions. See
    [Workspace roles](../reference/authentication.md#workspace-roles).

## List

```bash
marvin events list
marvin events list --connected          # types something reacts to
marvin events list --unused             # types nothing reacts to
marvin events list --category content   # one category (case doesn't matter)
```

One row per workspace event type, in catalogue order:

| Column | Meaning |
|--------|---------|
| Event type | The type's key, e.g. `entry_published` |
| Name, Category | From the event catalogue (blank for a type the catalogue doesn't list) |
| Senders | How many things send it: Marvin itself, workflows, incoming webhooks, scheduled tasks |
| Reactions (on/total) | Workflows, integration actions, emails and webhooks that react to it: switched on / all |
| Built-in | Reactions Marvin always runs, such as queueing a site rebuild |
| Last occurred | When it last happened, or blank |

`--connected` and `--unused` look at reactions you can configure, so built-ins don't count: a type
with only built-in reactions is `--unused`. Platform-scope event types are not listed; the admin
Events page shows those.

With `--json` each row is the API's summary row with `name` and `category` added:

```json
{
  "eventType": "entry_published",
  "name": "Entry Published",
  "category": "Content",
  "senders": 5,
  "reactions": 1,
  "activeReactions": 1,
  "builtinReactions": 4,
  "lastOccurredAt": "2026-10-04T18:02:23.857734Z"
}
```

```bash
# Event types nobody has wired up yet
marvin events list --unused --json | jq -r '.[].eventType'
```

## Show

```bash
marvin events show entry_published
marvin events show entry_published --limit 25
```

In a terminal it prints a page:

```text
Entry Published (entry_published)
Category: Content
A content entry was published.
Recorded in the event log: yes

Sent by
  on   Marvin            Publishing an entry (app, API, CLI)
  on   Workflow          Buttondown: subscriber confirmed — Entry step: publish · installed by Buttondown
  on   Incoming webhook  Buttondown events — Starts the workflow Buttondown: subscriber confirmed · installed by Buttondown
  on   Scheduled task    Publish Scheduled Entries — System task (every workspace)

What happens
  Workflows
    on   Buttondown: email an issue when published — installed by Buttondown
  Built-in
    on   Refreshes AI search
    on   Queues a site rebuild

Recent (newest first, UTC)
  2026-10-04 18:02  Entry 'Studio Notes' published

Leads to: site_rebuild_queued (Site Rebuild Queued), ai_embeddings_reindexed (AI Embeddings Reindexed)
Caused by: nothing
```

- **Sent by**: each sender with its kind and whether it is switched on.
- **What happens**: reactions grouped by kind (workflows, integration actions, webhooks, emails),
  built-ins last. "installed by" names the integration whose blueprint created it.
- **Recent**: the newest `--limit` events (default 10, at most 50). A type that isn't recorded in
  the event log has no history.
- **Leads to / Caused by**: event types this one sets off, and the ones that set it off.

With `--json` (or `--yaml`) it prints the API object unchanged: `eventType`, `name`, `description`,
`category`, `audited`, `senders[]`, `reactions[]`, `recent[]`, `leadsTo[]`, `causedBy[]`.

```bash
# Reactions that are switched off
marvin events show entry_published --json | jq '.reactions[] | select(.enabled | not) | .name'
```

### Errors

An event type the workspace doesn't have, or a platform event type, is a 404:

```text
✗ API Error (404)
Unknown event type 'nope' (or a platform event — see the admin Events page)
```

With `--json`: `{"error": "Unknown event type 'nope' (or a platform event — see the admin Events page)", "status": 404}`.
Without the ADMIN role, both commands answer with the usual
[permission message](../reference/authentication.md#workspace-roles).
