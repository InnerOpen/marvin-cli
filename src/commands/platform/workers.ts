/**
 * `marvin platform workers` — getting a workspace ready for workers.
 *
 * A worker (the `marvin-worker` project: a runner, a dispatcher) reads and writes three kinds of record by slug: `job`,
 * `job-kind` and `worker`. Core ships them as the "Workers" blueprints, and `setup` adds whichever are missing. It is
 * `blueprints apply` for those three, with the next steps said out loud. Like any blueprint it never overwrites what
 * is already there, so running it twice is safe. A same-named type that lacks the fields workers use is not "already there": it is reported and the exit code is 1. Applying needs workspace ADMIN.
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

/** `fits` is false when a record type of that name exists without the fields workers use (a "job" type for job postings, say). */
const doesNotFit = (r: BlueprintApplyResult): boolean => (r as { fits?: boolean }).fits === false;

const COLUMNS = {
  Type: "slug",
  Name: "name",
  Result: (r: BlueprintApplyResult) => (r.created ? "created" : doesNotFit(r) ? "DOES NOT FIT" : "already there"),
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
        const misfits = results.filter(doesNotFit);
        say(
          misfits.length
            ? `✗ ${misfits.length} existing record type(s) are not the ones workers use${created ? ` (added ${created} other(s))` : ""}`
            : created
              ? `✓ Added ${created} of ${results.length} record type(s) for workers`
              : "✓ This workspace is already set up for workers",
        );
        renderList(results, COLUMNS, mode);
        if (misfits.length) {
          say("");
          say("A record type with the same slug exists but lacks the fields workers read and write, so nothing was changed.");
          say("Rename it (or add those fields to it), then run this again.");
          process.exitCode = 1;
          return;
        }
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
