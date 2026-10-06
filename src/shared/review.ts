/**
 * AI suggestion review, shared by `platform entries|assets|resources`.
 *
 * An AI operation that writes back with approval on stages its proposed changes in the item's
 * `suggestionJson` instead of applying them. `apply-suggestion` commits them; `reject-suggestion`
 * discards them. Both print the updated item.
 */

import type { Command } from "commander";
import { clientFactory } from "./clients.js";
import { renderData } from "../output.js";
import { getOutputMode, type PlatformCommandOptions } from "./types.js";
import { handleCommandError } from "./error-handler.js";
import { say } from "./io.js";

type Reviewable = "entries" | "assets" | "resources";

const NOUN: Record<Reviewable, string> = { entries: "entry", assets: "asset", resources: "resource" };

export function registerSuggestionCommands(group: Command, kind: Reviewable): void {
  const noun = NOUN[kind];

  for (const [name, verb, done] of [
    ["apply-suggestion", "Apply", "Applied"],
    ["reject-suggestion", "Discard", "Rejected"],
  ] as const) {
    group
      .command(`${name} <id>`)
      .description(
        verb === "Apply"
          ? `Apply the ${noun}'s pending AI suggestion and clear it`
          : `Discard the ${noun}'s pending AI suggestion without applying it`,
      )
      .action(async function(this: Command, id: string) {
        try {
          const opts = this.optsWithGlobals<PlatformCommandOptions>();
          const client = await clientFactory.createPlatformClient(opts);
          const module = client[kind];
          const item = name === "apply-suggestion" ? await module.applySuggestion(id) : await module.rejectSuggestion(id);
          say(`✓ ${done} the AI suggestion on ${noun} ${id}`);
          renderData(item, getOutputMode(opts));
        } catch (error) {
          handleCommandError(error);
        }
      });
  }
}
