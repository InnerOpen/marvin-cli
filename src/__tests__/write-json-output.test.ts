/**
 * Every write command, run with `--output json`, prints parseable JSON on stdout — and nothing
 * else. Confirmations ("✓ Created…") belong on stderr, so `marvin … create --json | jq` works.
 *
 * Table-driven over the real command tree: a leaf counts as a write command when its name starts
 * with a write verb (create, update, delete, run, test, import…). A new write command is picked up
 * automatically; one that can't run against a mocked client must be listed in SKIP with a reason.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { createPlatformCommand } from '../commands/platform/index.js'
import { createAdminCommand } from '../commands/admin/index.js'
import { createUserCommand } from '../commands/user/index.js'
import { registerAuthCommands } from '../commands/auth.js'
import { registerWorkspaceCommands } from '../commands/platform/workspaces.js'
import { clientFactory } from '../shared/clients.js'
import { acceptsData, rewriteDeprecatedJsonPayload } from '../shared/json-input.js'
import { getCommandContext, resetCommandContext, trackCommandContext } from '../shared/command-context.js'
import { captureOutput, type Captured } from './helpers/capture.js'

vi.mock('../shared/clients.js', () => ({
  clientFactory: {
    createPlatformClient: vi.fn(),
    createPublishClient: vi.fn(),
    createAuthClient: vi.fn(),
    resolveWorkspace: vi.fn().mockResolvedValue(undefined),
  },
  ClientFactory: class {},
}))

vi.mock('../config/credentials.js', () => ({
  credentialsManager: {
    getActiveWorkspace: () => 'acme',
    setActiveWorkspace: () => {},
    getUserToken: () => 'user-token',
    getSiteToken: () => 'site-token',
    setSiteToken: () => {},
    removeSiteToken: () => {},
    getApiUrl: () => 'http://localhost:8000',
  },
}))

/** The placeholder for every required id argument: a UUID, so slug lookups are skipped. */
const ID = '00000000-0000-4000-8000-000000000001'

/** What every SDK call resolves to: an object with the fields commands print or read. */
const RESOURCE = {
  id: ID,
  slug: 'slug-1',
  name: 'Name',
  title: 'Title',
  message: 'done',
  status: 'ok',
  ok: true,
  token: 'test-token',
  workspaceRole: 'ADMIN',
  imported: { entries: 1 },
}

/**
 * A client whose every method, at any depth, resolves with RESOURCE — or [RESOURCE] for a list*
 * method (commands that take an id or slug look it up in a list), or bytes for downloads.
 */
function mockClient(): any {
  const node = (name = ''): any =>
    new Proxy(() => Promise.resolve(name.startsWith('list') ? [{ ...RESOURCE }] : { ...RESOURCE }), {
      get: (_t, prop) => {
        if (prop === 'then') return undefined
        if (prop === 'validatePathParam') return (v: string) => v
        if (prop === 'download' || prop === 'downloadBackup' || prop === 'getFile') {
          return () => Promise.resolve(new Blob(['bytes']))
        }
        return node(String(prop))
      },
    })
  return node()
}

const dir = mkdtempSync(join(tmpdir(), 'marvin-write-json-'))
const jsonFile = join(dir, 'body.json')
writeFileSync(jsonFile, '{"name":"x"}')
const binFile = join(dir, 'upload.png')
writeFileSync(binFile, 'png-bytes')

/**
 * What a command needs beyond the generic arguments (a placeholder per required positional,
 * `--data` when it takes a body, `--yes` when it asks): `positional` replaces the placeholders,
 * `options` is appended. Keyed by command path.
 */
