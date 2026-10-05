/**
 * Roles the Marvin backend requires per command, and the message for a 403.
 *
 * The backend answers a 403 when the caller's workspace role is below a route's gate. The SDK
 * turns that into a MarvinAuthError without the response body, so the CLI can't read which role
 * the route wanted; this table says it instead. It mirrors the backend's gates:
 * - ADMIN (or OWNER): workspace settings — webhooks, workflows, integrations (all but the provider
 *   catalogue), variables, scheduled tasks, email
 *   subscriptions, SMTP and test email, invites, members, API clients, AI providers, secret
 *   writes, workspace export and backups — reads included; and entry-type and form writes.
 * - EDITOR: collection, resource and asset-edit writes, reading form submissions, and site rebuilds.
 * - AUTHOR: creating entries and changing your own drafts; EDITOR for anyone else's entry or to
 *   approve, publish or schedule one.
 * - SUPER_ADMIN (platform role): everything under `marvin admin`.
 *
 * The same table appends "(needs …)" to those commands' help text.
 */

import type { Command } from "commander";
import { commandPath } from "./command-context.js";

export type WorkspaceRole = "OWNER" | "ADMIN" | "EDITOR" | "AUTHOR" | "VIEWER";
export type RequiredRole = Exclude<WorkspaceRole, "VIEWER"> | "SUPER_ADMIN";

/**
 * Command path (or path prefix) → role. The longest matching prefix wins, so a group-wide entry
 * can be overridden for one subcommand; `null` marks a subcommand any member may run.
 */
export const REQUIRED_ROLES: Readonly<Record<string, RequiredRole | null>> = {
  // Platform administration
  "admin": "SUPER_ADMIN",

  // Workspace settings: ADMIN, reads included
  "platform webhooks": "ADMIN",
  "platform webhooks types": null,
  "platform workflows": "ADMIN",
  "platform integrations": "ADMIN",
  "platform integrations providers": null,
  "platform variables": "ADMIN",
  "platform scheduled-tasks": "ADMIN",
  "platform scheduled-tasks types": null,
  "platform email-subscriptions": "ADMIN",
  "platform email test-smtp": "ADMIN",
  "platform email test-template": "ADMIN",
  "platform email update-template": "ADMIN",
  "platform email-templates create": "ADMIN",
  "platform email-templates update": "ADMIN",
  "platform email-templates delete": "ADMIN",
  "platform email-templates test-send": "ADMIN",
  "platform email-templates event-connections": "ADMIN",
  "platform invites": "ADMIN",
  "platform workspace-members": "ADMIN",
  "platform api-clients": "ADMIN",
  "platform ai providers": "ADMIN",
  "platform secrets create": "ADMIN",
  "platform secrets update": "ADMIN",
  "platform secrets delete": "ADMIN",
  "platform secrets reveal": "ADMIN",
  "workspace export": "ADMIN",
  "workspace backups": "ADMIN",

  // Workspace structure: ADMIN to change
  "platform entry-types create": "ADMIN",
  "platform entry-types update": "ADMIN",
  "platform entry-types delete": "ADMIN",
  "platform forms create": "ADMIN",
  "platform forms update": "ADMIN",
  "platform forms delete": "ADMIN",

  // Content: EDITOR to change
  "platform site": "EDITOR",
  "platform forms submissions": "EDITOR",
  "platform collections create": "EDITOR",
  "platform collections update": "EDITOR",
  "platform collections delete": "EDITOR",
  "platform collections reorder": "EDITOR",
  "platform collections update-entry": "EDITOR",
  "platform resources create": "EDITOR",
  "platform resources update": "EDITOR",
  "platform resources delete": "EDITOR",
  "platform assets update": "EDITOR",
  "platform assets delete": "EDITOR",
  "platform assets upload": "AUTHOR",

  // Entries: an AUTHOR may create and change their own drafts; the rest needs EDITOR
  "platform entries create": "AUTHOR",
  "platform entries update": "AUTHOR",
  "platform entries delete": "AUTHOR",
  "platform entries add-to-collection": "AUTHOR",
  "platform entries remove-from-collection": "AUTHOR",
};

/** The role `path` needs, by longest matching prefix; undefined when the table doesn't say. */
export function requiredRoleFor(path: string): RequiredRole | undefined {
  const words = path.split(" ").filter(Boolean);
  for (let n = words.length; n > 0; n--) {
    const key = words.slice(0, n).join(" ");
    if (key in REQUIRED_ROLES) {
      return REQUIRED_ROLES[key] ?? undefined;
    }
  }
  return undefined;
}

export interface PermissionDenied {
  /** One line saying what's missing, e.g. "This needs the ADMIN role in workspace 'acme'." */
  message: string;
  requiredRole?: RequiredRole;
  workspace?: string;
  /** What the user can do about it. */
  suggestions: string[];
}

/** Explain a 403 for the command at `path`, run against `workspace`. */
export function describePermissionDenied(path: string | undefined, workspace: string | undefined): PermissionDenied {
  const requiredRole = path ? requiredRoleFor(path) : undefined;
  const where = workspace ? `workspace '${workspace}'` : "the active workspace";

  if (requiredRole === "SUPER_ADMIN") {
    return {
      message: "This needs the SUPER_ADMIN platform role.",
      requiredRole,
      suggestions: ["Ask a platform administrator to run it, or to grant you SUPER_ADMIN"],
    };
  }

  const suggestions = [
    "Ask a workspace OWNER or ADMIN to change your role (marvin platform workspace-members update-role)",
    "Check you're in the right workspace: marvin workspace current",
  ];

  if (requiredRole === "AUTHOR") {
    return {
      message:
        `This needs the AUTHOR role in ${where} for your own draft entries, ` +
        "or EDITOR for anyone else's or to approve, publish or schedule one.",
      requiredRole,
      workspace,
      suggestions,
    };
  }

  if (requiredRole) {
    return { message: `This needs the ${requiredRole} role in ${where}.`, requiredRole, workspace, suggestions };
  }

  return { message: `Your role in ${where} doesn't allow this.`, workspace, suggestions };
}

function roleLabel(role: RequiredRole): string {
  return role === "SUPER_ADMIN" ? "SUPER_ADMIN" : `workspace ${role}`;
}

/** Append "(needs workspace ADMIN)" and the like to the help text of every command in the table. */
export function annotateRequiredRoles(root: Command): void {
  for (const sub of root.commands) {
    const role = REQUIRED_ROLES[commandPath(sub)];
    const description = sub.description();
    if (role && !/\b(requires|needs)\b/i.test(description)) {
      sub.description(`${description} (needs ${roleLabel(role)})`);
    }
    annotateRequiredRoles(sub);
  }
}
