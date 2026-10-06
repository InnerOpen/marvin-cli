import { handleCommandError } from '../../shared/error-handler.js';
import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderList, renderData } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { TABLE_SCHEMAS } from "../../shared/table-schemas.js";
import { addDataOptions, readJsonInput, readJsonArg } from "../../shared/json-input.js";
import { say, emitDeleted, emitOk } from "../../shared/io.js";
import { validatePositiveInteger } from "../../shared/validation.js";

const TARGET_TYPES = ["entry", "asset", "resource"] as const;
const PLURAL: Record<(typeof TARGET_TYPES)[number], string> = { entry: "entries", asset: "assets", resource: "resources" };

/** Smart-collection rules from --rules / --smart-rules: a JSON object (inline, @file or -). */
async function rulesFrom(value: string, flag: string): Promise<Record<string, unknown>> {
  const rules = await readJsonArg(value, flag);
  if (!rules || typeof rules !== "object" || Array.isArray(rules)) throw new Error(`${flag} must be a JSON object`);
  return rules;
}

/** Fold --smart-rules into a create/update body: it sets the rules and makes the collection smart. */
async function withSmartRules(body: Record<string, any>, cmdOpts: { smartRules?: string }): Promise<any> {
  if (cmdOpts.smartRules === undefined) return body;
  delete body.smart_rules;
  delete body.is_smart;
  return { ...body, isSmart: true, smartRules: await rulesFrom(cmdOpts.smartRules, "--smart-rules") };
}

