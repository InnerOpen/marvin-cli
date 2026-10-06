/**
 * Publishing ergonomics against a mocked SDK: `publish entries --tag/--slug/--updated-since/--expand`,
 * `publish asset --download` and `platform assets download`.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { mkdtempSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { Entry } from '@inneropen/marvin-sdk'
import { createPlatformCommand } from '../commands/platform/index.js'
import { createPublishCommand } from '../commands/publish/index.js'
import { clientFactory } from '../shared/clients.js'
import { resetCommandContext, trackCommandContext } from '../shared/command-context.js'
import { captureOutput, type Captured } from './helpers/capture.js'

vi.mock('../shared/clients.js', () => ({
  clientFactory: { createPlatformClient: vi.fn(), createPublishClient: vi.fn() },
  ClientFactory: class {},
}))

const dir = mkdtempSync(join(tmpdir(), 'marvin-publish-'))

function buildProgram(): Command {
  const program = new Command('marvin')
    .exitOverride()
    .option('--output <format>', 'Output format', 'table')
    .option('--json', 'JSON output', false)
    .option('--yaml', 'YAML output', false)
    .option('--csv', 'CSV output', false)
  trackCommandContext(program)
  program.addCommand(createPlatformCommand())
  program.addCommand(createPublishCommand())
  return program
}

async function run(...args: string[]): Promise<void> {
  await buildProgram().parseAsync(['node', 'marvin', ...args])
}

const PNG = { data: new Uint8Array([137, 80, 78, 71]), contentType: 'image/png' }

describe('publishing', () => {
  let io: Captured
  let publish: any

  beforeEach(() => {
    resetCommandContext()
    io = captureOutput()
    publish = {
      entries: { list: vi.fn().mockResolvedValue([{ title: 'Hello', slug: 'hello', entryType: 'post', status: 'published', publishedAt: null }]) },
      assets: { download: vi.fn().mockResolvedValue(PNG), get: vi.fn() },
    }
    vi.mocked(clientFactory.createPublishClient).mockReturnValue(publish)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.exitCode = 0
  })

  it('publish entries passes --tag, --slug, --updated-since and --expand full', async () => {
    await run('publish', 'entries', '--tag', 'news,events', '--slug', 'hello', '--updated-since', '2026-10-01', '--expand', 'full', '--json')
    expect(publish.entries.list).toHaveBeenCalledWith({
      entryType: undefined, collection: undefined, tag: 'news,events', slug: 'hello', updatedSince: '2026-10-01',
      limit: undefined, offset: undefined, expand: 'full',
    })
  })

  it('publish entries without --expand sends no expand', async () => {
    await run('publish', 'entries', '--json')
    expect(publish.entries.list.mock.calls[0][0]).not.toHaveProperty('expand')
  })

  it('expanded entries print as their data', async () => {
    const raw = { slug: 'hello', title: 'Hello', entryType: 'post', data: {}, collections: [], assets: [], resources: [], tags: [] }
    publish.entries.list.mockResolvedValueOnce([new Entry(raw as any)])
    await run('publish', 'entries', '--expand', 'full', '--yaml')
    expect(io.out()).toContain('slug: hello')
    expect(io.out()).not.toContain('raw')
  })

  it.each([
    [['--expand', 'some'], '--expand takes one value: full'],
    [['--updated-since', 'yesterday'], '--updated-since must be an ISO 8601'],
  ])('publish entries validates %j', async (args, message) => {
    await run('publish', 'entries', ...args)
    expect(process.exitCode).toBe(1)
    expect(io.err()).toContain(message)
    expect(publish.entries.list).not.toHaveBeenCalled()
  })

  it('publish asset --download --out-file writes the file and reports it', async () => {
    const out = join(dir, 'logo.png')
    await run('publish', 'asset', 'logo', '--download', '--out-file', out, '--json')
    expect(publish.assets.download).toHaveBeenCalledWith('logo')
    expect(Array.from(readFileSync(out))).toEqual([137, 80, 78, 71])
    expect(JSON.parse(io.out())).toEqual({ ok: true, file: out, bytes: 4, contentType: 'image/png' })
  })

  it('publish asset --download with stdout piped writes the bytes to stdout', async () => {
    const writes: unknown[] = []
    vi.mocked(process.stdout.write).mockImplementation(((chunk: unknown) => { writes.push(chunk); return true }) as any)
    await run('publish', 'asset', 'logo', '--download')
    expect(writes).toHaveLength(1)
    expect(Array.from(writes[0] as Buffer)).toEqual([137, 80, 78, 71])
  })

  it('publish asset --download refuses to write binary to a terminal', async () => {
    const tty = process.stdout.isTTY
    process.stdout.isTTY = true
    try {
      await run('publish', 'asset', 'logo', '--download')
    } finally {
      process.stdout.isTTY = tty
    }
    expect(process.exitCode).toBe(1)
    expect(io.err()).toContain('Pass --out-file <path>')
    expect(publish.assets.download).not.toHaveBeenCalled()
  })

  it('--out-file without --download is an error', async () => {
    await run('publish', 'asset', 'logo', '--out-file', join(dir, 'x'))
    expect(process.exitCode).toBe(1)
    expect(io.err()).toContain('--out-file goes with --download')
  })

  it('platform assets download writes the bytes to --out-file', async () => {
    const download = vi.fn().mockResolvedValue(PNG)
    vi.mocked(clientFactory.createPlatformClient).mockResolvedValue({ assets: { download } } as any)
    const out = join(dir, 'platform.png')
    await run('platform', 'assets', 'download', 'a1', '--out-file', out)
    expect(download).toHaveBeenCalledWith('a1')
    expect(Array.from(readFileSync(out))).toEqual([137, 80, 78, 71])
    expect(io.err()).toContain(`Wrote 4 bytes to ${out} (image/png)`)
  })
})
