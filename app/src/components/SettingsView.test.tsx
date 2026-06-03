import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PUBLIC_SYNC_SERVER_URL } from '../automerge/repo'
import { SettingsView } from './SettingsView'

const PASSPHRASE = 'able-acid-aged-also'

function defaultProps(overrides = {}) {
  return {
    passphrase: PASSPHRASE,
    syncServerUrl: PUBLIC_SYNC_SERVER_URL,
    onSyncServerUrlChange: vi.fn(),
    networkAdapter: null,
    ...overrides,
  }
}

describe('SettingsView', () => {
  it('renders a Settings heading', () => {
    render(<SettingsView {...defaultProps()} />)
    expect(
      screen.getByRole('heading', { name: /settings/i }),
    ).toBeInTheDocument()
  })

  it('renders the PassphraseDisplay', () => {
    render(<SettingsView {...defaultProps()} />)
    expect(
      screen.getByRole('button', { name: /reveal passphrase/i }),
    ).toBeInTheDocument()
  })

  it('does not render a close button (navigation is used instead)', () => {
    render(<SettingsView {...defaultProps()} />)
    expect(
      screen.queryByRole('button', { name: /close settings/i }),
    ).not.toBeInTheDocument()
  })

  it('renders the sync server settings section', () => {
    render(<SettingsView {...defaultProps()} />)
    expect(
      screen.getByRole('radio', { name: /public automerge/i }),
    ).toBeInTheDocument()
  })

  it('passes onSyncServerUrlChange to SyncServerSettings', async () => {
    const user = userEvent.setup()
    const onSyncServerUrlChange = vi.fn()
    render(
      <SettingsView
        {...defaultProps({
          syncServerUrl: PUBLIC_SYNC_SERVER_URL,
          onSyncServerUrlChange,
        })}
      />,
    )
    await user.click(screen.getByRole('radio', { name: /halfbakery/i }))
    expect(onSyncServerUrlChange).toHaveBeenCalled()
  })
})
