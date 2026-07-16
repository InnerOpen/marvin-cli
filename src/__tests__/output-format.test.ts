/**
 * Output format tests for Marvin CLI platform commands.
 *
 * For every list command, verifies:
 *   - --json produces parseable JSON matching the SDK response
 *   - --yaml produces valid YAML containing expected fields
 *   - default (table) mode calls console.table without error
 *   - --json with empty results outputs [] not human-readable text
 *
 * Tests are written against correct behavior. Broken commands will fail here,
 * exposing the bug so it can be fixed.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { createPlatformCommand } from '../commands/platform/index.js'
import { clientFactory } from '../shared/clients.js'

// ---------------------------------------------------------------------------
// Mock clientFactory — hoisted so it's available before any imports resolve
// ---------------------------------------------------------------------------

const mockClient = vi.hoisted(() => ({
  secrets: { list: vi.fn() },
  variables: { list: vi.fn() },
  webhooks: { list: vi.fn() },
  emailEventSubscriptions: { list: vi.fn() },
  entryTypes: { list: vi.fn() },
  entries: { list: vi.fn() },
  collections: { list: vi.fn() },
  apiClients: { list: vi.fn() },
  assets: { list: vi.fn() },
  resources: { list: vi.fn() },
  notifications: { list: vi.fn() },
  forms: { list: vi.fn() },
  scheduledTasks: { list: vi.fn(), log: vi.fn() },
  eventLog: { list: vi.fn() },
  invites: { list: vi.fn() },
  workspaces: { getCurrent: vi.fn() },
  emailTemplates: { list: vi.fn() },
  workspaceMembers: { list: vi.fn() },
}))

vi.mock('../shared/clients.js', () => ({
  clientFactory: {
    createPlatformClient: vi.fn().mockResolvedValue(mockClient),
    resolveWorkspace: vi.fn().mockResolvedValue(undefined),
  },
  ClientFactory: class {},
}))

// ---------------------------------------------------------------------------
// Fixtures — shape matches what the real API returns
// ---------------------------------------------------------------------------

const WORKSPACE = { id: 'ws1', name: 'My Workspace', slug: 'my-workspace' }

const FIXTURES = {
  secrets: [{ id: 'abc', name: 'My Secret', slug: 'MY_SECRET', description: null }],
  variables: [{ id: 'def', name: 'My Var', slug: 'MY_VAR', value: 'hello', description: null }],
  webhooks: [{ id: 'ghi', name: 'Test Webhook', url: 'https://example.com', enabled: true, method: 'POST' }],
  emailSubscriptions: [
    { id: 'jkl', templateId: 'tid', eventType: 'invitation_created', recipientType: 'admins', enabled: true },
  ],
  entryTypes: [
    { id: 'mno', name: 'Blog Post', slug: 'blog-post', isSystem: false, renderingJson: null, capabilitiesJson: null },
  ],
  entries: [
    { id: 'pqr', title: 'My Entry', slug: 'my-entry', entryType: 'blog-post', status: 'published', publishedAt: null },
  ],
  collections: [{ id: 'stu', name: 'My Collection', slug: 'my-collection', description: null }],
  apiClients: [{ id: 'api1', name: 'Test Client', description: 'A test API client', createdAt: '2024-01-01T00:00:00Z' }],
  assets: [{ id: 'ast1', name: 'hero.jpg', slug: 'hero', mimeType: 'image/jpeg', width: 1920, height: 1080, altText: 'Hero image' }],
  resources: [{ id: 'res1', name: 'Test Resource', slug: 'test-resource', resourceType: 'document', description: null, url: null }],
  notifications: [{ id: 'not1', name: 'Entry Published', eventType: 'entry.published', enabled: true }],
  forms: [{ id: 'frm1', slug: 'contact', name: 'Contact Form', status: 'active', submissionsCount: 5, createdAt: '2024-01-01T00:00:00Z' }],
  scheduledTasks: [
    { id: 'tsk1', name: 'Daily Cleanup', task_type: 'cleanup_temp_files', schedule_type: 'interval', enabled: true, last_status: 'success', next_run_at: null },
  ],
  scheduledTaskLog: [
    { executed_at: '2024-01-01T00:00:00Z', task_id: 'tsk1', status: 'success', duration_ms: 150, error_message: null },
  ],
  eventLog: [
    { event_id: 'evt1', eventType: 'entry.published', occurred_at: '2024-01-01T00:00:00Z', user_id: 'usr1', entity_type: 'entry', message_title: 'Entry published' },
  ],
  invites: [
    { id: 'inv1', token: 'abcdef1234567890abcdef', workspaceRole: 'EDITOR', usesLeft: 5, createdAt: '2024-01-01T00:00:00Z' },
  ],
  emailTemplates: [
    { id: 'tpl1', name: 'Welcome Email', templateType: 'welcome', enabled: true, groupId: 'grp1' },
  ],
  workspaceMembers: [
    { userId: 'usr1', user: { username: 'john', email: 'john@example.com' }, workspaceRole: 'ADMIN', joinedAt: '2024-01-01T00:00:00Z' },
  ],
}

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

/** Capture console.log/table, return references to the captured arrays. */
function captureOutput() {
  const logs: string[] = []
  const tableCalls: unknown[] = []

  beforeEach(() => {
    logs.length = 0
    tableCalls.length = 0
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '))
    })
    vi.spyOn(console, 'table').mockImplementation((data: unknown) => {
      tableCalls.push(data)
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.exitCode = 0
  })

  return { logs, tableCalls }
}

