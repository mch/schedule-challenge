import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RepoProvider, useRepo } from './RepoContext'
import type { Repo } from '@automerge/automerge-repo'

// A minimal fake Repo for testing.
const fakeRepo = { id: 'fake-repo' } as unknown as Repo

function Inspector() {
  const repo = useRepo()
  return <div data-testid="repo">{JSON.stringify(repo)}</div>
}

describe('RepoProvider / useRepo', () => {
  it('provides the repo to children', () => {
    render(
      <RepoProvider repo={fakeRepo}>
        <Inspector />
      </RepoProvider>,
    )
    expect(screen.getByTestId('repo').textContent).toContain('fake-repo')
  })

  it('throws when useRepo is called outside a provider', () => {
    // Suppress the React error boundary noise in test output.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Inspector />)).toThrow('useRepo must be used within a <RepoProvider>')
    spy.mockRestore()
  })
})
