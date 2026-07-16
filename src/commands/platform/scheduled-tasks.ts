import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import type { PlatformCommandOptions } from "../../shared/types.js";
import { renderList, renderData } from "../../output.js";
import { readFileSync } from "fs";

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
        renderList(items as any, {
          id: 'id',
          name: 'name',
          task_type: 'task_type',
          schedule_type: 'schedule_type',
          enabled: 'enabled',
          last_status: 'last_status',
          next_run_at: 'next_run_at',
        } as any, globalOpts.output as any || 'table');
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
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
        renderData(task, globalOpts.output as any || 'table');
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });

  // Create
  tasks
    .command("create")
    .description("Create a new scheduled task")
    .option("--json <json>", "Task data as JSON string")
    .option("--file <path>", "Path to JSON file with task data")
    .action(async function(this: Command, cmdOpts) {
      try {
        let data: any;

        if (cmdOpts.json) {
          data = JSON.parse(cmdOpts.json);
        } else if (cmdOpts.file) {
          data = JSON.parse(readFileSync(cmdOpts.file, "utf-8"));
        } else {
          console.error("Error: Provide task data via --json or --file");
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

        console.log(`✓ Created scheduled task: ${task.id}`);
        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(task, globalOpts.output as any || 'table');
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });

  // Update
  tasks
    .command("update <id-or-slug>")
    .description("Update a scheduled task")
    .option("--json <json>", "Task data as JSON string")
    .option("--file <path>", "Path to JSON file with task data")
    .option("--enable", "Enable the task")
    .option("--disable", "Disable the task")
    .action(async function(this: Command, idOrSlug: string, cmdOpts) {
      try {
        let data: any = {};

        if (cmdOpts.json) {
          data = JSON.parse(cmdOpts.json);
        } else if (cmdOpts.file) {
          data = JSON.parse(readFileSync(cmdOpts.file, "utf-8"));
        }

        // Apply quick flags
        if (cmdOpts.enable) {
          data.enabled = true;
        } else if (cmdOpts.disable) {
          data.enabled = false;
        }

        if (Object.keys(data).length === 0) {
          console.error("Error: Provide task data via --json, --file, --enable, or --disable");
          process.exitCode = 1;
          return;
        }

        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const task = await client.scheduledTasks.update(idOrSlug, data);

        console.log(`✓ Updated scheduled task: ${task.id}`);
        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(task, globalOpts.output as any || 'table');
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
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

        console.log(`✓ Deleted scheduled task: ${idOrSlug}`);
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
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

        console.log(`✓ Task execution triggered: ${idOrSlug}`);
        console.log("Check 'history' command for execution results");
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
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

        if (history.length === 0) {
          console.log("No execution history found");
          return;
        }

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderList(history as any, {
          executed_at: 'executed_at',
          status: 'status',
          duration_ms: 'duration_ms',
          error_message: 'error_message',
          retry_attempt: 'retry_attempt',
        } as any, globalOpts.output as any || 'table');
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
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

        if (cmdOpts.detailed) {
          // Detailed view with schemas
          const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
          renderList(types as any, {
            task_type: 'task_type',
            name: 'name',
            description: 'description',
          } as any, globalOpts.output as any || 'table');
        } else {
          // Simple list
          console.log("Available task types:");
          (types as string[]).forEach(type => console.log(`  - ${type}`));
          console.log("\nUse --detailed for metadata and config schemas");
        }
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
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

        if (entries.length === 0) {
          console.log("No execution log entries found");
          return;
        }

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderList(entries as any, {
          executed_at: 'executed_at',
          task_id: 'task_id',
          status: 'status',
          duration_ms: 'duration_ms',
          error_message: 'error_message',
        } as any, globalOpts.output as any || 'table');
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
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

        console.log("Scheduled Task Statistics:");
        console.log(`  Total tasks:       ${stats.total}`);
        console.log(`  Enabled:           ${stats.enabled}`);
        console.log(`  Disabled:          ${stats.disabled}`);
        console.log(`  Never run:         ${stats.never_run}`);
        console.log(`  Last status:`);
        console.log(`    Success:         ${stats.success}`);
        console.log(`    Failed:          ${stats.failed}`);

        if (stats.failed > 0) {
          console.log("\n⚠️  Some tasks have failed. Run 'list --failed-only' to see them.");
        }
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });
}
