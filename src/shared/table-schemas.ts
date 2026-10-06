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
  PlatformWorkspaceMember,
  EmailTemplateSummary,
  TaskTypeInfo,
  EventOption,
  Automation,
  AutomationExecution,
  AutomationPlanStep,
  Integration,
  IntegrationProviderInfo,
  IntegrationPluginInfo,
  IntegrationEventSubscription,
  AdminPlugin,
  AutomationDryRunSample,
  Blueprint,
  IncomingWebhook,
  IncomingWebhookSignatureScheme,
  PlatformTag,
  CollectionMember,
  PlatformRecentEvent,
  EventConnectionCounts,
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

/** A `marvin events list` row: the connections summary plus the type's name and category from the catalogue. */
export type EventTypeRow = EventConnectionCounts & { name: string | null; category: string | null }

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

/** An asset attached to an entry, as the entry read returns it (with its junction placement). */
interface EntryAssetRow {
  id: string
  slug: string
  name: string
  mimeType: string
  placementMetadata?: Record<string, unknown> | null
}

/** One item a smart-collection rule preview matched. */
interface SmartRulesPreviewItem {
  id: string
  label: string
  slug?: string | null
  type: string
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

  // ---- Events hub ----
  'events.list': {
    'Event type': 'eventType',
    Name: 'name',
    Category: 'category',
    Senders: 'senders',
    'Reactions (on/total)': (r: EventTypeRow) => `${r.activeReactions}/${r.reactions}`,
    'Built-in': 'builtinReactions',
    'Last occurred': 'lastOccurredAt',
  } satisfies ColumnSpec<EventTypeRow>,

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
  'entries.suggested-assets.list': {
    ID: 'id',
    Slug: 'slug',
    Name: 'name',
    Type: 'mimeType',
    Operation: (a: EntryAssetRow) => String(a.placementMetadata?.media_op ?? ''),
    'Derived from': (a: EntryAssetRow) => String(a.placementMetadata?.derived_from ?? ''),
  } satisfies ColumnSpec<EntryAssetRow>,

  // ---- Collections ----
  'collections.list': platformCollectionColumns,
  'collections.members': {
    ID: 'id',
    Type: 'type',
    Label: 'label',
    Slug: (m: CollectionMember) => m.slug ?? '',
  } satisfies ColumnSpec<CollectionMember>,
  'collections.preview': {
    ID: 'id',
    Type: 'type',
    Label: 'label',
    Slug: (m: SmartRulesPreviewItem) => m.slug ?? '',
  } satisfies ColumnSpec<SmartRulesPreviewItem>,
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

  // ---- Workflows (the SDK's automations) ----
  'workflows.list': {
    ID: 'id',
    Slug: 'slug',
    Name: 'name',
    Enabled: 'enabled',
    Trigger: (w: Automation) => {
      const t = w.definition?.trigger
      if (!t?.type) return ''
      const detail = t.event ?? t.schedule_type ?? t.webhook ?? t.automation
      return detail ? `${t.type}: ${detail}` : t.type
    },
    Steps: (w: Automation) => w.definition?.actions?.length ?? 0,
  } satisfies ColumnSpec<Automation>,

  'workflows.executions': {
    ID: 'id',
    Status: (r: AutomationExecution & { handled?: boolean }) => (r.handled ? `${r.status} (handled)` : r.status),
    Trigger: 'triggerType',
    Started: (r: AutomationExecution) => r.startedAt ?? '',
    Duration: (r: AutomationExecution) =>
      r.durationMs == null ? '' : r.durationMs < 1000 ? `${r.durationMs}ms` : `${(r.durationMs / 1000).toFixed(1)}s`,
    Targets: (r: AutomationExecution) => `${r.targetsRun}/${r.targetsMatched}${r.capped ? '+' : ''}`,
    Steps: (r: AutomationExecution) => `${r.stepsOk}/${r.stepsTotal}`,
    Error: (r: AutomationExecution) => r.error ?? '',
  } satisfies ColumnSpec<AutomationExecution>,

  'workflows.plan': {
    Target: (s: AutomationPlanStep) => {
      const t = s.target as { type?: string; id?: string } | null | undefined
      return t ? `${t.type ?? ''} ${t.id ?? ''}`.trim() : `#${s.target_index}`
    },
    Step: 'action_index',
    Kind: 'kind',
    Label: (s: AutomationPlanStep) => s.label ?? '',
    Status: 'status',
    Error: (s: AutomationPlanStep) => s.error ?? '',
  } satisfies ColumnSpec<AutomationPlanStep>,

  'workflows.samples': {
    Kind: 'kind',
    ID: 'id',
    Label: (s: AutomationDryRunSample) => s.label ?? '',
    Event: (s: AutomationDryRunSample) => s.event_type ?? '',
    'Occurred at': (s: AutomationDryRunSample) => s.occurred_at ?? '',
    Conditions: (s: AutomationDryRunSample) => (s.conditions_pass == null ? '' : s.conditions_pass ? 'pass' : 'fail'),
  } satisfies ColumnSpec<AutomationDryRunSample>,

