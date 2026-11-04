# Incoming Webhooks

An incoming webhook is a URL an outside service POSTs to. Each delivery drops an
`incoming_webhook` event carrying the request body, which a workflow with an `incoming_webhook`
trigger reacts to. The URL is `<api-url>/api/hooks/<token>`: the token is the credential, and you
can rotate or revoke it. A webhook can also verify each delivery's signature.

## Commands

```bash
marvin platform incoming-webhooks list
marvin platform incoming-webhooks get <webhook>
marvin platform incoming-webhooks create (--data <json|@file|-> | --file <path>)
marvin platform incoming-webhooks update <webhook> (--data <json|@file|-> | --file <path>)
marvin platform incoming-webhooks delete <webhook> --yes
marvin platform incoming-webhooks mint-token <webhook>
marvin platform incoming-webhooks revoke-token <webhook>
marvin platform incoming-webhooks signature-schemes
```

Every command that takes `<webhook>` accepts its id or its slug. `--data` takes inline JSON, `@path`
to read a file, or `-` to read stdin; `--file <path>` is the same as `--data @path`.

!!! note "Required role"
    Every incoming-webhook command, reads included, needs the workspace **ADMIN** (or OWNER) role:
    the token is a credential. See [Workspace roles](../reference/authentication.md#workspace-roles).

## create and mint-token

A new webhook has no token, so nothing can call it yet. Mint one to get the URL:

```bash
marvin platform incoming-webhooks create --data '{"name": "Shopify orders", "enabled": true}'
marvin platform incoming-webhooks mint-token shopify-orders
# ✓ Minted a token for shopify-orders. Senders POST to: https://cms.example.com/api/hooks/…
```

The URL goes to stderr; stdout carries the webhook (with its `token`), so
`mint-token … --json | jq -r .token` works in a script. Minting again rotates the token: the old URL
stops working at once. `revoke-token` leaves the webhook without a token until you mint a new one.

| Command | Argument / option | Description |
|---------|-------------------|-------------|
| `create` | `--data <json\|@file\|->` | The webhook as JSON, `@path` to read a file, or `-` for stdin |
| | `--file <path>` | JSON file with the webhook (same as `--data @path`) |
| `update` | `<webhook>` | Webhook id or slug |
| | `--data <json\|@file\|->`, `--file <path>` | The fields to change, as for `create` |
| `mint-token` | `<webhook>` | Webhook id or slug; no options |
| `revoke-token` | `<webhook>` | Webhook id or slug; no options |

The body for `create`/`update`:

| Field | Meaning |
|-------|---------|
| `name` | Display name (required on create) |
| `slug` | Defaults to one made from the name; fixed after create |
| `description` | Free text |
| `enabled` | `false` (the default) rejects deliveries |
| `signingSecretRef` | Slug of the workspace secret that holds the sender's signing key |
| `signatureScheme` | How to check the signature: a scheme from `signature-schemes` |
| `signatureHeader` | The header carrying the signature, when the scheme lets you choose |
| `signatureUrl` | The URL the sender signs, for schemes that sign it (when it differs from the receiver's) |
| `signatureConfig` | The construction, for `custom` |

`revoke-token` makes the receiver reject every request until a new token is minted:

```bash
marvin platform incoming-webhooks revoke-token shopify-orders
```

## update and signature-schemes

```bash
marvin platform incoming-webhooks update shopify-orders --data '{"enabled": true}'
marvin platform incoming-webhooks signature-schemes
```

`signature-schemes` takes no options. It lists the schemes: core presets (GitHub-style HMAC, Slack,
Stripe, Standard Webhooks, a static token, …), presets that installed integrations contribute, and `custom`. Source says where each comes
from. Store the sender's key as a workspace secret, then point the webhook at it:

```bash
marvin platform secrets create --name "Stripe signing key" --value-stdin < key.txt
marvin platform incoming-webhooks update stripe-events \
  --data '{"signatureScheme": "stripe", "signingSecretRef": "stripe-signing-key"}'
```

The server refuses a scheme it can't verify with (unknown, or a `custom` config that doesn't
describe a usable construction) with a 422 that says why.

## list and get

```bash
marvin platform incoming-webhooks list
marvin platform incoming-webhooks get shopify-orders --json | jq -r .token
```

`get` takes `<webhook>` and no options; it prints the webhook including its token.

Columns: ID, Slug, Name, Enabled, Token (`minted` or `none`; the value is only shown by `get`),
Signature (the scheme, `hmac-sha256` for the default check, or `none`), Received, Last received.

## delete

```bash
marvin platform incoming-webhooks delete shopify-orders --yes
```

| Argument / option | Description | Default |
|-------------------|-------------|---------|
| `<webhook>` | Webhook id or slug | |
| `--yes` | Confirm the delete; the command refuses to run without it | |

The URL stops working. Prints `{"deleted": "<id>"}` with `--json`.
