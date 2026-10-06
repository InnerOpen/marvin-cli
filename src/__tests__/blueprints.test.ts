/**
 * `marvin platform blueprints` against a mocked SDK: catalog filters, categories, get, single and
 * bulk apply with params, update, and the result output.
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

const BLUEPRINT = {
  kind: 'collection', slug: 'featured', name: 'Featured', description: '', required: false, category: 'Site',
  source: 'core', requires: ['entry_type:post'], parameters: [{ key: 'entry_type', label: 'Entry type', kind: 'text', required: true, help: '' }],
  payload: {}, available: false, missingRequirements: ['entry_type:post'], applied: false, outdated: false,
}

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
  await buildProgram().parseAsync(['node', 'marvin', 'platform', 'blueprints', ...args])
}

describe('platform blueprints', () => {
  let io: Captured
  let blueprints: any

  beforeEach(() => {
    resetCommandContext()
    io = captureOutput()
    blueprints = {
      list: vi.fn().mockResolvedValue([BLUEPRINT]),
      categories: vi.fn().mockResolvedValue(['Site', 'Shop']),
      get: vi.fn().mockResolvedValue(BLUEPRINT),
      apply: vi.fn().mockResolvedValue({ slug: 'featured', kind: 'collection', created: true, updated: false, detail: '', name: 'Featured' }),
      applyMany: vi.fn().mockResolvedValue([
        { slug: 'post', kind: 'entry_type', created: true, updated: false, detail: '', name: 'Post' },
        { slug: 'featured', kind: 'collection', created: false, updated: false, detail: 'already exists', name: 'Featured' },
      ]),
      update: vi.fn().mockResolvedValue({ slug: 'tag-posts', kind: 'workflow', created: false, updated: true, detail: 'steps replaced', name: 'Tag posts' }),
    }
    vi.mocked(clientFactory.createPlatformClient).mockResolvedValue({ blueprints } as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.exitCode = 0
  })

  it('list passes the filters and shows applied/available', async () => {
    await run('list', '--kind', 'collection', '--category', 'Site', '--source', 'core', '--integration-id', 'i-1')
    expect(blueprints.list).toHaveBeenCalledWith({ kind: 'collection', category: 'Site', source: 'core', integrationId: 'i-1' })
    expect(io.tables[0]).toEqual([{
      Slug: 'featured', Kind: 'collection', Name: 'Featured', Category: 'Site', Source: 'core',
      Applied: 'no', Available: 'no: needs entry_type:post', Params: 'entry_type',
    }])
  })

  it('categories prints a one-column table, or a JSON array', async () => {
    await run('categories')
    expect(io.tables[0]).toEqual([{ Category: 'Site' }, { Category: 'Shop' }])
    io.clear()
    await run('categories', '--json')
    expect(JSON.parse(io.out())).toEqual(['Site', 'Shop'])
  })

  it('get passes --source', async () => {
    await run('get', 'featured', '--source', 'core', '--json')
    expect(blueprints.get).toHaveBeenCalledWith('featured', { source: 'core' })
    expect(JSON.parse(io.out())).toMatchObject({ slug: 'featured' })
  })

  it('apply with one slug applies it with its params and prints the result object', async () => {
    await run('apply', 'featured', '--params', '{"entry_type":"post"}', '--integration-id', 'i-1', '--json')
    expect(blueprints.apply).toHaveBeenCalledWith('featured', { entry_type: 'post' }, { source: undefined, integrationId: 'i-1' })
    expect(blueprints.applyMany).not.toHaveBeenCalled()
    expect(JSON.parse(io.out())).toMatchObject({ slug: 'featured', created: true })
  })

  it('apply with several slugs is one bulk call, params keyed by slug from a file', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'marvin-blueprints-'))
    const file = join(dir, 'params.json')
    writeFileSync(file, '{"featured":{"entry_type":"post"}}')
    await run('apply', 'post', 'featured', '--params', `@${file}`)
    expect(blueprints.applyMany).toHaveBeenCalledWith(['post', 'featured'], { featured: { entry_type: 'post' } }, { source: undefined, integrationId: undefined })
    expect(io.err()).toContain('Created 1 of 2 blueprint(s); the rest were already in place')
    expect(io.tables[0]).toEqual([
      { Slug: 'post', Kind: 'entry_type', Name: 'Post', Created: 'yes', Updated: '', Detail: '' },
      { Slug: 'featured', Kind: 'collection', Name: 'Featured', Created: '', Updated: '', Detail: 'already exists' },
    ])
  })

  it('apply --json with several slugs prints the array', async () => {
    await run('apply', 'post', 'featured', '--json')
    expect(JSON.parse(io.out())).toHaveLength(2)
    expect(blueprints.applyMany).toHaveBeenCalledWith(['post', 'featured'], undefined, expect.anything())
  })

  it('rejects params that are not an object', async () => {
    await run('apply', 'featured', '--params', '["x"]')
    expect(process.exitCode).toBe(1)
    expect(io.err()).toContain('--params must be a JSON object')
    expect(blueprints.apply).not.toHaveBeenCalled()
  })

  it('update calls the SDK and reports what changed', async () => {
    await run('update', 'tag-posts')
    expect(blueprints.update).toHaveBeenCalledWith('tag-posts', undefined, { source: undefined })
    expect(io.err()).toContain('Updated 1 of 1 blueprint(s)')
  })
})
