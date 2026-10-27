export function getBudgetSpending(
  category,
  expenses,
  wallets,
  currency = 'PHP'
) {
  const walletMap = new Map(wallets.map((wallet) => [wallet.id, wallet]))
  return expenses
    .filter(
      (expense) =>
        expense.categoryId === category.id || expense.category === category.name
    )
    .filter(
      (expense) =>
        (expense.currency ||
          walletMap.get(expense.walletId)?.currency ||
          'PHP') === currency
    )
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
}
