import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { getOutputMode } from '../../shared/types.js';
import { handleCommandError } from '../../shared/error-handler.js';
import type { PlatformCommandOptions } from "../../shared/types.js";
import { renderList, renderData } from "../../output.js";
import { addDataOptions, readJsonInput } from "../../shared/json-input.js";
import { say, emitDeleted, emitOk } from "../../shared/io.js";

export function registerAdminScheduledTaskCommands(parent: Command): void {
  const tasks = new Command("scheduled-tasks")
    .description("System-wide scheduled task management (requires SUPER_ADMIN)");

  parent.addCommand(tasks);

  // List tasks
  tasks
    .command("list")
    .description("List all scheduled tasks across workspaces")
    .action(async function(this: Command) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const result = await client.adminScheduledTasks.list();

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderList(result as any[], {
          id: 'id',
          name: 'name',
          slug: 'slug',
          taskType: 'taskType',
          enabled: 'enabled',
          lastStatus: 'lastStatus',
          nextRunAt: 'nextRunAt',
        } as any, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Execution log
  tasks
    .command("log")
    .description("Get execution log for all scheduled tasks")
    .option("--limit <n>", "Maximum number of log entries")
    .action(async function(this: Command, cmdOpts) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const limit = cmdOpts.limit ? parseInt(cmdOpts.limit, 10) : undefined;
        const result = await client.adminScheduledTasks.log({ limit });

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderList(result as any[], {
          id: 'id',
          taskId: 'taskId',
          status: 'status',
          executedAt: 'executedAt',
          durationMs: 'durationMs',
          errorMessage: 'errorMessage',
        } as any, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Task types
  tasks
    .command("types")
    .description("Get available task types")
    .action(async function(this: Command) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const result = await client.adminScheduledTasks.taskTypes();

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderList(result as any[], {
          taskType: 'task_type',
          name: 'name',
          description: 'description',
        } as any, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Get task
  tasks
    .command("get <id>")
    .description("Get a scheduled task by ID")
    .action(async function(this: Command, id: string) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const result = await client.adminScheduledTasks.get(id);

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(result, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Run task
  tasks
    .command("run <id-or-slug>")
    .description("Manually trigger a scheduled task execution (e.g. `run optimize_database`)")
    .action(async function(this: Command, idOrSlug: string) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const id = await resolveTaskId(client, idOrSlug);
        await client.adminScheduledTasks.execute(id);

        emitOk({ taskId: id }, getOutputMode(parent.optsWithGlobals<PlatformCommandOptions>()), `✓ Executed task ${idOrSlug}`);
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // History
  tasks
    .command("history <id>")
    .description("Get execution history for a scheduled task")
    .option("--limit <n>", "Maximum number of history entries")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const limit = cmdOpts.limit ? parseInt(cmdOpts.limit, 10) : undefined;
        const result = await client.adminScheduledTasks.history(id, { limit });

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderList(result as any[], {
          id: 'id',
          taskId: 'taskId',
          status: 'status',
          executedAt: 'executedAt',
          durationMs: 'durationMs',
          errorMessage: 'errorMessage',
        } as any, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Create task
  addDataOptions(tasks
    .command("create")
    .description("Create a new scheduled task"), "task data")
    .action(async function(this: Command, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const result = await client.adminScheduledTasks.create(data);

        say(`✓ Created scheduled task: ${result.id}`);
        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(result, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Update task
  addDataOptions(tasks
    .command("update <id>")
    .description("Update a scheduled task"), "task data")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const result = await client.adminScheduledTasks.update(id, data);

        say(`✓ Updated scheduled task: ${result.id}`);
        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(result, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Delete task
  tasks
    .command("delete <id>")
    .description("Delete a scheduled task")
    .option("--yes", "Skip confirmation prompt")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        if (!cmdOpts.yes) {
          console.error("Error: Delete requires --yes confirmation flag");
          process.exitCode = 1;
          return;
        }

        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        await client.adminScheduledTasks.delete(id);

        emitDeleted(id, getOutputMode(parent.optsWithGlobals<PlatformCommandOptions>()), `✓ Deleted scheduled task: ${id}`);
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The admin API runs tasks by id; system tasks are better known by slug (`cleanup_temp_files`, `optimize_database`). */
async function resolveTaskId(
  client: Awaited<ReturnType<typeof clientFactory.createPlatformClient>>,
  idOrSlug: string,
): Promise<string> {
  if (UUID_PATTERN.test(idOrSlug)) return idOrSlug;
  const tasks = await client.adminScheduledTasks.list();
  const matches = tasks.filter((task) => task.slug === idOrSlug);
  const [only] = matches;
  if (only && matches.length === 1) return only.id;
  throw new Error(
    matches.length
      ? `More than one task has the slug "${idOrSlug}" — run it by id (see \`admin scheduled-tasks list\`)`
      : `No scheduled task with id or slug "${idOrSlug}"`,
  );
}
