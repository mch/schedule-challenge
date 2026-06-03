import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsView } from './SettingsView'
import { PUBLIC_SYNC_SERVER_URL } from '../automerge/repo'

const PASSPHRASE = 'able-acid-aged-also'

function defaultProps(overrides = {}) {
  return {
    passphrase: PASSPHRASE,
    onClose: () => {},
    syncServerUrl: PUBLIC_SYNC_SERVER_URL,
    onSyncServerUrlChange: vi.fn(),
    networkAdapter: null,
    ...overrides,
  }
}

describe('SettingsView', () => {
  it('renders a Settings heading', () => {
    render(<SettingsView {...defaultProps()} />)
    expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument()
  })

  it('renders the PassphraseDisplay', () => {
    render(<SettingsView {...defaultProps()} />)
    expect(screen.getByRole('button', { name: /reveal passphrase/i })).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<SettingsView {...defaultProps({ onClose })} />)
    await user.click(screen.getByRole('button', { name: /close settings/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('has role="dialog" for accessibility', () => {
    render(<SettingsView {...defaultProps()} />)
    expect(screen.getByRole('dialog', { name: /settings/i })).toBeInTheDocument()
  })

  it('renders the sync server settings section', () => {
    render(<SettingsView {...defaultProps()} />)
    expect(screen.getByRole('radio', { name: /public automerge/i })).toBeInTheDocument()
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
