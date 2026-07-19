/**
 * Centralized table column schemas for all platform commands.
 *
 * Every command that calls renderList imports its column spec from here.
 * String field names are type-checked against the SDK schema type via
 * `satisfies ColSpec<T>` — if the field name is wrong, TypeScript errors here.
 */

import type {
  Webhook,
  EventLogSummary,
  PlatformEntryType,
  PlatformAPIClient,
  PlatformForm,
  PlatformFormSubmission,
  Notification,
  PlatformWorkspaceMember,
  EmailTemplateSummary,
  TaskTypeInfo,
  EventOption,
} from '@inneropen/marvin-sdk/platform'
import type { ColumnSpec } from '../output.js'
import {
  platformEntryColumns,
  platformCollectionColumns,
  platformResourceColumns,
  platformAssetColumns,
} from './columns.js'

// ---------------------------------------------------------------------------
// Helper type: column spec where ALL values must be string-typed keys of T.
// Use this with `satisfies` on purely string-field schemas.
// For mixed schemas (strings + functions) use `satisfies ColumnSpec<T>` instead.
// ---------------------------------------------------------------------------
type ColSpec<T> = Record<string, keyof T & string>

// ---------------------------------------------------------------------------
// Local interfaces for SDK types not publicly exported with the right shape.
// ---------------------------------------------------------------------------

/** Write-only secret metadata (value never returned). */
interface WorkspaceSecretRead {
  id: string
  name: string
  slug: string
  description: string | null
}

/** Plain-text workspace variable. */
interface WorkspaceVariableRead {
  id: string
  name: string
  slug: string
  value: string
  description: string | null
}

/** Webhook delivery log entry (camelCase API shape). */
interface WebhookExecutionLogRead {
  id: string
  webhookId: string
  status: string
  httpStatusCode: number | null
  executedAt: string
}

/**
 * Email event subscription (camelCase API shape).
 * NOTE: The SDK-exported `EmailEventSubscription` interface uses snake_case
 * which does not match the actual API response. This local type mirrors
 * the real API shape (camelCase) as seen in the generated schema's
 * `EmailEventSubscriptionRead` component.
 */
interface EmailEventSubscriptionRead {
  id: string
  templateId: string
  eventType: string
  recipientType: string
  enabled: boolean
}

// ---------------------------------------------------------------------------
// TABLE_SCHEMAS — single source of truth for every renderList column spec.
//
// Key convention: "<commander-command-name>.<subcommand-name>"
//   (drop the leading "platform" group name)
//   e.g. ['platform', 'secrets', 'list'] → 'secrets.list'
// ---------------------------------------------------------------------------

