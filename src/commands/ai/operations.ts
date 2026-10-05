import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderList, renderData } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { addDataOptions, readJsonInput } from "../../shared/json-input.js";
import { say, emitDeleted, emitOk } from "../../shared/io.js";
import { handleCommandError } from "../../shared/error-handler.js";

export function registerAiOperationCommands(parent: Command): void {
  const operations = parent
    .command("operations")
    .description("AI operation catalogue and execution");

  // List operations
  operations
    .command("list")
    .description("List available AI operations")
    .action(async function(this: Command) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const result = await client.ai.operations.list();
        renderList(result as any[], {
          slug: 'slug',
          name: 'name',
          description: 'description',
        } as any, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Get operation by slug
  operations
    .command("get <slug>")
    .description("Get AI operation by slug")
    .action(async function(this: Command, slug: string) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const operation = await client.ai.operations.get(slug);
        renderData(operation, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Execute an operation
  addDataOptions(operations
    .command("execute <slug>")
    .description("Execute an AI operation"), "execution body")
    .action(async function(this: Command, slug: string, cmdOpts) {
      try {
        const body = (cmdOpts.data !== undefined || cmdOpts.file || !process.stdin.isTTY)
          ? await readJsonInput(cmdOpts)
          : {};

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const execution = await client.ai.operations.execute(slug, body);
        say(`✓ Executed AI operation: ${slug}`);
        renderData(execution, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Reindex RAG embeddings
  addDataOptions(operations
    .command("reindex")
    .description("Rebuild the RAG embeddings index"), "reindex body")
    .action(async function(this: Command, cmdOpts) {
      try {
        const body = (cmdOpts.data !== undefined || cmdOpts.file || !process.stdin.isTTY)
          ? await readJsonInput(cmdOpts)
          : {};

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const result = await client.ai.operations.reindex(body);
        const mode = getOutputMode(opts);
        emitOk(result as Record<string, unknown>, mode, `✓ Triggered RAG reindex`);
        if (mode === "table" && result) renderData(result, mode);
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Executions audit log
  const executions = parent
    .command("executions")
    .description("AI execution audit log");

  // List executions
  executions
    .command("list")
    .description("List AI executions (newest first)")
    .option("--operation-slug <slug>", "Filter by operation slug")
    .option("--status <status>", "Filter by status")
    .option("--entity-id <id>", "Filter by entity ID")
    .option("--limit <number>", "Maximum number of results")
    .option("--offset <number>", "Number of results to skip")
    .action(async function(this: Command, cmdOpts) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const result = await client.ai.executions.list({
          operationSlug: cmdOpts.operationSlug,
          status: cmdOpts.status,
          entityId: cmdOpts.entityId,
          limit: cmdOpts.limit !== undefined ? parseInt(cmdOpts.limit, 10) : undefined,
          offset: cmdOpts.offset !== undefined ? parseInt(cmdOpts.offset, 10) : undefined,
        });
        renderList(result as any[], {
          id: 'id',
          operationSlug: 'operationSlug',
          status: 'status',
          entityType: 'entityType',
          entityId: 'entityId',
          createdAt: 'createdAt',
        } as any, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Get execution by ID
  executions
    .command("get <id>")
    .description("Get AI execution by ID")
    .action(async function(this: Command, id: string) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const execution = await client.ai.executions.get(id);
        renderData(execution, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Delete execution
  executions
    .command("delete <id>")
    .description("Delete an AI execution record")
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

        await client.ai.executions.delete(id);
        emitDeleted(id, getOutputMode(opts), `✓ Deleted AI execution: ${id}`);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
