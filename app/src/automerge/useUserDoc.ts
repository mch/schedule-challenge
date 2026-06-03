/**
 * Opens (or creates) the user's Automerge document identified by `docId`.
 *
 * - If the document already exists locally or on the sync server it is opened.
 * - If it is brand-new it is bootstrapped with the default `UserDocument` shape
 *   at the deterministic docId derived from the user's passphrase.
 * - Returns `{ doc, handle }` once the document is ready, or `{ doc: null }`
 *   while it is still loading.
 *
 * ### API notes (automerge-repo ≥ 2.0)
 * - `repo.find(id)` is now async and rejects when the document is unavailable.
 *   Pass `allowableStates: ['ready', 'unavailable']` to get back the handle
 *   in either case instead of throwing.
 * - `handle.doc()` is synchronous and throws if the handle is not ready.
 * - `handle.change()` also throws if not ready; never call it on an
 *   unavailable handle.
 * - To bootstrap a brand-new doc at a deterministic ID, use `repo.import()`
 *   with a serialised empty Automerge document.
 */

import * as A from '@automerge/automerge/slim'
import type { AutomergeUrl, DocHandle } from '@automerge/automerge-repo'
import { parseAutomergeUrl } from '@automerge/automerge-repo'
import { useEffect, useRef, useState } from 'react'
import type { UserDocument } from '../types/user-document'
import { useRepo } from './RepoContext'

export interface UseUserDocResult {
  doc: UserDocument | null
  handle: DocHandle<UserDocument> | null
}

const DEFAULT_USER_DOCUMENT: UserDocument = {
  bookmarks: [],
  hidePastEvents: false,
}

export function useUserDoc(docId: AutomergeUrl | null): UseUserDocResult {
  const repo = useRepo()
  const handleRef = useRef<DocHandle<UserDocument> | null>(null)
  const [doc, setDoc] = useState<UserDocument | null>(null)

  useEffect(() => {
    if (!docId) return

    let cancelled = false

    async function init() {
      // `repo.find()` resolves to a ready handle, or rejects if unavailable
      // (the default `allowableStates` is ['ready']).
      // Ask for both so we can bootstrap the doc ourselves if needed.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handle = (await (repo as any).find(docId, {
        allowableStates: ['ready', 'unavailable'],
      })) as DocHandle<UserDocument>

      if (cancelled) return

      if (handle.isUnavailable()) {
        // Doc has never been written anywhere. Bootstrap it at the
        // deterministic docId using repo.import(), which transitions the
        // handle to 'ready' via the internal update/doneLoading path.
        const { documentId } = parseAutomergeUrl(docId!)
        const emptyDoc = A.change(A.init() as A.Doc<UserDocument>, (d) => {
          ;(d as UserDocument).bookmarks = DEFAULT_USER_DOCUMENT.bookmarks
          ;(d as UserDocument).hidePastEvents =
            DEFAULT_USER_DOCUMENT.hidePastEvents
        }) as A.Doc<UserDocument>
        const binary = A.save(emptyDoc)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(repo as any).import(binary, { docId: documentId })
        // After import, find the now-ready handle
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const readyHandle = (await (repo as any).find(
          docId,
        )) as DocHandle<UserDocument>
        if (cancelled) return
        handleRef.current = readyHandle
        setDoc(readyHandle.doc())
        readyHandle.on('change', onchange)
      } else {
        handleRef.current = handle
        setDoc(handle.doc())
        handle.on('change', onchange)
      }
    }

    function onchange({ doc: updated }: { doc: UserDocument }) {
      if (!cancelled) setDoc(updated)
    }

    init().catch((err) => {
      if (!cancelled) {
        console.error('useUserDoc: failed to open document', err)
      }
    })

    return () => {
      cancelled = true
      handleRef.current?.off('change', onchange)
      handleRef.current = null
    }
  }, [repo, docId])

  return { doc, handle: handleRef.current }
}