const OVERRIDES: Record<string, { positional?: string[]; options?: string[] }> = {
  'platform collections reorder': { options: ['--data', '[{"entryId":"e1","sortOrder":0}]'] },
  'platform collections update-entry': { options: ['--role', 'featured'] },
  'platform secrets create': { options: ['--name', 'Key', '--value', 's3cret'] },
  'platform secrets update': { options: ['--value', 's3cret'] },
  'platform variables update': { options: ['--value', 'v'] },
  'user profile update': { options: ['--name', 'New Name'] },
  'platform assets upload': { positional: [binFile] },
  'platform invites create': { options: ['--role', 'EDITOR'] },
  'platform api-clients create': { options: ['--name', 'Site'] },
  'platform api-clients update': { options: ['--name', 'Site'] },
  'workspace import': { options: ['--file', binFile] },
  'platform integrations errors set': { options: ['--no-review', '--alert'] },
  'platform integrations alert-routing set': { options: ['--no-email-admins', '--reminder-hours', '24'] },
}

/** Write commands this test can't drive, and why. */
const SKIP: Record<string, string> = {
  'reset-password': 'reads the new password from an interactive prompt',
  'user password change': 'reads passwords from an interactive prompt',
}

const WRITE_VERB = /^(create|update|delete|rm|remove|revoke|rotate|run|execute|test|rerun|import|upload|add|set|reset|enable|disable|send|submit|invite|unlock|reorder|reindex|clean|cleanup|clear|optimize|resolve|check|mint)(-|$)/

function buildProgram(): Command {
  const program = new Command('marvin')
    .exitOverride()
    .option('--api-url <url>', 'API URL')
    .option('--workspace <slug>', 'Workspace slug')
    .option('--output <format>', 'Output format', 'table')
    .option('--json', 'JSON output', false)
    .option('--yaml', 'YAML output', false)
    .option('--csv', 'CSV output', false)
  trackCommandContext(program)
  registerAuthCommands(program)
  registerWorkspaceCommands(program, { hidden: false })
  program.addCommand(createPlatformCommand())
  program.addCommand(createAdminCommand())
  program.addCommand(createUserCommand())
  return program
}

interface WriteCommand {
  path: string[]
  args: string[]
}

function placeholderFor(argName: string): string {
  if (/email/i.test(argName)) return 'someone@example.com'
  if (/role/i.test(argName)) return 'EDITOR'
  return ID
}

function collectWriteCommands(cmd: Command, path: string[] = []): WriteCommand[] {
  const out: WriteCommand[] = []
  for (const sub of cmd.commands) {
    const subPath = [...path, sub.name()]
    if (sub.commands.length) {
      out.push(...collectWriteCommands(sub, subPath))
      continue
    }
    if (!WRITE_VERB.test(sub.name())) continue
    const key = subPath.join(' ')
    if (key in SKIP) continue

    const override = OVERRIDES[key] ?? {}
    const options = override.options ?? []
    const positional =
      override.positional ?? sub.registeredArguments.filter((a) => a.required).map((a) => placeholderFor(a.name()))
    const args = [...positional, ...options]
    for (const opt of sub.options) {
      if (opt.mandatory && opt.long && !options.includes(opt.long)) args.push(opt.long, placeholderFor(opt.long))
    }
    if (acceptsData(sub) && !options.includes('--data') && !options.includes('--file')) args.push('--data', '{"name":"x"}')
    if (sub.options.some((o) => o.long === '--yes')) args.push('--yes')
    out.push({ path: subPath, args })
  }
  return out
}

const writeCommands = collectWriteCommands(buildProgram())

describe('write commands print parseable JSON on stdout with --output json', () => {
  let io: Captured

  beforeEach(() => {
    resetCommandContext()
    io = captureOutput()
    vi.mocked(clientFactory.createPlatformClient).mockResolvedValue(mockClient())
    vi.mocked(clientFactory.createAuthClient).mockReturnValue(mockClient())
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.exitCode = 0
  })

  it('finds the write commands', () => {
    expect(writeCommands.length).toBeGreaterThan(60)
  })

  it.each(writeCommands.map((c) => [c.path.join(' '), c] as const))('%s', async (_name, { path, args }) => {
    await buildProgram().parseAsync(['node', 'marvin', ...path, ...args, '--output', 'json'])

    const stdout = io.out()
    expect(process.exitCode ?? 0, `exited with an error; stderr:\n${io.err()}\nstdout:\n${stdout}`).toBe(0)
    let parsed: unknown
    try {
      parsed = JSON.parse(stdout)
    } catch {
      throw new Error(`stdout is not one JSON document:\n${stdout}\n--- stderr:\n${io.err()}`)
    }
    expect(parsed).toBeTypeOf('object')
    expect(stdout).not.toContain('✓')
  })
})

