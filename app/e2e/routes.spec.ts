import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { type Page, expect, test } from "@playwright/test";
import libCoverage from "istanbul-lib-coverage";
import libReport from "istanbul-lib-report";
import reports from "istanbul-reports";
import v8ToIstanbul from "v8-to-istanbul";

/**
 * Convert the raw V8 coverage entries returned by Playwright's
 * `page.coverage.stopJSCoverage()` into a merged Istanbul CoverageMap and
 * write it as an lcov report to `coverage/lcov.info`.
 *
 * Entries are filtered to only include scripts served from the dev-server
 * origin so that third-party / extension scripts are excluded.
 */
async function writeCoverageReport(
  coverage: Awaited<
    ReturnType<
      typeof import("@playwright/test").Page.prototype.coverage.stopJSCoverage
    >
  >,
  outputDir: string,
): Promise<void> {
  const map = libCoverage.createCoverageMap({});

  for (const entry of coverage) {
    // Only process our app's own source files — skip pre-bundled deps,
    // Vite internals, and any non-localhost scripts.
    if (!entry.url.startsWith("http://localhost:5173/src/")) continue;
    // Skip entries with no source (e.g. injected evaluation scripts)
    if (!entry.source) continue;

    // Convert http://localhost:5173/src/App.tsx → <appRoot>/src/App.tsx so
    // that v8-to-istanbul resolves source-map sources to real filesystem paths
    // (required by the istanbul HTML reporter to display source lines).
    const urlPath = new URL(entry.url).pathname; // e.g. "/src/App.tsx"
    const scriptPath = join(outputDir, "..", urlPath); // <appRoot>/src/App.tsx

    // v8ToIstanbul(scriptPath, wrapperLength, sources)
    // Providing source inline means load() never touches disk for the script
    // itself; scriptPath is only used to anchor source-map source resolution.
    const converter = v8ToIstanbul(scriptPath, 0, { source: entry.source });
    await converter.load();
    converter.applyCoverage(entry.functions);

    // toIstanbul() returns a coverage-map-shaped object keyed by file path.
    // Skip any entry whose resolved path is empty (e.g. un-mapped scripts).
    const istanbulData = converter.toIstanbul();
    const validData = Object.fromEntries(
      Object.entries(istanbulData).filter(([key]) => !!key),
    );
    if (Object.keys(validData).length > 0) {
      map.merge(validData);
    }
  }

  // Remove stale output so old artefacts from previous runs don't linger.
  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(outputDir, { recursive: true });

  // Remove CSS entries — they carry no JS coverage and the HTML reporter
  // cannot meaningfully display them.
  const appRoot = resolve(outputDir, "..");
  for (const filePath of map.files()) {
    if (filePath.endsWith(".css")) {
      map.data = Object.fromEntries(
        Object.entries(map.data).filter(([k]) => k !== filePath),
      );
    }
  }

  const context = libReport.createContext({
    dir: outputDir,
    coverageMap: map,
    // Resolve relative paths against the app root so the HTML reporter can
    // read the original source files.
    sourceFinder: (filePath: string) =>
      readFileSync(resolve(appRoot, filePath), "utf8"),
  });

  // Write lcov.info (consumed by lcov viewers, Codecov, Coveralls, etc.)
  reports.create("lcovonly").execute(context);
  // Write an HTML report for line/branch visualisation (coverage/index.html)
  reports.create("html").execute(context);
  // Also write a human-readable text summary to stdout
  reports.create("text-summary").execute(context);
}

// ---------------------------------------------------------------------------
// Shared page — created once, reused across all tests in this suite.
// Coverage is started before account setup and written after all tests run.
// ---------------------------------------------------------------------------

