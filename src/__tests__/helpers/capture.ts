/**
 * Capture what a command writes to stdout and stderr, whether through console.* or the streams.
 * Call inside a test (or beforeEach); `vi.restoreAllMocks()` undoes it.
 */
import { vi } from 'vitest'

export interface Captured {
  stdout: string[]
  stderr: string[]
  /** Rows handed to console.table (table mode). */
  tables: unknown[]
  /** Everything written to stdout, joined. */
  out(): string
  /** Everything written to stderr, joined. */
  err(): string
  clear(): void
}

export function captureOutput(): Captured {
  const stdout: string[] = []
  const stderr: string[] = []
  const tables: unknown[] = []
  const join = (a: unknown[]) => a.map(String).join(' ')

  vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => { stdout.push(join(a)) })
  vi.spyOn(console, 'dir').mockImplementation((a: unknown) => { stdout.push(JSON.stringify(a)) })
  vi.spyOn(console, 'table').mockImplementation((a: unknown) => { tables.push(a); stdout.push(JSON.stringify(a)) })
  vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => { stderr.push(join(a)) })
  vi.spyOn(console, 'warn').mockImplementation((...a: unknown[]) => { stderr.push(join(a)) })
  vi.spyOn(process.stdout, 'write').mockImplementation(((chunk: unknown) => {
    stdout.push(String(chunk).replace(/\n$/, ''))
    return true
  }) as any)
  vi.spyOn(process.stderr, 'write').mockImplementation(((chunk: unknown) => {
    stderr.push(String(chunk).replace(/\n$/, ''))
    return true
  }) as any)

  return {
    stdout,
    stderr,
    tables,
    out: () => stdout.join('\n'),
    err: () => stderr.join('\n'),
    clear: () => { stdout.length = 0; stderr.length = 0; tables.length = 0 },
  }
}
