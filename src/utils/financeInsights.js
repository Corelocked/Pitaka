export function clamp(value, min = 0, max = 100) {
  return Math.min(Math.max(value, min), max)
}

export function getMonthProgress(date = new Date()) {
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const day = clamp(date.getDate(), 1, daysInMonth)
  return { day, daysInMonth, remainingDays: Math.max(daysInMonth - day, 0) }
}

export function buildFinanceInsights({
  cash = 0,
  income = 0,
  expenses = 0,
  savings = 0,
  upcomingBills = 0,
  date = new Date()
} = {}) {
  const { day, remainingDays } = getMonthProgress(date)
  const dailySpend = day > 0 ? expenses / day : 0
  const projectedRemainingSpend = dailySpend * remainingDays
  const projectedExpenses = expenses + projectedRemainingSpend + upcomingBills
  const projectedMonthEnd = cash + income - projectedExpenses
  const runwayDays = dailySpend > 0 ? Math.floor(cash / dailySpend) : null
  const expenseLoad = income > 0 ? (expenses / income) * 100 : 0
  const savingsBuffer = expenses > 0 ? (savings / expenses) * 100 : 0
  const billLoad = income > 0 ? (upcomingBills / income) * 100 : 0
  const score = Math.round(clamp(
    100 -
    Math.max(expenseLoad - 65, 0) * 0.8 -
    Math.max(billLoad - 20, 0) -
    (projectedMonthEnd < 0 ? 25 : 0) +
    Math.min(savingsBuffer, 100) * 0.15
  ))

  return {
    score,
    status: score >= 80 ? 'Strong' : score >= 60 ? 'Steady' : score >= 40 ? 'Tight' : 'Risky',
    projectedMonthEnd,
    projectedExpenses,
    runwayDays,
    expenseLoad,
    savingsBuffer,
    billLoad
  }
}
