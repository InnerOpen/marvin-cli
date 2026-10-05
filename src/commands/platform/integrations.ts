/**
 * `marvin platform integrations` — the workspace's connections to integration providers (Slack,
 * Apprise, Cloudflare Pages…), their event subscriptions, and how their errors are handled.
 *
 * Everything needs workspace ADMIN except `providers`. The integration routes only exist when the
 * server has the integration SDK installed; without it they answer 404.
 */

import { Command } from "commander";
import type {
  Integration,
  IntegrationErrorOverrides,
  IntegrationProviderInfo,
  PlatformClient,
} from "@inneropen/marvin-sdk/platform";
import { clientFactory } from "../../shared/clients.js";
import { renderData, renderList, renderTable } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { handleCommandError } from "../../shared/error-handler.js";
import { TABLE_SCHEMAS } from "../../shared/table-schemas.js";
import { addDataOptions, readJsonInput } from "../../shared/json-input.js";
import { say, emitDeleted, emitOk } from "../../shared/io.js";
import { readFromStdin } from "../../shared/prompt.js";
import { validatePositiveInteger } from "../../shared/validation.js";

/** How the provider handles one error code (the integration SDK's `Handle.to_dict()`). */
interface ErrorHandle {
  review?: boolean;
  notify?: boolean;
  succeed?: boolean;
  summary?: string;
}

/** Provider info as the API returns it; SDK 4.1's type leaves out the error policy. */
type ProviderInfo = IntegrationProviderInfo & {
  errorPolicy?: {
    provider?: Record<string, ErrorHandle>;
    actions?: Record<string, Record<string, ErrorHandle>>;
  } | null;
};

/** One row of `integrations errors`: a code, what the provider does, and this connection's override. */
export interface ErrorPolicyRow {
  scope: string;
  code: string;
  default: string;
  review: boolean;
  alert: boolean;
  override: string;
}

/** Integrations have no single-item route; find one by id or slug in the list. */
async function findIntegration(client: PlatformClient, ref: string): Promise<Integration> {
  const match = (await client.integrations.list()).find((i) => i.id === ref || i.slug === ref);
  if (!match) throw new Error(`No integration with id or slug '${ref}'`);
  return match;
}

function attentionCount(i: Integration): number {
  return (i.attention ?? []).reduce((n, a) => n + (a.count ?? 1), 0);
}

/**
 * The error-policy table for a connection: every code the provider (or one of its actions)
 * declares, with the provider's handling and the effective review/alert flags after this
 * connection's overrides (a code's own override, else the "*" override, else the default).
 */
export function errorPolicyRows(provider: ProviderInfo | undefined, overrides: IntegrationErrorOverrides | null | undefined): ErrorPolicyRow[] {
  const policy = provider?.errorPolicy ?? {};
  const scopes: [string, Record<string, ErrorHandle>][] = [
    ["provider", policy.provider ?? {}],
    ...Object.entries(policy.actions ?? {}).map(([key, codes]) => [`action ${key}`, codes] as [string, Record<string, ErrorHandle>]),
  ];
  const rows: ErrorPolicyRow[] = [];
  for (const [scope, codes] of scopes) {
    for (const [code, handle] of Object.entries(codes)) {
      const own = overrides?.[code];
      const any = overrides?.["*"];
      const review = own?.review ?? any?.review ?? !!handle.review;
      const alert = own?.notify ?? any?.notify ?? !!handle.notify;
      const changed = [
        own?.review !== undefined || any?.review !== undefined ? `review ${review ? "on" : "off"}` : "",
        own?.notify !== undefined || any?.notify !== undefined ? `alert ${alert ? "on" : "off"}` : "",
      ].filter(Boolean);
      rows.push({
        scope,
        code,
        default: handle.summary ?? "",
        review,
        alert,
        override: changed.length ? `${changed.join(", ")}${own ? "" : " (via *)"}` : "",
      });
    }
  }
  // An override for a code the policy table doesn't list ("*" with no "*" handle, say) still shows.
  for (const [code, flags] of Object.entries(overrides ?? {})) {
    if (rows.some((r) => r.code === code)) continue;
    rows.push({
      scope: "override",
      code,
      default: "",
      review: !!flags.review,
      alert: !!flags.notify,
      override: [flags.review !== undefined ? `review ${flags.review ? "on" : "off"}` : "", flags.notify !== undefined ? `alert ${flags.notify ? "on" : "off"}` : ""].filter(Boolean).join(", "),
    });
  }
  return rows;
}

