/**
 * Boot / identity flow e2e tests.
 *
 * These tests verify that the app starts up cleanly — no uncaught JS errors,
 * no unhandled promise rejections — and that the identity + Automerge
 * document lifecycle works end-to-end in a real browser.
 *
 * Specifically designed to catch regressions like:
 *   - "handle.doc is not a function" (API mismatch: doc() became synchronous)
 *   - "Document … is unavailable" unhandled rejection (new doc not initialised)
 */
import { test, expect, type Page, type ConsoleMessage } from '@playwright/test'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Collect all console errors and unhandled rejections during a page session. */
function collectErrors(page: Page): () => string[] {
  const errors: string[] = []

  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      errors.push(`[console.error] ${msg.text()}`)
    }
  })

  page.on('pageerror', (err: Error) => {
    errors.push(`[pageerror] ${err.message}`)
  })

  return () => errors
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('App boot — first-time visitor', () => {
  test.beforeEach(async ({ context }) => {
    // Start with a clean origin: no localStorage, no IndexedDB
    await context.clearCookies()
    await context.addInitScript(() => localStorage.clear())
  })

  test('renders the identity setup screen without JS errors', async ({ page }) => {
    const getErrors = collectErrors(page)

    await page.goto('/')

    // The identity setup screen should appear (first-time visitor)
    await expect(
      page.getByRole('heading', { name: /welcome to craft 2026/i })
    ).toBeVisible({ timeout: 10_000 })

    expect(getErrors()).toEqual([])
  })

  test('no uncaught errors on the page after load', async ({ page }) => {
    const getErrors = collectErrors(page)

    await page.goto('/')

    // Wait for the app to reach a stable state
    await page.waitForLoadState('networkidle')

    // Allow a short settle time for async initialisation
    await page.waitForTimeout(1_000)

    const errors = getErrors().filter(
      // Filter out expected network errors from the sync server not being
      // reachable in test environment
      (e) => !e.includes('WebSocket') && !e.includes('wss://')
    )
    expect(errors).toEqual([])
  })
})

test.describe('App boot — returning visitor (existing passphrase)', () => {
  test('loads the schedule view without JS errors after confirming identity', async ({ page }) => {
    const getErrors = collectErrors(page)

    await page.goto('/')

    // Wait for the identity setup UI
    await expect(
      page.getByText(/create.*account|generate|new account/i).first()
    ).toBeVisible({ timeout: 10_000 })

    // Click "Create new account" to start the flow
    await page.getByRole('button', { name: 'Create new account' }).click()

    // The passphrase screen is shown — confirm it (button text: "I've saved it — continue")
    await page.getByRole('button', { name: /saved it/i }).click()

    // After confirming, the main app view should appear
    await expect(
      page.getByRole('heading', { name: /craft 2026 schedule/i })
    ).toBeVisible({ timeout: 10_000 })

    // Allow async Automerge initialisation to complete
    await page.waitForTimeout(2_000)

    // The app should show "Syncing…" or a bookmark count — not crash
    await expect(
      page.getByText(/syncing|bookmarks/i)
    ).toBeVisible({ timeout: 5_000 })

    const errors = getErrors().filter(
      (e) => !e.includes('WebSocket') && !e.includes('wss://')
    )
    expect(errors).toEqual([])
  })

  test('no "handle.doc is not a function" error in console', async ({ page }) => {
    const docErrors: string[] = []

    page.on('pageerror', (err) => {
      if (err.message.includes('handle.doc is not a function')) {
        docErrors.push(err.message)
      }
    })
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('handle.doc is not a function')) {
        docErrors.push(msg.text())
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2_000)

    expect(docErrors).toEqual([])
  })

  test('no "Document … is unavailable" unhandled rejection', async ({ page }) => {
    const unavailableErrors: string[] = []

    page.on('pageerror', (err) => {
      if (err.message.includes('is unavailable')) {
        unavailableErrors.push(err.message)
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2_000)

    expect(unavailableErrors).toEqual([])
  })
})
