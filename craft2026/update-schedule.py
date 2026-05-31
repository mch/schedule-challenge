#!/usr/bin/env python3
"""
update-schedule.py — Check for updates to the Craft 2026 schedule and refresh schedule.json.

Usage:
    python3 update-schedule.py            # check and update if changed
    python3 update-schedule.py --dry-run  # check only, print diff, don't write

Exit codes:
    0  no changes / already up to date
    1  schedule was updated (new schedule.json written)
    2  error
"""

import argparse
import html
import json
import re
import sys
import urllib.request
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path

# ── config ────────────────────────────────────────────────────────────────────

URL = "https://craft-conf.com/2026/schedule"
SCHEDULE_FILE = Path(__file__).parent / "schedule.json"
CHANGES_FILE  = Path(__file__).parent / "schedule-changes.json"
USER_AGENT = "Mozilla/5.0 (compatible; craft-schedule-updater/1.0)"

# ── fetch ─────────────────────────────────────────────────────────────────────

def fetch_raw_props(url: str) -> dict:
    """Download the page and return the decoded Inertia props dict."""
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        page = resp.read().decode("utf-8")

    m = re.search(r'id="app"\s+data-page="([^"]+)"', page)
    if not m:
        raise ValueError("Could not find data-page attribute in page HTML")

    outer = json.loads(html.unescape(m.group(1)))
    return outer["props"]

# ── transform (mirrors the logic used to create schedule.json) ────────────────

def make_tag(t: dict) -> dict:
    return {
        "id": t["id"],
        "name": t["name"],
        "is_trending": t.get("is_trending", False),
    }

def make_speaker(s: dict) -> dict:
    return {"name": s["name"], "slug": s["slug"], "topic": s.get("topic")}

def make_talk(t: dict) -> dict:
    return {
        "id": t["id"],
        "title": t["title"],
        "slug": t["slug"],
        "topic": t.get("topic"),
        "is_keynote": t.get("is_keynote", False),
        "is_online": t.get("is_online", False),
        "video_url": t.get("video_url"),
        "slides_url": t.get("slides_url"),
        "tags": [make_tag(tag) for tag in t.get("tags", [])],
        "speakers": [make_speaker(s) for s in t.get("speakers", [])],
    }

def make_workshop(w: dict) -> dict:
    return {
        "id": w["id"],
        "title": w["title"],
        "slug": w["slug"],
        "topic": w.get("topic"),
        "tags": [make_tag(tag) for tag in w.get("tags", [])],
        "speakers": [make_speaker(s) for s in w.get("speakers", [])],
    }

def make_slot(s: dict) -> dict:
    return {
        "id": s["id"],
        "type": s["type"],
        "topic": s.get("topic"),
        "start_time": s["start_time"],
        "end_time": s["end_time"],
        "title": s.get("title"),
        "description": s.get("description"),
        "talk": make_talk(s["talk"]) if s.get("talk") else None,
        "workshop": make_workshop(s["workshop"]) if s.get("workshop") else None,
    }

def make_global_slot(s: dict) -> dict:
    return {
        "id": s["id"],
        "type": s["type"],
        "title": s["title"],
        "description": s.get("description"),
        "start_time": s["start_time"],
        "end_time": s["end_time"],
    }

def make_stage(stage: dict) -> dict:
    return {
        "id": stage["id"],
        "name": stage["name"],
        "color": stage["color"],
        "slots": [make_slot(s) for s in stage["slots"]],
    }

def make_day(day: dict) -> dict:
    return {
        "id": day["id"],
        "name": day["name"],
        "date": day["date"],
        "global_slots": [make_global_slot(s) for s in day["global_slots"]],
        "stages": [make_stage(stage) for stage in day["stages"]],
    }

def build_schedule(props: dict) -> dict:
    conf = props["conference"]
    cy = props["conferenceYear"]
    return {
        "conference": {
            "id": conf["id"],
            "name": conf["name"],
            "year": conf["year"],
            "date": cy["date"],
            "location": cy["location"],
            "domain": conf["domain"],
        },
        "days": [make_day(day) for day in props["schedule"]],
    }

# ── diff ──────────────────────────────────────────────────────────────────────

def slot_label(slot: dict) -> str:
    """Human-readable label for a slot."""
    content = slot.get("title") or ""
    if slot.get("talk"):
        content = slot["talk"]["title"]
    elif slot.get("workshop"):
        content = slot["workshop"]["title"]
    return f"{slot['start_time']}–{slot['end_time']} {content!r}"