describe('result shapes', () => {
  let io: Captured

  beforeEach(() => {
    resetCommandContext()
    io = captureOutput()
    vi.mocked(clientFactory.createPlatformClient).mockResolvedValue(mockClient())
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.exitCode = 0
  })

  it('a delete prints {"deleted": id} in JSON mode and prose on stderr in table mode', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'webhooks', 'delete', 'wh-1', '--yes', '--json'])
    expect(JSON.parse(io.out())).toEqual({ deleted: 'wh-1' })

    io.clear()
    resetCommandContext()
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'webhooks', 'delete', 'wh-1', '--yes'])
    expect(io.out()).toBe('')
    expect(io.err()).toContain('✓ Deleted webhook: wh-1')
  })

  it('a run/test prints {"ok": true, …} in JSON mode', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'webhooks', 'test', 'wh-1', '--json'])
    expect(JSON.parse(io.out())).toMatchObject({ ok: true, message: 'done' })
  })

  it('create keeps the ✓ line on stderr and the resource on stdout', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'webhooks', 'create', '--data', '{"name":"n"}', '--json'])
    expect(JSON.parse(io.out())).toMatchObject({ id: ID })
    expect(io.err()).toContain(`✓ Created webhook: ${ID}`)
  })
})

describe('--data input', () => {
  let io: Captured

  beforeEach(() => {
    resetCommandContext()
    io = captureOutput()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.exitCode = 0
  })

  function clientCapturingCreate() {
    const create = vi.fn().mockResolvedValue({ id: 'wh-1' })
    vi.mocked(clientFactory.createPlatformClient).mockResolvedValue({ webhooks: { create } } as any)
    return create
  }

  it('takes inline JSON', async () => {
    const create = clientCapturingCreate()
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'webhooks', 'create', '--data', '{"name":"inline"}'])
    expect(create).toHaveBeenCalledWith({ name: 'inline' })
  })

  it('reads @file', async () => {
    const create = clientCapturingCreate()
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'webhooks', 'create', '--data', `@${jsonFile}`])
    expect(create).toHaveBeenCalledWith({ name: 'x' })
  })

  it('says which flag held invalid JSON', async () => {
    clientCapturingCreate()
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'webhooks', 'create', '--data', '{nope'])
    expect(process.exitCode).toBe(1)
    expect(io.err()).toContain('--data is not valid JSON')
  })
})

