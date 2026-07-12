export function getMonthsUntil(targetDate, today = new Date()) {
  if (!targetDate) return null
  const target = new Date(`${targetDate}T00:00:00`)
  if (Number.isNaN(target.getTime())) return null

  const months = (
    (target.getFullYear() - today.getFullYear()) * 12 +
    (target.getMonth() - today.getMonth()) +
    (target.getDate() > today.getDate() ? 1 : 0)
  )

  return Math.max(months, 1)
}

export function buildSavingsPlan(goal, today = new Date()) {
  const current = Number(goal?.currentAmount || 0)
  const target = Number(goal?.targetAmount || 0)
  const remaining = Math.max(target - current, 0)
  const monthsLeft = getMonthsUntil(goal?.targetDate, today)
  const monthlyNeeded = monthsLeft ? remaining / monthsLeft : null
  const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0

  return {
    current,
    target,
    remaining,
    monthsLeft,
    monthlyNeeded,
    progress,
    status: remaining <= 0 ? 'Funded' : !monthsLeft ? 'No date' : monthlyNeeded <= 0 ? 'Funded' : 'Needs funding'
  }
}