def diff_schedules(old: dict, new: dict) -> list[str]:
    """Return a list of human-readable change descriptions."""
    changes = []

    old_days = {d["id"]: d for d in old.get("days", [])}
    new_days = {d["id"]: d for d in new.get("days", [])}

    for day_id, new_day in new_days.items():
        day_name = new_day["name"]

        if day_id not in old_days:
            changes.append(f"[{day_name}] NEW DAY added")
            continue

        old_day = old_days[day_id]

        # Global slots
        old_gs = {s["id"]: s for s in old_day["global_slots"]}
        new_gs = {s["id"]: s for s in new_day["global_slots"]}
        for sid, ns in new_gs.items():
            if sid not in old_gs:
                changes.append(f"[{day_name}] Global slot ADDED: {slot_label(ns)}")
            elif ns != old_gs[sid]:
                changes.append(f"[{day_name}] Global slot CHANGED: {slot_label(ns)}")
        for sid in old_gs:
            if sid not in new_gs:
                changes.append(f"[{day_name}] Global slot REMOVED: {slot_label(old_gs[sid])}")

        # Stages
        old_stages = {s["id"]: s for s in old_day["stages"]}
        new_stages = {s["id"]: s for s in new_day["stages"]}

        for stage_id, new_stage in new_stages.items():
            stage_name = new_stage["name"]
            if stage_id not in old_stages:
                changes.append(f"[{day_name} / {stage_name}] NEW STAGE added")
                continue

            old_stage = old_stages[stage_id]
            old_slots = {s["id"]: s for s in old_stage["slots"]}
            new_slots = {s["id"]: s for s in new_stage["slots"]}

            for slot_id, ns in new_slots.items():
                if slot_id not in old_slots:
                    changes.append(f"[{day_name} / {stage_name}] Slot ADDED: {slot_label(ns)}")
                elif ns != old_slots[slot_id]:
                    # Narrow down what changed
                    os_ = old_slots[slot_id]
                    sub = []
                    for field in ("start_time", "end_time", "type", "title", "description"):
                        if ns.get(field) != os_.get(field):
                            sub.append(f"{field}: {os_.get(field)!r} → {ns.get(field)!r}")
                    for nested in ("talk", "workshop"):
                        on_, nn_ = os_.get(nested), ns.get(nested)
                        if on_ != nn_:
                            if on_ is None and nn_ is not None:
                                sub.append(f"{nested} assigned: {nn_['title']!r}")
                            elif on_ is not None and nn_ is None:
                                sub.append(f"{nested} removed")
                            else:
                                # both exist — compare fields
                                for f2 in ("title", "is_keynote", "is_online", "video_url", "slides_url", "tags", "speakers"):
                                    if on_.get(f2) != nn_.get(f2):
                                        sub.append(f"{nested}.{f2}: {on_.get(f2)!r} → {nn_.get(f2)!r}")
                    detail = "; ".join(sub) if sub else "unspecified change"
                    changes.append(f"[{day_name} / {stage_name}] Slot CHANGED ({detail}): {slot_label(ns)}")

            for slot_id in old_slots:
                if slot_id not in new_slots:
                    changes.append(f"[{day_name} / {stage_name}] Slot REMOVED: {slot_label(old_slots[slot_id])}")

        for stage_id in old_stages:
            if stage_id not in new_stages:
                sn = old_stages[stage_id]["name"]
                changes.append(f"[{day_name} / {sn}] STAGE REMOVED")

    for day_id in old_days:
        if day_id not in new_days:
            changes.append(f"Day REMOVED: {old_days[day_id]['name']}")

    return changes

# ── event log ────────────────────────────────────────────────────────────────

def load_changes_log() -> list:
    """Return the existing list of log entries, or an empty list."""
    if CHANGES_FILE.exists():
        with open(CHANGES_FILE, encoding="utf-8") as f:
            return json.load(f)
    return []

def append_to_log(changes: list[str], timestamp: str, dry_run: bool) -> None:
    """Append one event-log entry and write schedule-changes.json."""
    log = load_changes_log()
    log.append({
        "timestamp": timestamp,
        "dry_run": dry_run,
        "change_count": len(changes),
        "changes": changes,
    })
    with open(CHANGES_FILE, "w", encoding="utf-8") as f:
        json.dump(log, f, indent=2, ensure_ascii=False)
        f.write("\n")

# ── main ──────────────────────────────────────────────────────────────────────

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dry-run", action="store_true",
                        help="Print changes without writing schedule.json")
    args = parser.parse_args()

    # 1. Fetch fresh data
    print(f"Fetching {URL} …")
    try:
        props = fetch_raw_props(URL)
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 2

    new_schedule = build_schedule(props)

    # 2. Load existing schedule (if any)
    if SCHEDULE_FILE.exists():
        with open(SCHEDULE_FILE, encoding="utf-8") as f:
            old_schedule = json.load(f)
    else:
        print("No existing schedule.json found — will create it.")
        old_schedule = {}

    # 3. Compare (ignore the fetched_at timestamp for equality check)
    old_cmp = deepcopy(old_schedule)
    old_cmp.pop("fetched_at", None)

    if old_cmp == new_schedule:
        print("✓ No changes detected. schedule.json is up to date.")
        return 0

    # 4. Diff
    now = datetime.now(timezone.utc).isoformat()
    changes = diff_schedules(old_schedule, new_schedule)
    print(f"⚡ {len(changes)} change(s) detected:")
    for c in changes:
        print(f"  • {c}")

    if args.dry_run:
        append_to_log(changes, now, dry_run=True)
        print(f"\n--dry-run: schedule.json NOT updated.")
        print(f"✓ Changes logged to {CHANGES_FILE}")
        return 1

    # 5. Write schedule, stamping the fetch time
    new_schedule["fetched_at"] = now
    with open(SCHEDULE_FILE, "w", encoding="utf-8") as f:
        json.dump(new_schedule, f, indent=2, ensure_ascii=False)
        f.write("\n")

    # 6. Append to event log
    append_to_log(changes, now, dry_run=False)

    print(f"\n✓ schedule.json updated ({SCHEDULE_FILE})")
    print(f"✓ Changes logged to {CHANGES_FILE}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
