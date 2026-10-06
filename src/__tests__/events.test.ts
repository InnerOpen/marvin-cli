/**
 * `marvin events` against a mocked SDK: the summary joined with the catalogue and its filters, the
 * detail as a readable page or the API object unchanged, and the 404/403 messages.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { stripVTControlCharacters } from 'node:util'
import { Command } from 'commander'
import { MarvinAuthError, MarvinNotFoundError } from '@inneropen/marvin-sdk'
import { createEventsCommand } from '../commands/events/index.js'
import { createPlatformCommand } from '../commands/platform/index.js'
import { clientFactory } from '../shared/clients.js'
import { resetCommandContext, trackCommandContext } from '../shared/command-context.js'
import { annotateRequiredRoles } from '../shared/permissions.js'
import { captureOutput, type Captured } from './helpers/capture.js'

vi.mock('../shared/clients.js', () => ({
  clientFactory: { createPlatformClient: vi.fn() },
  ClientFactory: class {},
}))

vi.mock('../config/credentials.js', () => ({
  credentialsManager: {
    getActiveWorkspace: () => undefined,
    getUserToken: () => undefined,
    getSiteToken: () => undefined,
    getApiUrl: () => undefined,
  },
}))

const SUMMARY = [
  { eventType: 'entry_published', senders: 3, reactions: 2, activeReactions: 1, builtinReactions: 2, lastOccurredAt: '2026-10-04T18:02:23.857Z' },
  { eventType: 'entry_deleted', senders: 1, reactions: 0, activeReactions: 0, builtinReactions: 1, lastOccurredAt: null },
  { eventType: 'invitation_sent', senders: 1, reactions: 1, activeReactions: 1, builtinReactions: 0, lastOccurredAt: null },
  { eventType: 'shop_order_paid', senders: 1, reactions: 0, activeReactions: 0, builtinReactions: 0, lastOccurredAt: null },
]

const CATALOGUE = [
  { value: 'entry_published', label: 'Entry Published', category: 'Content' },
  { value: 'entry_deleted', label: 'Entry Deleted', category: 'Content' },
  { value: 'invitation_sent', label: 'Invitation Sent', category: 'Members' },
]

const BUTTONDOWN = { integrationId: 'i1', name: 'Buttondown', provider: 'buttondown', blueprint: 'buttondown' }

const DETAIL = {
  eventType: 'entry_published',
  name: 'Entry Published',
  description: 'A content entry was published.',
  category: 'Content',
  audited: true,
  senders: [
    { kind: 'marvin', id: null, name: 'Publishing an entry (app, API, CLI)', enabled: true, detail: null, managedAt: null, installedBy: null },
    { kind: 'incoming_webhook', id: 'h1', name: 'Buttondown events', enabled: false, detail: 'Starts the workflow Subscriber confirmed', managedAt: '/automation/incoming-webhooks', installedBy: BUTTONDOWN },
  ],
  reactions: [
    { kind: 'builtin', id: null, name: 'Queues a site rebuild', enabled: true, detail: null, managedAt: null, installedBy: null },
    { kind: 'email', id: null, name: 'Notify subscribers', enabled: false, detail: 'to: editors', managedAt: null, installedBy: null },
    { kind: 'workflow', id: 'w1', name: 'Email an issue when published', enabled: true, detail: null, triggerType: 'event', managedAt: '/automation/workflows?workflow=w1', installedBy: BUTTONDOWN },
  ],
  recent: [
    { id: 'e1', eventId: 'x1', eventType: 'entry_published', occurredAt: '2026-10-01T09:00:00Z', workspaceId: 'g1', messageTitle: 'Entry Published', messageBody: "Entry 'Older' published" },
    { id: 'e2', eventId: 'x2', eventType: 'entry_published', occurredAt: '2026-10-04T18:02:23.857Z', workspaceId: 'g1', messageTitle: 'Entry Published', messageBody: "Entry 'Newer' published" },
  ],
  leadsTo: [{ eventType: 'site_rebuild_requested', name: 'Site Rebuild Requested' }],
  causedBy: [],
}

function buildProgram(): Command {
  const program = new Command('marvin')
    .exitOverride()
    .option('--workspace <slug>', 'Workspace slug')
    .option('--output <format>', 'Output format', 'table')
    .option('--json', 'JSON output', false)
    .option('--yaml', 'YAML output', false)
    .option('--csv', 'CSV output', false)
  trackCommandContext(program)
  program.addCommand(createEventsCommand())
  annotateRequiredRoles(program)
  return program
}

async function run(...args: string[]): Promise<void> {
  await buildProgram().parseAsync(['node', 'marvin', 'events', ...args])
}

describe('events', () => {
  let io: Captured
  let events: any

  beforeEach(() => {
    resetCommandContext()
    io = captureOutput()
    events = {
      getConnectionsSummary: vi.fn().mockResolvedValue(SUMMARY),
      getOptions: vi.fn().mockResolvedValue(CATALOGUE),
      getConnections: vi.fn().mockResolvedValue(DETAIL),
    }
    vi.mocked(clientFactory.createPlatformClient).mockResolvedValue({ events } as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.exitCode = 0
  })

  describe('list', () => {
    it('shows one row per type with its name and category from the catalogue', async () => {
      await run('list')
      const rows = io.tables[0] as Record<string, unknown>[]
      expect(rows).toHaveLength(4)
      expect(rows[0]).toEqual({
        'Event type': 'entry_published', Name: 'Entry Published', Category: 'Content', Senders: 3,
        'Reactions (on/total)': '1/2', 'Built-in': 2, 'Last occurred': '2026-10-04T18:02:23.857Z',
      })
      // A type the catalogue doesn't list still shows, without a name
      expect(rows[3]).toMatchObject({ 'Event type': 'shop_order_paid', Name: '', Category: '' })
    })

    it('--category matches case-insensitively', async () => {
      await run('list', '--category', 'content', '--json')
      expect(JSON.parse(io.out()).map((r: any) => r.eventType)).toEqual(['entry_published', 'entry_deleted'])
    })

    it('--connected keeps types something reacts to, not counting built-ins', async () => {
      await run('list', '--connected', '--json')
      expect(JSON.parse(io.out()).map((r: any) => r.eventType)).toEqual(['entry_published', 'invitation_sent'])
    })

    it('--unused keeps types nothing reacts to', async () => {
      await run('list', '--unused', '--json')
      expect(JSON.parse(io.out()).map((r: any) => r.eventType)).toEqual(['entry_deleted', 'shop_order_paid'])
    })

    it('JSON rows are the API rows plus name and category', async () => {
      await run('list', '--json')
      expect(JSON.parse(io.out())[0]).toEqual({ ...SUMMARY[0], name: 'Entry Published', category: 'Content' })
    })

    it('refuses --connected with --unused', async () => {
      await run('list', '--connected', '--unused')
      expect(process.exitCode).toBe(1)
      expect(io.err()).toContain("--connected and --unused can't be used together")
      expect(events.getConnectionsSummary).not.toHaveBeenCalled()
    })
  })

  describe('show', () => {
    it('prints the API object unchanged with --json', async () => {
      await run('show', 'entry_published', '--json')
      expect(events.getConnections).toHaveBeenCalledWith('entry_published', { limit: 10 })
      expect(JSON.parse(io.out())).toEqual(DETAIL)
    })

    it('passes --limit through', async () => {
      await run('show', 'entry_published', '--limit', '3', '--json')
      expect(events.getConnections).toHaveBeenCalledWith('entry_published', { limit: 3 })
    })

    it('rejects a --limit over 50 before calling the API', async () => {
      await run('show', 'entry_published', '--limit', '51')
      expect(process.exitCode).toBe(1)
      expect(io.err()).toContain('--limit must be 50 or less')
      expect(events.getConnections).not.toHaveBeenCalled()
    })

    it('reads as a page in a terminal', async () => {
      await run('show', 'entry_published')
      const text = stripVTControlCharacters(io.out())
      expect(text).toContain('Entry Published (entry_published)')
      expect(text).toContain('Category: Content')
      expect(text).toContain('A content entry was published.')
      expect(text).toContain('Recorded in the event log: yes')
      // Senders: kind, on/off, and who installed it
      expect(text).toMatch(/on\s+Marvin\s+Publishing an entry \(app, API, CLI\)/)
      expect(text).toMatch(/off\s+Incoming webhook\s+Buttondown events — Starts the workflow Subscriber confirmed · installed by Buttondown/)
      // Reactions grouped by kind, built-ins last
      const workflows = text.indexOf('Workflows')
      const emails = text.indexOf('Emails')
      const builtin = text.indexOf('Built-in')
      expect(workflows).toBeGreaterThan(text.indexOf('What happens'))
      expect(emails).toBeGreaterThan(workflows)
      expect(builtin).toBeGreaterThan(emails)
      expect(text).toMatch(/on\s+Email an issue when published — installed by Buttondown/)
      expect(text).toMatch(/off\s+Notify subscribers — to: editors/)
      // Recent: newest first
      expect(text.indexOf("Entry 'Newer' published")).toBeLessThan(text.indexOf("Entry 'Older' published"))
      expect(text).toContain("2026-10-04 18:02  Entry 'Newer' published")
      expect(text).toContain('Leads to: site_rebuild_requested (Site Rebuild Requested)')
      expect(text).toContain('Caused by: nothing')
      expect(io.err()).toBe('')
    })

    it('says when an event type is not recorded', async () => {
      events.getConnections.mockResolvedValue({ ...DETAIL, audited: false, recent: [], senders: [], reactions: [] })
      await run('show', 'entry_published')
      const text = stripVTControlCharacters(io.out())
      expect(text).toContain('Recorded in the event log: no')
      expect(text).toContain('not recorded in the event log')
      expect(text).toContain('nothing in this workspace')
      expect(text).toContain('nothing reacts to it')
    })

    it('explains a 404', async () => {
      events.getConnections.mockRejectedValue(new MarvinNotFoundError('Resource not found', '/api/platform/event-types/nope/connections'))
      await run('show', 'nope')
      expect(process.exitCode).toBe(1)
      expect(stripVTControlCharacters(io.err())).toContain("Unknown event type 'nope' (or a platform event — see the admin Events page)")
      expect(io.out()).toBe('')
    })

    it('explains a 404 as JSON with --json', async () => {
      events.getConnections.mockRejectedValue(new MarvinNotFoundError('Resource not found', '/api/platform/event-types/nope/connections'))
      await run('show', 'nope', '--json')
      expect(JSON.parse(io.out())).toEqual({
        error: "Unknown event type 'nope' (or a platform event — see the admin Events page)",
        status: 404,
      })
    })
  })

  describe('a 403', () => {
    const forbidden = () => new MarvinAuthError('Authentication failed: Forbidden', 403)

    it('says show needs ADMIN', async () => {
      events.getConnections.mockRejectedValue(forbidden())
      await run('show', 'entry_published', '--workspace', 'acme')
      expect(process.exitCode).toBe(1)
      expect(io.err()).toContain('Permission denied (403)')
      expect(io.err()).toContain("This needs the ADMIN role in workspace 'acme'.")
    })

    it('says list needs ADMIN, as JSON fields with --json', async () => {
      events.getConnectionsSummary.mockRejectedValue(forbidden())
      await run('list', '--workspace', 'acme', '--json')
      expect(JSON.parse(io.out())).toEqual({
        error: "This needs the ADMIN role in workspace 'acme'.",
        status: 403,
        requiredRole: 'ADMIN',
        workspace: 'acme',
      })
    })
  })

  it('help says the group needs workspace ADMIN', () => {
    const events = buildProgram().commands.find(c => c.name() === 'events')!
    expect(events.description()).toContain('(needs workspace ADMIN)')
  })
})

describe('platform events (deprecated alias of platform event-log)', () => {
  let io: Captured
  let eventLog: any
  const WARNING = '`platform events` is now `platform event-log`; `marvin events` shows the Events hub'

  beforeEach(() => {
    resetCommandContext()
    io = captureOutput()
    eventLog = { list: vi.fn().mockResolvedValue([]) }
    vi.mocked(clientFactory.createPlatformClient).mockResolvedValue({ eventLog } as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.exitCode = 0
  })

  async function runPlatform(...args: string[]): Promise<void> {
    const program = new Command('marvin').exitOverride().option('--json', 'JSON output', false)
    trackCommandContext(program)
    program.addCommand(createPlatformCommand())
    await program.parseAsync(['node', 'marvin', 'platform', ...args])
  }

  it('still works, with a one-line warning on stderr', async () => {
    await runPlatform('events', 'list', '--json')
    expect(eventLog.list).toHaveBeenCalled()
    expect(JSON.parse(io.out())).toEqual([])
    const err = stripVTControlCharacters(io.err())
    expect(err).toContain(WARNING)
    expect(err.split('\n')).toHaveLength(1)
  })

  it('says nothing for platform event-log', async () => {
    await runPlatform('event-log', 'list', '--json')
    expect(eventLog.list).toHaveBeenCalled()
    expect(io.err()).toBe('')
  })
})
