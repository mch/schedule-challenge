import { useState } from 'react'

interface PassphraseDisplayProps {
  passphrase: string
}

/**
 * Inline display of the user's passphrase with a copy button.
 * Used in settings / account info areas.
 */
export function PassphraseDisplay({ passphrase }: PassphraseDisplayProps) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(passphrase)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="passphrase-display">
      <span className="passphrase-display__label">Your passphrase:</span>
      <code
        className="passphrase-display__value"
        aria-label={revealed ? 'Your passphrase' : 'Passphrase hidden'}
        style={{
          filter: revealed ? 'none' : 'blur(6px)',
          userSelect: revealed ? 'text' : 'none',
        }}
      >
        {passphrase}
      </code>
      <button
        type="button"
        onClick={() => setRevealed((r) => !r)}
        aria-label={revealed ? 'Hide passphrase' : 'Reveal passphrase'}
      >
        {revealed ? 'Hide' : 'Reveal'}
      </button>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy passphrase"
        disabled={!revealed}
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}
