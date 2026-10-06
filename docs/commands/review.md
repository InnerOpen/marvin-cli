# Review Queue

Work through what's waiting in a workspace: entries by status, AI suggestions that need a yes or
no, AI-generated assets awaiting approval, and the dashboard that counts all of it. Plus the
scheduling flags on `entries update`.

## Commands

```bash
marvin platform dashboard
marvin platform entries counts
marvin platform entries list [--status <s>[,<s>…]] [--entry-type <slug>] [--suggestions] [--limit <n>]
marvin platform entries apply-suggestion <id>
marvin platform entries reject-suggestion <id>
marvin platform assets apply-suggestion <id>
marvin platform assets reject-suggestion <id>
marvin platform resources apply-suggestion <id>
marvin platform resources reject-suggestion <id>
marvin platform entries suggested-assets list <entry-id>
marvin platform entries suggested-assets approve <entry-id> <asset-id>
marvin platform entries suggested-assets reject <entry-id> <asset-id>
marvin platform entries update <id> [--status <s>] [--publish-at <iso>] [--expire-at <iso>] [--data <json|@file|->]
```

!!! note "Required role"
    Any member reads the dashboard, counts and lists. Applying or rejecting an entry's suggestion,
    approving or rejecting its suggested assets, and updating it follow the entry rules: an
    **AUTHOR** for their own drafts, **EDITOR** for anyone else's entry or to approve, publish or
    schedule one. Suggestions on assets and resources need **EDITOR**. See
    [Workspace roles](../reference/authentication.md#workspace-roles).

## Dashboard

```bash
marvin platform dashboard
```

```text
Needs attention: 7
┌─────────┬───────────────────┬───────┬─────────────────────────────────────────────────────┐
│ (index) │ Item              │ Count │ See it with                                         │
├─────────┼───────────────────┼───────┼─────────────────────────────────────────────────────┤
│ 0       │ Inbox             │ 2     │ marvin platform entries list --status inbox         │
│ 1       │ Drafts            │ 1     │ marvin platform entries list --status draft         │
│ 2       │ Needs review      │ 1     │ marvin platform entries list --status needs_review  │
│ 3       │ AI suggestions    │ 3     │ marvin platform entries list --suggestions          │
│ 4       │ Failures (7 days) │ 0     │                                                     │
└─────────┴───────────────────┴───────┴─────────────────────────────────────────────────────┘

Recent activity
…
```

**AI suggestions** counts entries, assets and resources with a pending suggestion. **Failures**
counts failed scheduled-task runs, webhook deliveries and AI executions in the last 7 days. With
`--json` you get the API's `{attention: {inbox, drafts, needsReview, aiSuggestions, failures},
recentActivity: [...]}`.

## Counts and filtered lists

```bash
marvin platform entries counts            # every status, zero-filled, plus total
marvin platform entries counts --json     # {"inbox": 2, "draft": 1, …, "total": 48}
```

`entries list` returns entries newest first. The API has no filters, so the CLI fetches the list
and filters it:

| Option | Keeps |
|--------|-------|
| `--status <s>` | Entries with this status; comma-separate several (`inbox,needs_review`) |
| `--entry-type <slug>` | Entries of this type (slug or id) |
| `--suggestions` | Entries with a pending AI suggestion (`suggestionJson` set) |
| `--limit <n>` | The first *n* after filtering |

```bash
marvin platform entries list --status needs_review --entry-type post
marvin platform entries list --suggestions --json | jq -r '.[].id'
```

## AI suggestions

When an AI operation writes back with approval required, its proposed changes are staged on the
item as `suggestionJson` instead of being applied. Look at it with `get`, then apply or discard it:

```bash
marvin platform entries get 6f1c… --json | jq .suggestionJson
marvin platform entries apply-suggestion 6f1c…     # commits the changes and clears the suggestion
marvin platform entries reject-suggestion 6f1c…    # clears it without applying
```

`assets` and `resources` have the same two commands. Each prints the updated item.

Approve every pending entry suggestion in one go:

```bash
marvin platform entries list --suggestions --json | jq -r '.[].id' |
  xargs -n1 marvin platform entries apply-suggestion
```

## Suggested assets

An AI media operation (e.g. background removal) can attach the asset it made to the entry as a
*suggestion*: it stays out of published output until someone approves it.

```bash
marvin platform entries suggested-assets list <entry-id>       # ID, Slug, Name, Type, Operation, Derived from
marvin platform entries suggested-assets approve <entry-id> <asset-id>
marvin platform entries suggested-assets reject <entry-id> <asset-id>
```

Approving makes it a normal attached asset. Rejecting unlinks it, and deletes the asset if nothing
else uses it.

## Scheduling and status

`entries update` takes `--status`, `--publish-at` and `--expire-at`, so you can schedule without
writing a JSON body:

```bash
marvin platform entries update 6f1c… --publish-at 2026-10-31T09:00:00Z
marvin platform entries update 6f1c… --expire-at 2027-01-01T00:00:00Z
marvin platform entries update 6f1c… --publish-at ""          # clear the schedule ("none" works too)
marvin platform entries update 6f1c… --status needs_review
```

Times are ISO 8601; the CLI rejects one it can't read before calling the API. The flags combine
with `--data`, and win over the same field in it (`publish_at` or `publishAt`). With only flags, the
command doesn't wait on stdin for a body.
