/**
 * Opens (or creates) the user's Automerge document identified by `docId`.
 *
 * - If the document already exists locally or on the sync server it is opened.
 * - If it is brand-new it is created with the default `UserDocument` shape.
 * - Returns `{ doc, handle }` once the document is ready, or `{ doc: null }`
 *   while it is still loading.
 */
import { useEffect, useRef, useState } from 'react'
import type { AutomergeUrl, DocHandle } from '@automerge/automerge-repo'
import type { UserDocument } from '../types/user-document'
import { useRepo } from './RepoContext'

export interface UseUserDocResult {
  doc: UserDocument | null
  handle: DocHandle<UserDocument> | null
}

const DEFAULT_USER_DOCUMENT: UserDocument = {
  bookmarks: [],
}

export function useUserDoc(docId: AutomergeUrl | null): UseUserDocResult {
  const repo = useRepo()
  const handleRef = useRef<DocHandle<UserDocument> | null>(null)
  const [doc, setDoc] = useState<UserDocument | null>(null)

  useEffect(() => {
    if (!docId) return

    let cancelled = false

    // Try to find an existing doc; if not found, create it with defaults.
    const handle = repo.find<UserDocument>(docId)
    handleRef.current = handle

    handle.doc().then((loaded) => {
      if (cancelled) return

      if (loaded === undefined) {
        // Doc doesn't exist yet — initialise it.
        // `repo.find` already created a local handle; we need to create a
        // new one at the desired URL. Use `repo.create` with a fixed docId
        // by merging the handle.
        // In automerge-repo the canonical way is: if `find` returns undefined
        // after await, the doc was never written; we initialise via `change`.
        handle.change((d) => {
          d.bookmarks = DEFAULT_USER_DOCUMENT.bookmarks
        })
        setDoc({ ...DEFAULT_USER_DOCUMENT })
      } else {
        setDoc(loaded)
      }
    })

    // Subscribe to future changes.
    function onchange({ doc: updated }: { doc: UserDocument }) {
      if (!cancelled) setDoc(updated)
    }
    handle.on('change', onchange)

    return () => {
      cancelled = true
      handle.off('change', onchange)
      handleRef.current = null
    }
  }, [repo, docId])

  return { doc, handle: handleRef.current }
}
