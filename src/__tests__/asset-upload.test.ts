/**
 * `platform assets upload` sends the file under its own name: the server reads the type from the extension, so a nameless
 * upload was stored as application/octet-stream and no picture or audio step could use it.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { createPlatformCommand } from '../commands/platform/index.js'
import { clientFactory } from '../shared/clients.js'
import { resetCommandContext, trackCommandContext } from '../shared/command-context.js'
import { captureOutput } from './helpers/capture.js'

vi.mock('../shared/clients.js', () => ({
  clientFactory: { createPlatformClient: vi.fn(), createPublishClient: vi.fn() },
  ClientFactory: class {},
}))

const dir = mkdtempSync(join(tmpdir(), 'marvin-upload-'))

async function run(...args: string[]): Promise<void> {
  const program = new Command('marvin').exitOverride().option('--json', 'JSON output', false)
  trackCommandContext(program)
  program.addCommand(createPlatformCommand())
  await program.parseAsync(['node', 'marvin', ...args])
}

describe('platform assets upload', () => {
  let platform: any

  beforeEach(() => {
    resetCommandContext()
    captureOutput()
    platform = { assets: { upload: vi.fn().mockResolvedValue({ id: 'a1', assetType: 'image', mimeType: 'image/jpeg', fileSize: 4, checksum: 'x' }) } }
    vi.mocked(clientFactory.createPlatformClient).mockResolvedValue(platform)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.exitCode = 0
  })

  it('uploads the file with its own name and bytes', async () => {
    const path = join(dir, 'cook-master.jpg')
    writeFileSync(path, Buffer.from([0xff, 0xd8, 0xff, 0xe0]))

    await run('platform', 'assets', 'upload', path, '--slug', 'cook', '--name', 'Cook', '--json')

    const [file, meta] = platform.assets.upload.mock.calls[0]
    expect(file.name).toBe('cook-master.jpg')
    expect(file.size).toBe(4)
    expect(meta).toMatchObject({ slug: 'cook', name: 'Cook' })
  })
})
