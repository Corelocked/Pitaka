import { Fragment } from 'react'
import {
  CategoryIcon,
  ExpenseIcon,
  IncomeIcon,
  TrendUpIcon,
  ChartIcon,
  ChevronRightIcon
} from './Icons'

export default function PlanHub({
  onNavigate,
  onNewGoal,
  categoryBudgets,
  savings,
  isPro
}) {
  const budgets = categoryBudgets.filter((budget) => budget.hasBudget)
  const alerts = budgets.filter((budget) =>
    ['warning', 'over'].includes(budget.status)
  )
  const tools = [
    {
      view: 'categories',
      title: 'Budgets & categories',
      description:
        'Give your spending a plan. Set monthly limits and see what’s left.',
      detail: budgets.length
        ? `${budgets.length} budget${budgets.length === 1 ? '' : 's'} · ${alerts.length ? `${alerts.length} need attention` : 'On track'}`
        : 'Set your first budget',
      icon: CategoryIcon
    },
    {
      view: 'wealth',
      title: 'Savings goals',
      description:
        'Build your emergency fund or save for something you’re looking forward to.',
      detail: `${savings.length} goal${savings.length === 1 ? '' : 's'}`,
      icon: TrendUpIcon
    },
    {
      view: 'subscriptions',
      title: 'Bills & subscriptions',
      description:
        'Keep recurring costs in sight and prepare for the next payment.',
      detail: isPro ? 'Manage recurring bills' : 'Pro feature',
      icon: ExpenseIcon,
      pro: true
    },
    {
      view: 'recurring-income',
      title: 'Recurring income',
      description: 'Plan around payday with scheduled income entries.',
      detail: isPro ? 'Manage income schedules' : 'Pro feature',
      icon: IncomeIcon,
      pro: true
    },
    {
      view: 'investments',
      title: 'Investments',
      description: 'Keep a record of your holdings, cost, and current value.',
      detail: isPro ? 'View your portfolio' : 'Pro feature',
      icon: ChartIcon,
      pro: true
    }
  ]
  return (
    <div className="mobile-content page-shell plan-workspace">
      <section className="plan-welcome">
        <p className="workspace-description">Build a plan for today, and the things ahead.</p>
        <button className="btn btn-primary" onClick={onNewGoal}>
          <TrendUpIcon size={18} /> New savings goal
        </button>
      </section>
      {alerts.length > 0 && (
        <button className="plan-alert" onClick={() => onNavigate('categories')}>
          <span>
            <strong>
              {alerts.length} budget{alerts.length === 1 ? '' : 's'} to review
            </strong>
            <span>
              {alerts
                .map((budget) => budget.categoryName || budget.name)
                .filter(Boolean)
                .join(', ')}
            </span>
          </span>
          <ChevronRightIcon size={20} />
        </button>
      )}
      <div className="plan-tools">
        {tools.map(({ view, title, description, detail, icon, pro }, index) => {
          const Icon = icon
          return (
            <Fragment key={view}>
            {index === 2 && <h2 className="plan-section-title">Recurring & investing<span>Keep regular payments and long-term plans in view.</span></h2>}
            <button
              className={`plan-tool${index < 2 ? ' plan-tool--primary' : ''}`}
              onClick={() => onNavigate(pro && !isPro ? 'pro' : view)}
            >
              <span className="plan-tool-icon">
                <Icon size={24} />
              </span>
              <span className="plan-tool-copy">
                <strong>{title}</strong>
                <span>{description}</span>
                <small>{detail}</small>
              </span>
              <ChevronRightIcon size={20} />
            </button>
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}
