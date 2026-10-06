import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderList, renderData } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { TABLE_SCHEMAS } from "../../shared/table-schemas.js";
import { addDataOptions, readJsonInput } from "../../shared/json-input.js";
import { handleCommandError } from "../../shared/error-handler.js";
import { say, emitDeleted, emitOk } from "../../shared/io.js";
import { validatePositiveInteger } from "../../shared/validation.js";
import { registerSuggestionCommands } from "../../shared/review.js";

/** A suggested-asset link: an AI-generated asset awaiting review (junction metadata `suggested`). */
function isSuggestedAsset(asset: { placementMetadata?: Record<string, unknown> | null }): boolean {
  return Boolean(asset.placementMetadata?.suggested);
}

/**
 * A `--publish-at` / `--expire-at` value: an ISO 8601 time, or "" (or "none") to clear it.
 * Returns the value to send — the string as given, or null.
 */
function scheduleValue(value: string, flag: string): string | null {
  const trimmed = value.trim();
  if (trimmed === "" || trimmed.toLowerCase() === "none") return null;
  if (Number.isNaN(Date.parse(trimmed))) {
    throw new Error(`${flag} must be an ISO 8601 date-time (e.g. 2026-10-31T09:00:00Z), or "" to clear it`);
  }
  return trimmed;
}

