/**
 * Smart collections against a mocked SDK: `collections preview|members|order` and `--smart-rules`
 * on create/update.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { createPlatformCommand } from '../commands/platform/index.js'
import { clientFactory } from '../shared/clients.js'
import { resetCommandContext, trackCommandContext } from '../shared/command-context.js'
import { captureOutput, type Captured } from './helpers/capture.js'

vi.mock('../shared/clients.js', () => ({
  clientFactory: { createPlatformClient: vi.fn() },
  ClientFactory: class {},
}))

const dir = mkdtempSync(join(tmpdir(), 'marvin-collections-'))

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
  await buildProgram().parseAsync(['node', 'marvin', ...args])
}

describe('smart collections', () => {
  let io: Captured
  let collections: any

  beforeEach(() => {
    resetCommandContext()
    io = captureOutput()
    collections = {
      preview: vi.fn().mockResolvedValue({
        total: 12,
        items: [{ id: 'e1', label: 'Hello', slug: 'hello', type: 'entry' }],
        ignoredKeys: ['entry_type'],
        note: null,
      }),
      members: vi.fn().mockResolvedValue([{ id: 'a1', label: 'Logo', slug: 'logo', type: 'asset' }]),
      reorder: vi.fn().mockResolvedValue({ updated: 2 }),
      create: vi.fn().mockImplementation((body) => Promise.resolve({ id: 'c1', ...body })),
      update: vi.fn().mockImplementation((id, body) => Promise.resolve({ id, ...body })),
    }
    vi.mocked(clientFactory.createPlatformClient).mockResolvedValue({ collections } as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.exitCode = 0
  })

  it('preview sends the rules, target type and limit; table mode says how many match', async () => {
    await run('platform', 'collections', 'preview', '--rules', '{"tags":["news"],"entry_type":"post"}', '--limit', '5')
    expect(collections.preview).toHaveBeenCalledWith({ targetType: 'entry', smartRules: { tags: ['news'], entry_type: 'post' }, limit: 5 })
    expect(io.err()).toContain('Ignored (not rules for entries): entry_type')
    expect(io.err()).toContain('Matching entries: 12 (showing 1)')
    expect(io.tables[0]).toEqual([{ ID: 'e1', Type: 'entry', Label: 'Hello', Slug: 'hello' }])
  })

  it('preview reads --rules from a file and passes the result through as JSON', async () => {
    const file = join(dir, 'rules.json')
    writeFileSync(file, '{"statuses":["published"]}')
    await run('platform', 'collections', 'preview', '--rules', `@${file}`, '--target-type', 'asset', '--json')
    expect(collections.preview).toHaveBeenCalledWith({ targetType: 'asset', smartRules: { statuses: ['published'] }, limit: 10 })
    expect(JSON.parse(io.out())).toMatchObject({ total: 12 })
  })

  it.each([
    [['--target-type', 'page'], '--target-type must be one of: entry, asset, resource'],
    [['--limit', '51'], '--limit can be at most 50'],
    [['--rules', '[1]'], '--rules must be a JSON object'],
  ])('preview validates %j', async (args, message) => {
    await run('platform', 'collections', 'preview', '--rules', '{}', ...args)
    expect(process.exitCode).toBe(1)
    expect(io.err()).toContain(message)
    expect(collections.preview).not.toHaveBeenCalled()
  })

  it('members lists any kind of member', async () => {
    await run('platform', 'collections', 'members', 'c1')
    expect(collections.members).toHaveBeenCalledWith('c1')
    expect(io.tables[0]).toEqual([{ ID: 'a1', Type: 'asset', Label: 'Logo', Slug: 'logo' }])
  })

  it('order takes ids in the order wanted', async () => {
    await run('platform', 'collections', 'order', 'c2', 'c1', '--json')
    expect(collections.reorder).toHaveBeenCalledWith([{ id: 'c2', sortOrder: 0 }, { id: 'c1', sortOrder: 1 }])
    expect(JSON.parse(io.out())).toEqual({ ok: true, updated: 2 })
  })

  it('order takes --data [{id, sortOrder}] and says when ids did not match', async () => {
    await run('platform', 'collections', 'order', '--data', '[{"id":"c1","sortOrder":10},{"id":"c2","sortOrder":20},{"id":"zz","sortOrder":30}]')
    expect(collections.reorder).toHaveBeenCalledWith([{ id: 'c1', sortOrder: 10 }, { id: 'c2', sortOrder: 20 }, { id: 'zz', sortOrder: 30 }])
    expect(io.err()).toContain("1 id(s) didn't match a collection")
  })

  it('order refuses ids and --data together', async () => {
    await run('platform', 'collections', 'order', 'c1', '--data', '[]')
    expect(process.exitCode).toBe(1)
    expect(collections.reorder).not.toHaveBeenCalled()
  })

  it('create --smart-rules makes a smart collection', async () => {
    await run('platform', 'collections', 'create', '--data', '{"name":"News"}', '--smart-rules', '{"tags":["news"]}', '--json')
    expect(collections.create).toHaveBeenCalledWith({ name: 'News', isSmart: true, smartRules: { tags: ['news'] } })
  })

  it('update --smart-rules alone needs no body', async () => {
    await run('platform', 'collections', 'update', 'c1', '--smart-rules', '{"statuses":["published"]}', '--json')
    expect(collections.update).toHaveBeenCalledWith('c1', { isSmart: true, smartRules: { statuses: ['published'] } })
  })
})
