import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { getOutputMode } from '../../shared/types.js';
import { handleCommandError } from '../../shared/error-handler.js';
import type { PlatformCommandOptions } from "../../shared/types.js";
import { renderList, renderData } from "../../output.js";
import { TABLE_SCHEMAS } from "../../shared/table-schemas.js";
import { addDataOptions, readJsonInput } from "../../shared/json-input.js";
import { say, emitDeleted, emitOk } from "../../shared/io.js";

export function registerScheduledTaskCommands(parent: Command): void {
  const tasks = new Command("scheduled-tasks")
    .alias("tasks")
    .description("Scheduled task automation management");

  parent.addCommand(tasks);

  // List
  tasks
    .command("list")
    .description("List all scheduled tasks")
    .option("--enabled-only", "Show only enabled tasks")
    .option("--failed-only", "Show only failed tasks")
    .action(async function(this: Command, cmdOpts) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        let items = await client.scheduledTasks.list();

        // Apply filters
        if (cmdOpts.enabledOnly) {
          items = items.filter((t: any) => t.enabled);
        }
        if (cmdOpts.failedOnly) {
          items = items.filter((t: any) => t.last_status === 'failed');
        }

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderList(items as any[], TABLE_SCHEMAS['scheduled-tasks.list'], getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Get
  tasks
    .command("get <id-or-slug>")
    .description("Get scheduled task by ID or slug")
    .action(async function(this: Command, idOrSlug: string) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const task = await client.scheduledTasks.get(idOrSlug);

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(task, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Create
  addDataOptions(tasks
    .command("create")
    .description("Create a new scheduled task"), "task data")
    .action(async function(this: Command, cmdOpts) {
      try {
        let data: any;

        if (cmdOpts.data !== undefined || cmdOpts.file) {
          data = await readJsonInput(cmdOpts);
        } else {
          console.error("Error: Provide task data via --data or --file");
          console.error("\nExample JSON:");
          console.error(JSON.stringify({
            name: "Daily Cleanup",
            description: "Clean up old files",
            task_type: "cleanup_temp_files",
            schedule_type: "interval",
            schedule_config: { interval_seconds: 86400 },
            task_config: { age_hours: 24 },
            enabled: true
          }, null, 2));
          process.exitCode = 1;
          return;
        }

        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const task = await client.scheduledTasks.create(data);

        say(`✓ Created scheduled task: ${task.id}`);
        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(task, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Update
  addDataOptions(tasks
    .command("update <id-or-slug>")
    .description("Update a scheduled task"), "task data")
    .option("--enable", "Enable the task")
    .option("--disable", "Disable the task")
    .action(async function(this: Command, idOrSlug: string, cmdOpts) {
      try {
        let data: any = {};

        if (cmdOpts.data !== undefined || cmdOpts.file) {
          data = await readJsonInput(cmdOpts);
        }

        // Apply quick flags
        if (cmdOpts.enable) {
          data.enabled = true;
        } else if (cmdOpts.disable) {
          data.enabled = false;
        }

        if (Object.keys(data).length === 0) {
          console.error("Error: Provide task data via --data, --file, --enable, or --disable");
          process.exitCode = 1;
          return;
        }

        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const task = await client.scheduledTasks.update(idOrSlug, data);

        say(`✓ Updated scheduled task: ${task.id}`);
        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(task, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Delete
  tasks
    .command("delete <id-or-slug>")
    .description("Delete a scheduled task")
    .option("--yes", "Skip confirmation prompt")
    .action(async function(this: Command, idOrSlug: string, cmdOpts) {
      try {
        if (!cmdOpts.yes) {
          console.error("Error: Delete requires --yes confirmation flag");
          process.exitCode = 1;
          return;
        }

        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        await client.scheduledTasks.delete(idOrSlug);

        emitDeleted(idOrSlug, getOutputMode(parent.optsWithGlobals<PlatformCommandOptions>()), `✓ Deleted scheduled task: ${idOrSlug}`);
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Execute (run now)
  tasks
    .command("run <id-or-slug>")
    .alias("execute")
    .description("Manually trigger task execution (bypasses schedule)")
    .action(async function(this: Command, idOrSlug: string) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        await client.scheduledTasks.execute(idOrSlug);

        emitOk(
          { task: idOrSlug },
          getOutputMode(parent.optsWithGlobals<PlatformCommandOptions>()),
          `✓ Task execution triggered: ${idOrSlug}`,
          "Check 'history' command for execution results",
        );
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // History
  tasks
    .command("history <id-or-slug>")
    .description("View task execution history")
    .option("--limit <number>", "Number of records to show", "50")
    .option("--failed-only", "Show only failed executions")
    .action(async function(this: Command, idOrSlug: string, cmdOpts) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        let history = await client.scheduledTasks.history(idOrSlug, {
          limit: parseInt(cmdOpts.limit, 10)
        });

        // Filter to failed only if requested
        if (cmdOpts.failedOnly) {
          history = history.filter((h: any) => h.status === 'failed');
        }

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        const mode = getOutputMode(globalOpts);
        if (history.length === 0 && mode === "table") {
          say("No execution history found");
          return;
        }

        renderList(history as any[], TABLE_SCHEMAS['scheduled-tasks.history'], mode);
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Task Types (discoverability)
  tasks
    .command("types")
    .description("List available task types")
    .option("--detailed", "Show detailed metadata including config schemas")
    .action(async function(this: Command, cmdOpts) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const types = await client.scheduledTasks.taskTypes({
          detailed: cmdOpts.detailed || false
        });

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        const mode = getOutputMode(globalOpts);
        if (cmdOpts.detailed) {
          // Detailed view with schemas
          renderList(types as any[], TABLE_SCHEMAS['scheduled-tasks.types'], mode);
        } else if (mode !== "table") {
          renderData(types, mode);
        } else {
          // Simple list: the names are the data, the heading and hint are messages
          say("Available task types:");
          (types as string[]).forEach(type => process.stdout.write(`  - ${type}\n`));
          say("\nUse --detailed for metadata and config schemas");
        }
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Workspace-wide execution log
  tasks
    .command("log")
    .description("Show execution log for all scheduled tasks in the workspace")
    .option("--limit <number>", "Maximum number of entries to return", "50")
    .action(async function(this: Command, cmdOpts) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const entries = await client.scheduledTasks.log({ limit: parseInt(cmdOpts.limit, 10) });

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        const mode = getOutputMode(globalOpts);

        if (entries.length === 0 && mode === 'table') {
          say("No execution log entries found");
          return;
        }

        renderList(entries as any[], TABLE_SCHEMAS['scheduled-tasks.log'], mode);
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Stats (quick health check)
  tasks
    .command("stats")
    .description("Show task execution statistics")
    .action(async function(this: Command) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const allTasks = await client.scheduledTasks.list();

        const stats = {
          total: allTasks.length,
          enabled: allTasks.filter((t: any) => t.enabled).length,
          disabled: allTasks.filter((t: any) => !t.enabled).length,
          never_run: allTasks.filter((t: any) => !t.last_run_at).length,
          failed: allTasks.filter((t: any) => t.last_status === 'failed').length,
          success: allTasks.filter((t: any) => t.last_status === 'success').length,
        };

        const mode = getOutputMode(parent.optsWithGlobals<PlatformCommandOptions>());
        if (mode !== "table") {
          renderData(stats, mode);
          return;
        }

        process.stdout.write([
          "Scheduled Task Statistics:",
          `  Total tasks:       ${stats.total}`,
          `  Enabled:           ${stats.enabled}`,
          `  Disabled:          ${stats.disabled}`,
          `  Never run:         ${stats.never_run}`,
          `  Last status:`,
          `    Success:         ${stats.success}`,
          `    Failed:          ${stats.failed}`,
        ].join("\n") + "\n");

        if (stats.failed > 0) {
          say("\n⚠️  Some tasks have failed. Run 'list --failed-only' to see them.");
        }
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });
}