const ERROR_POLICY_COLUMNS = {
  Scope: "scope",
  Code: "code",
  "Provider default": "default",
  Review: (r: ErrorPolicyRow) => (r.review ? "yes" : "no"),
  Alert: (r: ErrorPolicyRow) => (r.alert ? "yes" : "no"),
  Override: "override",
} as const;

/** `--credential-stdin` (secret from a pipe), merged into the --data body. */
async function bodyWithCredential(cmdOpts: any, requireBody: boolean): Promise<Record<string, unknown>> {
  const fromStdinTwice = cmdOpts.credentialStdin && (cmdOpts.data === "-" || cmdOpts.file === "-");
  if (fromStdinTwice) throw new Error("--credential-stdin and --data - both read stdin; put the body in --data '<json>' or @file");
  const hasBody = cmdOpts.data !== undefined || cmdOpts.file;
  const body: Record<string, unknown> = hasBody || requireBody ? await readJsonInput(cmdOpts) : {};
  if (cmdOpts.credentialStdin) {
    const credential = await readFromStdin();
    if (!credential) throw new Error("--credential-stdin read an empty value");
    body.credential = credential;
  }
  if (Object.keys(body).length === 0) throw new Error("Nothing to change: pass --data and/or --credential-stdin");
  return body;
}

