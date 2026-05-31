import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Initialise Automerge's WebAssembly module before mounting.
// vite-plugin-wasm handles the import; `?url` gives us the asset URL at build time.
import wasmUrl from '@automerge/automerge/automerge.wasm?url'
import * as Automerge from '@automerge/automerge/slim'

Automerge.initializeWasm(wasmUrl).then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
