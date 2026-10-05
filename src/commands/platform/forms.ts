import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderList, renderData } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { addDataOptions, readJsonInput } from "../../shared/json-input.js";
import { handleCommandError } from "../../shared/error-handler.js";
import { say, emitDeleted } from "../../shared/io.js";
import { TABLE_SCHEMAS } from "../../shared/table-schemas.js";
import { validatePositiveInteger } from "../../shared/validation.js";

export function registerPlatformFormCommands(parent: Command): void {
  const forms = parent
    .command("forms")
    .description("Forms: definitions, their submissions, and the public submit endpoint");

  // List forms
  forms
    .command("list")
    .description("List forms")
    .action(async function(this: Command) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const forms = await client.forms.list();

        renderList(forms as any[], TABLE_SCHEMAS['forms.list'], getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Get form by ID
  forms
    .command("get <id>")
    .description("Get form by ID")
    .action(async function(this: Command, id: string) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const form = await client.forms.get(id);
        renderData(form, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Create form
  addDataOptions(forms
    .command("create")
    .description("Create a new form"), "form data")
    .action(async function(this: Command, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const form = await client.forms.create(data);
        say(`✓ Created form: ${form.id} (${form.slug})`);
        renderData(form, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Update form
  addDataOptions(forms
    .command("update <id>")
    .description("Update a form"), "form data")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const form = await client.forms.update(id, data);
        say(`✓ Updated form: ${form.id} (${form.slug})`);
        renderData(form, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Delete form
  forms
    .command("delete <id>")
    .description("Delete a form")
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

        await client.forms.delete(id);
        emitDeleted(id, getOutputMode(opts), `✓ Deleted form: ${id}`);
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Get form submissions
  forms
    .command("submissions <formId>")
    .description("List a form's submissions, newest first")
    .option("--limit <number>", "Maximum number of submissions to return", "100")
    .option("--offset <number>", "Number of submissions to skip", "0")
    .action(async function(this: Command, formId: string, cmdOpts) {
      try {
        const limit = validatePositiveInteger(cmdOpts.limit, "--limit");
        const offset = parseInt(cmdOpts.offset, 10);
        if (isNaN(offset) || offset < 0) throw new Error(`--offset must be 0 or more, got: ${cmdOpts.offset}`);

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        // The SDK's getSubmissions() takes no paging, so pass limit/offset on the raw GET
        const id = client.validatePathParam(formId, "form ID");
        const submissions = await client.get<unknown[]>(`/api/platform/forms/${id}/submissions`, { limit, offset });

        renderList(submissions as any[], TABLE_SCHEMAS['forms.submissions'], getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Get published form (Publishing API)
  forms
    .command("get-published <slug>")
    .description("Get a published form by slug (Publishing API)")
    .action(async function(this: Command, slug: string) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const workspace = await client.workspaces.getCurrent();

        const form = await client.forms.getPublishedForm(workspace.slug ?? '', slug);
        renderData(form, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Submit to published form (Publishing API)
  addDataOptions(forms
    .command("submit <slug>")
    .description("Submit data to a published form (Publishing API)"), "submission data")
    .action(async function(this: Command, slug: string, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const workspace = await client.workspaces.getCurrent();

        const submission = await client.forms.submitForm(workspace.slug ?? '', slug, data);
        say(`✓ Submitted to form: ${slug}`);
        renderData(submission, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });
}
