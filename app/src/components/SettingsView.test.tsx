import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsView } from './SettingsView'

const PASSPHRASE = 'able-acid-aged-also'

describe('SettingsView', () => {
  it('renders a Settings heading', () => {
    render(<SettingsView passphrase={PASSPHRASE} onClose={() => {}} />)
    expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument()
  })

  it('renders the PassphraseDisplay', () => {
    render(<SettingsView passphrase={PASSPHRASE} onClose={() => {}} />)
    expect(screen.getByRole('button', { name: /reveal passphrase/i })).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<SettingsView passphrase={PASSPHRASE} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: /close settings/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('has role="dialog" for accessibility', () => {
    render(<SettingsView passphrase={PASSPHRASE} onClose={() => {}} />)
    expect(screen.getByRole('dialog', { name: /settings/i })).toBeInTheDocument()
  })
})