export function registerPlatformEntryCommands(parent: Command): void {
  const entries = parent
    .command("entries")
    .description("Entry CRUD operations");

  // List entries — the API takes no filters, so they apply to the fetched list (newest first)
  entries
    .command("list")
    .description("List entries, newest first; filter by status or type for a review queue")
    .option("--status <status>", "Only entries with this status (inbox, draft, needs_review, published, …); comma-separate several")
    .option("--entry-type <slug>", "Only entries of this entry type (slug or id)")
    .option("--suggestions", "Only entries with a pending AI suggestion")
    .option("--limit <number>", "At most this many entries (after filtering)")
    .action(async function(this: Command, cmdOpts) {
      try {
        const limit = cmdOpts.limit === undefined ? undefined : validatePositiveInteger(cmdOpts.limit, "--limit");
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        let entries = await client.entries.list();

        if (cmdOpts.status) {
          const wanted = new Set(String(cmdOpts.status).split(",").map((s) => s.trim().toLowerCase()).filter(Boolean));
          entries = entries.filter((e) => wanted.has(String(e.status).toLowerCase()));
        }
        if (cmdOpts.entryType) {
          const ref = String(cmdOpts.entryType);
          const type = (await client.entryTypes.list()).find((t) => t.slug === ref || t.id === ref);
          if (!type) throw new Error(`No entry type with slug or id '${ref}'`);
          entries = entries.filter((e) => e.entryTypeId === type.id);
        }
        if (cmdOpts.suggestions) {
          entries = entries.filter((e) => e.suggestionJson != null);
        }
        if (limit !== undefined) entries = entries.slice(0, limit);

        renderList(entries as any[], TABLE_SCHEMAS['entries.list'], getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Entry counts by status
  entries
    .command("counts")
    .description("How many entries are in each status (inbox, draft, needs_review, …), plus the total")
    .action(async function(this: Command) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const mode = getOutputMode(opts);
        const client = await clientFactory.createPlatformClient(opts);
        const counts = await client.entries.counts();
        if (mode === "table" || mode === "csv") {
          renderList(Object.entries(counts).map(([status, count]) => ({ status, count })), { Status: "status", Count: "count" }, mode);
        } else {
          renderData(counts, mode);
        }
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Get entry by ID
  entries
    .command("get <id>")
    .description("Get entry by ID")
    .action(async function(this: Command, id: string) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const entry = await client.entries.get(id);
        renderData(entry, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Create entry
  addDataOptions(entries
    .command("create")
    .description("Create a new entry"), "entry data")
    .action(async function(this: Command, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const entry = await client.entries.create(data);
        say(`✓ Created entry: ${entry.id}`);
        renderData(entry, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Update entry
  addDataOptions(entries
    .command("update <id>")
    .description("Update an entry; --status, --publish-at and --expire-at change those without a --data body"), "entry data")
    .option("--status <status>", "Set the status (e.g. draft, needs_review, published, archived)")
    .option("--publish-at <iso>", 'Schedule publishing at this ISO 8601 time; "" clears the schedule')
    .option("--expire-at <iso>", 'Unpublish at this ISO 8601 time; "" clears it')
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        const flags: Record<string, unknown> = {};
        if (cmdOpts.status !== undefined) flags.status = String(cmdOpts.status).trim();
        if (cmdOpts.publishAt !== undefined) flags.publishAt = scheduleValue(cmdOpts.publishAt, "--publish-at");
        if (cmdOpts.expireAt !== undefined) flags.expireAt = scheduleValue(cmdOpts.expireAt, "--expire-at");

        // With only flags, don't wait on stdin for a body; flags win over the same fields in --data.
        const hasBody = cmdOpts.data !== undefined || cmdOpts.file !== undefined || Object.keys(flags).length === 0;
        const body = hasBody ? await readJsonInput(cmdOpts) : {};
        for (const key of Object.keys(flags)) {
          delete body[key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)];
        }
        const data = { ...body, ...flags };

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const entry = await client.entries.update(id, data);
        say(`✓ Updated entry: ${entry.id}`);
        renderData(entry, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Delete entry
  entries
    .command("delete <id>")
    .description("Delete an entry")
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

        await client.entries.delete(id);
        emitDeleted(id, getOutputMode(opts), `✓ Deleted entry: ${id}`);
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Suggested assets: AI-generated assets attached to an entry, awaiting review
  const suggestedAssets = entries
    .command("suggested-assets")
    .description("AI-suggested assets on an entry: list, approve or reject them");

  suggestedAssets
    .command("list <entry-id>")
    .description("The entry's assets that are still AI suggestions awaiting review")
    .action(async function(this: Command, entryId: string) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const entry = await client.entries.get(entryId);
        const pending = (entry.assets ?? []).filter(isSuggestedAsset);
        renderList(pending as any[], TABLE_SCHEMAS['entries.suggested-assets.list'], getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  for (const [name, done] of [["approve", "Approved"], ["reject", "Rejected"]] as const) {
    suggestedAssets
      .command(`${name} <entry-id> <asset-id>`)
      .description(name === "approve"
        ? "Keep an AI-suggested asset: it becomes a normal attached asset and reaches published output"
        : "Drop an AI-suggested asset: unlink it, and delete the asset if nothing else uses it")
      .action(async function(this: Command, entryId: string, assetId: string) {
        try {
          const opts = this.optsWithGlobals<PlatformCommandOptions>();
          const client = await clientFactory.createPlatformClient(opts);
          const entry = name === "approve"
            ? await client.entries.approveSuggestedAsset(entryId, assetId)
            : await client.entries.rejectSuggestedAsset(entryId, assetId);
          say(`✓ ${done} suggested asset ${assetId} on entry ${entryId}`);
          renderData(entry, getOutputMode(opts));
        } catch (error) {
          handleCommandError(error);
        }
      });
  }

  registerSuggestionCommands(entries, "entries");

  // List collections for an entry
  entries
    .command("collections <id>")
    .description("List collections that an entry belongs to")
    .action(async function(this: Command, id: string) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const collections = await client.entries.listCollections(id);
        renderList(collections as any[], TABLE_SCHEMAS['entries.collections'], getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Add entry to collection
  entries
    .command("add-to-collection <entry-id> <collection-id>")
    .description("Add an entry to a collection")
    .action(async function(this: Command, entryId: string, collectionId: string) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const result = await client.entries.addToCollection(entryId, collectionId);
        emitOk({ ...result, entryId, collectionId }, getOutputMode(opts),
          `✓ ${result.message || `Added entry ${entryId} to collection ${collectionId}`}`);
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Remove entry from collection
  entries
    .command("remove-from-collection <entry-id> <collection-id>")
    .description("Remove an entry from a collection")
    .action(async function(this: Command, entryId: string, collectionId: string) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        await client.entries.removeFromCollection(entryId, collectionId);
        emitOk({ entryId, collectionId, removed: true }, getOutputMode(opts),
          `✓ Removed entry ${entryId} from collection ${collectionId}`);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
