export function estimateGpuCost(
  rate: number,
  gpus: number,
  users: number,
  speed: number,
  utilization: number,
) {
  if (
    ![rate, gpus, users, speed, utilization].every(Number.isFinite) ||
    rate < 0 ||
    !Number.isInteger(gpus) ||
    gpus < 1 ||
    !Number.isInteger(users) ||
    users < 1 ||
    speed <= 0 ||
    utilization <= 0 ||
    utilization > 100
  )
    return null
  const hourly = rate * gpus
  const tokensPerHour = (users * speed * 3600 * utilization) / 100
  const perMillion = (hourly / tokensPerHour) * 1_000_000
  return Number.isFinite(perMillion) && Number.isFinite(hourly) ? { hourly, perMillion } : null
}
