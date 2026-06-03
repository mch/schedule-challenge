import { PassphraseDisplay } from './PassphraseDisplay'
import { SyncServerSettings } from './SyncServerSettings'
import type { NetworkAdapterLike } from './SyncServerSettings'
import './SettingsView.css'

interface SettingsViewProps {
  passphrase: string
  syncServerUrl: string
  onSyncServerUrlChange: (url: string) => void
  networkAdapter: NetworkAdapterLike | null
}

/**
 * Full-page settings view, navigated to via the gear icon in the header.
 * Houses passphrase management and sync server configuration.
 */
export function SettingsView({
  passphrase,
  syncServerUrl,
  onSyncServerUrlChange,
  networkAdapter,
}: SettingsViewProps) {
  return (
    <div className="settings-view">
      <header className="settings-view__header">
        <h2 className="settings-view__title">Settings</h2>
      </header>

      <section className="settings-view__section">
        <h3 className="settings-view__section-title">Sync server</h3>
        <p className="settings-view__section-desc">
          Choose which server to use for syncing your bookmarks across devices.
        </p>
        <SyncServerSettings
          currentUrl={syncServerUrl}
          onUrlChange={onSyncServerUrlChange}
          networkAdapter={networkAdapter}
        />
      </section>

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