/** Join captured log lines and parse as JSON. */
function parseJson(logs: string[]): unknown {
  return JSON.parse(logs.join('\n'))
}

// ---------------------------------------------------------------------------
// Tests — one describe block per list command
// ---------------------------------------------------------------------------

describe('platform secrets list', () => {
  const { logs, tableCalls } = captureOutput()
  beforeEach(() => { mockClient.secrets.list.mockResolvedValue(FIXTURES.secrets) })

  it('--json outputs valid JSON matching API response', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'secrets', 'list', '--json'])
    expect(parseJson(logs)).toEqual(FIXTURES.secrets)
  })

  it('--yaml outputs YAML with expected fields', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'secrets', 'list', '--yaml'])
    const out = logs.join('\n')
    expect(out).toContain('id: abc')
    expect(out).toContain('name: My Secret')
    expect(out).toContain('slug: MY_SECRET')
  })

  it('table mode calls console.table with projected rows', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'secrets', 'list'])
    expect(tableCalls).toHaveLength(1)
    expect((tableCalls[0] as any[])[0]).toMatchObject({ ID: 'abc', Name: 'My Secret', Slug: 'MY_SECRET' })
  })

  it('empty results with --json outputs []', async () => {
    mockClient.secrets.list.mockResolvedValue([])
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'secrets', 'list', '--json'])
    expect(parseJson(logs)).toEqual([])
  })
})

describe('platform variables list', () => {
  const { logs, tableCalls } = captureOutput()
  beforeEach(() => { mockClient.variables.list.mockResolvedValue(FIXTURES.variables) })

  it('--json outputs valid JSON matching API response', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'variables', 'list', '--json'])
    expect(parseJson(logs)).toEqual(FIXTURES.variables)
  })

  it('--yaml outputs YAML with expected fields', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'variables', 'list', '--yaml'])
    const out = logs.join('\n')
    expect(out).toContain('id: def')
    expect(out).toContain('name: My Var')
    expect(out).toContain('slug: MY_VAR')
    expect(out).toContain('value: hello')
  })

  it('table mode calls console.table with projected rows', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'variables', 'list'])
    expect(tableCalls).toHaveLength(1)
    expect((tableCalls[0] as any[])[0]).toMatchObject({ ID: 'def', Name: 'My Var', Slug: 'MY_VAR', Value: 'hello' })
  })

  it('empty results with --json outputs []', async () => {
    mockClient.variables.list.mockResolvedValue([])
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'variables', 'list', '--json'])
    expect(parseJson(logs)).toEqual([])
  })
})