export function registerPlatformCollectionCommands(parent: Command): void {
  const collections = parent
    .command("collections")
    .description("Collection CRUD operations");

  collections
    .command("list")
    .description("List collections")
    .action(async function(this: Command) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const collections = await client.collections.list();
        renderList(collections as any[], TABLE_SCHEMAS['collections.list'], getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  collections
    .command("get <id>")
    .description("Get collection by ID")
    .action(async function(this: Command, id: string) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const collection = await client.collections.get(id);
        renderData(collection, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  addDataOptions(collections
    .command("create")
    .description("Create a new collection; --smart-rules makes it a smart collection"), "collection data")
    .option("--smart-rules <json|@file|->", "Smart-collection rules (sets isSmart); try them first with `collections preview`")
    .action(async function(this: Command, cmdOpts) {
      try {
        const data = await withSmartRules(await readJsonInput(cmdOpts), cmdOpts);

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const collection = await client.collections.create(data);
        say(`✓ Created collection: ${collection.id}`);
        renderData(collection, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  addDataOptions(collections
    .command("update <id>")
    .description("Update a collection; --smart-rules replaces its rules (and makes it smart)"), "collection data")
    .option("--smart-rules <json|@file|->", "Smart-collection rules (sets isSmart)")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        // --smart-rules alone needs no body (and must not wait on stdin for one)
        const hasBody = cmdOpts.data !== undefined || cmdOpts.file !== undefined || cmdOpts.smartRules === undefined;
        const data = await withSmartRules(hasBody ? await readJsonInput(cmdOpts) : {}, cmdOpts);

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const collection = await client.collections.update(id, data);
        say(`✓ Updated collection: ${collection.id}`);
        renderData(collection, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  collections
    .command("delete <id>")
    .description("Delete a collection")
    .option("--yes", "Skip confirmation prompt")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        if (!cmdOpts.yes) {
          console.error("Error: Delete requires --yes confirmation flag");
          process.exitCode = 1;
          return;
        }

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        await client.collections.delete(id);
        emitDeleted(id, getOutputMode(opts), `✓ Deleted collection: ${id}`);
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  collections
    .command("members <id>")
    .description("A collection's members, whatever it groups (entries, assets or resources)")
    .action(async function(this: Command, id: string) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        renderList(await client.collections.members(id), TABLE_SCHEMAS['collections.members'], getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  collections
    .command("preview")
    .description("What smart-collection rules would match, without saving anything")
    .requiredOption("--rules <json|@file|->", "The rules, as a collection's smartRules (e.g. {\"tags\": [\"news\"], \"statuses\": [\"published\"]})")
    .option("--target-type <type>", "What the rules select: entry, asset or resource", "entry")
    .option("--limit <number>", "How many matches to list (at most 50); the total counts them all", "10")
    .action(async function(this: Command, cmdOpts) {
      try {
        const targetType = String(cmdOpts.targetType);
        if (!(TARGET_TYPES as readonly string[]).includes(targetType)) {
          throw new Error(`--target-type must be one of: ${TARGET_TYPES.join(", ")}`);
        }
        const limit = validatePositiveInteger(cmdOpts.limit, "--limit");
        if (limit > 50) throw new Error("--limit can be at most 50");
        const smartRules = await rulesFrom(cmdOpts.rules, "--rules");

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const mode = getOutputMode(opts);
        const client = await clientFactory.createPlatformClient(opts);
        const result = await client.collections.preview({
          targetType: targetType as (typeof TARGET_TYPES)[number],
          smartRules,
          limit,
        });
        if (mode !== "table") {
          renderData(result, mode);
          return;
        }
        if (result.note) say(result.note);
        const plural = PLURAL[targetType as (typeof TARGET_TYPES)[number]];
        if (result.ignoredKeys?.length) say(`Ignored (not rules for ${plural}): ${result.ignoredKeys.join(", ")}`);
        say(`Matching ${plural}: ${result.total}${result.total > result.items.length ? ` (showing ${result.items.length})` : ""}`);
        renderList(result.items, TABLE_SCHEMAS['collections.preview'], mode);
      } catch (error) {
        handleCommandError(error);
      }
    });

  addDataOptions(collections
    .command("order [ids...]")
    .description("Set the order collections are listed in: ids in the order you want, or --data [{id, sortOrder}]"),
    "an array of {id, sortOrder}")
    .action(async function(this: Command, ids: string[], cmdOpts) {
      try {
        let order: Array<{ id: string; sortOrder: number }>;
        if (ids.length > 0) {
          if (cmdOpts.data !== undefined || cmdOpts.file !== undefined) throw new Error("Pass ids or --data, not both");
          order = ids.map((id, index) => ({ id, sortOrder: index }));
        } else {
          const data = await readJsonInput(cmdOpts, { validateObject: false });
          if (!Array.isArray(data) || data.length === 0) throw new Error("Order data must be a non-empty array of {id, sortOrder}");
          order = data.map((item: any) => ({ id: String(item.id), sortOrder: Number(item.sortOrder ?? item.sort_order) }));
          if (order.some((o) => !o.id || Number.isNaN(o.sortOrder))) throw new Error("Each item needs an id and a numeric sortOrder");
        }

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const result = await client.collections.reorder(order);
        emitOk({ updated: result?.updated ?? order.length }, getOutputMode(opts),
          `✓ Reordered ${result?.updated ?? order.length} collection(s)`);
        if (result && result.updated < order.length) {
          say(`  ${order.length - result.updated} id(s) didn't match a collection in this workspace`);
        }
      } catch (error) {
        handleCommandError(error);
      }
    });

  collections
    .command("entries <id>")
    .description("List entries in a collection (ordered)")
    .action(async function(this: Command, id: string) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const entries = await client.collections.getEntries(id);

        renderList(entries as any[], TABLE_SCHEMAS['collections.entries'], getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  addDataOptions(collections
    .command("reorder <id>")
    .description("Reorder entries in a collection"), "an array of {entryId, sortOrder}")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        const entries: Array<{ entryId: string; sortOrder: number }> = await readJsonInput(cmdOpts, { validateObject: false });

        if (!Array.isArray(entries) || entries.length === 0) {
          console.error("Error: Reorder data must be a non-empty array");
          process.exitCode = 1;
          return;
        }

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        await client.collections.reorderEntries(id, entries);
        emitOk({ reordered: entries.length, collectionId: id }, getOutputMode(opts),
          `✓ Reordered ${entries.length} entries in collection ${id}`);
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  collections
    .command("update-entry <id> <entry-id>")
    .description("Update junction fields (role, metadata) for an entry in a collection")
    .option("--role <role>", "Role for the entry within the collection")
    .option("--metadata <json>", "Junction metadata as JSON string")
    .option("--data <json|@file|->", "Full junction payload as JSON, @path, or - for stdin (overrides --role/--metadata)")
    .action(async function(this: Command, id: string, entryId: string, cmdOpts) {
      try {
        let data: any;
        if (cmdOpts.data !== undefined) {
          data = await readJsonInput(cmdOpts);
        } else {
          data = {};
          if (cmdOpts.role !== undefined) data.role = cmdOpts.role;
          if (cmdOpts.metadata) data.metadataJson = JSON.parse(cmdOpts.metadata);

          if (Object.keys(data).length === 0) {
            console.error("Error: Provide --role, --metadata, or --data");
            process.exitCode = 1;
            return;
          }
        }

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const result = await client.collections.updateEntryJunction(id, entryId, data);
        say(`✓ Updated entry ${entryId} in collection ${id}`);
        renderData(result, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });
}
