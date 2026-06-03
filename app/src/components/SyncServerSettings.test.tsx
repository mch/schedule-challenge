import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  HALFBAKERY_SYNC_SERVER_URL,
  PUBLIC_SYNC_SERVER_URL,
} from '../automerge/repo'
import { SyncServerSettings } from './SyncServerSettings'

function makeAdapter(open: boolean) {
  return { socket: { readyState: open ? WebSocket.OPEN : WebSocket.CLOSED } }
}

describe('SyncServerSettings', () => {
  const baseProps = {
    currentUrl: PUBLIC_SYNC_SERVER_URL,
    onUrlChange: vi.fn(),
    networkAdapter: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // --- preset options ---

  it('renders a radio button for the public server', () => {
    render(<SyncServerSettings {...baseProps} />)
    expect(
      screen.getByRole('radio', { name: /public automerge/i }),
    ).toBeInTheDocument()
  })

  it('renders a radio button for the halfbakery server', () => {
    render(<SyncServerSettings {...baseProps} />)
    expect(
      screen.getByRole('radio', { name: /halfbakery/i }),
    ).toBeInTheDocument()
  })

  it('renders a radio button for a custom server', () => {
    render(<SyncServerSettings {...baseProps} />)
    expect(screen.getByRole('radio', { name: /custom/i })).toBeInTheDocument()
  })

  it('selects the public preset when currentUrl matches', () => {
    render(
      <SyncServerSettings {...baseProps} currentUrl={PUBLIC_SYNC_SERVER_URL} />,
    )
    expect(
      screen.getByRole('radio', { name: /public automerge/i }),
    ).toBeChecked()
  })

  it('selects the halfbakery preset when currentUrl matches', () => {
    render(
      <SyncServerSettings
        {...baseProps}
        currentUrl={HALFBAKERY_SYNC_SERVER_URL}
      />,
    )
    expect(screen.getByRole('radio', { name: /halfbakery/i })).toBeChecked()
  })

  it('selects "custom" when currentUrl does not match any preset', () => {
    render(
      <SyncServerSettings
        {...baseProps}
        currentUrl="wss://my-own.example.com"
      />,
    )
    expect(screen.getByRole('radio', { name: /custom/i })).toBeChecked()
  })

  // --- public-server warning ---

  it('shows a warning when public server is selected', () => {
    render(
      <SyncServerSettings {...baseProps} currentUrl={PUBLIC_SYNC_SERVER_URL} />,
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('does not show the warning when halfbakery server is selected', () => {
    render(
      <SyncServerSettings
        {...baseProps}
        currentUrl={HALFBAKERY_SYNC_SERVER_URL}
      />,
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  // --- custom URL input ---

  it('shows a text input when custom is selected', () => {
    render(
      <SyncServerSettings
        {...baseProps}
        currentUrl="wss://custom.example.com"
      />,
    )
    expect(
      screen.getByRole('textbox', { name: /server url/i }),
    ).toBeInTheDocument()
  })

  it('does not show the text input when a preset is selected', () => {
    render(
      <SyncServerSettings {...baseProps} currentUrl={PUBLIC_SYNC_SERVER_URL} />,
    )
    expect(
      screen.queryByRole('textbox', { name: /server url/i }),
    ).not.toBeInTheDocument()
  })

  it('populates the custom input with the current URL', () => {
    render(
      <SyncServerSettings {...baseProps} currentUrl="wss://my.example.com" />,
    )
    expect(screen.getByRole('textbox', { name: /server url/i })).toHaveValue(
      'wss://my.example.com',
    )
  })

  // --- switching presets calls onUrlChange ---

  it('calls onUrlChange with PUBLIC_SYNC_SERVER_URL when that preset is selected', async () => {
    const user = userEvent.setup()
    const onUrlChange = vi.fn()
    render(
      <SyncServerSettings
        {...baseProps}
        currentUrl={HALFBAKERY_SYNC_SERVER_URL}
        onUrlChange={onUrlChange}
      />,
    )
    await user.click(screen.getByRole('radio', { name: /public automerge/i }))
    expect(onUrlChange).toHaveBeenCalledWith(PUBLIC_SYNC_SERVER_URL)
  })

  it('calls onUrlChange with HALFBAKERY_SYNC_SERVER_URL when that preset is selected', async () => {
    const user = userEvent.setup()
    const onUrlChange = vi.fn()
    render(
      <SyncServerSettings
        {...baseProps}
        currentUrl={PUBLIC_SYNC_SERVER_URL}
        onUrlChange={onUrlChange}
      />,
    )
    await user.click(screen.getByRole('radio', { name: /halfbakery/i }))
    expect(onUrlChange).toHaveBeenCalledWith(HALFBAKERY_SYNC_SERVER_URL)
  })

  it('calls onUrlChange when the custom URL input is committed with Enter', async () => {
    const user = userEvent.setup()
    const onUrlChange = vi.fn()
    render(
      <SyncServerSettings
        {...baseProps}
        currentUrl="wss://old.example.com"
        onUrlChange={onUrlChange}
      />,
    )
    const input = screen.getByRole('textbox', { name: /server url/i })
    await user.clear(input)
    await user.type(input, 'wss://new.example.com{Enter}')
    expect(onUrlChange).toHaveBeenCalledWith('wss://new.example.com')
  })

  it('calls onUrlChange when the custom URL input loses focus', async () => {
    const user = userEvent.setup()
    const onUrlChange = vi.fn()
    render(
      <SyncServerSettings
        {...baseProps}
        currentUrl="wss://old.example.com"
        onUrlChange={onUrlChange}
      />,
    )
    const input = screen.getByRole('textbox', { name: /server url/i })
    await user.clear(input)
    await user.type(input, 'wss://blur.example.com')
    await user.tab()
    expect(onUrlChange).toHaveBeenCalledWith('wss://blur.example.com')
  })

  // --- connection status indicator ---

  it('shows a "connected" indicator when the adapter is ready', async () => {
    render(
      <SyncServerSettings {...baseProps} networkAdapter={makeAdapter(true)} />,
    )
    await waitFor(() =>
      expect(screen.getByTitle(/connected/i)).toBeInTheDocument(),
    )
  })

  it('shows a "disconnected" indicator when the adapter is not ready', async () => {
    render(
      <SyncServerSettings {...baseProps} networkAdapter={makeAdapter(false)} />,
    )
    await waitFor(() =>
      expect(screen.getByTitle(/disconnected/i)).toBeInTheDocument(),
    )
  })

  it('shows a "disconnected" indicator when no adapter is provided', async () => {
    render(<SyncServerSettings {...baseProps} networkAdapter={null} />)
    await waitFor(() =>
      expect(screen.getByTitle(/disconnected/i)).toBeInTheDocument(),
    )
  })
})
