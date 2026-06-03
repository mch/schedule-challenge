import { PassphraseDisplay } from './PassphraseDisplay'
import './SettingsView.css'

interface SettingsViewProps {
  passphrase: string
  onClose: () => void
}

/**
 * Full-page settings panel, accessible from the hamburger menu.
 * Currently houses passphrase management.
 */
export function SettingsView({ passphrase, onClose }: SettingsViewProps) {
  return (
    <div className="settings-view" role="dialog" aria-modal="true" aria-label="Settings">
      <header className="settings-view__header">
        <h2 className="settings-view__title">Settings</h2>
        <button
          type="button"
          className="settings-view__close"
          onClick={onClose}
          aria-label="Close settings"
        >
          ✕
        </button>
      </header>

      <section className="settings-view__section">
        <h3 className="settings-view__section-title">Your passphrase</h3>
        <p className="settings-view__section-desc">
          This passphrase identifies your personal schedule and syncs it across devices.
          Keep it somewhere safe — it&rsquo;s the only way to recover your bookmarks.
        </p>
        <PassphraseDisplay passphrase={passphrase} />
      </section>
    </div>
  )
}
