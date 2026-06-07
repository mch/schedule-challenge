import { useState } from 'react'
import './IdentitySetup.css'

interface IdentitySetupProps {
  /** Called with the confirmed passphrase (either newly generated or user-entered). */
  onConfirm: (passphrase: string) => Promise<void>
  /** Returns a freshly generated passphrase suggestion. */
  generateNew: () => string
}

/**
 * Shown on first visit (or when no identity is stored).
 * Lets the user either create a new account (auto-generated passphrase)
 * or recover an existing account by entering their passphrase.
 */
export function IdentitySetup({ onConfirm, generateNew }: IdentitySetupProps) {
  type Mode = 'choose' | 'create' | 'recover'
  const [mode, setMode] = useState<Mode>('choose')
  const [generatedPassphrase] = useState<string>(generateNew)
  const [inputValue, setInputValue] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(generatedPassphrase)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleCreate() {
    setSubmitting(true)
    try {
      await onConfirm(generatedPassphrase)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRecover(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = inputValue.trim()
    if (!trimmed) {
      setError('Please enter your passphrase.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await onConfirm(trimmed)
    } finally {
      setSubmitting(false)
    }
  }

  if (mode === 'choose') {
    return (
      <div className="identity-setup-page">
        <main className="identity-setup">
          <h1>Welcome to Craft 2026</h1>
          <p>
            Your personal schedule is stored locally and synced privately using
            a passphrase.
          </p>
          <div className="identity-setup__actions">
            <button type="button" onClick={() => setMode('create')}>
              Create new account
            </button>
            <button type="button" onClick={() => setMode('recover')}>
              Enter existing passphrase
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (mode === 'create') {
    return (
      <div className="identity-setup-page">
        <main className="identity-setup">
          <h1>Your passphrase</h1>
          <p>
            This is your unique passphrase. Write it down — you&apos;ll need it
            to access your schedule on other devices or after clearing your
            browser data.
          </p>
          <div className="identity-setup__passphrase">
            <span className="identity-setup__passphrase-label">Your passphrase</span>
            <code>{generatedPassphrase}</code>
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy passphrase"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="identity-setup__actions">
            <button type="button" onClick={handleCreate} disabled={submitting}>
              {submitting ? 'Saving…' : "I've saved it — continue"}
            </button>
            <button
              type="button"
              onClick={() => setMode('choose')}
              disabled={submitting}
            >
              Back
            </button>
          </div>
        </main>
      </div>
    )
  }

  // mode === 'recover'
  return (
    <div className="identity-setup-page">
      <main className="identity-setup">
        <h1>Enter your passphrase</h1>
        <form onSubmit={handleRecover}>
          <label htmlFor="passphrase-input">Passphrase</label>
          <input
            id="passphrase-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="word-word-word-word"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            disabled={submitting}
          />
          {error && (
            <p role="alert" className="identity-setup__error">
              {error}
            </p>
          )}
          <div className="identity-setup__actions">
            <button type="submit" disabled={submitting}>
              {submitting ? 'Loading…' : 'Recover account'}
            </button>
            <button
              type="button"
              onClick={() => setMode('choose')}
              disabled={submitting}
            >
              Back
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
