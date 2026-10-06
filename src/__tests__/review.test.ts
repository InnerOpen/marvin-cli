/**
 * The review queue against a mocked SDK: `entries list` filters, `entries counts`, AI suggestions
 * on entries/assets/resources, suggested assets, `dashboard`, and the scheduling flags on
 * `entries update`.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { createPlatformCommand } from '../commands/platform/index.js'
import { clientFactory } from '../shared/clients.js'
import { resetCommandContext, trackCommandContext } from '../shared/command-context.js'
import { captureOutput, type Captured } from './helpers/capture.js'

vi.mock('../shared/clients.js', () => ({
  clientFactory: { createPlatformClient: vi.fn() },
  ClientFactory: class {},
}))

const POST = 'type-post'
const PAGE = 'type-page'

const ENTRIES = [
  { id: 'e1', title: 'One', slug: 'one', status: 'inbox', entryTypeId: POST, suggestionJson: null },
  { id: 'e2', title: 'Two', slug: 'two', status: 'draft', entryTypeId: POST, suggestionJson: { title: 'Better' } },
  { id: 'e3', title: 'Three', slug: 'three', status: 'inbox', entryTypeId: PAGE, suggestionJson: null },
  { id: 'e4', title: 'Four', slug: 'four', status: 'needs_review', entryTypeId: POST, suggestionJson: null },
]

function buildProgram(): Command {
  const program = new Command('marvin')
    .exitOverride()
    .option('--output <format>', 'Output format', 'table')
    .option('--json', 'JSON output', false)
    .option('--yaml', 'YAML output', false)
    .option('--csv', 'CSV output', false)
  trackCommandContext(program)
  program.addCommand(createPlatformCommand())
  return program
}

async function run(...args: string[]): Promise<void> {
  await buildProgram().parseAsync(['node', 'marvin', 'platform', ...args])
}

describe('review queue', () => {
  let io: Captured
  let client: any

  beforeEach(() => {
    resetCommandContext()
    io = captureOutput()
    const updated = (id: string) => Promise.resolve({ id, suggestionJson: null })
    client = {
      entries: {
        list: vi.fn().mockResolvedValue(ENTRIES),
        get: vi.fn().mockResolvedValue({
          id: 'e2',
          assets: [
            { id: 'a1', slug: 'hero', name: 'Hero', mimeType: 'image/png', placementMetadata: null },
            { id: 'a2', slug: 'hero-nobg', name: 'Hero (no background)', mimeType: 'image/png', placementMetadata: { suggested: true, media_op: 'remove_background', derived_from: 'a1' } },
          ],
        }),
        counts: vi.fn().mockResolvedValue({ inbox: 2, draft: 1, needs_review: 1, published: 0, total: 4 }),
        update: vi.fn().mockImplementation((id, body) => Promise.resolve({ id, ...body })),
        applySuggestion: vi.fn().mockImplementation(updated),
        rejectSuggestion: vi.fn().mockImplementation(updated),
        approveSuggestedAsset: vi.fn().mockResolvedValue({ id: 'e2' }),
        rejectSuggestedAsset: vi.fn().mockResolvedValue({ id: 'e2' }),
      },
      entryTypes: { list: vi.fn().mockResolvedValue([{ id: POST, slug: 'post' }, { id: PAGE, slug: 'page' }]) },
      assets: { applySuggestion: vi.fn().mockImplementation(updated), rejectSuggestion: vi.fn().mockImplementation(updated) },
      resources: { applySuggestion: vi.fn().mockImplementation(updated), rejectSuggestion: vi.fn().mockImplementation(updated) },
      workspaces: {
        getDashboard: vi.fn().mockResolvedValue({
          attention: { inbox: 2, drafts: 1, needsReview: 1, aiSuggestions: 3, failures: 0 },
          recentActivity: [{ eventType: 'entry_published', message: 'Published One', entityType: 'entry', entityId: 'e1', occurredAt: '2026-10-05T10:00:00Z' }],
        }),
      },
    }
    vi.mocked(clientFactory.createPlatformClient).mockResolvedValue(client)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.exitCode = 0
  })

  const ids = () => (JSON.parse(io.out()) as { id: string }[]).map((e) => e.id)

  describe('entries list', () => {
    it('without filters lists everything', async () => {
      await run('entries', 'list', '--json')
      expect(ids()).toEqual(['e1', 'e2', 'e3', 'e4'])
      expect(client.entryTypes.list).not.toHaveBeenCalled()
    })

    it('--status filters, and takes several', async () => {
      await run('entries', 'list', '--status', 'inbox', '--json')
      expect(ids()).toEqual(['e1', 'e3'])
      io.clear()
      await run('entries', 'list', '--status', 'inbox, needs_review', '--json')
      expect(ids()).toEqual(['e1', 'e3', 'e4'])
    })

    it('--entry-type resolves a slug to the type id', async () => {
      await run('entries', 'list', '--entry-type', 'page', '--json')
      expect(ids()).toEqual(['e3'])
    })

    it('--entry-type reports an unknown type', async () => {
      await run('entries', 'list', '--entry-type', 'nope')
      expect(process.exitCode).toBe(1)
      expect(io.err()).toContain("No entry type with slug or id 'nope'")
    })

    it('--suggestions keeps entries with a pending AI suggestion', async () => {
      await run('entries', 'list', '--suggestions', '--json')
      expect(ids()).toEqual(['e2'])
    })

    it('--limit applies after filtering', async () => {
      await run('entries', 'list', '--entry-type', 'post', '--limit', '2', '--json')
      expect(ids()).toEqual(['e1', 'e2'])
    })

    it('rejects a bad --limit before calling the API', async () => {
      await run('entries', 'list', '--limit', '0')
      expect(process.exitCode).toBe(1)
      expect(client.entries.list).not.toHaveBeenCalled()
    })
  })

  it('entries counts prints a status/count table, or the object as JSON', async () => {
    await run('entries', 'counts')
    expect(io.tables[0]).toEqual([
      { Status: 'inbox', Count: 2 },
      { Status: 'draft', Count: 1 },
      { Status: 'needs_review', Count: 1 },
      { Status: 'published', Count: 0 },
      { Status: 'total', Count: 4 },
    ])
    io.clear()
    await run('entries', 'counts', '--json')
    expect(JSON.parse(io.out())).toEqual({ inbox: 2, draft: 1, needs_review: 1, published: 0, total: 4 })
  })

  describe('AI suggestions', () => {
    it.each(['entries', 'assets', 'resources'])('%s apply-suggestion and reject-suggestion', async (kind) => {
      await run(kind, 'apply-suggestion', 'x1', '--json')
      expect(client[kind].applySuggestion).toHaveBeenCalledWith('x1')
      expect(JSON.parse(io.out())).toEqual({ id: 'x1', suggestionJson: null })
      expect(io.err()).toContain('Applied the AI suggestion')

      io.clear()
      await run(kind, 'reject-suggestion', 'x1', '--json')
      expect(client[kind].rejectSuggestion).toHaveBeenCalledWith('x1')
      expect(io.err()).toContain('Rejected the AI suggestion')
    })
  })

  describe('suggested assets', () => {
    it('list shows only the assets still awaiting review', async () => {
      await run('entries', 'suggested-assets', 'list', 'e2')
      expect(client.entries.get).toHaveBeenCalledWith('e2')
      expect(io.tables[0]).toEqual([
        { ID: 'a2', Slug: 'hero-nobg', Name: 'Hero (no background)', Type: 'image/png', Operation: 'remove_background', 'Derived from': 'a1' },
      ])
    })

    it('approve and reject call the SDK with entry and asset', async () => {
      await run('entries', 'suggested-assets', 'approve', 'e2', 'a2', '--json')
      expect(client.entries.approveSuggestedAsset).toHaveBeenCalledWith('e2', 'a2')
      expect(io.err()).toContain('Approved suggested asset a2 on entry e2')
      await run('entries', 'suggested-assets', 'reject', 'e2', 'a2', '--json')
      expect(client.entries.rejectSuggestedAsset).toHaveBeenCalledWith('e2', 'a2')
    })
  })

  describe('dashboard', () => {
    it('table mode shows the attention counts and recent activity', async () => {
      await run('dashboard')
      expect(io.out()).toContain('Needs attention: 7')
      const attention = io.tables[0] as { Item: string; Count: number; 'See it with': string }[]
      expect(attention.map((r) => [r.Item, r.Count])).toEqual([
        ['Inbox', 2], ['Drafts', 1], ['Needs review', 1], ['AI suggestions', 3], ['Failures (7 days)', 0],
      ])
      expect(attention[0]!['See it with']).toBe('marvin platform entries list --status inbox')
      expect(attention[4]!['See it with']).toBe('')
      expect(io.tables[1]).toEqual([
        { When: '2026-10-05T10:00:00Z', Event: 'entry_published', Message: 'Published One', Entity: 'entry e1' },
      ])
    })

    it('--json passes the dashboard through', async () => {
      await run('dashboard', '--json')
      expect(JSON.parse(io.out())).toMatchObject({ attention: { aiSuggestions: 3 } })
    })
  })

  describe('entries update scheduling flags', () => {
    it('sends the flags without a --data body (and without reading stdin)', async () => {
      await run('entries', 'update', 'e1', '--status', 'draft', '--publish-at', '2026-10-31T09:00:00Z', '--json')
      expect(client.entries.update).toHaveBeenCalledWith('e1', { status: 'draft', publishAt: '2026-10-31T09:00:00Z' })
    })

    it('"" clears a schedule', async () => {
      await run('entries', 'update', 'e1', '--publish-at', '', '--expire-at', 'none', '--json')
      expect(client.entries.update).toHaveBeenCalledWith('e1', { publishAt: null, expireAt: null })
    })

    it('merges with --data, the flags winning over the same field in either spelling', async () => {
      await run('entries', 'update', 'e1', '--data', '{"title":"New","publish_at":"2026-01-01T00:00:00Z"}', '--publish-at', '2026-12-01T00:00:00Z', '--json')
      expect(client.entries.update).toHaveBeenCalledWith('e1', { title: 'New', publishAt: '2026-12-01T00:00:00Z' })
    })

    it('rejects a date it cannot read', async () => {
      await run('entries', 'update', 'e1', '--expire-at', 'next tuesday')
      expect(process.exitCode).toBe(1)
      expect(io.err()).toContain('--expire-at must be an ISO 8601 date-time')
      expect(client.entries.update).not.toHaveBeenCalled()
    })
  })
})
