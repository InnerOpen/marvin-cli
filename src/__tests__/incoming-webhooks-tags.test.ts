/**
 * `marvin platform incoming-webhooks` and `marvin platform tags` against a mocked SDK: slug
 * resolution, token mint/revoke with the receiver URL, signature schemes, deletes, tag CRUD from
 * flags or --data, and attach/detach to each kind of target.
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

const HOOK_ID = '11111111-2222-4333-8444-555555555555'
const TAG_ID = '66666666-2222-4333-8444-555555555555'

const HOOK = {
  id: HOOK_ID, groupId: 'g1', name: 'Shopify orders', slug: 'shopify-orders', description: null, enabled: false,
  token: null, receivedCount: 0, lastReceivedAt: null, signatureScheme: null, signingSecretRef: null,
}
const TAG = { id: TAG_ID, groupId: 'g1', name: 'News', slug: 'news', color: null, entryCount: 3, usageCount: 5 }

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

describe('platform incoming-webhooks', () => {
  let io: Captured
  let hooks: any

  beforeEach(() => {
    resetCommandContext()
    io = captureOutput()
    hooks = {
      list: vi.fn().mockResolvedValue([HOOK]),
      get: vi.fn().mockResolvedValue(HOOK),
      create: vi.fn().mockResolvedValue(HOOK),
      update: vi.fn().mockImplementation((_id, body) => Promise.resolve({ ...HOOK, ...body })),
      delete: vi.fn().mockResolvedValue(undefined),
      mintToken: vi.fn().mockResolvedValue({ ...HOOK, token: 'test-token' }),
      revokeToken: vi.fn().mockResolvedValue({ ...HOOK, token: null }),
      signatureSchemes: vi.fn().mockResolvedValue([
        { name: 'github', notes: 'X-Hub-Signature-256', source: 'core' },
        { name: 'custom', notes: "Describe the sender's construction yourself", source: 'core' },
      ]),
    }
    vi.mocked(clientFactory.createPlatformClient).mockResolvedValue({
      incomingWebhooks: hooks,
      buildUrl: (path: string) => `https://cms.example.test${path}`,
    } as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.exitCode = 0
  })

  it('list hides the token and shows the signature scheme', async () => {
    await run('incoming-webhooks', 'list')
    expect(io.tables[0]).toEqual([{
      ID: HOOK_ID, Slug: 'shopify-orders', Name: 'Shopify orders', Enabled: false, Token: 'none',
      Signature: 'none', Received: 0, 'Last received': '',
    }])
  })

  it('get accepts a slug', async () => {
    await run('incoming-webhooks', 'get', 'shopify-orders', '--json')
    expect(hooks.get).toHaveBeenCalledWith(HOOK_ID)
  })

  it('reports an unknown slug', async () => {
    await run('incoming-webhooks', 'get', 'nope')
    expect(process.exitCode).toBe(1)
    expect(io.err()).toContain("No incoming webhook with id or slug 'nope'")
  })

  it('create posts --data', async () => {
    await run('incoming-webhooks', 'create', '--data', '{"name":"Shopify orders","signatureScheme":"shopify","signingSecretRef":"shopify-key"}', '--json')
    expect(hooks.create).toHaveBeenCalledWith({ name: 'Shopify orders', signatureScheme: 'shopify', signingSecretRef: 'shopify-key' })
    expect(io.err()).toContain('mint a token to get its URL')
  })

  it('mint-token prints the receiver URL on stderr and the webhook on stdout', async () => {
    await run('incoming-webhooks', 'mint-token', 'shopify-orders', '--json')
    expect(hooks.mintToken).toHaveBeenCalledWith(HOOK_ID)
    expect(JSON.parse(io.out())).toMatchObject({ token: 'test-token' })
    expect(io.err()).toContain('Senders POST to: https://cms.example.test/api/hooks/test-token')
    expect(io.err()).toContain('disabled')
  })

  it('revoke-token', async () => {
    await run('incoming-webhooks', 'revoke-token', HOOK_ID, '--json')
    expect(hooks.revokeToken).toHaveBeenCalledWith(HOOK_ID)
    expect(JSON.parse(io.out())).toMatchObject({ token: null })
  })

  it('delete needs --yes and prints {"deleted": id}', async () => {
    await run('incoming-webhooks', 'delete', 'shopify-orders')
    expect(hooks.delete).not.toHaveBeenCalled()
    expect(process.exitCode).toBe(1)
    process.exitCode = 0
    await run('incoming-webhooks', 'delete', 'shopify-orders', '--yes', '--json')
    expect(JSON.parse(io.out())).toEqual({ deleted: HOOK_ID })
  })

  it('signature-schemes lists the schemes', async () => {
    await run('incoming-webhooks', 'signature-schemes')
    expect(io.tables[0]).toEqual([
      { Name: 'github', Source: 'core', Notes: 'X-Hub-Signature-256' },
      { Name: 'custom', Source: 'core', Notes: "Describe the sender's construction yourself" },
    ])
  })
})

describe('platform tags', () => {
  let io: Captured
  let tags: any

  beforeEach(() => {
    resetCommandContext()
    io = captureOutput()
    tags = {
      list: vi.fn().mockResolvedValue([TAG]),
      get: vi.fn().mockResolvedValue(TAG),
      create: vi.fn().mockResolvedValue(TAG),
      update: vi.fn().mockImplementation((_id, body) => Promise.resolve({ ...TAG, ...body })),
      delete: vi.fn().mockResolvedValue(undefined),
      attach: vi.fn().mockResolvedValue(undefined),
      detach: vi.fn().mockResolvedValue(undefined),
      attachAsset: vi.fn().mockResolvedValue(undefined),
      detachAsset: vi.fn().mockResolvedValue(undefined),
      attachResource: vi.fn().mockResolvedValue(undefined),
      detachResource: vi.fn().mockResolvedValue(undefined),
    }
    vi.mocked(clientFactory.createPlatformClient).mockResolvedValue({ tags } as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.exitCode = 0
  })

  it('list shows usage counts', async () => {
    await run('tags', 'list')
    expect(io.tables[0]).toEqual([{ ID: TAG_ID, Slug: 'news', Name: 'News', Color: '', Entries: 3, Uses: 5 }])
  })

  it('create from flags', async () => {
    await run('tags', 'create', '--name', 'Chore Coat', '--color', '#123456', '--json')
    expect(tags.create).toHaveBeenCalledWith({ name: 'Chore Coat', color: '#123456' })
  })

  it('create needs a flag or --data', async () => {
    await run('tags', 'create')
    expect(process.exitCode).toBe(1)
    expect(io.err()).toContain('Provide --name, --slug, --color or --data')
  })

  it('update resolves the slug and sends only name/color', async () => {
    await run('tags', 'update', 'news', '--name', 'Updates', '--json')
    expect(tags.update).toHaveBeenCalledWith(TAG_ID, { name: 'Updates' })
  })

  it('delete prints {"deleted": id}', async () => {
    await run('tags', 'delete', 'news', '--yes', '--json')
    expect(tags.delete).toHaveBeenCalledWith(TAG_ID)
    expect(JSON.parse(io.out())).toEqual({ deleted: TAG_ID })
  })

  it.each([
    ['attach', '--entry', 'attach'],
    ['attach', '--asset', 'attachAsset'],
    ['attach', '--resource', 'attachResource'],
    ['detach', '--entry', 'detach'],
    ['detach', '--asset', 'detachAsset'],
    ['detach', '--resource', 'detachResource'],
  ])('%s %s calls tags.%s', async (action, flag, method) => {
    await run('tags', action, 'news', flag, 'x1', '--json')
    expect(tags[method]).toHaveBeenCalledWith(TAG_ID, 'x1')
    const kind = flag.slice(2)
    expect(JSON.parse(io.out())).toEqual({ ok: true, tagId: TAG_ID, [`${kind}Id`]: 'x1', [action === 'attach' ? 'attached' : 'detached']: true })
  })

  it('attach needs exactly one target', async () => {
    await run('tags', 'attach', 'news')
    expect(process.exitCode).toBe(1)
    expect(io.err()).toContain('Name exactly one of --entry <id>, --asset <id> or --resource <id>')
    process.exitCode = 0
    await run('tags', 'attach', 'news', '--entry', 'e1', '--asset', 'a1')
    expect(process.exitCode).toBe(1)
    expect(tags.attach).not.toHaveBeenCalled()
  })
})