describe('deprecated --json <payload>', () => {
  let io: Captured

  beforeEach(() => {
    resetCommandContext()
    io = captureOutput()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.exitCode = 0
  })

  const argv = (...args: string[]) => ['node', 'marvin', ...args]

  it('is rewritten to --data with a warning naming 4.0', () => {
    const program = buildProgram()
    const out = rewriteDeprecatedJsonPayload(program, argv('platform', 'webhooks', 'create', '--json', '{"name":"n"}'))
    expect(out).toEqual(argv('platform', 'webhooks', 'create', '--data', '{"name":"n"}'))
    expect(io.err()).toMatch(/--json <payload> is deprecated and will be removed in 4\.0; use --data/)
  })

  it('handles --json=<payload> and array payloads', () => {
    const program = buildProgram()
    expect(rewriteDeprecatedJsonPayload(program, argv('platform', 'webhooks', 'update', 'wh-1', '--json={"a":1}')))
      .toEqual(argv('platform', 'webhooks', 'update', 'wh-1', '--data={"a":1}'))
    expect(rewriteDeprecatedJsonPayload(program, argv('platform', 'collections', 'reorder', 'c1', '--json', '[{"entryId":"e"}]')))
      .toEqual(argv('platform', 'collections', 'reorder', 'c1', '--data', '[{"entryId":"e"}]'))
  })

  it('leaves the --json output switch alone', () => {
    const program = buildProgram()
    for (const args of [
      ['platform', 'webhooks', 'create', '--data', '{}', '--json'],
      ['platform', 'webhooks', 'update', '--json', 'wh-1', '--data', '{}'],
      ['platform', 'webhooks', 'list', '--json'],
      ['--json', 'platform', 'webhooks', 'get', 'wh-1'],
    ]) {
      expect(rewriteDeprecatedJsonPayload(program, argv(...args))).toEqual(argv(...args))
    }
    expect(io.err()).toBe('')
  })

  it('does not force JSON output', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'wh-1' })
    vi.mocked(clientFactory.createPlatformClient).mockResolvedValue({ webhooks: { create } } as any)
    const program = buildProgram()
    await program.parseAsync(rewriteDeprecatedJsonPayload(program, argv('platform', 'webhooks', 'create', '--json', '{"name":"n"}')))
    expect(create).toHaveBeenCalledWith({ name: 'n' })
    expect(io.err()).toContain('✓ Created webhook: wh-1')
    expect(getCommandContext()?.outputMode).toBe('table')
  })
})

describe('secrets: value input', () => {
  let io: Captured

  beforeEach(() => {
    resetCommandContext()
    io = captureOutput()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.exitCode = 0
  })

  it('warns when the value comes from --value (shell history)', async () => {
    const create = vi.fn().mockResolvedValue({ id: 's1' })
    vi.mocked(clientFactory.createPlatformClient).mockResolvedValue({ secrets: { create } } as any)
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'secrets', 'create', '--name', 'K', '--value', 'v', '--json'])
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ value: 'v' }))
    expect(io.err()).toMatch(/--value puts the secret in your shell history/)
  })

  it('reads the value from stdin with --value-stdin', async () => {
    const { Readable } = await import('stream')
    const fake = Readable.from(['from-stdin\n']) as any
    fake.isTTY = false
    const stdin = Object.getOwnPropertyDescriptor(process, 'stdin')!
    Object.defineProperty(process, 'stdin', { value: fake, configurable: true })
    try {
      const create = vi.fn().mockResolvedValue({ id: 's1' })
      vi.mocked(clientFactory.createPlatformClient).mockResolvedValue({ secrets: { create } } as any)
      await buildProgram().parseAsync(['node', 'marvin', 'platform', 'secrets', 'create', '--name', 'K', '--value-stdin', '--json'])
      expect(create).toHaveBeenCalledWith(expect.objectContaining({ value: 'from-stdin' }))
      expect(io.err()).not.toMatch(/shell history/)
    } finally {
      Object.defineProperty(process, 'stdin', stdin)
    }
  })

  it('refuses to guess when there is no value and no terminal to prompt on', async () => {
    const { Readable } = await import('stream')
    const fake = Readable.from([]) as any
    fake.isTTY = false
    const stdin = Object.getOwnPropertyDescriptor(process, 'stdin')!
    Object.defineProperty(process, 'stdin', { value: fake, configurable: true })
    try {
      vi.mocked(clientFactory.createPlatformClient).mockResolvedValue({ secrets: { create: vi.fn() } } as any)
      await buildProgram().parseAsync(['node', 'marvin', 'platform', 'secrets', 'create', '--name', 'K'])
      expect(process.exitCode).toBe(1)
      expect(io.err()).toMatch(/--value-stdin/)
    } finally {
      Object.defineProperty(process, 'stdin', stdin)
    }
  })
})