export const TABLE_SCHEMAS = {
  // ---- Secrets ----
  'secrets.list': {
    ID: 'id',
    Name: 'name',
    Slug: 'slug',
    Description: 'description',
  } satisfies ColSpec<WorkspaceSecretRead>,

  // ---- Variables ----
  'variables.list': {
    ID: 'id',
    Name: 'name',
    Slug: 'slug',
    Value: 'value',
    Description: 'description',
  } satisfies ColSpec<WorkspaceVariableRead>,

  // ---- Webhooks ----
  'webhooks.list': {
    ID: 'id',
    Name: 'name',
    URL: 'url',
    Method: 'method',
    Enabled: 'enabled',
  } satisfies ColSpec<Webhook>,

  'webhooks.log': {
    ID: 'id',
    Webhook: 'webhookId',
    Status: 'status',
    HTTP: 'httpStatusCode',
    Executed: 'executedAt',
  } satisfies ColSpec<WebhookExecutionLogRead>,

  'webhooks.logs': {
    ID: 'id',
    Webhook: 'webhookId',
    Status: 'status',
    HTTP: 'httpStatusCode',
    Executed: 'executedAt',
  } satisfies ColSpec<WebhookExecutionLogRead>,

  // ---- Event Log ----
  'event-log.list': {
    ID: 'eventId',
    Event: 'eventType',
    Occurred: 'occurredAt',
    User: 'userId',
    'Entity Type': 'entityType',
    Title: 'messageTitle',
  } satisfies ColSpec<EventLogSummary>,

  'event-log.entity': {
    ID: 'eventId',
    Event: 'eventType',
    Occurred: 'occurredAt',
    User: 'userId',
    Title: 'messageTitle',
  } satisfies ColSpec<EventLogSummary>,

  'event-log.user': {
    ID: 'eventId',
    Event: 'eventType',
    Occurred: 'occurredAt',
    'Entity Type': 'entityType',
    'Entity ID': 'entityId',
    Title: 'messageTitle',
  } satisfies ColSpec<EventLogSummary>,

  'event-log.types': {
    value: 'value',
    label: 'label',
    category: 'category',
    description: 'description',
  } satisfies ColSpec<EventOption>,

  // ---- Email Event Subscriptions ----
  'email-subscriptions.list': {
    ID: 'id',
    'Template ID': 'templateId',
    'Event Type': 'eventType',
    'Recipient Type': 'recipientType',
    Enabled: 'enabled',
  } satisfies ColSpec<EmailEventSubscriptionRead>,

  // ---- Entry Types (mixed: strings + function accessors) ----
  'entry-types.list': {
    ID: 'id',
    Name: 'name',
    Slug: 'slug',
    System: 'isSystem',
    Renderer: (et: PlatformEntryType) => (et.renderingJson as any)?.renderer ?? '',
    Package: (et: PlatformEntryType) => (et.renderingJson as any)?.package ?? '',
    Publishable: (et: PlatformEntryType) =>
      et.capabilitiesJson
        ? (et.capabilitiesJson as any).publishable !== false
          ? 'yes'
          : 'no'
        : '',
    Routable: (et: PlatformEntryType) =>
      et.capabilitiesJson
        ? (et.capabilitiesJson as any).routable !== false
          ? 'yes'
          : 'no'
        : '',
  } satisfies ColumnSpec<PlatformEntryType>,

  // ---- Entries (use shared columns from columns.ts) ----
  'entries.list': platformEntryColumns,
  'entries.collections': platformCollectionColumns,

  // ---- Collections ----
  'collections.list': platformCollectionColumns,
  'collections.entries': {
    Order: (e: any) => (e.order !== undefined && e.order !== null ? String(e.order) : '-'),
    ID: (e: any) => e.id,
    Title: (e: any) => e.title,
    Status: (e: any) => e.status || '-',
    Published: (e: any) => e.publishedAt || '-',
  } satisfies ColumnSpec<any>,

  // ---- Resources & Assets (use shared columns from columns.ts) ----
  'resources.list': platformResourceColumns,
  'assets.list': platformAssetColumns,

  // ---- Email Templates (mixed: strings + function for Scope) ----
  'email-templates.list': {
    Name: 'name',
    Type: 'templateType',
    Enabled: 'enabled',
    Scope: (t: EmailTemplateSummary) => (t.groupId ? 'workspace' : 'system'),
  } satisfies ColumnSpec<EmailTemplateSummary>,

  // ---- Notifications ----
  // NOTE: GroupEventNotifierRead has no 'eventType' field; only id/name/enabled/options.
  'notifications.list': {
    ID: 'id',
    Name: 'name',
    Enabled: 'enabled',
  } satisfies ColSpec<Notification>,

  // ---- Scheduled Tasks (legacy snake_case API shape; SDK type uses camelCase) ----
  // Using Record<string, unknown> as fallback — no satisfies field-check here since
  // the real API response shape does not match the ScheduledTaskRead TypeScript type.
  'scheduled-tasks.list': {
    id: 'id',
    name: 'name',
    task_type: 'task_type',
    schedule_type: 'schedule_type',
    enabled: 'enabled',
    last_status: 'last_status',
    next_run_at: 'next_run_at',
  } satisfies ColSpec<Record<string, unknown>>,

  'scheduled-tasks.history': {
    executed_at: 'executed_at',
    status: 'status',
    duration_ms: 'duration_ms',
    error_message: 'error_message',
    retry_attempt: 'retry_attempt',
  } satisfies ColSpec<Record<string, unknown>>,

  'scheduled-tasks.log': {
    executed_at: 'executed_at',
    task_id: 'task_id',
    status: 'status',
    duration_ms: 'duration_ms',
    error_message: 'error_message',
  } satisfies ColSpec<Record<string, unknown>>,

  'scheduled-tasks.types': {
    task_type: 'task_type',
    name: 'name',
    description: 'description',
  } satisfies ColSpec<TaskTypeInfo>,

  // ---- Invites (command pre-maps tokens to custom row shape; columns are function accessors) ----
  'invites.list': {
    Token: (row: any) => row.Token as string,
    Role: (row: any) => row.Role as string,
    'Uses Left': (row: any) => row['Uses Left'] as string,
    Created: (row: any) => row.Created as string,
  } satisfies ColumnSpec<any>,

  // ---- Workspace Members (all function accessors — nested user object) ----
  'workspace-members.list': {
    'User ID': (m: PlatformWorkspaceMember) => m.userId || '',
    Username: (m: PlatformWorkspaceMember) => (m.user as any)?.username || '',
    Email: (m: PlatformWorkspaceMember) => (m.user as any)?.email || '',
    Role: (m: PlatformWorkspaceMember) => m.workspaceRole || '',
    Joined: (m: PlatformWorkspaceMember) =>
      (m as any).joinedAt
        ? new Date((m as any).joinedAt).toISOString().split('T')[0]
        : '',
  } satisfies ColumnSpec<PlatformWorkspaceMember>,

  // ---- Forms ----
  'forms.list': {
    ID: (form: PlatformForm) => form.id || '',
    Slug: (form: PlatformForm) => form.slug || '',
    Name: (form: PlatformForm) => form.name || '',
    Status: (form: PlatformForm) => form.status || '',
    Submissions: (form: PlatformForm) => form.submissionsCount?.toString() ?? '0',
    Created: (form: PlatformForm) =>
      form.createdAt ? new Date(form.createdAt).toLocaleDateString() : '',
  } satisfies ColumnSpec<PlatformForm>,

  'forms.submissions': {
    ID: (sub: PlatformFormSubmission) => sub.id || '',
    Status: (sub: PlatformFormSubmission) => sub.status || '',
    'Submitted At': (sub: PlatformFormSubmission) =>
      sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : '',
    IP: (sub: PlatformFormSubmission) => sub.ipAddress || '',
  } satisfies ColumnSpec<PlatformFormSubmission>,

  // ---- API Clients (mixed: strings + function for Description/Created) ----
  'api-clients.list': {
    ID: 'id',
    Name: 'name',
    Description: (c: PlatformAPIClient) => (c.description || '').substring(0, 50),
    Created: (c: PlatformAPIClient) =>
      c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : '',
  } satisfies ColumnSpec<PlatformAPIClient>,
} satisfies Record<string, ColumnSpec<any>>

export type SchemaKey = keyof typeof TABLE_SCHEMAS
