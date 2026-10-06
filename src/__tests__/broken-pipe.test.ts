/**
 * `marvin … | head`: when the reader closes the pipe, the CLI exits quietly instead of crashing
 * with an unhandled EPIPE.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { EventEmitter } from 'node:events'
import { spawn } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import { exitQuietlyOnBrokenPipe } from '../shared/io.js'

const ioModule = pathToFileURL(join(dirname(fileURLToPath(import.meta.url)), '../shared/io.ts')).href

function pipeError(code: string): NodeJS.ErrnoException {
  return Object.assign(new Error(`write ${code}`), { code })
}

describe('exitQuietlyOnBrokenPipe', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    process.exitCode = 0
  })

  it('exits with the current exit code on EPIPE', () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => { throw new Error('exited') }) as any)
    const stream = new EventEmitter() as unknown as NodeJS.WritableStream
    exitQuietlyOnBrokenPipe(stream)

    expect(() => stream.emit('error', pipeError('EPIPE'))).toThrow('exited')
    expect(exit).toHaveBeenCalledWith(0)

    process.exitCode = 1
    expect(() => stream.emit('error', pipeError('EPIPE'))).toThrow('exited')
    expect(exit).toHaveBeenLastCalledWith(1)
  })

  it('rethrows any other stream error', () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as any)
    const stream = new EventEmitter() as unknown as NodeJS.WritableStream
    exitQuietlyOnBrokenPipe(stream)

    expect(() => stream.emit('error', pipeError('EIO'))).toThrow('write EIO')
    expect(exit).not.toHaveBeenCalled()
  })

  it('a process piped into a reader that stops early exits 0 without a stack trace', async () => {
    // Writes far more than one pipe buffer, like a big `--csv` list
    const script =
      `const { exitQuietlyOnBrokenPipe } = await import(${JSON.stringify(ioModule)});` +
      `exitQuietlyOnBrokenPipe(process.stdout);` +
      `for (let i = 0; i < 200000; i++) process.stdout.write('row,' + i + '\\n');`
    const child = spawn(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', script], {
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stderr = ''
    child.stderr.on('data', (chunk) => { stderr += chunk })
    // Read the first chunk, then hang up, as `head -1` does
    child.stdout.once('data', () => child.stdout.destroy())

    const code = await new Promise<number | null>((resolve) => child.on('close', resolve))
    expect(stderr).not.toContain('EPIPE')
    expect(code).toBe(0)
  }, 20000)
})
