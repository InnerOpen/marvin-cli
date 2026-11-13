/**
 * Following the worker job a workflow run started. A workflow that does real work makes a `job` record and a worker picks it up (the record's
 * `kind` says what to do, its `status` goes queued -> claimed -> running -> done or failed, and `result` and `log` are written back). Running
 * the workflow only starts it; `--wait` is how the terminal gets the outcome too. Nothing here knows what a job does.
 */

export const FINISHED = ["done", "failed"] as const;
const ACTIVE = ["queued", "claimed", "running"] as const;

export interface JobState {
  slug: string;
  kind: string;
  status: string;
  result?: unknown;
  log?: string;
}

/** Where a job stands, or null when the entry is not a worker job (no `kind`, or a status that is not the worker's). */
export function jobOf(entry: { slug?: string; dataJson?: Record<string, unknown> | null } | null | undefined): JobState | null {
  const data = entry?.dataJson ?? {};
  const status = String(data.status ?? "");
  if (!data.kind || ![...ACTIVE, ...FINISHED].includes(status as never)) return null;
  return {
    slug: String(entry?.slug ?? ""),
    kind: String(data.kind),
    status,
    ...(data.result !== undefined && data.result !== null ? { result: data.result } : {}),
    ...(data.log ? { log: String(data.log) } : {}),
  };
}

export interface WaitOptions {
  timeoutMs: number;
  pollMs: number;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
}

/** Look at the job until it is done or failed, or the time is up. `finished` says which; `job` is null when the entry is not a worker job. */
export async function waitForJob(
  get: () => Promise<{ slug?: string; dataJson?: Record<string, unknown> | null }>,
  { timeoutMs, pollMs, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), now = Date.now }: WaitOptions,
): Promise<{ job: JobState | null; finished: boolean }> {
  const deadline = now() + timeoutMs;
  for (;;) {
    const job = jobOf(await get());
    if (!job) return { job: null, finished: false };
    if ((FINISHED as readonly string[]).includes(job.status)) return { job, finished: true };
    if (now() >= deadline) return { job, finished: false };
    await sleep(Math.min(pollMs, Math.max(0, deadline - now())));
  }
}
