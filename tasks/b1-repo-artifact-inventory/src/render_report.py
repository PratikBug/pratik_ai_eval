#!/usr/bin/env python3
"""Render inventory JSON as a Markdown report."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

SECTIONS = [
    ("classes", "Classes"),
    ("interfaces", "Interfaces"),
    ("services", "Services"),
    ("controllers", "Controllers"),
    ("models", "Models"),
    ("repositories", "Repositories"),
    ("jobs", "Jobs"),
    ("consumers", "Consumers"),
    ("configs", "Configs"),
    ("utilities", "Utilities"),
]


def render_item(item: dict) -> str:
    loc = f"`{item['file']}`"
    if item.get("line"):
        loc += f":{item['line']}"
    inferred = " *(inferred)*" if item.get("inferred") else ""
    lang = f" [{item['language']}]" if item.get("language") else ""
    return f"- **{item['name']}** ({item['kind']}) — {loc}{lang}{inferred}"


def render_report(data: dict) -> str:
    lines = [
        "# Repository Artifact Inventory",
        "",
        f"**Root:** `{data['root']}`  ",
        f"**Scanned at:** {data['scanned_at']}  ",
        f"**Files scanned:** {data['files_scanned']}",
        "",
        "## Summary",
        "",
        "| Category | Count |",
        "|----------|------:|",
    ]

    for key, label in SECTIONS:
        count = len(data.get(key, []))
        lines.append(f"| {label} | {count} |")

    lines.append("")
    for key, label in SECTIONS:
        items = data.get(key, [])
        lines.extend([f"## {label}", ""])
        if not items:
            lines.append("_None found._")
        else:
            lines.extend(render_item(item) for item in items)
        lines.append("")

    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Render inventory JSON to Markdown.")
    parser.add_argument("input", type=Path, help="Input inventory JSON")
    parser.add_argument("output", type=Path, help="Output Markdown path")
    args = parser.parse_args()

    data = json.loads(args.input.read_text(encoding="utf-8"))
    report = render_report(data)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(report, encoding="utf-8")
    print(f"Wrote {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
