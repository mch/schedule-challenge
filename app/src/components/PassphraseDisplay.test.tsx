import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PassphraseDisplay } from './PassphraseDisplay'

const PASSPHRASE = 'able-acid-aged-also'

describe('PassphraseDisplay', () => {
  it('renders a reveal button', () => {
    render(<PassphraseDisplay passphrase={PASSPHRASE} />)
    expect(screen.getByRole('button', { name: /reveal passphrase/i })).toBeInTheDocument()
  })

  it('passphrase is blurred by default', () => {
    render(<PassphraseDisplay passphrase={PASSPHRASE} />)
    const code = screen.getByLabelText(/passphrase hidden/i)
    expect(code).toHaveStyle({ filter: 'blur(6px)' })
  })

  it('copy button is disabled when passphrase is hidden', () => {
    render(<PassphraseDisplay passphrase={PASSPHRASE} />)
    expect(screen.getByRole('button', { name: /copy passphrase/i })).toBeDisabled()
  })

  it('clicking reveal shows the passphrase', async () => {
    const user = userEvent.setup()
    render(<PassphraseDisplay passphrase={PASSPHRASE} />)
    await user.click(screen.getByRole('button', { name: /reveal passphrase/i }))
    const code = screen.getByLabelText(/your passphrase/i)
    expect(code).toHaveStyle({ filter: 'none' })
  })

  it('clicking reveal enables the copy button', async () => {
    const user = userEvent.setup()
    render(<PassphraseDisplay passphrase={PASSPHRASE} />)
    await user.click(screen.getByRole('button', { name: /reveal passphrase/i }))
    expect(screen.getByRole('button', { name: /copy passphrase/i })).not.toBeDisabled()
  })

  it('clicking reveal then hide re-blurs the passphrase', async () => {
    const user = userEvent.setup()
    render(<PassphraseDisplay passphrase={PASSPHRASE} />)
    await user.click(screen.getByRole('button', { name: /reveal passphrase/i }))
    await user.click(screen.getByRole('button', { name: /hide passphrase/i }))
    const code = screen.getByLabelText(/passphrase hidden/i)
    expect(code).toHaveStyle({ filter: 'blur(6px)' })
  })

  it('clicking copy calls clipboard.writeText with the passphrase', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
      writable: true,
    })
    render(<PassphraseDisplay passphrase={PASSPHRASE} />)
    // Reveal first
    fireEvent.click(screen.getByRole('button', { name: /reveal passphrase/i }))
    const copyBtn = screen.getByRole('button', { name: /copy passphrase/i })
    expect(copyBtn).not.toBeDisabled()
    // Use fireEvent + act so the async handleCopy resolves
    await act(async () => {
      fireEvent.click(copyBtn)
      await new Promise((r) => setTimeout(r, 10))
    })
    expect(writeText).toHaveBeenCalledWith(PASSPHRASE)
  })
})