describe('platform webhooks list', () => {
  const { logs, tableCalls } = captureOutput()
  beforeEach(() => { mockClient.webhooks.list.mockResolvedValue(FIXTURES.webhooks) })

  it('--json outputs valid JSON matching API response', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'webhooks', 'list', '--json'])
    expect(parseJson(logs)).toEqual(FIXTURES.webhooks)
  })

  it('--yaml outputs YAML with expected fields', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'webhooks', 'list', '--yaml'])
    const out = logs.join('\n')
    expect(out).toContain('id: ghi')
    expect(out).toContain('name: Test Webhook')
    expect(out).toContain('enabled: true')
  })

  it('table mode calls console.table with projected rows', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'webhooks', 'list'])
    expect(tableCalls).toHaveLength(1)
    expect((tableCalls[0] as any[])[0]).toMatchObject({ ID: 'ghi', Name: 'Test Webhook', Enabled: true })
  })

  it('empty results with --json outputs []', async () => {
    mockClient.webhooks.list.mockResolvedValue([])
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'webhooks', 'list', '--json'])
    expect(parseJson(logs)).toEqual([])
  })
})

describe('platform email-subscriptions list', () => {
  const { logs, tableCalls } = captureOutput()
  beforeEach(() => { mockClient.emailEventSubscriptions.list.mockResolvedValue(FIXTURES.emailSubscriptions) })

  it('--json outputs valid JSON matching API response', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'email-subscriptions', 'list', '--json'])
    expect(parseJson(logs)).toEqual(FIXTURES.emailSubscriptions)
  })

  it('--yaml outputs YAML with expected fields', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'email-subscriptions', 'list', '--yaml'])
    const out = logs.join('\n')
    expect(out).toContain('id: jkl')
    expect(out).toContain('eventType: invitation_created')
    expect(out).toContain('recipientType: admins')
  })

  it('table mode calls console.table with projected rows', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'email-subscriptions', 'list'])
    expect(tableCalls).toHaveLength(1)
    expect((tableCalls[0] as any[])[0]).toMatchObject({
      ID: 'jkl',
      'Event Type': 'invitation_created',
      'Recipient Type': 'admins',
    })
  })

  it('empty results with --json outputs []', async () => {
    mockClient.emailEventSubscriptions.list.mockResolvedValue([])
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'email-subscriptions', 'list', '--json'])
    expect(parseJson(logs)).toEqual([])
  })
})

describe('platform entry-types list', () => {
  const { logs, tableCalls } = captureOutput()
  beforeEach(() => { mockClient.entryTypes.list.mockResolvedValue(FIXTURES.entryTypes) })

  it('--json outputs valid JSON matching API response', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'entry-types', 'list', '--json'])
    expect(parseJson(logs)).toEqual(FIXTURES.entryTypes)
  })

  it('--yaml outputs YAML with expected fields', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'entry-types', 'list', '--yaml'])
    const out = logs.join('\n')
    expect(out).toContain('id: mno')
    expect(out).toContain('name: Blog Post')
    expect(out).toContain('slug: blog-post')
    expect(out).toContain('isSystem: false')
  })

  it('table mode calls console.table with projected rows', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'entry-types', 'list'])
    expect(tableCalls).toHaveLength(1)
    expect((tableCalls[0] as any[])[0]).toMatchObject({ ID: 'mno', Name: 'Blog Post', Slug: 'blog-post', System: false })
  })

  it('empty results with --json outputs []', async () => {
    mockClient.entryTypes.list.mockResolvedValue([])
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'entry-types', 'list', '--json'])
    expect(parseJson(logs)).toEqual([])
  })
})

describe('platform entries list', () => {
  const { logs, tableCalls } = captureOutput()
  beforeEach(() => { mockClient.entries.list.mockResolvedValue(FIXTURES.entries) })

  it('--json outputs valid JSON matching API response', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'entries', 'list', '--json'])
    expect(parseJson(logs)).toEqual(FIXTURES.entries)
  })

  it('--yaml outputs YAML with expected fields', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'entries', 'list', '--yaml'])
    const out = logs.join('\n')
    expect(out).toContain('id: pqr')
    expect(out).toContain('title: My Entry')
    expect(out).toContain('slug: my-entry')
    expect(out).toContain('status: published')
  })

  it('table mode calls console.table with projected rows', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'entries', 'list'])
    expect(tableCalls).toHaveLength(1)
    expect((tableCalls[0] as any[])[0]).toMatchObject({ ID: 'pqr', Title: 'My Entry', Status: 'published' })
  })

  it('empty results with --json outputs []', async () => {
    mockClient.entries.list.mockResolvedValue([])
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'entries', 'list', '--json'])
    expect(parseJson(logs)).toEqual([])
  })
})

