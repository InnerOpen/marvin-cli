/**
 * `marvin platform incoming-webhooks` — tokened endpoints that let an outside service start a
 * workflow: a POST to /api/hooks/{token} drops an `incoming_webhook` event carrying the request
 * body. CRUD, minting/rotating/revoking the token, and the signature schemes a webhook can verify
 * its sender with. Every route needs workspace ADMIN, reads included.
 */

import { Command } from "commander";
import type { IncomingWebhook, PlatformClient } from "@inneropen/marvin-sdk/platform";
import { clientFactory } from "../../shared/clients.js";
import { renderData, renderList } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { handleCommandError } from "../../shared/error-handler.js";
import { TABLE_SCHEMAS } from "../../shared/table-schemas.js";
import { addDataOptions, readJsonInput } from "../../shared/json-input.js";
import { say, emitDeleted } from "../../shared/io.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The API takes ids; accept a slug too and look it up. */
async function resolveWebhookId(client: PlatformClient, ref: string): Promise<string> {
  if (UUID.test(ref)) return ref;
  const match = (await client.incomingWebhooks.list()).find((w) => w.slug === ref);
  if (!match) throw new Error(`No incoming webhook with id or slug '${ref}'`);
  return match.id;
}

/** Where senders POST: the receiver URL for the webhook's current token. */
function receiverUrl(client: PlatformClient, webhook: IncomingWebhook): string | undefined {
  return webhook.token ? client.buildUrl(`/api/hooks/${webhook.token}`) : undefined;
}

export function registerIncomingWebhookCommands(parent: Command): void {
  const hooks = parent
    .command("incoming-webhooks")
    .description("Incoming webhooks: URLs an outside service POSTs to, to trigger workflows");

  const optsOf = (cmd: Command) => cmd.optsWithGlobals<PlatformCommandOptions>();

  hooks
    .command("list")
    .description("List the workspace's incoming webhooks (tokens are not shown; `get` shows one)")
    .action(async function(this: Command) {
      try {
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        renderList(await client.incomingWebhooks.list(), TABLE_SCHEMAS["incoming-webhooks.list"], getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  hooks
    .command("get <webhook>")
    .description("Show an incoming webhook (id or slug), including its token")
    .action(async function(this: Command, ref: string) {
      try {
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        renderData(await client.incomingWebhooks.get(await resolveWebhookId(client, ref)), getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  hooks
    .command("signature-schemes")
    .description("Signature schemes a webhook can verify its sender with (core presets, integration presets, custom)")
    .action(async function(this: Command) {
      try {
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        renderList(await client.incomingWebhooks.signatureSchemes(), TABLE_SCHEMAS["incoming-webhooks.signature-schemes"], getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  addDataOptions(hooks
    .command("create")
    .description("Create an incoming webhook from {name, slug?, description?, enabled?, signingSecretRef?, signatureScheme?, …} (no token until you mint one)"),
    "the webhook")
    .action(async function(this: Command, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        const webhook = await client.incomingWebhooks.create(data);
        say(`✓ Created incoming webhook: ${webhook.slug} (${webhook.id}) — mint a token to get its URL`);
        renderData(webhook, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  addDataOptions(hooks
    .command("update <webhook>")
    .description("Change a webhook's name, description, enabled flag or signature settings"), "the fields to change")
    .action(async function(this: Command, ref: string, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        const webhook = await client.incomingWebhooks.update(await resolveWebhookId(client, ref), data);
        say(`✓ Updated incoming webhook: ${webhook.slug}`);
        renderData(webhook, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  hooks
    .command("delete <webhook>")
    .description("Delete an incoming webhook (its URL stops working)")
    .option("--yes", "Confirm the delete")
    .action(async function(this: Command, ref: string, cmdOpts) {
      try {
        if (!cmdOpts.yes) {
          console.error("Error: Delete requires --yes confirmation flag");
          process.exitCode = 1;
          return;
        }
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        const id = await resolveWebhookId(client, ref);
        await client.incomingWebhooks.delete(id);
        emitDeleted(id, getOutputMode(opts), `✓ Deleted incoming webhook: ${ref}`);
      } catch (error) {
        handleCommandError(error);
      }
    });

  hooks
    .command("mint-token <webhook>")
    .description("Mint a token (or rotate it: the old URL stops working) and print the receiver URL")
    .action(async function(this: Command, ref: string) {
      try {
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        const webhook = await client.incomingWebhooks.mintToken(await resolveWebhookId(client, ref));
        const url = receiverUrl(client, webhook);
        say(`✓ Minted a token for ${webhook.slug}${url ? `. Senders POST to: ${url}` : ""}`);
        if (!webhook.enabled) say("  The webhook is disabled; enable it to accept deliveries.");
        renderData(webhook, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  hooks
    .command("revoke-token <webhook>")
    .description("Revoke the token: the receiver rejects every request until a new one is minted")
    .action(async function(this: Command, ref: string) {
      try {
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        const webhook = await client.incomingWebhooks.revokeToken(await resolveWebhookId(client, ref));
        say(`✓ Revoked the token for ${webhook.slug}`);
        renderData(webhook, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });
}