export function registerIntegrationCommands(parent: Command): void {
  const integrations = parent
    .command("integrations")
    .description("Integrations: connections to providers, their event subscriptions, and error handling");

  const optsOf = (cmd: Command) => cmd.optsWithGlobals<PlatformCommandOptions>();

  integrations
    .command("list")
    .description("List the workspace's integrations, with any open alerts that need attention")
    .option("--needs-attention", "Only integrations with open alerts")
    .action(async function(this: Command, cmdOpts) {
      try {
        const opts = optsOf(this);
        const mode = getOutputMode(opts);
        const client = await clientFactory.createPlatformClient(opts);
        let items = await client.integrations.list();
        if (cmdOpts.needsAttention) items = items.filter((i) => attentionCount(i) > 0);
        renderList(items, TABLE_SCHEMAS["integrations.list"], mode);
        const flagged = items.filter((i) => attentionCount(i) > 0);
        if (mode === "table" && flagged.length) {
          say(`⚠ ${flagged.length} need attention — see 'integrations get <id>', then 'integrations resolve <id>' once fixed`);
        }
      } catch (error) {
        handleCommandError(error);
      }
    });

  integrations
    .command("get <integration>")
    .description("Show an integration (id or slug): config, status and open alerts")
    .action(async function(this: Command, ref: string) {
      try {
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        renderData(await findIntegration(client, ref), getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  integrations
    .command("providers")
    .description("List the installed providers: what each connects to, its actions and events")
    .action(async function(this: Command) {
      try {
        const opts = optsOf(this);
        const mode = getOutputMode(opts);
        const client = await clientFactory.createPlatformClient(opts);
        const providers = (await client.integrations.listProviders()).map((p) => ({
          ...p,
          // A URL the client builds (no request): only meaningful when the provider ships a logo
          logoUrl: p.hasLogo ? client.integrations.providerLogoUrl(p.slug) : null,
        }));
        renderList(providers, TABLE_SCHEMAS["integrations.providers"], mode);
      } catch (error) {
        handleCommandError(error);
      }
    });

  integrations
    .command("plugins")
    .description("List the plugin packages that provide integration providers, and whether each loaded")
    .action(async function(this: Command) {
      try {
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        renderList(await client.integrations.listPlugins(), TABLE_SCHEMAS["integrations.plugins"], getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  addDataOptions(integrations
    .command("create")
    .description("Connect a provider: {provider, name, slug?, config?}"), "the integration")
    .option("--credential-stdin", "Read the provider credential (API key, token…) from stdin")
    .action(async function(this: Command, cmdOpts) {
      try {
        const data = await bodyWithCredential(cmdOpts, true);
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        const integration = await client.integrations.create(data as any);
        say(`✓ Created integration: ${integration.slug} (${integration.id}) — status ${integration.status}`);
        renderData(integration, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  addDataOptions(integrations
    .command("update <integration>")
    .description("Change an integration's name, enabled flag, config or credential"), "the fields to change")
    .option("--credential-stdin", "Read a new provider credential from stdin")
    .action(async function(this: Command, ref: string, cmdOpts) {
      try {
        const data = await bodyWithCredential(cmdOpts, false);
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        const target = await findIntegration(client, ref);
        const integration = await client.integrations.update(target.id, data);
        say(`✓ Updated integration: ${integration.slug}`);
        renderData(integration, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  integrations
    .command("delete <integration>")
    .description("Delete an integration and its event subscriptions")
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
        const target = await findIntegration(client, ref);
        await client.integrations.delete(target.id);
        emitDeleted(target.id, getOutputMode(opts), `✓ Deleted integration: ${target.slug}`);
      } catch (error) {
        handleCommandError(error);
      }
    });

  integrations
    .command("check <integration>")
    .description("Test the connection now (exit 1 unless its status comes back ok)")
    .action(async function(this: Command, ref: string) {
      try {
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        const target = await findIntegration(client, ref);
        const result = await client.integrations.check(target.id);
        const ok = result.status === "ok";
        emitOk({ ...result, ok }, getOutputMode(opts),
          `${ok ? "✓" : "✗"} ${target.slug}: ${result.status}${result.lastError ? ` — ${result.lastError}` : ""}`);
        if (!ok) process.exitCode = 1;
      } catch (error) {
        handleCommandError(error);
      }
    });

  integrations
    .command("resolve <integration>")
    .description("Mark the integration's open alerts resolved (\"I fixed it\"); parked retries run again")
    .option("--alert-id <id>", "Resolve just this alert")
    .action(async function(this: Command, ref: string, cmdOpts) {
      try {
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        const target = await findIntegration(client, ref);
        const result = await client.integrations.resolveAttention(target.id, cmdOpts.alertId);
        emitOk(result, getOutputMode(opts), `✓ Resolved ${result.resolved} alert(s) on ${target.slug}`);
      } catch (error) {
        handleCommandError(error);
      }
    });

  addDataOptions(integrations
    .command("run <integration> <action>")
    .description("Run one of the provider's actions now with the given arguments (secrets as {{SLUG}})"),
    "the action's arguments")
    .action(async function(this: Command, ref: string, action: string, cmdOpts) {
      try {
        const args = cmdOpts.data !== undefined || cmdOpts.file ? await readJsonInput(cmdOpts) : {};
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        const target = await findIntegration(client, ref);
        const result = await client.integrations.runAction(target.id, action, args);
        emitOk(result, getOutputMode(opts), `${result.ok ? "✓" : "✗"} ${target.slug} ${action}: ${result.ok ? "ok" : "failed"}`);
        if (getOutputMode(opts) === "table") renderData(result.result, "table");
        if (!result.ok) process.exitCode = 1;
      } catch (error) {
        handleCommandError(error);
      }
    });

  integrations
    .command("options <integration> <action> <input>")
    .description("List the choices for an action input that offers them (e.g. the channels for Slack's post)")
    .action(async function(this: Command, ref: string, action: string, input: string) {
      try {
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        const target = await findIntegration(client, ref);
        const options = await client.integrations.listOptions(target.id, action, input);
        renderList(options, { Value: "value", Label: "label" }, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // ---- error handling ----------------------------------------------------------------------

  const errors = integrations
    .command("errors")
    .description("An integration's error policy: what each error code does, and this connection's overrides")
    .argument("<integration>", "Integration id or slug")
    .action(async function(this: Command, ref: string) {
      try {
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        const target = await findIntegration(client, ref);
        const providers = (await client.integrations.listProviders()) as ProviderInfo[];
        const provider = providers.find((p) => p.slug === target.provider);
        const rows = errorPolicyRows(provider, target.errorOverrides);
        const mode = getOutputMode(opts);
        if (mode === "table" && !provider?.errorPolicy) {
          say(`Provider '${target.provider}' publishes no error policy (an older integration SDK, or not installed).`);
        }
        renderList(rows, ERROR_POLICY_COLUMNS, mode);
      } catch (error) {
        handleCommandError(error);
      }
    });

  errors
    .command("set <integration> <code>")
    .description("Override review/alert for one error code (or * for every code); retries stay the provider's")
    .option("--review", "Send the entry to review when this error happens")
    .option("--no-review", "Don't send it to review")
    .option("--alert", "Alert the workspace admins")
    .option("--no-alert", "Don't alert")
    .action(async function(this: Command, ref: string, code: string, cmdOpts) {
      try {
        if (cmdOpts.review === undefined && cmdOpts.alert === undefined) {
          throw new Error("Pass --review/--no-review and/or --alert/--no-alert");
        }
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        const target = await findIntegration(client, ref);
        const overrides: IntegrationErrorOverrides = { ...(target.errorOverrides ?? {}) };
        overrides[code] = {
          ...overrides[code],
          ...(cmdOpts.review !== undefined ? { review: cmdOpts.review } : {}),
          ...(cmdOpts.alert !== undefined ? { notify: cmdOpts.alert } : {}),
        };
        const updated = await client.integrations.setErrorOverrides(target.id, overrides);
        say(`✓ ${target.slug}: override for ${code} saved`);
        renderData(updated.errorOverrides ?? {}, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  errors
    .command("reset <integration> [code]")
    .description("Drop the override for one code, or every override when no code is given")
    .action(async function(this: Command, ref: string, code: string | undefined) {
      try {
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        const target = await findIntegration(client, ref);
        const overrides: IntegrationErrorOverrides = { ...(target.errorOverrides ?? {}) };
        if (code) {
          if (!(code in overrides)) throw new Error(`${target.slug} has no override for ${code}`);
          delete overrides[code];
        }
        const updated = await client.integrations.setErrorOverrides(target.id, code ? overrides : {});
        say(`✓ ${target.slug}: ${code ? `override for ${code}` : "all overrides"} removed`);
        renderData(updated.errorOverrides ?? {}, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // ---- alert routing -----------------------------------------------------------------------

  const routing = integrations
    .command("alert-routing")
    .description("Where integration alerts go: admin email and/or notify-capable integrations")
    .action(async function(this: Command) {
      try {
        const opts = optsOf(this);
        const mode = getOutputMode(opts);
        const client = await clientFactory.createPlatformClient(opts);
        const routingNow = await client.integrations.getAlertRouting();
        if (mode !== "table") {
          renderData(routingNow, mode);
          return;
        }
        process.stdout.write(`Email admins:   ${routingNow.emailAdmins ? "yes" : "no"}\n`);
        process.stdout.write(`Reminder every: ${routingNow.reminderHours}h\n`);
        renderTable(routingNow.targets, { "Integration ID": "integrationId", Name: "name", Provider: "provider", Action: "action", Enabled: "enabled" });
      } catch (error) {
        handleCommandError(error);
      }
    });

  routing
    .command("set")
    .description("Change alert routing; --targets replaces the list of integrations alerts go to")
    .option("--email-admins", "Email workspace admins")
    .option("--no-email-admins", "Don't email admins")
    .option("--targets <ids>", "Comma-separated integration ids to alert through ('' for none)")
    .option("--reminder-hours <n>", "Re-alert an unresolved problem every n hours")
    .action(async function(this: Command, cmdOpts) {
      try {
        const body: { emailAdmins?: boolean; integrationIds?: string[]; reminderHours?: number } = {};
        if (cmdOpts.emailAdmins !== undefined) body.emailAdmins = cmdOpts.emailAdmins;
        if (cmdOpts.targets !== undefined) body.integrationIds = String(cmdOpts.targets).split(",").map((s) => s.trim()).filter(Boolean);
        if (cmdOpts.reminderHours !== undefined) body.reminderHours = validatePositiveInteger(cmdOpts.reminderHours, "--reminder-hours");
        if (Object.keys(body).length === 0) throw new Error("Pass --email-admins/--no-email-admins, --targets and/or --reminder-hours");
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        const updated = await client.integrations.setAlertRouting(body);
        say("✓ Alert routing saved");
        renderData(updated, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // ---- event subscriptions -----------------------------------------------------------------

  const subscriptions = integrations
    .command("subscriptions")
    .alias("subs")
    .description("Event subscriptions: run an integration action whenever an event happens");

  subscriptions
    .command("list")
    .description("List event subscriptions")
    .option("--event <type>", "Only subscriptions to this event type")
    .action(async function(this: Command, cmdOpts) {
      try {
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        const items = await client.integrations.listSubscriptions(cmdOpts.event);
        renderList(items, TABLE_SCHEMAS["integrations.subscriptions.list"], getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  addDataOptions(subscriptions
    .command("create")
    .description("Subscribe an integration action to an event: --data, or --integration/--event/--action"),
    "{integrationId, eventType, action, args?}")
    .option("--integration <id>", "Integration id or slug")
    .option("--event <type>", "Event type (see 'platform event-log types')")
    .option("--action <key>", "Provider action to run")
    .option("--args <json>", "Action arguments as JSON (templated: {{entry.title}}, {{SECRET}})")
    .action(async function(this: Command, cmdOpts) {
      try {
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        let data: any;
        if (cmdOpts.integration || cmdOpts.event || cmdOpts.action) {
          if (!cmdOpts.integration || !cmdOpts.event || !cmdOpts.action) {
            throw new Error("--integration, --event and --action go together (or pass the body with --data)");
          }
          data = {
            integrationId: (await findIntegration(client, cmdOpts.integration)).id,
            eventType: cmdOpts.event,
            action: cmdOpts.action,
            ...(cmdOpts.args !== undefined ? { args: JSON.parse(cmdOpts.args) } : {}),
          };
        } else {
          data = await readJsonInput(cmdOpts);
        }
        const sub = await client.integrations.createSubscription(data);
        say(`✓ Created subscription: ${sub.eventType} → ${sub.integrationName ?? sub.integrationId} ${sub.action}`);
        renderData(sub, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  addDataOptions(subscriptions
    .command("update <id>")
    .description("Turn a subscription on/off or change its arguments"), "{enabled?, args?}")
    .option("--enable", "Turn it on")
    .option("--disable", "Turn it off")
    .option("--args <json>", "Replace the action arguments (JSON)")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        if (cmdOpts.enable && cmdOpts.disable) throw new Error("Pass --enable or --disable, not both");
        let data: any = {};
        if (cmdOpts.data !== undefined || cmdOpts.file) data = await readJsonInput(cmdOpts);
        if (cmdOpts.enable) data.enabled = true;
        if (cmdOpts.disable) data.enabled = false;
        if (cmdOpts.args !== undefined) data.args = JSON.parse(cmdOpts.args);
        if (Object.keys(data).length === 0) throw new Error("Pass --enable, --disable, --args or --data");
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        const sub = await client.integrations.updateSubscription(id, data);
        say(`✓ Updated subscription: ${sub.id}`);
        renderData(sub, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  subscriptions
    .command("delete <id>")
    .description("Delete an event subscription")
    .option("--yes", "Confirm the delete")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        if (!cmdOpts.yes) {
          console.error("Error: Delete requires --yes confirmation flag");
          process.exitCode = 1;
          return;
        }
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        await client.integrations.deleteSubscription(id);
        emitDeleted(id, getOutputMode(opts), `✓ Deleted subscription: ${id}`);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
