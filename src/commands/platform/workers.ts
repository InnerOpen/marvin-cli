/**
 * `marvin platform workers` — getting a workspace ready for workers.
 *
 * A worker (the `marvin-worker` project: a runner, a dispatcher) reads and writes three kinds of record by slug: `job`,
 * `job-kind` and `worker`. Core ships them as the "Workers" blueprints, and `setup` adds whichever are missing. It is
 * `blueprints apply` for those three, with the next steps said out loud. Like any blueprint it never overwrites what
 * is already there, so running it twice is safe. Applying needs workspace ADMIN.
 */

import { Command } from "commander";
import type { BlueprintApplyResult } from "@inneropen/marvin-sdk/platform";
import { clientFactory } from "../../shared/clients.js";
import { renderData, renderList } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { handleCommandError } from "../../shared/error-handler.js";
import { say } from "../../shared/io.js";

/** The slugs of the record types workers need (core's "Workers" blueprints). */
export const WORKER_BLUEPRINTS = ["job", "job-kind", "worker"] as const;

const COLUMNS = {
  Type: "slug",
  Name: "name",
  Result: (r: BlueprintApplyResult) => (r.created ? "created" : "already there"),
  Detail: "detail",
} as const;

export function registerWorkerCommands(parent: Command): void {
  const workers = parent
    .command("workers")
    .description("Workers: get a workspace ready to run jobs on runners and dispatchers");

  workers
    .command("setup")
    .description("Add the record types workers use (job, job-kind, worker) to the workspace; skips what is already there")
    .action(async function(this: Command) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        // `source: core` because a provider could also offer a blueprint with one of these slugs.
        const results = await client.blueprints.applyMany([...WORKER_BLUEPRINTS], undefined, { source: "core" });
        const mode = getOutputMode(opts);
        if (mode !== "table") {
          renderData(results, mode);
          return;
        }
        const created = results.filter((r) => r.created).length;
        say(created ? `✓ Added ${created} of ${results.length} record type(s) for workers` : "✓ This workspace is already set up for workers");
        renderList(results, COLUMNS, mode);
        if (created) {
          say("");
          say("Next: make a token pinned to this workspace, then start a runner with it.");
          say("  marvin user tokens create --name worker --pin <workspace-slug>");
          say("  Settings -> Workers shows how to run it: a process, Docker, Podman or Kubernetes.");
        }
      } catch (error) {
        handleCommandError(error);
      }
    });
}
