#!/usr/bin/env bash
# fix-style-issue.sh
#
# Runs biome in app/, picks the first reported diagnostic, and asks Pi to fix it.
#
# Usage:
#   ./scripts/fix-style-issue.sh            # fix one issue
#   ./scripts/fix-style-issue.sh --all      # loop until no issues remain

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$REPO_ROOT/app"
PROBLEMS_FILE=/tmp/style-problems.json

fix_one() {
  # ── 1. Generate the diagnostics report ──────────────────────────────────────
  echo "🔍  Running biome check in app/ …"
  cd "$APP_DIR"

  # biome exits non-zero when there are issues; capture that without aborting
  npx biome check --reporter=json 1>"$PROBLEMS_FILE" 2>/dev/null || true

  # ── 2. Count remaining issues ───────────────────────────────────────────────
  ISSUE_COUNT=$(jq '.diagnostics | length' "$PROBLEMS_FILE")

  if [[ "$ISSUE_COUNT" -eq 0 ]]; then
    echo "✅  No style issues found — nothing to fix."
    return 1   # signal "done" to the --all loop
  fi

  echo "📋  $ISSUE_COUNT issue(s) remaining. Fixing the first one …"

  # ── 3. Extract the first diagnostic as pretty JSON ──────────────────────────
  DIAGNOSTIC=$(jq '.diagnostics[0]' "$PROBLEMS_FILE")

  FILE_PATH=$(echo "$DIAGNOSTIC" | jq -r '.location.path // "unknown"')
  CATEGORY=$(echo "$DIAGNOSTIC" | jq -r '.category // "unknown"')
  MESSAGE=$(echo "$DIAGNOSTIC" | jq -r '.message // ""')
  START_LINE=$(echo "$DIAGNOSTIC" | jq -r '.location.start.line // "unknown"')
  START_COL=$(echo "$DIAGNOSTIC" | jq -r '.location.start.column // "unknown"')

  # Build a human-readable advice block from the advices array (may be empty)
  ADVICE_TEXT=$(echo "$DIAGNOSTIC" | jq -r '
    if (.advices | length) > 0
    then "Advice from biome:\n" + (.advices[] | "  - \(.text // "")")
    else ""
    end
  ')

  # ── 4. Build the prompt ──────────────────────────────────────────────────────
  PROMPT=$(cat <<EOF
Fix the following biome style issue in the app/ directory.

File:     $FILE_PATH
Location: line $START_LINE, column $START_COL
Rule:     $CATEGORY
Message:  $MESSAGE
${ADVICE_TEXT:+
$ADVICE_TEXT}
Full diagnostic JSON:
$DIAGNOSTIC

Instructions:
- Fix only this one issue. Do not change anything else.
- After editing, run the following to ensure the issue is gone and the fix doesn't have problems:
  - \`npm run checkstyle\` (from app/) to verify the issue is gone.
  - \`npm run build\` (from app/) to verify it still compiles correctly.
  - \`npm run test:run\` (from app/) to verify no unit tests break.
- If the rule violation cannot be fixed without breaking correctness, add a biome
  suppression comment (\`// biome-ignore <rule>: <reason>\`) as a last resort.
EOF
)

  # ── 5. Invoke Pi ────────────────────────────────────────────────────────────
  echo "🤖  Asking Pi to fix: [$CATEGORY] in $FILE_PATH:$START_LINE"
  cd "$APP_DIR"
  pi --print --no-session "$PROMPT"
}

# ── Entry point ────────────────────────────────────────────────────────────────
if [[ "${1:-}" == "--all" ]]; then
  MAX_ITERATIONS=100
  iteration=0
  while [[ $iteration -lt $MAX_ITERATIONS ]]; do
    (( iteration++ )) || true
    echo ""
    echo "══════════════════════════════════════════════"
    echo "  Iteration $iteration / $MAX_ITERATIONS"
    echo "══════════════════════════════════════════════"
    fix_one || break   # fix_one returns 1 when there are no more issues
  done
  if [[ $iteration -ge $MAX_ITERATIONS ]]; then
    echo "⚠️  Reached $MAX_ITERATIONS iterations — stopping to avoid infinite loop."
    exit 1
  fi
  echo ""
  echo "🎉  All style issues fixed!"
else
  fix_one || true
fi
