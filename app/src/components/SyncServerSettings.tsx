import { useEffect, useRef, useState } from 'react'
import {
  HALFBAKERY_SYNC_SERVER_URL,
  PUBLIC_SYNC_SERVER_URL,
} from '../automerge/repo'
import './SyncServerSettings.css'

type Preset = 'public' | 'halfbakery' | 'custom'

function urlToPreset(url: string): Preset {
  if (url === PUBLIC_SYNC_SERVER_URL) return 'public'
  if (url === HALFBAKERY_SYNC_SERVER_URL) return 'halfbakery'
  return 'custom'
}

export interface NetworkAdapterLike {
  /** The underlying WebSocket, if one has been created. */
  socket?: { readyState: number }
}

/** Returns true when the adapter's WebSocket is in the OPEN state. */
function isSocketOpen(adapter: NetworkAdapterLike | null): boolean {
  return adapter?.socket?.readyState === WebSocket.OPEN
}

export interface SyncServerSettingsProps {
  currentUrl: string
  onUrlChange: (url: string) => void
  networkAdapter: NetworkAdapterLike | null
}

/**
 * Settings section for choosing and monitoring the Automerge sync server.
 *
 * - Preset radio buttons: public server, halfbakery, or custom
 * - Custom URL text input (shown only when "custom" is selected)
 * - Live connection status indicator (polls `networkAdapter.isReady()`)
 * - Warning when the public server is selected (unencrypted, non-durable)
 */
export function SyncServerSettings({
  currentUrl,
  onUrlChange,
  networkAdapter,
}: SyncServerSettingsProps) {
  const preset = urlToPreset(currentUrl)

  // Local state for the custom URL input so we don't fire onUrlChange on every keystroke.
  const [customInput, setCustomInput] = useState(
    preset === 'custom' ? currentUrl : '',
  )

  // Sync customInput if parent changes the URL to a custom value externally.
  useEffect(() => {
    if (urlToPreset(currentUrl) === 'custom') {
      setCustomInput(currentUrl)
    }
  }, [currentUrl])

  // --- connection status (polled) ---
  // We poll socket.readyState rather than adapter.isReady() because isReady()
  // latches true after the first successful connect and never resets to false,
  // so it can't reflect a subsequent disconnection.
  const [connected, setConnected] = useState(() => isSocketOpen(networkAdapter))
  const adapterRef = useRef(networkAdapter)
  adapterRef.current = networkAdapter

  useEffect(() => {
    function check() {
      setConnected(isSocketOpen(adapterRef.current))
    }
    check()
    const id = setInterval(check, 1000)
    return () => clearInterval(id)
  }, [])

  function handlePresetChange(next: Preset) {
    if (next === 'public') onUrlChange(PUBLIC_SYNC_SERVER_URL)
    else if (next === 'halfbakery') onUrlChange(HALFBAKERY_SYNC_SERVER_URL)
    // For 'custom', wait until the user types a URL
  }

  function commitCustomUrl() {
    const trimmed = customInput.trim()
    if (trimmed) onUrlChange(trimmed)
  }

  return (
    <div className="sync-server-settings">
      <fieldset className="sync-server-settings__fieldset">
        <legend className="sync-server-settings__legend">Sync server</legend>

        <label className="sync-server-settings__option">
          <input
            type="radio"
            name="syncServer"
            value="public"
            checked={preset === 'public'}
            onChange={() => handlePresetChange('public')}
            aria-label="Public Automerge sync server"
          />
          <span className="sync-server-settings__option-label">
            Public Automerge
            <span className="sync-server-settings__option-url">
              {PUBLIC_SYNC_SERVER_URL}
            </span>
          </span>
        </label>

        <label className="sync-server-settings__option">
          <input
            type="radio"
            name="syncServer"
            value="halfbakery"
            checked={preset === 'halfbakery'}
            onChange={() => handlePresetChange('halfbakery')}
            aria-label="Halfbakery sync server"
          />
          <span className="sync-server-settings__option-label">
            Halfbakery
            <span className="sync-server-settings__option-url">
              {HALFBAKERY_SYNC_SERVER_URL}
            </span>
          </span>
        </label>

        <label className="sync-server-settings__option">
          <input
            type="radio"
            name="syncServer"
            value="custom"
            checked={preset === 'custom'}
            onChange={() => handlePresetChange('custom')}
            aria-label="Custom sync server"
          />
          <span className="sync-server-settings__option-label">Custom</span>
        </label>
      </fieldset>

      {preset === 'custom' && (
        <div className="sync-server-settings__custom">
          <label
            className="sync-server-settings__custom-label"
            htmlFor="syncServerUrl"
          >
            Server URL
          </label>
          <input
            id="syncServerUrl"
            type="url"
            className="sync-server-settings__custom-input"
            value={customInput}
            placeholder="wss://your-server.example.com"
            onChange={(e) => setCustomInput(e.target.value)}
            onBlur={commitCustomUrl}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitCustomUrl()
            }}
            aria-label="Server URL"
          />
        </div>
      )}

      {preset === 'public' && (
        <p className="sync-server-settings__warning" role="alert">
          ⚠️ The public server is not encrypted and data may not be long-term
          durable. Anyone who knows your document ID can read your schedule.
        </p>
      )}

      <div className="sync-server-settings__status">
        <span
          className={`sync-server-settings__indicator sync-server-settings__indicator--${connected ? 'connected' : 'disconnected'}`}
          title={connected ? 'Connected' : 'Disconnected'}
          aria-hidden="true"
        />
        <span className="sync-server-settings__status-label">
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
    </div>
  )
}
