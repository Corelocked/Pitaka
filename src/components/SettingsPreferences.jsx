import { DownloadIcon } from './Icons'

export default function SettingsPreferences({
  layouts,
  layout,
  onLayoutChange,
  themes,
  theme,
  onThemeChange,
  privacyShieldEnabled,
  onTogglePrivacy,
  notificationsEnabled,
  onToggleNotifications,
  notificationPermission,
  requestingNotifications,
  notificationMessage,
  onDownloadDiagnostics
}) {
  const notificationsUnavailable = notificationPermission === 'unsupported'
  const notificationsBlocked = notificationPermission === 'denied'
  const alertsOn = notificationsEnabled && notificationPermission === 'granted'

  return (
    <details className="settings-preferences">
      <summary>Appearance & preferences<span>Theme, Home layout, privacy, and alerts</span></summary>
      <div className="settings-preferences-body">
        <section className="settings-group" aria-labelledby="settings-display-title">
          <h3 id="settings-display-title">Display</h3>
          <div className="settings-row">
            <div className="settings-row-copy">
              <span className="settings-row-title" id="settings-theme-label">Theme</span>
              <p id="settings-theme-hint">System follows your device’s light or dark appearance.</p>
            </div>
            <div className="settings-theme-options" role="radiogroup" aria-labelledby="settings-theme-label" aria-describedby="settings-theme-hint">
              {themes.map((option) => (
                <label className="settings-theme-option" key={option.id}>
                  <input type="radio" name="appearance-theme" value={option.id} checked={theme === option.id} onChange={() => onThemeChange(option.id)} />
                  <span>{option.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row-copy">
              <label className="settings-row-title" htmlFor="settings-home-layout">Home layout</label>
              <p id="settings-layout-hint">{layouts.find((option) => option.id === layout)?.description}</p>
            </div>
            <select className="settings-select" id="settings-home-layout" value={layout} onChange={(event) => onLayoutChange(event.target.value)} aria-describedby="settings-layout-hint">
              {layouts.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
            </select>
          </div>
        </section>

        <section className="settings-group" aria-labelledby="settings-privacy-title">
          <h3 id="settings-privacy-title">Privacy & alerts</h3>
          <label className="settings-row settings-toggle-row" htmlFor="settings-privacy-switch">
            <span className="settings-row-copy">
              <span className="settings-row-title" id="settings-privacy-label">Privacy shield</span>
              <span className="settings-row-hint" id="settings-privacy-hint">Blur your finances when Pitaka is in the background. App switcher previews may vary by device.</span>
            </span>
            <span className="settings-toggle-control">
              <span className="settings-toggle-state" aria-hidden="true">{privacyShieldEnabled ? 'On' : 'Off'}</span>
              <span className="settings-switch">
                <input id="settings-privacy-switch" type="checkbox" role="switch" checked={privacyShieldEnabled} onChange={onTogglePrivacy} aria-labelledby="settings-privacy-label" aria-describedby="settings-privacy-hint" />
                <span className="settings-switch-track" aria-hidden="true"><span /></span>
              </span>
            </span>
          </label>
          <label className="settings-row settings-toggle-row" htmlFor="settings-alert-switch">
            <span className="settings-row-copy">
              <span className="settings-row-title" id="settings-alert-label">Budget & debt alerts</span>
              <span className="settings-row-hint" id="settings-alert-hint" aria-live="polite">{notificationMessage || (notificationsUnavailable ? 'Notifications are unavailable on this device. Alerts stay visible inside Pitaka.' : notificationsBlocked ? 'Notifications are blocked. Allow them in your browser or device settings.' : 'Get notifications while Pitaka is open when a budget or credit limit needs attention.')}</span>
            </span>
            <span className="settings-toggle-control">
              <span className="settings-toggle-state" aria-hidden="true">{requestingNotifications ? 'Waiting…' : notificationsUnavailable ? 'Unavailable' : notificationsBlocked ? 'Blocked' : alertsOn ? 'On' : 'Off'}</span>
              <span className="settings-switch">
                <input id="settings-alert-switch" type="checkbox" role="switch" checked={alertsOn} onChange={onToggleNotifications} disabled={notificationsUnavailable || notificationsBlocked || requestingNotifications} aria-labelledby="settings-alert-label" aria-describedby="settings-alert-hint" />
                <span className="settings-switch-track" aria-hidden="true"><span /></span>
              </span>
            </span>
          </label>
        </section>

        <section className="settings-group" aria-labelledby="settings-diagnostics-title">
          <h3 id="settings-diagnostics-title">Troubleshooting</h3>
          <div className="settings-row">
            <div className="settings-row-copy">
              <span className="settings-row-title">Diagnostics</span>
              <p>Download device details and recent app errors to share with support.</p>
            </div>
            <button type="button" className="btn btn-secondary settings-diagnostics" onClick={onDownloadDiagnostics}><DownloadIcon size={16} /> Export diagnostics</button>
          </div>
        </section>
        <p className="settings-device-note">These preferences are saved on this device.</p>
      </div>
    </details>
  )
}