test.describe("app routes", () => {
  test.describe.configure({ mode: "serial" });

  let sharedPage: Page;

  test.beforeAll(async ({ browser }) => {
    sharedPage = await browser.newPage();
    await sharedPage.coverage.startJSCoverage({
      resetOnNavigation: false,
    });

    // Create a new account and wait for the main app to be ready.
    await sharedPage.goto("/");
    await sharedPage
      .getByRole("button", { name: "Create new account" })
      .click();
    await sharedPage.getByRole("button", { name: /saved it/i }).click();
    await expect(
      sharedPage.getByRole("heading", { name: /craft 2026/i }),
    ).toBeVisible({ timeout: 10_000 });
    // Allow async Automerge initialisation to complete
    await sharedPage.waitForTimeout(2_000);
    await expect(
      sharedPage.getByRole("button", { name: /schedule/i }).first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test.afterAll(async () => {
    const coverage = await sharedPage.coverage.stopJSCoverage();
    await writeCoverageReport(coverage, resolve(process.cwd(), "coverage"));
    await sharedPage.close();
  });

  test.describe("Schedule view", () => {
    test("loads via URL (?view=schedule)", async () => {
      await sharedPage.goto("/?view=schedule");
      await expect(
        sharedPage.getByRole("button", { name: "Schedule", exact: true }),
      ).toBeVisible({ timeout: 5_000 });
    });

    test("loads via nav button click", async () => {
      await sharedPage.goto("/");
      await sharedPage
        .getByRole("button", { name: "Schedule", exact: true })
        .click();
      await expect(
        sharedPage.getByRole("button", { name: "Schedule", exact: true }),
      ).toBeVisible({ timeout: 5_000 });
    });
  });

  test.describe("My Schedule view", () => {
    test("loads via URL (?view=myschedule)", async () => {
      await sharedPage.goto("/?view=myschedule");
      await expect(
        sharedPage.getByRole("button", { name: "My Schedule" }),
      ).toBeVisible({ timeout: 5_000 });
    });

    test("loads via nav button click and shows bookmarked session", async () => {
      // Bookmark a session from the main schedule first
      await sharedPage.goto("/");
      await sharedPage
        .getByRole("button", { name: "Schedule", exact: true })
        .click();
      const firstCard = sharedPage.getByRole("article").first();
      const firstCardLabel = await firstCard.getAttribute("aria-label");
      const firstSessionTitle =
        firstCardLabel?.replace(/^View details for /, "") ?? "";
      await firstCard
        .getByRole("button", { name: "Add to personal schedule" })
        .click();

      // Navigate to My Schedule via the nav button
      await sharedPage.getByRole("button", { name: "My Schedule" }).click();
      await expect(
        sharedPage.getByRole("article", {
          name: `View details for ${firstSessionTitle}`,
        }),
      ).toBeVisible({ timeout: 5_000 });
    });
  });

  test.describe("Speakers view", () => {
    test("loads via URL (?view=speakers)", async () => {
      await sharedPage.goto("/?view=speakers");
      await expect(
        sharedPage.getByRole("heading", { name: /Speakers/ }),
      ).toBeVisible({ timeout: 5_000 });
    });

    test("loads via nav button click", async () => {
      await sharedPage.goto("/");
      await sharedPage.getByRole("button", { name: "Speakers" }).click();
      await expect(
        sharedPage.getByRole("heading", { name: /Speakers/ }),
      ).toBeVisible({ timeout: 5_000 });
    });
  });

  test.describe("Settings view", () => {
    test("loads via URL (?view=settings)", async () => {
      await sharedPage.goto("/?view=settings");
      await expect(
        sharedPage.getByRole("heading", { name: /Settings/ }),
      ).toBeVisible({ timeout: 5_000 });
    });

    test("loads via nav button click", async () => {
      await sharedPage.goto("/");
      await sharedPage.getByRole("button", { name: "Settings" }).click();
      await expect(
        sharedPage.getByRole("heading", { name: /Settings/ }),
      ).toBeVisible({ timeout: 5_000 });
    });
  });

  test.describe("Session detail view", () => {
    test("loads via URL (?session=616)", async () => {
      await sharedPage.goto("/?session=616");
      await expect(
        sharedPage.getByRole("heading", { name: /Slow down to speed up/ }),
      ).toBeVisible({ timeout: 5_000 });
    });

    test("loads via article click from the Schedule view", async () => {
      await sharedPage.goto("/");
      await sharedPage
        .getByRole("button", { name: "Schedule", exact: true })
        .click();
      await sharedPage
        .getByRole("article", {
          name: "View details for Slow down to speed up",
          exact: true,
        })
        .click();
      await expect(
        sharedPage.getByRole("heading", { name: /Slow down to speed up/ }),
      ).toBeVisible({ timeout: 5_000 });
    });
  });

  test.describe("Speaker detail view", () => {
    test("loads via URL (?speaker=gergely-orosz)", async () => {
      await sharedPage.goto("/?speaker=gergely-orosz");
      await expect(
        sharedPage.getByRole("heading", { name: /Gergely Orosz/ }),
      ).toBeVisible({ timeout: 5_000 });
    });

    test("loads via speaker button click from the Speakers view", async () => {
      await sharedPage.goto("/");
      await sharedPage.getByRole("button", { name: "Speakers" }).click();
      await sharedPage
        .getByRole("button", { name: "View Aaron Erickson's sessions" })
        .click();
      await expect(
        sharedPage.getByRole("heading", { name: /Aaron Erickson/ }),
      ).toBeVisible({ timeout: 5_000 });
    });
  });
});
