/**
 * Fully dynamic output format tests for Marvin CLI platform commands.
 *
 * Walks the commander tree at module load time to discover every list/log/logs
 * subcommand. For each, runs three tests:
 *   - --json  : output is parseable JSON (data passes through unchanged)
 *   - --yaml  : output contains at least one "key: value" line
 *   - table   : console.table receives rows where no column value is empty string /
 *               undefined / null — this is the drift detector
 *
 * The table test fails if a column spec references a wrong field name (e.g. `event_type`
 * when the API returns `eventType`), because `resolveValue` returns `undefined` →
 * `displayValue` converts that to `""` → caught here.
 *
 * Auto-registration: adding a new list/log/logs command automatically gets all three
 * format tests — no manual test additions required.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { createPlatformCommand } from '../commands/platform/index.js'
import { clientFactory } from '../shared/clients.js'

// ---------------------------------------------------------------------------
// Universal fixture — covers every field name that any command column spec
// references. Values are non-null/non-empty so that the drift detector can
// tell apart "correct field name → real value" from "wrong field name → undefined → ''".
//
// Include only CORRECT field names (camelCase for current API, snake_case for
// scheduled-tasks which uses a legacy API shape). Intentionally omit wrong
// snake_case variants like event_id, occurred_at, user_id so a column spec
// using them produces "" and the table test fails.
// ---------------------------------------------------------------------------

const UNIVERSAL_FIXTURE: Record<string, unknown> = {
  // Identity / common
  id: 'id-val',
  name: 'name-val',
  slug: 'slug-val',
  description: 'description-val',
  value: 'value-val',
  enabled: true,
  isSystem: false,
  status: 'active',
  url: 'https://example.com',
  method: 'POST',

  // Date fields — camelCase (current API standard)
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  publishedAt: '2024-01-01T00:00:00Z',
  joinedAt: '2024-01-01T00:00:00Z',

  // Webhook execution log (WebhookExecutionLogRead — all camelCase)
  webhookId: 'webhook-id-val',
  groupId: 'group-id-val',
  executedAt: '2024-01-01T00:00:00Z',
  httpStatusCode: 200,
  errorMessage: 'test-error',
  retryAttempt: 1,

  // Event log (EventLogRead / EventLogSummary — all camelCase)
  eventId: 'event-id-val',
  eventType: 'entry.published',
  occurredAt: '2024-01-01T00:00:00Z',
  workspaceId: 'workspace-id-val',
  userId: 'user-id-val',
  entityId: 'entity-id-val',
  entityType: 'entry',
  messageTitle: 'message-title-val',
  messageBody: 'message-body-val',
  integrationId: 'integration-id-val',
  operation: 'create',

  // Entries
  title: 'title-val',
  entryType: 'blog-post',

  // Assets
  mimeType: 'image/jpeg',
  width: 1920,
  height: 1080,
  altText: 'alt-text-val',

  // Resources
  resourceType: 'document',

  // Email subscriptions / templates
  templateId: 'template-id-val',
  recipientType: 'admins',
  templateType: 'welcome',

  // Invites (usedby invites list — pre-projects rows before renderList)
  token: 'token-value-here-for-test',
  usesLeft: 5,
  workspaceRole: 'ADMIN',

  // Workspace members (columns use function accessors against these fields)
  user: { username: 'username-val', email: 'email@example.com' },

  // Scheduled tasks — uses snake_case field names (legacy API)
  task_type: 'cleanup_temp_files',
  schedule_type: 'interval',
  last_status: 'success',
  last_run_at: '2024-01-01T00:00:00Z',
  task_id: 'task-id-val',
  duration_ms: 150,
  error_message: 'none',
  retry_attempt: 1,
  executed_at: '2024-01-01T00:00:00Z',
  next_run_at: '2024-01-01T00:00:00Z',

  // Forms
  submissionsCount: 5,

  // Entry types — rendering/capabilities JSON (nullable in practice; set non-null here
  // so that column accessors that do `et.renderingJson?.renderer || ""` return a real value
  // and the drift detector can tell apart "correct field" from "wrong field name → undefined → ''".)
  renderingJson: { renderer: 'react', package: '@marvin/renderer' },
  capabilitiesJson: { publishable: true, routable: true },

  // Event type options (event-log types — not a list/log/logs command, not discovered)
  label: 'label-val',
  category: 'category-val',
}

// ---------------------------------------------------------------------------
// Mock — every platform client method returns [UNIVERSAL_FIXTURE].
// workspaces.getCurrent is special-cased because email-templates list calls it
// to get the workspace id before listing templates.
// ---------------------------------------------------------------------------

const STUB_WORKSPACE = { id: 'ws-stub', slug: 'stub', name: 'Stub Workspace' }

// Proxy: namespace access returns an inner Proxy whose every method call returns
// a resolved promise of [UNIVERSAL_FIXTURE]. workspaces is the one exception.
const mockPlatformClient: any = new Proxy(
  { workspaces: { getCurrent: () => Promise.resolve(STUB_WORKSPACE) } } as Record<string, unknown>,
  {
    get(target: Record<string, unknown>, namespace: string) {
      if (namespace in target) return target[namespace]
      return new Proxy(
        {} as Record<string, unknown>,
        { get: (_t, _method) => () => Promise.resolve([UNIVERSAL_FIXTURE]) }
      )
    },
  }
)

vi.mock('../shared/clients.js', () => ({
  clientFactory: {
    createPlatformClient: vi.fn(),
    createPublishClient: vi.fn().mockResolvedValue({}),
    resolveWorkspace: vi.fn().mockResolvedValue(undefined),
  },
  ClientFactory: class {},
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildProgram(): Command {
  const program = new Command('marvin')
    .exitOverride()
    .option('--api-url <url>', 'API URL')
    .option('--workspace <slug>', 'Workspace slug')
    .option('--output <format>', 'Output format', 'table')
    .option('--json', 'JSON output', false)
    .option('--yaml', 'YAML output', false)
    .option('--csv', 'CSV output', false)

  program.addCommand(createPlatformCommand())
  return program
}

// ---------------------------------------------------------------------------
// Command discovery — walk commander tree for list / log / logs subcommands
// ---------------------------------------------------------------------------

interface DiscoveredCommand {
  path: string[]
  requiredArgCount: number
}

function collectTargetCommands(cmd: Command, path: string[] = []): DiscoveredCommand[] {
  const results: DiscoveredCommand[] = []
  for (const sub of cmd.commands) {
    const subPath = [...path, sub.name()]
    const n = sub.name()
    if (n === 'list' || n === 'log' || n === 'logs') {
      const requiredArgCount = sub.registeredArguments.filter((a) => a.required).length
      results.push({ path: subPath, requiredArgCount })
    }
    results.push(...collectTargetCommands(sub, subPath))
  }
  return results
}

// Build one program at module load time purely for command tree discovery.
// No actions are executed here — commander just registers the tree structure.
const _discoverRoot = buildProgram()
const _platformCmd = _discoverRoot.commands.find((c) => c.name() === 'platform')!
const discoveredCommands = collectTargetCommands(_platformCmd, ['platform'])

// ---------------------------------------------------------------------------
// Dynamic tests — JSON, YAML, and table (drift detection) for every command
// ---------------------------------------------------------------------------

describe('output format tests (fully dynamic)', () => {
  const logs: string[] = []
  const tableData: unknown[] = []

  beforeEach(() => {
    logs.length = 0
    tableData.length = 0
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '))
    })
    vi.spyOn(console, 'table').mockImplementation((data: unknown) => {
      tableData.push(data)
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(clientFactory.createPlatformClient).mockResolvedValue(mockPlatformClient)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.exitCode = 0
  })

  for (const { path, requiredArgCount } of discoveredCommands) {
    const commandPath = path.join(' ')
    // Fill required positional args with placeholder values
    const positionalArgs = Array.from({ length: requiredArgCount }, () => 'test-id')

    describe(commandPath, () => {
      it('--json produces parseable JSON array', async () => {
        logs.length = 0
        await buildProgram().parseAsync(['node', 'marvin', ...path, ...positionalArgs, '--json'])
        const output = logs.join('\n')
        let parsed: unknown
        try {
          parsed = JSON.parse(output)
        } catch {
          throw new Error(`Expected valid JSON from "${commandPath}" but got:\n${output}`)
        }
        expect(Array.isArray(parsed), `"${commandPath}" --json should output an array`).toBe(true)
      })

      it('--yaml produces key: value output', async () => {
        logs.length = 0
        await buildProgram().parseAsync(['node', 'marvin', ...path, ...positionalArgs, '--yaml'])
        const output = logs.join('\n')
        expect(output, `"${commandPath}" --yaml should contain a key: value line`).toMatch(/\w+: .+/)
      })

      it('table mode: no column is empty (drift detection)', async () => {
        tableData.length = 0
        logs.length = 0
        await buildProgram().parseAsync(['node', 'marvin', ...path, ...positionalArgs])

        // If no console.table call occurred the command may have taken an early
        // non-error path (e.g., printed plain text). Verify at least no exit error.
        if (tableData.length === 0) {
          expect(
            process.exitCode ?? 0,
            `"${commandPath}" table mode exited with error (check console.error output)`
          ).toBe(0)
          return
        }

        const rows = tableData[0] as Record<string, unknown>[]
        if (!Array.isArray(rows) || rows.length === 0) return

        const emptyColumns = Object.entries(rows[0])
          .filter(([, v]) => v === undefined || v === null || v === '')
          .map(([k]) => k)

        expect(
          emptyColumns,
          `"${commandPath}" table output has empty columns — column spec likely references wrong field name(s)`
        ).toEqual([])
      })
    })
  }
})