describe('platform collections list', () => {
  const { logs, tableCalls } = captureOutput()
  beforeEach(() => { mockClient.collections.list.mockResolvedValue(FIXTURES.collections) })

  it('--json outputs valid JSON matching API response', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'collections', 'list', '--json'])
    expect(parseJson(logs)).toEqual(FIXTURES.collections)
  })

  it('--yaml outputs YAML with expected fields', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'collections', 'list', '--yaml'])
    const out = logs.join('\n')
    expect(out).toContain('id: stu')
    expect(out).toContain('name: My Collection')
    expect(out).toContain('slug: my-collection')
  })

  it('table mode calls console.table with projected rows', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'collections', 'list'])
    expect(tableCalls).toHaveLength(1)
    expect((tableCalls[0] as any[])[0]).toMatchObject({ ID: 'stu', Name: 'My Collection', Slug: 'my-collection' })
  })

  it('empty results with --json outputs []', async () => {
    mockClient.collections.list.mockResolvedValue([])
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'collections', 'list', '--json'])
    expect(parseJson(logs)).toEqual([])
  })
})

describe('platform api-clients list', () => {
  const { logs, tableCalls } = captureOutput()
  beforeEach(() => { mockClient.apiClients.list.mockResolvedValue(FIXTURES.apiClients) })

  it('--json outputs valid JSON matching API response', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'api-clients', 'list', '--json'])
    expect(parseJson(logs)).toEqual(FIXTURES.apiClients)
  })

  it('--yaml outputs YAML with expected fields', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'api-clients', 'list', '--yaml'])
    const out = logs.join('\n')
    expect(out).toContain('id: api1')
    expect(out).toContain('name: Test Client')
  })

  it('table mode calls console.table with projected rows', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'api-clients', 'list'])
    expect(tableCalls).toHaveLength(1)
    expect((tableCalls[0] as any[])[0]).toMatchObject({ ID: 'api1', Name: 'Test Client' })
  })

  it('empty results with --json outputs []', async () => {
    mockClient.apiClients.list.mockResolvedValue([])
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'api-clients', 'list', '--json'])
    expect(parseJson(logs)).toEqual([])
  })
})

describe('platform assets list', () => {
  const { logs, tableCalls } = captureOutput()
  beforeEach(() => { mockClient.assets.list.mockResolvedValue(FIXTURES.assets) })

  it('--json outputs valid JSON matching API response', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'assets', 'list', '--json'])
    expect(parseJson(logs)).toEqual(FIXTURES.assets)
  })

  it('--yaml outputs YAML with expected fields', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'assets', 'list', '--yaml'])
    const out = logs.join('\n')
    expect(out).toContain('id: ast1')
    expect(out).toContain('slug: hero')
    expect(out).toContain('mimeType: image/jpeg')
  })

  it('table mode calls console.table with projected rows', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'assets', 'list'])
    expect(tableCalls).toHaveLength(1)
    expect((tableCalls[0] as any[])[0]).toMatchObject({ ID: 'ast1', Name: 'hero.jpg', Slug: 'hero', Type: 'image/jpeg' })
  })

  it('empty results with --json outputs []', async () => {
    mockClient.assets.list.mockResolvedValue([])
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'assets', 'list', '--json'])
    expect(parseJson(logs)).toEqual([])
  })
})

describe('platform resources list', () => {
  const { logs, tableCalls } = captureOutput()
  beforeEach(() => { mockClient.resources.list.mockResolvedValue(FIXTURES.resources) })

  it('--json outputs valid JSON matching API response', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'resources', 'list', '--json'])
    expect(parseJson(logs)).toEqual(FIXTURES.resources)
  })

  it('--yaml outputs YAML with expected fields', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'resources', 'list', '--yaml'])
    const out = logs.join('\n')
    expect(out).toContain('id: res1')
    expect(out).toContain('name: Test Resource')
    expect(out).toContain('slug: test-resource')
  })

  it('table mode calls console.table with projected rows', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'resources', 'list'])
    expect(tableCalls).toHaveLength(1)
    expect((tableCalls[0] as any[])[0]).toMatchObject({ ID: 'res1', Name: 'Test Resource', Slug: 'test-resource' })
  })

  it('empty results with --json outputs []', async () => {
    mockClient.resources.list.mockResolvedValue([])
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'resources', 'list', '--json'])
    expect(parseJson(logs)).toEqual([])
  })
})

