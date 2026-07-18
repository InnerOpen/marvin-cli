import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { getOutputMode } from '../../shared/types.js';
import { handleCommandError } from '../../shared/error-handler.js';
import type { PlatformCommandOptions } from "../../shared/types.js";
import { renderList, renderData } from "../../output.js";
import { readJsonInput } from "../../shared/json-input.js";

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
    .command("run <id>")
    .description("Manually trigger a scheduled task execution")
    .action(async function(this: Command, id: string) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        await client.adminScheduledTasks.execute(id);

        console.log(`✓ Executed task ${id}`);
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
  tasks
    .command("create")
    .description("Create a new scheduled task")
    .option("--json <json>", "Task data as JSON string")
    .option("--file <path>", "Path to JSON file with task data (use '-' for stdin)")
    .action(async function(this: Command, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const result = await client.adminScheduledTasks.create(data);

        console.log(`✓ Created scheduled task: ${result.id}`);
        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(result, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Update task
  tasks
    .command("update <id>")
    .description("Update a scheduled task")
    .option("--json <json>", "Task data as JSON string")
    .option("--file <path>", "Path to JSON file with task data (use '-' for stdin)")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const result = await client.adminScheduledTasks.update(id, data);

        console.log(`✓ Updated scheduled task: ${result.id}`);
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

        console.log(`✓ Deleted scheduled task: ${id}`);
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });
}
