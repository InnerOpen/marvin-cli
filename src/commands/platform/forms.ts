import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderList, renderData } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { readJsonInput } from "../../shared/json-input.js";
import { handleCommandError } from "../../shared/error-handler.js";
import type { ColumnSpec } from "../../output.js";

// Column definitions for forms list
const platformFormColumns: ColumnSpec<any> = {
  ID: (form) => form.id || "",
  Slug: (form) => form.slug || "",
  Name: (form) => form.name || "",
  Status: (form) => form.status || "",
  Submissions: (form) => form.submissionsCount?.toString() || "0",
  Created: (form) => form.createdAt ? new Date(form.createdAt).toLocaleDateString() : "",
};

// Column definitions for form submissions list
const formSubmissionColumns: ColumnSpec<any> = {
  ID: (sub) => sub.id || "",
  Status: (sub) => sub.status || "",
  "Submitted At": (sub) => sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : "",
  IP: (sub) => sub.ipAddress || "",
};

export function registerPlatformFormCommands(parent: Command): void {
  const forms = parent
    .command("forms")
    .description("Form CRUD operations");

  // List forms
  forms
    .command("list")
    .description("List forms")
    .action(async function(this: Command) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const forms = await client.forms.list();

        renderList(forms as any[], platformFormColumns, getOutputMode(opts));
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
  forms
    .command("create")
    .description("Create a new form")
    .option("--json <json>", "Form data as JSON string")
    .option("--file <path>", "Path to JSON file with form data (use '-' for stdin)")
    .action(async function(this: Command, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const form = await client.forms.create(data);
        console.log(`✓ Created form: ${form.id} (${form.slug})`);
        renderData(form, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Update form
  forms
    .command("update <id>")
    .description("Update a form")
    .option("--json <json>", "Form data as JSON string")
    .option("--file <path>", "Path to JSON file with form data (use '-' for stdin)")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const form = await client.forms.update(id, data);
        console.log(`✓ Updated form: ${form.id} (${form.slug})`);
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
        console.log(`✓ Deleted form: ${id}`);
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Get form submissions
  forms
    .command("submissions <formId>")
    .description("Get submissions for a form")
    .action(async function(this: Command, formId: string) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const submissions = await client.forms.getSubmissions(formId);

        renderList(submissions as any[], formSubmissionColumns, getOutputMode(opts));
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
  forms
    .command("submit <slug>")
    .description("Submit data to a published form (Publishing API)")
    .option("--json <json>", "Submission data as JSON string")
    .option("--file <path>", "Path to JSON file with submission data (use '-' for stdin)")
    .action(async function(this: Command, slug: string, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const workspace = await client.workspaces.getCurrent();

        const submission = await client.forms.submitForm(workspace.slug ?? '', slug, data);
        console.log(`✓ Submitted to form: ${slug}`);
        renderData(submission, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });
}
