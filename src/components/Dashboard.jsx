import { useMemo } from 'react'
import {
  ActivityIcon,
  ChartIcon,
  ExpenseIcon,
  IncomeIcon,
  TrendUpIcon,
  WalletIcon,
  ChevronRightIcon
} from './Icons'
import {
  DEFAULT_CURRENCY,
  formatCurrency,
  formatCurrencySummary,
  getWalletCurrency,
  summarizeByCurrency
} from '../utils/currency'
import { buildTransactionFeed } from '../utils/transactions'
import { buildSavingsPlan } from '../utils/savingsPlan'

function Empty({ children, action, onAction }) {
  return (
    <div className="overview-empty">
      <p>{children}</p>
      {action && (
        <button className="text-action" onClick={onAction}>
          {action}
          <ChevronRightIcon size={16} />
        </button>
      )}
    </div>
  )
}

function Panel({ title, icon, action, onAction, children }) {
  const Icon = icon
  return (
    <section className="card overview-panel">
      <div className="overview-panel-heading">
        <h2>
          <Icon size={19} />
          {title}
        </h2>
        {action && (
          <button className="text-action" onClick={onAction}>
            {action}
            <ChevronRightIcon size={16} />
          </button>
        )}
      </div>
      {children}
    </section>
  )
}

export default function Dashboard({
  walletBalances = [],
  savings = [],
  filteredIncomes = [],
  filteredExpenses = [],
  transfers = [],
  subscriptions = [],
  netWorthSnapshots = [],
  categoryBudgets = [],
  selectedMonth,
  selectedYear,
  preset,
  onNavigate,
  onAddAccount
}) {
  const period = new Date(selectedYear, selectedMonth).toLocaleDateString(
    'en-PH',
    { month: 'long', year: 'numeric' }
  )
  const walletMap = useMemo(
    () => new Map(walletBalances.map((wallet) => [wallet.id, wallet])),
    [walletBalances]
  )
  const currencyOf = (entry) =>
    entry.currency || getWalletCurrency(walletMap.get(entry.walletId))
  const balances = summarizeByCurrency(
    walletBalances,
    (wallet) => wallet.balance,
    getWalletCurrency
  )
  const incomeTotals = summarizeByCurrency(
    filteredIncomes,
    (entry) => entry.amount,
    currencyOf
  )
  const expenseTotals = summarizeByCurrency(
    filteredExpenses,
    (entry) => entry.amount,
    currencyOf
  )
  const netTotals = summarizeByCurrency(
    [
      ...filteredIncomes.map((entry) => ({
        ...entry,
        signed: Number(entry.amount)
      })),
      ...filteredExpenses.map((entry) => ({
        ...entry,
        signed: -Number(entry.amount)
      }))
    ],
    (entry) => entry.signed,
    currencyOf
  )
  const savedTotals = summarizeByCurrency(
    savings,
    (goal) => goal.currentAmount,
    (goal) => goal.currency
  )
  const recent = buildTransactionFeed({
    incomes: filteredIncomes,
    expenses: filteredExpenses,
    wallets: walletBalances,
    transfers: transfers.filter((entry) =>
      String(entry.date).startsWith(
        `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`
      )
    )
  }).slice(0, 5)
  const categories = new Map()
  filteredExpenses.forEach((entry) => {
    const currency = currencyOf(entry)
    const name = entry.category || 'Uncategorized'
    const key = `${currency}:${name}`
    const previous = categories.get(key)
    categories.set(key, {
      key,
      currency,
      name,
      amount: (previous?.amount || 0) + Number(entry.amount || 0)
    })
  })
  const spending = [...categories.values()]
    .sort((a, b) => a.currency.localeCompare(b.currency) || b.amount - a.amount)
    .slice(0, 6)
  const monthCurrencies = [
    ...new Set(
      [...incomeTotals, ...expenseTotals].map((entry) => entry.currency)
    )
  ]
  const chartCurrency = monthCurrencies[0] || DEFAULT_CURRENCY
  const weeks = Array.from({ length: 5 }, (_, index) => ({
    label: `${index * 7 + 1}–${Math.min((index + 1) * 7, new Date(selectedYear, selectedMonth + 1, 0).getDate())}`,
    income: 0,
    expense: 0
  })).filter(
    (week) =>
      Number(week.label.split('–')[0]) <=
      new Date(selectedYear, selectedMonth + 1, 0).getDate()
  )
  for (const [entries, type] of [
    [filteredIncomes, 'income'],
    [filteredExpenses, 'expense']
  ]) {
    entries.forEach((entry) => {
      const day = Number(String(entry.date).slice(8, 10))
      const week = weeks[Math.floor((day - 1) / 7)]
      if (week && currencyOf(entry) === chartCurrency)
        week[type] += Number(entry.amount || 0)
    })
  }
  const maxWeek = Math.max(
    1,
    ...weeks.flatMap((week) => [week.income, week.expense])
  )
  const alerts = categoryBudgets.filter(
    (budget) => budget.hasBudget && ['warning', 'over'].includes(budget.status)
  )
  const goals = [...savings]
    .map((goal) => ({ ...goal, plan: buildSavingsPlan(goal) }))
    .slice(0, 3)
  const history = [...netWorthSnapshots]
    .sort((a, b) => String(a.monthKey).localeCompare(String(b.monthKey)))
    .slice(-6)
  const bills = subscriptions
    .filter(
      (bill) => bill.isActive !== false && (bill.nextDueDate || bill.startDate)
    )
    .sort((a, b) =>
      String(a.nextDueDate || a.startDate).localeCompare(
        String(b.nextDueDate || b.startDate)
      )
    )
    .slice(0, 4)

  const sections = {
    'recent-activity': (
      <Panel
        title="Recent activity"
        icon={ActivityIcon}
        action="View all"
        onAction={() => onNavigate('transactions')}
      >
        {recent.length ? (
          <div className="overview-activity">
            {recent.map((entry) => (
              <button
                key={entry.key}
                className="overview-transaction"
                onClick={() => onNavigate('transactions')}
              >
                <span className={`activity-type activity-type--${entry.type}`}>
                  {entry.type === 'income' ? (
                    <IncomeIcon size={19} />
                  ) : entry.type === 'expense' ? (
                    <ExpenseIcon size={19} />
                  ) : (
                    <ActivityIcon size={19} />
                  )}
                </span>
                <span className="overview-row-copy">
                  <strong>{entry.title}</strong>
                  <small>
                    {new Date(`${entry.date}T00:00:00`).toLocaleDateString(
                      'en-PH',
                      { month: 'short', day: 'numeric' }
                    )}{' '}
                    · {entry.account}
                  </small>
                </span>
                <strong className={`overview-row-amount amount-${entry.type}`}>
                  {entry.type === 'income'
                    ? '+'
                    : entry.type === 'expense'
                      ? '−'
                      : ''}
                  {formatCurrency(entry.amount, entry.currency)}
                </strong>
              </button>
            ))}
          </div>
        ) : (
          <Empty
            action="Add your first transaction"
            onAction={() => onNavigate('transactions')}
          >
            Every expense and payday, together in one place.
          </Empty>
        )}
      </Panel>
    ),
    spending: (
      <Panel
        title="Where it went"
        icon={ChartIcon}
        action="Budgets"
        onAction={() => onNavigate('categories')}
      >
        {spending.length ? (
          <div className="overview-spending">
            {spending.map((category, index) => {
              const total =
                expenseTotals.find(
                  (entry) => entry.currency === category.currency
                )?.total || 1
              const share = (category.amount / total) * 100
              return (
                <div className="overview-spending-row" key={category.key}>
                  <div>
                    <span>
                      <i
                        className={`overview-dot overview-dot--${index % 4}`}
                      />
                      {category.name}
                    </span>
                    <strong>
                      {formatCurrency(category.amount, category.currency)}
                    </strong>
                  </div>
                  <div
                    className="overview-track"
                    role="img"
                    aria-label={`${category.name}: ${share.toFixed(0)}% of ${category.currency} spending`}
                  >
                    <span style={{ width: `${Math.min(share, 100)}%` }} />
                  </div>
                </div>
              )
            })}
            {expenseTotals.length > 1 && (
              <p className="overview-note">
                Each currency is shown separately.
              </p>
            )}
          </div>
        ) : (
          <Empty
            action="Review activity"
            onAction={() => onNavigate('transactions')}
          >
            Log an expense to understand your spending.
          </Empty>
        )}
      </Panel>
    ),
    accounts: (
      <Panel
        title="Your accounts"
        icon={WalletIcon}
        action="Manage"
        onAction={() => onNavigate('accounts')}
      >
        {walletBalances.length ? (
          <div className="overview-accounts">
            {walletBalances.slice(0, 4).map((wallet) => (
              <button
                className="overview-account"
                key={wallet.id}
                onClick={() => onNavigate('accounts')}
              >
                <span
                  className={`overview-account-mark overview-account-mark--${wallet.accountType || 'cash'}`}
                >
                  <WalletIcon size={20} />
                </span>
                <span className="overview-row-copy">
                  <strong>{wallet.name}</strong>
                  <small>
                    {{
                      bank: 'Bank account',
                      credit: 'Credit card',
                      ewallet: 'E-wallet',
                      savings: 'Savings account',
                      investment: 'Investment account'
                    }[wallet.accountType] || 'Cash account'}
                  </small>
                </span>
                <strong className="overview-row-amount">
                  {formatCurrency(wallet.balance, getWalletCurrency(wallet))}
                </strong>
              </button>
            ))}
          </div>
        ) : (
          <Empty action="Add an account" onAction={onAddAccount}>
            Start with your cash, bank account, or e-wallet.
          </Empty>
        )}
      </Panel>
    ),
    savings: (
      <Panel
        title="Things you’re saving for"
        icon={TrendUpIcon}
        action="Goals"
        onAction={() => onNavigate('wealth')}
      >
        {goals.length ? (
          <div className="overview-goals">
            {goals.map((goal) => (
              <button
                className="overview-goal"
                key={goal.id}
                onClick={() => onNavigate('wealth')}
              >
                <div>
                  <strong>{goal.goal}</strong>
                  <span>{goal.plan.progress.toFixed(0)}%</span>
                </div>
                <div className="overview-track">
                  <span style={{ width: `${goal.plan.progress}%` }} />
                </div>
                <small>
                  {formatCurrency(goal.currentAmount || 0, goal.currency)} of{' '}
                  {formatCurrency(goal.targetAmount, goal.currency)}
                </small>
              </button>
            ))}
          </div>
        ) : (
          <Empty
            action="Create a savings goal"
            onAction={() => onNavigate('wealth')}
          >
            Give your next big thing a place in your plan.
          </Empty>
        )}
      </Panel>
    ),
    'cashflow-chart': (
      <Panel title="Income & spending" icon={ChartIcon}>
        {monthCurrencies.length > 1 ? (
          <Empty>
            Charts compare one currency at a time. Review your separate currency
            totals in Activity.
          </Empty>
        ) : (
          <>
            <p className="overview-note">
              Weekly totals · {chartCurrency} · {period}
            </p>
            <div
              className="overview-chart"
              role="list"
              aria-label="Weekly income and spending"
            >
              {weeks.map((week) => (
                <div
                  key={week.label}
                  role="listitem"
                  aria-label={`Days ${week.label}: income ${formatCurrency(week.income, chartCurrency)}, expenses ${formatCurrency(week.expense, chartCurrency)}`}
                >
                  <div className="overview-bars" aria-hidden="true">
                    <span
                      style={{ height: `${(week.income / maxWeek) * 100}%` }}
                    />
                    <span
                      style={{ height: `${(week.expense / maxWeek) * 100}%` }}
                    />
                  </div>
                  <small>{week.label}</small>
                </div>
              ))}
            </div>
            <div className="overview-legend">
              <span>
                <i />
                Income
              </span>
              <span>
                <i />
                Expenses
              </span>
            </div>
          </>
        )}
      </Panel>
    ),
    'plan-ahead': (
      <Panel
        title="Your spending plan"
        icon={ChartIcon}
        action="Review plan"
        onAction={() => onNavigate('plan')}
      >
        <Empty>
          {alerts.length
            ? `${alerts.length} budget${alerts.length === 1 ? '' : 's'} approaching or over the limit.`
            : 'Check your budgets, savings, and recurring payments in Plan.'}
        </Empty>
      </Panel>
    ),
    'upcoming-bills': (
      <Panel
        title="Bills & subscriptions"
        icon={ExpenseIcon}
        action="Manage"
        onAction={() => onNavigate('subscriptions')}
      >
        {bills.length ? (
          bills.map((bill) => (
            <div className="overview-bill" key={bill.id}>
              <span>
                <strong>{bill.name}</strong>
                <small>Next due {bill.nextDueDate || bill.startDate}</small>
              </span>
              <strong>
                {formatCurrency(
                  bill.amount,
                  bill.currency ||
                    getWalletCurrency(walletMap.get(bill.walletId))
                )}
              </strong>
            </div>
          ))
        ) : (
          <Empty>Manage recurring payments in Plan.</Empty>
        )}
      </Panel>
    ),
    'net-worth-history': (
      <Panel title="Net worth history" icon={TrendUpIcon}>
        {history.length ? (
          <div className="overview-history">
            {history.map((snapshot) => (
              <div key={snapshot.id || snapshot.monthKey}>
                <span>{snapshot.monthKey}</span>
                <strong>
                  {formatCurrency(snapshot.total, snapshot.currency)}
                </strong>
              </div>
            ))}
            <p className="overview-note">
              Recorded balances, savings, and holdings. Separate currencies are
              not converted.
            </p>
          </div>
        ) : (
          <Empty>Your history will appear as you track your accounts.</Empty>
        )}
      </Panel>
    )
  }

  const order = (
    preset?.widgetOrder || [
      'recent-activity',
      'spending',
      'accounts',
      'savings'
    ]
  ).filter((id) => sections[id])
  return (
    <div className="mobile-content finance-home">
      <section className="overview-balance" aria-label="Account balance">
        <div>
          <span className="overview-balance-label">
            <WalletIcon size={18} />
            Total account balance
          </span>
          <div className="overview-balance-value">
            {formatCurrencySummary(balances)}
          </div>
          <p>
            Across {walletBalances.length} account
            {walletBalances.length === 1 ? '' : 's'} · Current balance
          </p>
        </div>
        <button
          className="overview-balance-link"
          onClick={() => onNavigate('accounts')}
          aria-label="View accounts"
        >
          <ChevronRightIcon size={24} />
        </button>
        <span className="overview-weave" aria-hidden="true" />
      </section>
      {!walletBalances.length && (
        <section className="overview-setup">
          <span className="plan-tool-icon">
            <WalletIcon size={24} />
          </span>
          <div>
            <h2>Let’s set up your first account.</h2>
            <p>Add your cash, bank, or e-wallet balance to get started.</p>
          </div>
          <button className="btn btn-primary" onClick={onAddAccount}>
            Add account
          </button>
        </section>
      )}
      <div className="overview-period">
        <h2>{period}</h2>
        <span>Your monthly snapshot</span>
      </div>
      <section className="workspace-summary-stats overview-metrics" aria-label="Monthly summary">
        {[
          {
            label: 'Income',
            value: incomeTotals,
            icon: IncomeIcon,
            detail: 'Received this month',
            tone: 'income'
          },
          {
            label: 'Expenses',
            value: expenseTotals,
            icon: ExpenseIcon,
            detail: 'Spent this month',
            tone: 'expense'
          },
          {
            label: 'Net cash flow',
            value: netTotals,
            icon: ChartIcon,
            detail: 'Income minus expenses',
            tone: 'net'
          },
          {
            label: 'Savings',
            value: savedTotals,
            icon: TrendUpIcon,
            detail: 'Total reserved for goals',
            tone: 'savings'
          }
        ].map((metric) => {
          const MetricIcon = metric.icon
          return (
            <article
              className={`workspace-stat overview-metric overview-metric--${metric.tone}`}
              key={metric.label}
            >
              <span>
                <MetricIcon size={17} />
                {metric.label}
              </span>
              <strong>{formatCurrencySummary(metric.value)}</strong>
              <small>{metric.detail}</small>
            </article>
          )
        })}
      </section>
      <div className="overview-grid">
        {order.map((id) => (
          <div className={`overview-widget overview-widget--${id}`} key={id}>
            {sections[id]}
          </div>
        ))}
      </div>
    </div>
  )
}
