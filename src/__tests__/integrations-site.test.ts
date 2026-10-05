/**
 * `marvin platform integrations` and `marvin platform site` against a mocked SDK (4.1 methods).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { createPlatformCommand } from '../commands/platform/index.js'
import { createAdminCommand } from '../commands/admin/index.js'
import { errorPolicyRows } from '../commands/platform/integrations.js'
import { clientFactory } from '../shared/clients.js'
import { resetCommandContext, trackCommandContext } from '../shared/command-context.js'
import { captureOutput, type Captured } from './helpers/capture.js'

vi.mock('../shared/clients.js', () => ({
  clientFactory: { createPlatformClient: vi.fn() },
  ClientFactory: class {},
}))

function buildProgram(): Command {
  const program = new Command('marvin')
    .exitOverride()
    .option('--output <format>', 'Output format', 'table')
    .option('--json', 'JSON output', false)
    .option('--yaml', 'YAML output', false)
    .option('--csv', 'CSV output', false)
  trackCommandContext(program)
  program.addCommand(createPlatformCommand())
  program.addCommand(createAdminCommand())
  return program
}

const run = (...args: string[]) => buildProgram().parseAsync(['node', 'marvin', ...args])

const SLACK = {
  id: 'int-1', provider: 'slack', name: 'Team Slack', slug: 'team-slack', enabled: true, config: {},
  hasCredential: true, status: 'ok', lastCheckedAt: null, lastError: null,
  attention: [{ id: 'al-1', code: 'rate_limited', count: 3 }],
  errorOverrides: { rate_limited: { review: false } },
}
const N8N = { ...SLACK, id: 'int-2', provider: 'n8n', name: 'n8n', slug: 'n8n', attention: [], errorOverrides: undefined }

const SLACK_PROVIDER = {
  slug: 'slack', name: 'Slack', description: '', category: 'notify', icon: '💬', hasLogo: true,
  configSchema: {}, credentials: [], emits: [], actions: [{ key: 'post_message', label: 'Post', description: '', inputSchema: {} }],
  errorPolicy: {
    provider: {
      rate_limited: { review: true, notify: false, summary: 'retry 3× (1m, 5m, 30m), then send to review' },
      auth_failed: { review: false, notify: true, summary: 'notify admins' },
    },
    actions: { post_message: { channel_not_found: { review: true, notify: true, summary: 'notify admins, send to review' } } },
  },
}

describe('errorPolicyRows', () => {
  it('applies a code override, then the * override, then the provider default', () => {
    const rows = errorPolicyRows(SLACK_PROVIDER as any, { rate_limited: { review: false }, '*': { notify: false } })
    expect(rows).toEqual([
      { scope: 'provider', code: 'rate_limited', default: 'retry 3× (1m, 5m, 30m), then send to review', review: false, alert: false, override: 'review off, alert off' },
      { scope: 'provider', code: 'auth_failed', default: 'notify admins', review: false, alert: false, override: 'alert off (via *)' },
      { scope: 'action post_message', code: 'channel_not_found', default: 'notify admins, send to review', review: true, alert: false, override: 'alert off (via *)' },
      { scope: 'override', code: '*', default: '', review: false, alert: false, override: 'alert off' },
    ])
  })

  it('is empty for a provider without a published policy', () => {
    expect(errorPolicyRows(undefined, undefined)).toEqual([])
  })
})

describe('platform integrations', () => {
  let io: Captured
  let integrations: any

  beforeEach(() => {
    resetCommandContext()
    io = captureOutput()
    integrations = {
      list: vi.fn().mockResolvedValue([SLACK, N8N]),
      listProviders: vi.fn().mockResolvedValue([SLACK_PROVIDER]),
      providerLogoUrl: vi.fn((slug: string) => `http://api.test/api/groups/integrations/providers/${slug}/logo`),
      listPlugins: vi.fn().mockResolvedValue([{ name: 'marvin-integration-slack', source: 'entry_point', ok: true, slugs: ['slack'], distribution: 'x', version: '1.0.0', error: null }]),
      create: vi.fn().mockImplementation((body) => Promise.resolve({ ...SLACK, ...body })),
      update: vi.fn().mockImplementation((_id, body) => Promise.resolve({ ...SLACK, ...body })),
      delete: vi.fn().mockResolvedValue(undefined),
      check: vi.fn().mockResolvedValue({ status: 'ok', lastError: null, lastCheckedAt: '2026-10-05T00:00:00Z' }),
      runAction: vi.fn().mockResolvedValue({ ok: true, result: { ts: '1' } }),
      listOptions: vi.fn().mockResolvedValue([{ value: 'C1', label: '#general' }]),
      resolveAttention: vi.fn().mockResolvedValue({ resolved: 1 }),
      setErrorOverrides: vi.fn().mockImplementation((_id, overrides) => Promise.resolve({ ...SLACK, errorOverrides: overrides })),
      getAlertRouting: vi.fn().mockResolvedValue({ emailAdmins: true, targets: [], reminderHours: 24 }),
      setAlertRouting: vi.fn().mockImplementation((body) => Promise.resolve({ emailAdmins: true, targets: [], reminderHours: 24, ...body })),
      listSubscriptions: vi.fn().mockResolvedValue([]),
      createSubscription: vi.fn().mockImplementation((body) => Promise.resolve({ id: 'sub-1', integrationName: 'Team Slack', ...body })),
      updateSubscription: vi.fn().mockImplementation((id, body) => Promise.resolve({ id, ...body })),
      deleteSubscription: vi.fn().mockResolvedValue(undefined),
    }
    vi.mocked(clientFactory.createPlatformClient).mockResolvedValue({ integrations } as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.exitCode = 0
  })

  it('lists integrations and flags the ones that need attention', async () => {
    await run('platform', 'integrations', 'list')
    expect(io.tables[0]).toEqual([
      expect.objectContaining({ Slug: 'team-slack', Attention: '⚠ 3 (rate_limited)' }),
      expect.objectContaining({ Slug: 'n8n', Attention: '' }),
    ])
    expect(io.err()).toContain('1 need attention')
  })

  it('--needs-attention keeps only those', async () => {
    await run('platform', 'integrations', 'list', '--needs-attention', '--json')
    expect(JSON.parse(io.out()).map((i: { slug: string }) => i.slug)).toEqual(['team-slack'])
  })

  it('gets one by slug', async () => {
    await run('platform', 'integrations', 'get', 'team-slack', '--json')
    expect(JSON.parse(io.out())).toMatchObject({ id: 'int-1' })
  })

  it('adds the logo URL to providers that ship one', async () => {
    await run('platform', 'integrations', 'providers', '--json')
    expect(JSON.parse(io.out())[0]).toMatchObject({ slug: 'slack', logoUrl: 'http://api.test/api/groups/integrations/providers/slack/logo' })
  })

  it('shows the error policy table with this connection’s overrides', async () => {
    await run('platform', 'integrations', 'errors', 'team-slack')
    expect(io.tables[0]).toEqual([
      expect.objectContaining({ Code: 'rate_limited', Review: 'no', Alert: 'no', Override: 'review off' }),
      expect.objectContaining({ Code: 'auth_failed', Review: 'no', Alert: 'yes', Override: '' }),
      expect.objectContaining({ Scope: 'action post_message', Code: 'channel_not_found' }),
    ])
  })

  it('errors set merges into the existing overrides; --alert maps to notify', async () => {
    await run('platform', 'integrations', 'errors', 'set', 'team-slack', 'auth_failed', '--no-alert', '--review', '--json')
    expect(integrations.setErrorOverrides).toHaveBeenCalledWith('int-1', {
      rate_limited: { review: false },
      auth_failed: { review: true, notify: false },
    })
    expect(JSON.parse(io.out())).toHaveProperty('auth_failed')
  })

  it('errors set needs a flag', async () => {
    await run('platform', 'integrations', 'errors', 'set', 'team-slack', 'auth_failed')
    expect(process.exitCode).toBe(1)
    expect(integrations.setErrorOverrides).not.toHaveBeenCalled()
  })

  it('errors reset drops one code, or everything', async () => {
    await run('platform', 'integrations', 'errors', 'reset', 'team-slack', 'rate_limited', '--json')
    expect(integrations.setErrorOverrides).toHaveBeenLastCalledWith('int-1', {})

    resetCommandContext()
    await run('platform', 'integrations', 'errors', 'reset', 'team-slack', '--json')
    expect(integrations.setErrorOverrides).toHaveBeenLastCalledWith('int-1', {})

    resetCommandContext()
    await run('platform', 'integrations', 'errors', 'reset', 'team-slack', 'nope')
    expect(process.exitCode).toBe(1)
  })

  it('resolves one alert or all', async () => {
    await run('platform', 'integrations', 'resolve', 'team-slack', '--alert-id', 'al-1', '--json')
    expect(integrations.resolveAttention).toHaveBeenCalledWith('int-1', 'al-1')
    expect(JSON.parse(io.out())).toEqual({ ok: true, resolved: 1 })
  })

  it('check exits 1 when the connection is not ok', async () => {
    integrations.check.mockResolvedValue({ status: 'error', lastError: 'bad token', lastCheckedAt: null })
    await run('platform', 'integrations', 'check', 'team-slack', '--json')
    expect(JSON.parse(io.out())).toMatchObject({ ok: false, status: 'error' })
    expect(process.exitCode).toBe(1)
  })

  it('runs an action with --data', async () => {
    await run('platform', 'integrations', 'run', 'team-slack', 'post_message', '--data', '{"channel":"C1","text":"hi"}', '--json')
    expect(integrations.runAction).toHaveBeenCalledWith('int-1', 'post_message', { channel: 'C1', text: 'hi' })
    expect(JSON.parse(io.out())).toEqual({ ok: true, result: { ts: '1' } })
  })

  it('lists an input’s options', async () => {
    await run('platform', 'integrations', 'options', 'team-slack', 'post_message', 'channel', '--json')
    expect(integrations.listOptions).toHaveBeenCalledWith('int-1', 'post_message', 'channel')
    expect(JSON.parse(io.out())).toEqual([{ value: 'C1', label: '#general' }])
  })

  it('shows and sets alert routing', async () => {
    await run('platform', 'integrations', 'alert-routing')
    expect(io.out()).toContain('Email admins:   yes')

    resetCommandContext()
    await run('platform', 'integrations', 'alert-routing', 'set', '--no-email-admins', '--targets', 'int-1, int-2', '--json')
    expect(integrations.setAlertRouting).toHaveBeenCalledWith({ emailAdmins: false, integrationIds: ['int-1', 'int-2'] })
  })

  it('creates a subscription from flags, resolving the integration slug', async () => {
    await run('platform', 'integrations', 'subscriptions', 'create', '--integration', 'team-slack', '--event', 'entry_published',
      '--action', 'post_message', '--args', '{"text":"{{entry.title}}"}', '--json')
    expect(integrations.createSubscription).toHaveBeenCalledWith({
      integrationId: 'int-1', eventType: 'entry_published', action: 'post_message', args: { text: '{{entry.title}}' },
    })
  })

  it('disables a subscription', async () => {
    await run('platform', 'integrations', 'subs', 'update', 'sub-1', '--disable', '--json')
    expect(integrations.updateSubscription).toHaveBeenCalledWith('sub-1', { enabled: false })
  })

  it('reads a credential from stdin on create', async () => {
    const { Readable } = await import('stream')
    const fake = Readable.from(['xoxb-secret\n']) as any
    fake.isTTY = false
    const stdin = Object.getOwnPropertyDescriptor(process, 'stdin')!
    Object.defineProperty(process, 'stdin', { value: fake, configurable: true })
    try {
      await run('platform', 'integrations', 'create', '--data', '{"provider":"slack","name":"Team Slack"}', '--credential-stdin', '--json')
      expect(integrations.create).toHaveBeenCalledWith({ provider: 'slack', name: 'Team Slack', credential: 'xoxb-secret' })
    } finally {
      Object.defineProperty(process, 'stdin', stdin)
    }
  })

  it('deletes by slug and prints the id', async () => {
    await run('platform', 'integrations', 'delete', 'team-slack', '--yes', '--json')
    expect(integrations.delete).toHaveBeenCalledWith('int-1')
    expect(JSON.parse(io.out())).toEqual({ deleted: 'int-1' })
  })
})

describe('platform site', () => {
  let io: Captured
  let site: any

  beforeEach(() => {
    resetCommandContext()
    io = captureOutput()
    site = {
      requestRebuild: vi.fn().mockResolvedValue({
        requested: true, queuedAt: '2026-10-05T10:00:00Z', lastRequestedAt: '2026-10-05T10:00:05Z',
        expectedSendAt: '2026-10-05T10:01:05Z', requestCount: 2, reason: 'CLI deploy',
        targets: [{ kind: 'integration', id: 'int-3', name: 'Pages', provider: 'cloudflare_pages', action: 'deploy' }],
      }),
      rebuildStatus: vi.fn().mockResolvedValue({
        configured: true, targets: [{ kind: 'webhook', id: 'wh-1', name: 'Deploy hook' }], quietSeconds: 60, maxWaitSeconds: 600,
        pending: null, lastSent: { eventId: 'e1', sentAt: '2026-10-05T09:00:00Z', message: 'Rebuild requested' },
        lastBuild: { eventId: 'e2', eventType: 'site_build_completed', stage: 'deployment', status: 'completed', occurredAt: '2026-10-05T09:02:00Z', message: 'Deployed' },
      }),
    }
    vi.mocked(clientFactory.createPlatformClient).mockResolvedValue({ site } as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.exitCode = 0
  })

  it('queues a rebuild with a reason and prints {"ok": true, …}', async () => {
    await run('platform', 'site', 'rebuild', '--reason', 'CLI deploy', '--json')
    expect(site.requestRebuild).toHaveBeenCalledWith('CLI deploy')
    expect(JSON.parse(io.out())).toMatchObject({ ok: true, requested: true, requestCount: 2 })
  })

  it('says what it joined and what builds the site', async () => {
    await run('platform', 'site', 'rebuild')
    expect(site.requestRebuild).toHaveBeenCalledWith(undefined)
    expect(io.out()).toBe('')
    expect(io.err()).toContain('joins 1 earlier request(s)')
    expect(io.err()).toContain('Pages (integration: cloudflare_pages → deploy)')
  })

  it('rejects an over-long reason before calling the API', async () => {
    await run('platform', 'site', 'rebuild', '--reason', 'x'.repeat(201))
    expect(process.exitCode).toBe(1)
    expect(site.requestRebuild).not.toHaveBeenCalled()
  })

  it('shows the rebuild status', async () => {
    await run('platform', 'site', 'rebuild-status')
    const out = io.out()
    expect(out).toContain('Builds via:  Deploy hook (webhook)')
    expect(out).toContain('Pending:     none')
    expect(out).toContain('Last build:  deployment completed')
  })
})

describe('workflow samples and admin plugins', () => {
  let io: Captured

  beforeEach(() => {
    resetCommandContext()
    io = captureOutput()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.exitCode = 0
  })

  it('lists dry-run samples', async () => {
    const samples = vi.fn().mockResolvedValue({ event_type: 'entry_published', samples: [{ kind: 'event', id: 'ev1', label: 'Hello', conditions_pass: true }] })
    vi.mocked(clientFactory.createPlatformClient).mockResolvedValue({ automations: { samples } } as any)
    await run('platform', 'workflows', 'samples', '11111111-2222-4333-8444-555555555555', '--limit', '3')
    expect(samples).toHaveBeenCalledWith('11111111-2222-4333-8444-555555555555', 3)
    expect(io.tables[0]).toEqual([expect.objectContaining({ Kind: 'event', ID: 'ev1', Conditions: 'pass' })])
  })

  it('lists installed plugins', async () => {
    const listPlugins = vi.fn().mockResolvedValue([{ name: 'slack', kind: 'integration', ok: true, version: '1.0', providers: [{ slug: 'slack', workspaces: 2 }] }])
    vi.mocked(clientFactory.createPlatformClient).mockResolvedValue({ adminSystem: { listPlugins } } as any)
    await run('admin', 'system', 'plugins')
    expect(io.tables[0]).toEqual([{ Name: 'slack', Kind: 'integration', Version: '1.0', Loaded: 'yes', Providers: 'slack (2 ws)' }])
  })
})
