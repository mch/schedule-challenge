/**
 * Provides the Automerge Repo instance via React context so any component
 * in the tree can access it without prop-drilling.
 *
 * Usage:
 *   <RepoProvider repo={repo}>
 *     <App />
 *   </RepoProvider>
 *
 * Then in components:
 *   const repo = useRepo()
 */

import type { Repo } from '@automerge/automerge-repo'
import { createContext, type ReactNode, useContext } from 'react'

const RepoContext = createContext<Repo | null>(null)

export interface RepoProviderProps {
  repo: Repo
  children: ReactNode
}

export function RepoProvider({ repo, children }: RepoProviderProps) {
  return <RepoContext.Provider value={repo}>{children}</RepoContext.Provider>
}

/**
 * Returns the Automerge Repo from context.
 * Throws if called outside a <RepoProvider>.
 */
export function useRepo(): Repo {
  const repo = useContext(RepoContext)
  if (!repo) {
    throw new Error('useRepo must be used within a <RepoProvider>')
  }
  return repo
}