describe('platform notifications list', () => {
  const { logs, tableCalls } = captureOutput()
  beforeEach(() => { mockClient.notifications.list.mockResolvedValue(FIXTURES.notifications) })

  it('--json outputs valid JSON matching API response', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'notifications', 'list', '--json'])
    expect(parseJson(logs)).toEqual(FIXTURES.notifications)
  })

  it('--yaml outputs YAML with expected fields', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'notifications', 'list', '--yaml'])
    const out = logs.join('\n')
    expect(out).toContain('id: not1')
    expect(out).toContain('name: Entry Published')
    expect(out).toContain('eventType: entry.published')
  })

  it('table mode calls console.table with projected rows', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'notifications', 'list'])
    expect(tableCalls).toHaveLength(1)
    // columns are lowercase: id, name, eventType, enabled
    expect((tableCalls[0] as any[])[0]).toMatchObject({ id: 'not1', name: 'Entry Published', eventType: 'entry.published' })
  })

  it('empty results with --json outputs []', async () => {
    mockClient.notifications.list.mockResolvedValue([])
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'notifications', 'list', '--json'])
    expect(parseJson(logs)).toEqual([])
  })
})

describe('platform forms list', () => {
  const { logs, tableCalls } = captureOutput()
  beforeEach(() => { mockClient.forms.list.mockResolvedValue(FIXTURES.forms) })

  it('--json outputs valid JSON matching API response', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'forms', 'list', '--json'])
    expect(parseJson(logs)).toEqual(FIXTURES.forms)
  })

  it('--yaml outputs YAML with expected fields', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'forms', 'list', '--yaml'])
    const out = logs.join('\n')
    expect(out).toContain('id: frm1')
    expect(out).toContain('slug: contact')
    expect(out).toContain('name: Contact Form')
  })

  it('table mode calls console.table with projected rows', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'forms', 'list'])
    expect(tableCalls).toHaveLength(1)
    expect((tableCalls[0] as any[])[0]).toMatchObject({ ID: 'frm1', Slug: 'contact', Name: 'Contact Form' })
  })

  it('empty results with --json outputs []', async () => {
    mockClient.forms.list.mockResolvedValue([])
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'forms', 'list', '--json'])
    expect(parseJson(logs)).toEqual([])
  })
})

describe('platform scheduled-tasks list', () => {
  const { logs, tableCalls } = captureOutput()
  beforeEach(() => { mockClient.scheduledTasks.list.mockResolvedValue(FIXTURES.scheduledTasks) })

  it('--json outputs valid JSON matching API response', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'scheduled-tasks', 'list', '--json'])
    expect(parseJson(logs)).toEqual(FIXTURES.scheduledTasks)
  })

  it('--yaml outputs YAML with expected fields', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'scheduled-tasks', 'list', '--yaml'])
    const out = logs.join('\n')
    expect(out).toContain('id: tsk1')
    expect(out).toContain('name: Daily Cleanup')
    expect(out).toContain('enabled: true')
  })

  it('table mode calls console.table with projected rows', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'scheduled-tasks', 'list'])
    expect(tableCalls).toHaveLength(1)
    expect((tableCalls[0] as any[])[0]).toMatchObject({ id: 'tsk1', name: 'Daily Cleanup', enabled: true })
  })

  it('empty results with --json outputs []', async () => {
    mockClient.scheduledTasks.list.mockResolvedValue([])
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'scheduled-tasks', 'list', '--json'])
    expect(parseJson(logs)).toEqual([])
  })
})

describe('platform scheduled-tasks log', () => {
  const { logs, tableCalls } = captureOutput()
  beforeEach(() => { mockClient.scheduledTasks.log.mockResolvedValue(FIXTURES.scheduledTaskLog) })

  it('--json outputs valid JSON matching API response', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'scheduled-tasks', 'log', '--json'])
    expect(parseJson(logs)).toEqual(FIXTURES.scheduledTaskLog)
  })

  it('--yaml outputs YAML with expected fields', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'scheduled-tasks', 'log', '--yaml'])
    const out = logs.join('\n')
    expect(out).toContain('task_id: tsk1')
    expect(out).toContain('status: success')
  })

  it('table mode calls console.table with projected rows', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'scheduled-tasks', 'log'])
    expect(tableCalls).toHaveLength(1)
    expect((tableCalls[0] as any[])[0]).toMatchObject({ task_id: 'tsk1', status: 'success' })
  })

  // This test exposes the bug: early-return for empty results ignores --json
  it('empty results with --json outputs [] not human text', async () => {
    mockClient.scheduledTasks.log.mockResolvedValue([])
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'scheduled-tasks', 'log', '--json'])
    expect(parseJson(logs)).toEqual([])
  })
})

