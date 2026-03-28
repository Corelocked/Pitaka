export const DEFAULT_CURRENCY = 'PHP'

export const SUPPORTED_CURRENCIES = [
  { code: 'PHP', label: 'Philippine Peso', locale: 'en-PH' },
  { code: 'USD', label: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', label: 'Euro', locale: 'en-IE' },
  { code: 'GBP', label: 'British Pound', locale: 'en-GB' },
  { code: 'JPY', label: 'Japanese Yen', locale: 'ja-JP' },
  { code: 'AUD', label: 'Australian Dollar', locale: 'en-AU' },
  { code: 'CAD', label: 'Canadian Dollar', locale: 'en-CA' },
  { code: 'SGD', label: 'Singapore Dollar', locale: 'en-SG' },
  { code: 'HKD', label: 'Hong Kong Dollar', locale: 'en-HK' },
  { code: 'AED', label: 'UAE Dirham', locale: 'en-AE' }
]

const currencyMap = Object.fromEntries(
  SUPPORTED_CURRENCIES.map((currency) => [currency.code, currency])
)

export function getCurrencyConfig(currencyCode = DEFAULT_CURRENCY) {
  return currencyMap[currencyCode] || currencyMap[DEFAULT_CURRENCY]
}

export function getCurrencyCode(currencyCode = DEFAULT_CURRENCY) {
  return getCurrencyConfig(currencyCode).code
}

export function formatCurrency(amount = 0, currencyCode = DEFAULT_CURRENCY, options = {}) {
  const config = getCurrencyConfig(currencyCode)
  const {
    maximumFractionDigits = 2,
    minimumFractionDigits,
    currencyDisplay = 'symbol'
  } = options

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    currencyDisplay,
    maximumFractionDigits,
    minimumFractionDigits: minimumFractionDigits ?? maximumFractionDigits
  }).format(Number(amount || 0))
}

export function formatMoneyInputLabel(currencyCode = DEFAULT_CURRENCY) {
  return `${getCurrencyCode(currencyCode)} amount`
}

export function getWalletCurrency(wallet) {
  return wallet?.currency || DEFAULT_CURRENCY
}

export function summarizeByCurrency(items = [], getAmount, getCurrency) {
  const totals = new Map()

  items.forEach((item) => {
    const currency = getCurrency(item) || DEFAULT_CURRENCY
    const amount = Number(getAmount(item) || 0)
    totals.set(currency, (totals.get(currency) || 0) + amount)
  })

  return Array.from(totals.entries()).map(([currency, total]) => ({ currency, total }))
}

export function formatCurrencySummary(summary = []) {
  if (!summary.length) return formatCurrency(0, DEFAULT_CURRENCY)
  if (summary.length === 1) return formatCurrency(summary[0].total, summary[0].currency)

  return summary
    .map(({ currency, total }) => `${currency} ${Number(total || 0).toFixed(2)}`)
    .join(' · ')
}
