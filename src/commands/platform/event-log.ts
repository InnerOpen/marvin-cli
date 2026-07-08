import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import type { PlatformCommandOptions } from "../../shared/types.js";
import { renderList, renderData } from "../../output.js";

export function registerEventLogCommands(parent: Command): void {
  const eventLog = new Command("event-log")
    .alias("events")
    .description("Event log and audit trail");

  parent.addCommand(eventLog);

  // List events
  eventLog
    .command("list")
    .description("List events with optional filtering")
    .option("--event-type <type>", "Filter by event type (e.g., entry.published)")
    .option("--entity-type <type>", "Filter by entity type (e.g., entry, asset)")
    .option("--entity-id <id>", "Filter by entity ID")
    .option("--user-id <id>", "Filter by user ID")
    .option("--start-date <date>", "Filter by start date (ISO 8601)")
    .option("--end-date <date>", "Filter by end date (ISO 8601)")
    .option("--limit <number>", "Maximum number of events to return", "50")
    .option("--offset <number>", "Number of events to skip", "0")
    .action(async function(this: Command, cmdOpts) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());

        const params: any = {};
        if (cmdOpts.eventType) params.event_type = cmdOpts.eventType;
        if (cmdOpts.entityType) params.entity_type = cmdOpts.entityType;
        if (cmdOpts.entityId) params.entity_id = cmdOpts.entityId;
        if (cmdOpts.userId) params.user_id = cmdOpts.userId;
        if (cmdOpts.startDate) params.start_date = cmdOpts.startDate;
        if (cmdOpts.endDate) params.end_date = cmdOpts.endDate;
        if (cmdOpts.limit) params.limit = parseInt(cmdOpts.limit);
        if (cmdOpts.offset) params.offset = parseInt(cmdOpts.offset);

        const events = await client.eventLog.list(params);

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderList(events as any, {
          event_id: 'event_id',
          event_type: 'event_type',
          occurred_at: 'occurred_at',
          user_id: 'user_id',
          entity_type: 'entity_type',
          message_title: 'message_title',
        } as any, globalOpts.output as any || 'table');
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });

  // Get single event
  eventLog
    .command("get <event-id>")
    .description("Get a single event by ID")
    .action(async function(this: Command, eventId: string) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const event = await client.eventLog.get(eventId);

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(event, globalOpts.output as any || 'table');
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });

  // Get entity history
  eventLog
    .command("entity <entity-id>")
    .description("Get complete event history for an entity")
    .option("--entity-type <type>", "Filter by entity type (e.g., entry, asset)")
    .option("--limit <number>", "Maximum number of events to return", "100")
    .option("--offset <number>", "Number of events to skip", "0")
    .action(async function(this: Command, entityId: string, cmdOpts) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());

        const options: any = {};
        if (cmdOpts.entityType) options.entity_type = cmdOpts.entityType;
        if (cmdOpts.limit) options.limit = parseInt(cmdOpts.limit);
        if (cmdOpts.offset) options.offset = parseInt(cmdOpts.offset);

        const events = await client.eventLog.getEntityHistory(entityId, options);

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderList(events as any, {
          event_id: 'event_id',
          event_type: 'event_type',
          occurred_at: 'occurred_at',
          user_id: 'user_id',
          message_title: 'message_title',
        } as any, globalOpts.output as any || 'table');
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });

  // Get user activity
  eventLog
    .command("user <user-id>")
    .description("Get activity history for a user")
    .option("--event-type <type>", "Filter by event type (e.g., entry.published)")
    .option("--start-date <date>", "Filter by start date (ISO 8601)")
    .option("--end-date <date>", "Filter by end date (ISO 8601)")
    .option("--limit <number>", "Maximum number of events to return", "100")
    .option("--offset <number>", "Number of events to skip", "0")
    .action(async function(this: Command, userId: string, cmdOpts) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());

        const options: any = {};
        if (cmdOpts.eventType) options.event_type = cmdOpts.eventType;
        if (cmdOpts.startDate) options.start_date = cmdOpts.startDate;
        if (cmdOpts.endDate) options.end_date = cmdOpts.endDate;
        if (cmdOpts.limit) options.limit = parseInt(cmdOpts.limit);
        if (cmdOpts.offset) options.offset = parseInt(cmdOpts.offset);

        const events = await client.eventLog.getUserActivity(userId, options);

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderList(events as any, {
          event_id: 'event_id',
          event_type: 'event_type',
          occurred_at: 'occurred_at',
          entity_type: 'entity_type',
          entity_id: 'entity_id',
          message_title: 'message_title',
        } as any, globalOpts.output as any || 'table');
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });
}
