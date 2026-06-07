import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { IdentitySetup } from './IdentitySetup'

function makeProps(overrides?: Partial<Parameters<typeof IdentitySetup>[0]>) {
  return {
    onConfirm: vi.fn().mockResolvedValue(undefined),
    generateNew: vi.fn().mockReturnValue('able-acid-aged-also'),
    ...overrides,
  }
}

describe('IdentitySetup — layout', () => {
  it('renders a full-page centered wrapper with class identity-setup-page', () => {
    render(<IdentitySetup {...makeProps()} />)
    // The outermost wrapper must have the page-centering class
    expect(document.querySelector('.identity-setup-page')).toBeInTheDocument()
  })

  it('renders the card container with class identity-setup', () => {
    render(<IdentitySetup {...makeProps()} />)
    expect(document.querySelector('.identity-setup')).toBeInTheDocument()
  })

  it('uses a semantic <main> element (not a div with role=main) on the choose screen', () => {
    render(<IdentitySetup {...makeProps()} />)
    expect(screen.getByRole('main').tagName).toBe('MAIN')
  })

  it('uses a semantic <main> element on the create screen', async () => {
    const user = userEvent.setup()
    render(<IdentitySetup {...makeProps()} />)
    await user.click(screen.getByRole('button', { name: /create new account/i }))
    expect(screen.getByRole('main').tagName).toBe('MAIN')
  })

  it('uses a semantic <main> element on the recover screen', async () => {
    const user = userEvent.setup()
    render(<IdentitySetup {...makeProps()} />)
    await user.click(screen.getByRole('button', { name: /enter existing passphrase/i }))
    expect(screen.getByRole('main').tagName).toBe('MAIN')
  })
})

describe('IdentitySetup — choose screen', () => {
  it('shows welcome heading', () => {
    render(<IdentitySetup {...makeProps()} />)
    expect(
      screen.getByRole('heading', { name: /welcome/i }),
    ).toBeInTheDocument()
  })

  it('shows "Create new account" and "Enter existing passphrase" buttons', () => {
    render(<IdentitySetup {...makeProps()} />)
    expect(
      screen.getByRole('button', { name: /create new account/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /enter existing passphrase/i }),
    ).toBeInTheDocument()
  })
})

describe('IdentitySetup — create screen', () => {
  it('shows the generated passphrase', async () => {
    const user = userEvent.setup()
    render(<IdentitySetup {...makeProps()} />)
    await user.click(
      screen.getByRole('button', { name: /create new account/i }),
    )
    expect(screen.getByLabelText(/your passphrase/i)).toHaveTextContent(
      'able-acid-aged-also',
    )
  })

  it('calls generateNew() exactly once on mount', () => {
    const props = makeProps()
    render(<IdentitySetup {...props} />)
    expect(props.generateNew).toHaveBeenCalledTimes(1)
  })

  it('"I\'ve saved it" button calls onConfirm with the generated passphrase', async () => {
    const user = userEvent.setup()
    const props = makeProps()
    render(<IdentitySetup {...props} />)
    await user.click(
      screen.getByRole('button', { name: /create new account/i }),
    )
    await user.click(screen.getByRole('button', { name: /i've saved it/i }))
    expect(props.onConfirm).toHaveBeenCalledWith('able-acid-aged-also')
  })

  it('"Back" button returns to the choose screen', async () => {
    const user = userEvent.setup()
    render(<IdentitySetup {...makeProps()} />)
    await user.click(
      screen.getByRole('button', { name: /create new account/i }),
    )
    await user.click(screen.getByRole('button', { name: /back/i }))
    expect(
      screen.getByRole('heading', { name: /welcome/i }),
    ).toBeInTheDocument()
  })
})

describe('IdentitySetup — recover screen', () => {
  it('shows a passphrase input field', async () => {
    const user = userEvent.setup()
    render(<IdentitySetup {...makeProps()} />)
    await user.click(
      screen.getByRole('button', { name: /enter existing passphrase/i }),
    )
    expect(screen.getByLabelText(/passphrase/i)).toBeInTheDocument()
  })

  it('has autocapitalize="none" on the passphrase input', async () => {
    const user = userEvent.setup()
    render(<IdentitySetup {...makeProps()} />)
    await user.click(
      screen.getByRole('button', { name: /enter existing passphrase/i }),
    )
    expect(screen.getByLabelText(/passphrase/i)).toHaveAttribute(
      'autocapitalize',
      'none',
    )
  })

  it('submitting a passphrase calls onConfirm', async () => {
    const user = userEvent.setup()
    const props = makeProps()
    render(<IdentitySetup {...props} />)
    await user.click(
      screen.getByRole('button', { name: /enter existing passphrase/i }),
    )
    await user.type(screen.getByLabelText(/passphrase/i), 'bark-barn-base-bath')
    await user.click(screen.getByRole('button', { name: /recover account/i }))
    await waitFor(() =>
      expect(props.onConfirm).toHaveBeenCalledWith('bark-barn-base-bath'),
    )
  })

  it('shows an error when submitting an empty passphrase', async () => {
    const user = userEvent.setup()
    render(<IdentitySetup {...makeProps()} />)
    await user.click(
      screen.getByRole('button', { name: /enter existing passphrase/i }),
    )
    await user.click(screen.getByRole('button', { name: /recover account/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(
      /enter your passphrase/i,
    )
  })

  it('"Back" button returns to choose screen', async () => {
    const user = userEvent.setup()
    render(<IdentitySetup {...makeProps()} />)
    await user.click(
      screen.getByRole('button', { name: /enter existing passphrase/i }),
    )
    await user.click(screen.getByRole('button', { name: /back/i }))
    expect(
      screen.getByRole('heading', { name: /welcome/i }),
    ).toBeInTheDocument()
  })
})
