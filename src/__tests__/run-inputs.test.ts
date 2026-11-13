import { describe, expect, it } from 'vitest'
import { collect, parseRunInputs } from '../shared/run-inputs.js'
import { jobOf, waitForJob } from '../shared/job-wait.js'

describe('run inputs', () => {
  it('turns name=value pairs into an object and reads @files through the reader', () => {
    expect(parseRunInputs(['mode=add', 'text=@draft.txt', 'note=a=b'], (p) => `<${p}>`)).toEqual({ mode: 'add', text: '<draft.txt>', note: 'a=b' })
    expect(parseRunInputs(undefined)).toEqual({})
    expect(collect('b', ['a'])).toEqual(['a', 'b'])
  })
  it('refuses a pair with no name and a name given twice', () => {
    expect(() => parseRunInputs(['=x'])).toThrow('--input needs name=value')
    expect(() => parseRunInputs(['x'])).toThrow('--input needs name=value')
    expect(() => parseRunInputs(['a=1', 'a=2'])).toThrow('--input a is given twice')
  })
})

describe('following a job', () => {
  it('knows a worker job by its kind and a status of the worker', () => {
    expect(jobOf({ slug: 'j', dataJson: { kind: 'render', status: 'running' } })).toEqual({ slug: 'j', kind: 'render', status: 'running' })
    expect(jobOf({ slug: 'p', dataJson: { title: 'x' } })).toBeNull()
    expect(jobOf({ slug: 'p', dataJson: { kind: 'k', status: 'published' } })).toBeNull()
    expect(jobOf(null)).toBeNull()
  })
  it('looks until done, waiting between, and stops at the time limit saying where it got to', async () => {
    const seq = [{ slug: 'j', dataJson: { kind: 'k', status: 'queued' } }, { slug: 'j', dataJson: { kind: 'k', status: 'done', result: 1 } }]
    const slept: number[] = []
    const done = await waitForJob(async () => seq.shift()!, { timeoutMs: 10_000, pollMs: 500, sleep: async (ms) => void slept.push(ms) })
    expect(done).toMatchObject({ finished: true, job: { status: 'done', result: 1 } })
    expect(slept).toEqual([500])
    let t = 0
    const late = await waitForJob(async () => ({ slug: 'j', dataJson: { kind: 'k', status: 'running' } }), { timeoutMs: 1000, pollMs: 400, sleep: async (ms) => void (t += ms), now: () => t })
    expect(late).toMatchObject({ finished: false, job: { status: 'running' } })
    expect(await waitForJob(async () => ({ slug: 'p', dataJson: {} }), { timeoutMs: 1, pollMs: 1 })).toEqual({ job: null, finished: false })
  })
})
