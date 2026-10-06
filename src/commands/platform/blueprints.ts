/**
 * `marvin platform blueprints` — the catalog of structure a workspace could have (collections, entry
 * types, scheduled tasks and workflows that core ships and integrations contribute), and applying it.
 *
 * Applying creates what is missing and never overwrites what exists, so running it twice is safe;
 * the result says, per blueprint, whether it created something. Any member browses; applying and
 * updating need workspace ADMIN.
 */

import { Command } from "commander";
import type { BlueprintApplyResult } from "@inneropen/marvin-sdk/platform";
import { clientFactory } from "../../shared/clients.js";
import { renderData, renderList, type OutputMode } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { handleCommandError } from "../../shared/error-handler.js";
import { TABLE_SCHEMAS } from "../../shared/table-schemas.js";
import { readJsonArg } from "../../shared/json-input.js";
import { say } from "../../shared/io.js";

const RESULT_COLUMNS = {
  Slug: "slug",
  Kind: "kind",
  Name: "name",
  Created: (r: BlueprintApplyResult) => (r.created ? "yes" : ""),
  Updated: (r: BlueprintApplyResult) => (r.updated ? "yes" : ""),
  Detail: "detail",
} as const;

/** `--params`: an object of parameter values (one blueprint) or of objects keyed by slug (several). */
async function paramsFrom(cmdOpts: { params?: string; data?: string }): Promise<Record<string, any> | undefined> {
  const value = cmdOpts.params ?? cmdOpts.data;
  if (value === undefined) return undefined;
  const params = await readJsonArg(value, cmdOpts.params !== undefined ? "--params" : "--data");
  if (!params || typeof params !== "object" || Array.isArray(params)) {
    throw new Error("--params must be a JSON object");
  }
  return params;
}

/** JSON modes: the result object for one blueprint, an array for several. */
function renderResults(results: BlueprintApplyResult[], mode: OutputMode, verb: "apply" | "update", single: boolean): void {
  if (mode !== "table") {
    renderData(single ? results[0] : results, mode);
    return;
  }
  const changed = results.filter((r) => (verb === "apply" ? r.created : r.updated)).length;
  say(`✓ ${verb === "apply" ? "Created" : "Updated"} ${changed} of ${results.length} blueprint(s)${changed < results.length ? "; the rest were already in place" : ""}`);
  renderList(results, RESULT_COLUMNS, mode);
}

export function registerBlueprintCommands(parent: Command): void {
  const blueprints = parent
    .command("blueprints")
    .description("Blueprints: ready-made collections, entry types, tasks and workflows to add to the workspace");

  const optsOf = (cmd: Command) => cmd.optsWithGlobals<PlatformCommandOptions>();

  blueprints
    .command("list")
    .description("The catalog, with what this workspace already has (Applied) and can use (Available)")
    .option("--kind <kind>", "Only this kind: collection, entry_type, scheduled_task, workflow, …")
    .option("--category <name>", "Only this category (see `blueprints categories`)")
    .option("--source <source>", "Only from this source: core, or an integration provider's slug")
    .option("--integration-id <id>", "Check per-integration blueprints against this connection")
    .action(async function(this: Command, cmdOpts) {
      try {
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        const items = await client.blueprints.list({
          kind: cmdOpts.kind,
          category: cmdOpts.category,
          source: cmdOpts.source,
          integrationId: cmdOpts.integrationId,
        });
        renderList(items, TABLE_SCHEMAS["blueprints.list"], getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  blueprints
    .command("categories")
    .description("Blueprint categories, core's first, then each integration's")
    .action(async function(this: Command) {
      try {
        const opts = optsOf(this);
        const mode = getOutputMode(opts);
        const client = await clientFactory.createPlatformClient(opts);
        const categories = await client.blueprints.categories();
        if (mode === "table" || mode === "csv") renderList(categories.map((name) => ({ name })), { Category: "name" }, mode);
        else renderData(categories, mode);
      } catch (error) {
        handleCommandError(error);
      }
    });

  blueprints
    .command("get <slug>")
    .description("One blueprint with its parameters and payload")
    .option("--source <source>", "Pick the blueprint from this source when several share the slug")
    .action(async function(this: Command, slug: string, cmdOpts) {
      try {
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        renderData(await client.blueprints.get(slug, { source: cmdOpts.source }), getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  blueprints
    .command("apply <slugs...>")
    .description("Add one or more blueprints to the workspace (skips what already exists)")
    .option("--params <json|@file|->", "Parameter values: {key: value} for one blueprint, {slug: {key: value}} for several")
    .option("--data <json|@file|->", "Same as --params")
    .option("--source <source>", "Pick blueprints from this source when several share a slug")
    .option("--integration-id <id>", "The integration connection to apply per-integration blueprints for")
    .action(async function(this: Command, slugs: string[], cmdOpts) {
      try {
        const params = await paramsFrom(cmdOpts);
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        const options = { source: cmdOpts.source, integrationId: cmdOpts.integrationId };
        const results = slugs.length === 1
          ? [await client.blueprints.apply(slugs[0]!, params, options)]
          : await client.blueprints.applyMany(slugs, params as Record<string, Record<string, unknown>> | undefined, options);
        renderResults(results, getOutputMode(opts), "apply", slugs.length === 1);
      } catch (error) {
        handleCommandError(error);
      }
    });

  blueprints
    .command("update <slug>")
    .description("Bring an applied workflow blueprint up to date with what its integration declares now")
    .option("--params <json|@file|->", "Parameter values as {key: value}")
    .option("--data <json|@file|->", "Same as --params")
    .option("--source <source>", "Pick the blueprint from this source when several share the slug")
    .action(async function(this: Command, slug: string, cmdOpts) {
      try {
        const params = await paramsFrom(cmdOpts);
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        const result = await client.blueprints.update(slug, params, { source: cmdOpts.source });
        renderResults([result], getOutputMode(opts), "update", true);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