describe('platform event-log list', () => {
  const { logs, tableCalls } = captureOutput()
  beforeEach(() => { mockClient.eventLog.list.mockResolvedValue(FIXTURES.eventLog) })

  it('--json outputs valid JSON matching API response', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'event-log', 'list', '--json'])
    expect(parseJson(logs)).toEqual(FIXTURES.eventLog)
  })

  it('--yaml outputs YAML with expected fields', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'event-log', 'list', '--yaml'])
    const out = logs.join('\n')
    expect(out).toContain('event_id: evt1')
    expect(out).toContain('eventType: entry.published')
    expect(out).toContain('entity_type: entry')
  })

  it('table mode calls console.table with projected rows', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'event-log', 'list'])
    expect(tableCalls).toHaveLength(1)
    expect((tableCalls[0] as any[])[0]).toMatchObject({ event_id: 'evt1', Event: 'entry.published' })
  })

  it('empty results with --json outputs []', async () => {
    mockClient.eventLog.list.mockResolvedValue([])
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'event-log', 'list', '--json'])
    expect(parseJson(logs)).toEqual([])
  })
})

describe('platform invites list', () => {
  const { logs, tableCalls } = captureOutput()
  beforeEach(() => { mockClient.invites.list.mockResolvedValue(FIXTURES.invites) })

  // invites list maps tokens to projected rows before rendering.
  // --json should output only the JSON (no trailing "Total: N" text).
  it('--json outputs valid JSON array', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'invites', 'list', '--json'])
    const parsed = parseJson(logs) as any[]
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed[0]).toMatchObject({ Role: 'EDITOR', 'Uses Left': 5 })
  })

  it('--yaml outputs YAML with expected fields', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'invites', 'list', '--yaml'])
    const out = logs.join('\n')
    expect(out).toContain('Role: EDITOR')
    expect(out).toContain('Uses Left: 5')
  })

  it('table mode calls console.table with projected rows', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'invites', 'list'])
    expect(tableCalls).toHaveLength(1)
    expect((tableCalls[0] as any[])[0]).toMatchObject({ Role: 'EDITOR', 'Uses Left': 5 })
  })

  // This test exposes two bugs: early-return for empty results, and trailing "Total:" log in JSON mode
  it('empty results with --json outputs []', async () => {
    mockClient.invites.list.mockResolvedValue([])
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'invites', 'list', '--json'])
    expect(parseJson(logs)).toEqual([])
  })
})

describe('platform email-templates list', () => {
  const { logs, tableCalls } = captureOutput()

  beforeEach(() => {
    mockClient.workspaces.getCurrent.mockResolvedValue(WORKSPACE)
    mockClient.emailTemplates.list.mockResolvedValue(FIXTURES.emailTemplates)
  })

  it('--json outputs valid JSON matching API response', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'email-templates', 'list', '--json'])
    expect(parseJson(logs)).toEqual(FIXTURES.emailTemplates)
  })

  it('--yaml outputs YAML with expected fields', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'email-templates', 'list', '--yaml'])
    const out = logs.join('\n')
    expect(out).toContain('id: tpl1')
    expect(out).toContain('name: Welcome Email')
    expect(out).toContain('templateType: welcome')
  })

  it('table mode calls console.table with projected rows', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'email-templates', 'list'])
    expect(tableCalls).toHaveLength(1)
    expect((tableCalls[0] as any[])[0]).toMatchObject({ Name: 'Welcome Email', Type: 'welcome' })
  })

  it('empty results with --json outputs []', async () => {
    mockClient.emailTemplates.list.mockResolvedValue([])
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'email-templates', 'list', '--json'])
    expect(parseJson(logs)).toEqual([])
  })
})