  // ---- Integrations ----
  'integrations.list': {
    ID: 'id',
    Slug: 'slug',
    Name: 'name',
    Provider: 'provider',
    Enabled: 'enabled',
    Status: 'status',
    // Open alerts ("needs attention"): total occurrences and the codes behind them
    Attention: (i: Integration) => {
      const open = i.attention ?? []
      if (!open.length) return ''
      const count = open.reduce((n, a) => n + (a.count ?? 1), 0)
      return `⚠ ${count} (${[...new Set(open.map((a) => a.code))].join(', ')})`
    },
  } satisfies ColumnSpec<Integration>,

  'integrations.providers': {
    Slug: 'slug',
    Name: 'name',
    Category: 'category',
    Actions: (p: IntegrationProviderInfo) => (p.actions ?? []).map((a) => a.key).join(', '),
    Emits: (p: IntegrationProviderInfo) => (p.emits ?? []).length,
    Logo: (p: IntegrationProviderInfo & { logoUrl?: string | null }) => p.logoUrl ?? p.icon ?? '',
  } satisfies ColumnSpec<IntegrationProviderInfo & { logoUrl?: string | null }>,

  'integrations.plugins': {
    Name: 'name',
    Source: 'source',
    Loaded: (p: IntegrationPluginInfo) => (p.ok ? 'yes' : `no: ${p.error ?? ''}`),
    Providers: (p: IntegrationPluginInfo) => (p.slugs ?? []).join(', '),
    Version: (p: IntegrationPluginInfo) => p.version ?? '',
  } satisfies ColumnSpec<IntegrationPluginInfo>,

  'integrations.subscriptions.list': {
    ID: 'id',
    Event: 'eventType',
    Integration: (s: IntegrationEventSubscription) => s.integrationName ?? s.integrationId,
    Action: 'action',
    Enabled: 'enabled',
  } satisfies ColumnSpec<IntegrationEventSubscription>,

  // ---- Dashboard ----
  'dashboard.activity': {
    When: (e: PlatformRecentEvent) => e.occurredAt ?? '',
    Event: 'eventType',
    Message: 'message',
    Entity: (e: PlatformRecentEvent) => (e.entityId ? `${e.entityType ?? ''} ${e.entityId}`.trim() : ''),
  } satisfies ColumnSpec<PlatformRecentEvent>,

  // ---- Blueprints ----
  'blueprints.list': {
    Slug: 'slug',
    Kind: 'kind',
    Name: 'name',
    Category: 'category',
    Source: 'source',
    Applied: (b: Blueprint) => (b.applied ? (b.outdated ? 'yes (outdated)' : 'yes') : 'no'),
    Available: (b: Blueprint) => (b.available ? 'yes' : `no: needs ${(b.missingRequirements ?? []).join(', ')}`),
    Params: (b: Blueprint) => (b.parameters ?? []).map((p) => (p.required ? p.key : `${p.key}?`)).join(', '),
  } satisfies ColumnSpec<Blueprint>,

  // ---- Incoming webhooks ----
  'incoming-webhooks.list': {
    ID: 'id',
    Slug: 'slug',
    Name: 'name',
    Enabled: 'enabled',
    Token: (w: IncomingWebhook) => (w.token ? 'minted' : 'none'),
    Signature: (w: IncomingWebhook) => w.signatureScheme ?? (w.signingSecretRef ? 'hmac-sha256' : 'none'),
    Received: 'receivedCount',
    'Last received': (w: IncomingWebhook) => w.lastReceivedAt ?? '',
  } satisfies ColumnSpec<IncomingWebhook>,
  'incoming-webhooks.signature-schemes': {
    Name: 'name',
    Source: 'source',
    Notes: 'notes',
  } satisfies ColSpec<IncomingWebhookSignatureScheme>,

  // ---- Tags ----
  'tags.list': {
    ID: 'id',
    Slug: 'slug',
    Name: 'name',
    Color: (t: PlatformTag) => t.color ?? '',
    Entries: (t: PlatformTag) => t.entryCount ?? '',
    Uses: (t: PlatformTag) => t.usageCount ?? '',
  } satisfies ColumnSpec<PlatformTag>,

  // ---- Admin ----
  'admin.system.plugins': {
    Name: 'name',
    Kind: 'kind',
    Version: (p: AdminPlugin) => p.version ?? '',
    Loaded: (p: AdminPlugin) => (p.ok ? 'yes' : `no: ${p.error ?? ''}`),
    Providers: (p: AdminPlugin) => (p.providers ?? []).map((pr) => `${pr.slug} (${pr.workspaces} ws)`).join(', '),
  } satisfies ColumnSpec<AdminPlugin>,
} satisfies Record<string, ColumnSpec<any>>

export type SchemaKey = keyof typeof TABLE_SCHEMAS
