export const PRIMARY_DESTINATIONS = [
  { id: 'dashboard', label: 'Home', icon: 'home' },
  { id: 'transactions', label: 'Activity', icon: 'activity' },
  { id: 'accounts', label: 'Accounts', icon: 'wallet' },
  { id: 'plan', label: 'Plan', icon: 'plan' },
  { id: 'settings', label: 'More', icon: 'settings' }
]

export function getPrimaryDestination(view) {
  if (['plan', 'categories', 'subscriptions', 'recurring-income', 'wealth', 'savings', 'investments'].includes(view)) return 'plan'
  return ['dashboard', 'transactions', 'accounts'].includes(view) ? view : 'settings'
}