describe('platform workspace-members list', () => {
  const { logs, tableCalls } = captureOutput()
  beforeEach(() => { mockClient.workspaceMembers.list.mockResolvedValue(FIXTURES.workspaceMembers) })

  it('--json outputs valid JSON matching API response', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'workspace-members', 'list', 'ws1', '--json'])
    expect(parseJson(logs)).toEqual(FIXTURES.workspaceMembers)
  })

  it('--yaml outputs YAML with expected fields', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'workspace-members', 'list', 'ws1', '--yaml'])
    const out = logs.join('\n')
    expect(out).toContain('userId: usr1')
    expect(out).toContain('workspaceRole: ADMIN')
  })

  it('table mode calls console.table with projected rows', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'workspace-members', 'list', 'ws1'])
    expect(tableCalls).toHaveLength(1)
    expect((tableCalls[0] as any[])[0]).toMatchObject({ 'User ID': 'usr1', Role: 'ADMIN' })
  })

  it('empty results with --json outputs []', async () => {
    mockClient.workspaceMembers.list.mockResolvedValue([])
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'workspace-members', 'list', 'ws1', '--json'])
    expect(parseJson(logs)).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Auto-discovery: traverse the platform command tree at test-load time and
// generate one JSON-format test per `list` subcommand.
//
// This means adding a new command without --json support will automatically
// fail here — no manual test entry required.
// ---------------------------------------------------------------------------

/**
 * Recursively walk a Commander command tree and collect every subcommand
 * whose name is "list", together with how many required positional args it needs.
 */
function collectListCommands(
  cmd: Command,
  path: string[] = []
): Array<{ path: string[]; requiredArgCount: number }> {
  const results: Array<{ path: string[]; requiredArgCount: number }> = []
  for (const sub of cmd.commands) {
    const subPath = [...path, sub.name()]
    if (sub.name() === 'list') {
      const requiredArgCount = sub.registeredArguments.filter((a) => a.required).length
      results.push({ path: subPath, requiredArgCount })
    }
    results.push(...collectListCommands(sub, subPath))
  }
  return results
}

// Build one program at module-load time purely for command discovery.
// We never run actions from this instance.
const _discoverRoot = buildProgram()
const _platformCmd = _discoverRoot.commands.find((c) => c.name() === 'platform')!
const discoveredListCommands = collectListCommands(_platformCmd, ['platform'])

/**
 * Universal proxy client: every namespace method returns [] (an empty array),
 * which is valid input for renderList in any output mode.
 * workspaces.getCurrent is special-cased because some commands (e.g., email-templates)
 * call getCurrent() and need a usable workspace object back.
 */
const STUB_WORKSPACE = { id: 'ws-auto', slug: 'auto', name: 'Auto Workspace' }
const _proxyClient: any = new Proxy(
  { workspaces: { getCurrent: vi.fn().mockResolvedValue(STUB_WORKSPACE) } },
  {
    get(target: any, namespace: string) {
      if (namespace in target) return target[namespace]
      return new Proxy({}, { get: (_t, _method) => vi.fn().mockResolvedValue([]) })
    },
  }
)

describe('auto-discovery: all platform list commands produce valid JSON with --json', () => {
  const logs: string[] = []

  beforeEach(() => {
    logs.length = 0
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '))
    })
    vi.spyOn(console, 'table').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    // Override clientFactory to return the universal proxy for this suite
    vi.mocked(clientFactory.createPlatformClient).mockResolvedValue(_proxyClient)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // Restore the per-command mockClient for the explicit test suites
    vi.mocked(clientFactory.createPlatformClient).mockResolvedValue(mockClient)
    process.exitCode = 0
  })

  for (const { path, requiredArgCount } of discoveredListCommands) {
    // Fill required positional args with a placeholder value
    const positionalArgs = Array.from({ length: requiredArgCount }, () => 'auto-id')
    const parseArgs = ['node', 'marvin', ...path, ...positionalArgs, '--json']

    it(`${path.join(' ')} --json outputs valid JSON`, async () => {
      await buildProgram().parseAsync(parseArgs)
      const output = logs.join('\n')
      let parsed: unknown
      try {
        parsed = JSON.parse(output)
      } catch {
        throw new Error(
          `Expected valid JSON from "${parseArgs.slice(2).join(' ')}" but got:\n${output}`
        )
      }
      expect(Array.isArray(parsed)).toBe(true)
    })
  }
})
