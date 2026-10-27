import { DEFAULT_CURRENCY, getWalletCurrency } from './currency.js'

export function buildTransactionFeed({
  incomes = [],
  expenses = [],
  transfers = [],
  wallets = []
}) {
  const walletMap = new Map(wallets.map((wallet) => [wallet.id, wallet]))
  return [
    ...incomes.map((entry) => ({
      ...entry,
      type: 'income',
      title: entry.source || 'Income'
    })),
    ...expenses.map((entry) => ({
      ...entry,
      type: 'expense',
      title: entry.description || 'Expense'
    })),
    ...transfers.map((entry) => ({
      ...entry,
      type: 'transfer',
      title: entry.toWalletId ? 'Account transfer' : 'Savings contribution'
    }))
  ]
    .map((entry) => ({
      ...entry,
      key: `${entry.type}:${entry.id}`,
      currency:
        entry.currency ||
        getWalletCurrency(
          walletMap.get(entry.walletId || entry.fromWalletId)
        ) ||
        DEFAULT_CURRENCY,
      account:
        entry.type === 'transfer'
          ? `${walletMap.get(entry.fromWalletId)?.name || 'Account'} → ${walletMap.get(entry.toWalletId)?.name || 'Savings goal'}`
          : walletMap.get(entry.walletId)?.name || 'No account',
      category:
        entry.category ||
        (entry.type === 'income'
          ? 'Income'
          : entry.type === 'transfer'
            ? 'Transfer'
            : 'Uncategorized')
    }))
    .sort(
      (a, b) =>
        String(b.date || '').localeCompare(String(a.date || '')) ||
        a.key.localeCompare(b.key)
    )
}

export function splitExpenseAmount(amount, splitAmount) {
  const totalCents = Math.round(Number(amount) * 100)
  const splitCents = Math.round(Number(splitAmount) * 100)
  if (
    !Number.isSafeInteger(totalCents) ||
    !Number.isSafeInteger(splitCents) ||
    splitCents <= 0 ||
    splitCents >= totalCents
  ) {
    throw new Error(
      'The split amount must be greater than zero and less than the total.'
    )
  }
  return [(totalCents - splitCents) / 100, splitCents / 100]
}
