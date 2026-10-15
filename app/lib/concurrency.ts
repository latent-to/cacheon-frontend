export type ConcurrencyPoint = { users: number; throughput: number }

// Points must come from the same hardware, runtime, checkpoint and workload.
// A piecewise linear fit preserves measured values without polynomial overshoot.
export function concurrencyRange(points: readonly ConcurrencyPoint[]) {
  if (
    points.length === 0 ||
    points.some(
      (point, index) =>
        !Number.isInteger(point.users) ||
        point.users < 1 ||
        !Number.isFinite(point.throughput) ||
        point.throughput <= 0 ||
        (index > 0 && point.users <= points[index - 1].users),
    )
  )
    return null
  return { min: points[0].users, max: points[points.length - 1].users }
}

export function estimateUserThroughput(points: readonly ConcurrencyPoint[], users: number) {
  const range = concurrencyRange(points)
  // Never extrapolate, including when only one measured concurrency is available.
  if (!range || !Number.isInteger(users) || users < range.min || users > range.max) return null
  const exact = points.find((point) => point.users === users)
  if (exact) return exact.throughput
  const upperIndex = points.findIndex((point) => point.users > users)
  const lower = points[upperIndex - 1]
  const upper = points[upperIndex]
  const fraction = (users - lower.users) / (upper.users - lower.users)
  return lower.throughput + fraction * (upper.throughput - lower.throughput)
}

export function clampConcurrency(points: readonly ConcurrencyPoint[], users: number) {
  const range = concurrencyRange(points)
  if (!range || !Number.isFinite(users)) return null
  return Math.max(range.min, Math.min(range.max, Math.round(users)))
}
