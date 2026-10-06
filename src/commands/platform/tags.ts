/**
 * `marvin platform tags` — the workspace's shared tag vocabulary, and tagging entries, assets and
 * resources. Smart-collection rules and the publishing API's `--tag` filter match on tag slugs.
 *
 * Any member lists tags; an AUTHOR creates them (create is find-or-create by slug) and tags their
 * own draft entries; renaming, deleting, tagging anyone else's entry, an asset or a resource needs
 * EDITOR.
 */

import { Command } from "commander";
import type { PlatformClient } from "@inneropen/marvin-sdk/platform";
import { clientFactory } from "../../shared/clients.js";
import { renderData, renderList } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { handleCommandError } from "../../shared/error-handler.js";
import { TABLE_SCHEMAS } from "../../shared/table-schemas.js";
import { addDataOptions, readJsonInput } from "../../shared/json-input.js";
import { say, emitDeleted, emitOk } from "../../shared/io.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The API takes ids; accept a slug too and look it up. */
async function resolveTagId(client: PlatformClient, ref: string): Promise<string> {
  if (UUID.test(ref)) return ref;
  const match = (await client.tags.list()).find((t) => t.slug === ref);
  if (!match) throw new Error(`No tag with id or slug '${ref}'`);
  return match.id;
}

type Target = "entry" | "asset" | "resource";

/** The one target named by --entry, --asset or --resource. */
function targetOf(cmdOpts: { entry?: string; asset?: string; resource?: string }): { kind: Target; id: string } {
  const given = (["entry", "asset", "resource"] as const).filter((k) => cmdOpts[k] !== undefined);
  if (given.length !== 1) throw new Error("Name exactly one of --entry <id>, --asset <id> or --resource <id>");
  const kind = given[0]!;
  return { kind, id: String(cmdOpts[kind]) };
}

/** The body for create/update: --data, or the --name/--slug/--color flags. */
async function tagBody(cmdOpts: any, fields: ("name" | "slug" | "color")[]): Promise<Record<string, unknown>> {
  if (cmdOpts.data !== undefined || cmdOpts.file !== undefined) return readJsonInput(cmdOpts);
  const body: Record<string, unknown> = {};
  for (const field of fields) if (cmdOpts[field] !== undefined) body[field] = cmdOpts[field];
  if (Object.keys(body).length === 0) {
    throw new Error(`Provide ${fields.map((f) => `--${f}`).join(", ")} or --data`);
  }
  return body;
}

export function registerTagCommands(parent: Command): void {
  const tags = parent
    .command("tags")
    .description("Tags: the workspace's shared labels for entries, assets and resources");

  const optsOf = (cmd: Command) => cmd.optsWithGlobals<PlatformCommandOptions>();

  tags
    .command("list")
    .description("List tags with how many entries (and things in all) carry each")
    .action(async function(this: Command) {
      try {
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        renderList(await client.tags.list(), TABLE_SCHEMAS["tags.list"], getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  tags
    .command("get <tag>")
    .description("Show a tag (id or slug)")
    .action(async function(this: Command, ref: string) {
      try {
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        renderData(await client.tags.get(await resolveTagId(client, ref)), getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  addDataOptions(tags
    .command("create")
    .description("Create a tag, or return the existing one with the same slug")
    .option("--name <name>", "Display name (the slug is derived from it unless --slug is given)")
    .option("--slug <slug>", "URL-friendly identity")
    .option("--color <color>", "Color for the UI, e.g. #FF5733"), "{name, slug?, color?}")
    .action(async function(this: Command, cmdOpts) {
      try {
        const data = await tagBody(cmdOpts, ["name", "slug", "color"]);
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        const tag = await client.tags.create(data as any);
        say(`✓ Tag: ${tag.slug} (${tag.id})`);
        renderData(tag, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  addDataOptions(tags
    .command("update <tag>")
    .description("Rename or recolor a tag (its slug never changes)")
    .option("--name <name>", "New display name")
    .option("--color <color>", "New color"), "{name?, color?}")
    .action(async function(this: Command, ref: string, cmdOpts) {
      try {
        const data = await tagBody(cmdOpts, ["name", "color"]);
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        const tag = await client.tags.update(await resolveTagId(client, ref), data);
        say(`✓ Updated tag: ${tag.slug}`);
        renderData(tag, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  tags
    .command("delete <tag>")
    .description("Delete a tag (everything carrying it is untagged)")
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
        const id = await resolveTagId(client, ref);
        await client.tags.delete(id);
        emitDeleted(id, getOutputMode(opts), `✓ Deleted tag: ${ref}`);
      } catch (error) {
        handleCommandError(error);
      }
    });

  for (const action of ["attach", "detach"] as const) {
    tags
      .command(`${action} <tag>`)
      .description(action === "attach"
        ? "Tag an entry, asset or resource (no-op if it already carries the tag)"
        : "Remove a tag from an entry, asset or resource")
      .option("--entry <id>", "The entry")
      .option("--asset <id>", "The asset")
      .option("--resource <id>", "The resource")
      .action(async function(this: Command, ref: string, cmdOpts) {
        try {
          const target = targetOf(cmdOpts);
          const opts = optsOf(this);
          const client = await clientFactory.createPlatformClient(opts);
          const tagId = await resolveTagId(client, ref);
          const call = {
            attach: { entry: client.tags.attach, asset: client.tags.attachAsset, resource: client.tags.attachResource },
            detach: { entry: client.tags.detach, asset: client.tags.detachAsset, resource: client.tags.detachResource },
          }[action][target.kind];
          await call.call(client.tags, tagId, target.id);
          emitOk({ tagId, [`${target.kind}Id`]: target.id, [action === "attach" ? "attached" : "detached"]: true }, getOutputMode(opts),
            action === "attach" ? `✓ Tagged ${target.kind} ${target.id} with ${ref}` : `✓ Removed ${ref} from ${target.kind} ${target.id}`);
        } catch (error) {
          handleCommandError(error);
        }
      });
  }
}
