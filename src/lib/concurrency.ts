/**
 * Map with a concurrency ceiling.
 *
 * The English-enforcement and transplant passes used a bare `Promise.all` over
 * every paragraph, so a 25-paragraph draft opened 25 simultaneous Claude requests
 * each holding an 8-16k token response in memory. That is what OOM-killed the
 * Railway container (see the humanize fix in commit ac3e25d) and what makes the
 * Anthropic 429 retry path fire in bursts. Results stay in input order.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let cursor = 0

  const worker = async () => {
    while (true) {
      const i = cursor++
      if (i >= items.length) return
      results[i] = await fn(items[i], i)
    }
  }

  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, worker)
  await Promise.all(workers)
  return results
}
