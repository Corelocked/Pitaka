import {
  ActivityIcon,
  HomeIcon,
  WalletIcon,
  TrendUpIcon,
  SettingsIcon,
  LogoutIcon
} from './Icons'
import {
  PRIMARY_DESTINATIONS,
  getPrimaryDestination
} from '../utils/navigation'

const ICONS = {
  home: HomeIcon,
  activity: ActivityIcon,
  wallet: WalletIcon,
  plan: TrendUpIcon,
  settings: SettingsIcon
}

export default function AppNavigation({
  desktop = false,
  view,
  onNavigate,
  user,
  isPro,
  onLogout,
  inert = false
}) {
  const active = getPrimaryDestination(view)
  const items = PRIMARY_DESTINATIONS.map((destination) => {
    const Icon = ICONS[destination.icon]
    return (
      <button
        key={destination.id}
        type="button"
        className={`${desktop ? 'sidebar-nav-item' : 'bottom-nav-item'} ${active === destination.id ? 'active' : ''}`}
        aria-current={active === destination.id ? 'page' : undefined}
        onClick={() => onNavigate(destination.id)}
      >
        <span className={desktop ? 'sidebar-nav-icon' : 'bottom-nav-icon'}>
          <Icon size={22} />
        </span>
        <span>{destination.label}</span>
      </button>
    )
  })
  if (!desktop)
    return (
      <nav className="bottom-nav" aria-label="Primary navigation">
        {items}
      </nav>
    )
  return (
    <aside className="desktop-sidebar" inert={inert}>
      <div className="sidebar-header">
        <div className="sidebar-title-row">
          <img className="sidebar-brand-mark" src="/pitaka-logo.png" alt="" />
          <span className="sidebar-brand-name">Pitaka</span>
          <span className={`sidebar-plan-badge ${isPro ? 'pro' : 'basic'}`}>
            {isPro ? 'Pro' : 'Basic'}
          </span>
        </div>
        <p className="sidebar-kicker">Make room for what matters.</p>
      </div>
      <nav className="sidebar-nav" aria-label="Primary navigation">
        <div className="sidebar-nav-scroll">{items}</div>
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <span className="sidebar-user-avatar">
            {(user?.displayName || user?.email || 'P')[0].toUpperCase()}
          </span>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">
              {user?.displayName || 'Your account'}
            </p>
            <p className="sidebar-user-email">{user?.email}</p>
          </div>
        </div>
        <button type="button" className="btn btn-secondary" onClick={onLogout}>
          <LogoutIcon size={18} /> Sign out
        </button>
      </div>
    </aside>
  )
}
