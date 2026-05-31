/**
 * Git Session Trailer Extension
 *
 * Automatically appends a `Pi-agent-session: <uuid>` git trailer to every
 * `git commit` command the agent runs, so commits are traceable back to the
 * pi session that produced them.
 *
 * The session UUID is read from ctx.sessionManager.getSessionId(), the same
 * value shown by the /session command. The agent doesn't expose this by
 * default, so this extension bridges that gap.
 *
 * Handles the common commit message forms:
 *   git commit -m "message"
 *   git commit --message "message"
 *   git commit -m "message" --amend  (etc.)
 *
 * For commits invoked without -m / --message (e.g. opening an editor), the
 * trailer is appended via --trailer instead so git itself handles formatting.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { isToolCallEventType } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.on("tool_call", async (event, ctx) => {
    if (!isToolCallEventType("bash", event)) return;

    const command: string = event.input.command ?? "";

    // Only act on git commit invocations.
    // Match `git commit` with optional flags/args before it, e.g.:
    //   git commit -m "..."
    //   git -C /path commit -m "..."
    if (!/\bgit\b.*\bcommit\b/.test(command)) return;

    const sessionId = ctx.sessionManager.getSessionId();
    const trailers = [
      `Pi-agent-session: ${sessionId}`,
      `Co-authored-by: mchbot <258630856+mchbot@users.noreply.github.com>`,
    ];

    // Rewrite -m / --message values to include the trailer as a git trailer
    // (blank line + "Key: value" appended to the message body).
    const rewritten = rewriteCommitMessage(command, trailers);

    if (rewritten !== null) {
      event.input.command = rewritten;
    } else {
      // No inline message flag found — let git append the trailers itself.
      event.input.command = appendTrailerFlags(command, trailers);
    }
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Appends `trailer` to every -m / --message value found in `command`.
 * Returns the rewritten command string, or null if no message flag was found.
 *
 * Handles both quoted forms:
 *   -m "single line"
 *   -m 'single line'
 *   --message="value"
 *   --message "value"
 */
function rewriteCommitMessage(command: string, trailers: string[]): string | null {
  // We'll do a single-pass replacement over the raw command string.
  // Regex captures the flag, optional =, then a single- or double-quoted string.
  const pattern =
    /(-m\s+|--message\s*=\s*|--message\s+)(["'])([\s\S]*?)\2/g;

  let matched = false;

  const result = command.replace(pattern, (_full, flag, quote, body) => {
    matched = true;
    // Git trailers require a blank line before them when appended to a
    // single-line subject, but git itself normalises this. We normalise
    // here to be safe: strip any trailing whitespace from the existing
    // body and add the blank separator + trailer.
    const normalised = body.trimEnd();
    const separator = normalised.includes("\n") ? "\n" : "\n\n";
    return `${flag}${quote}${normalised}${separator}${trailers.join("\n")}${quote}`;
  });

  return matched ? result : null;
}

/**
 * Appends a `--trailer "<value>"` flag for each trailer to the command, for
 * commits that don't use an inline -m flag (e.g. `git commit --amend --no-edit`).
 */
function appendTrailerFlags(command: string, trailers: string[]): string {
  const flags = trailers.map((t) => `--trailer "${t}"`).join(" ");
  return `${command.trimEnd()} ${flags}`;
}
