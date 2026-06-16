#!/usr/bin/env python3
"""Render endpoint map JSON into Markdown reports."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def _table(headers: list[str], rows: list[list[str]]) -> str:
    if not rows:
        return "_None found._\n"
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join(["---"] * len(headers)) + " |",
    ]
    for row in rows:
        lines.append("| " + " | ".join(row) + " |")
    return "\n".join(lines) + "\n"


def render_api_report(data: dict) -> str:
    lines = [
        "# API Endpoint Map",
        "",
        f"**Root:** `{data['root']}`  ",
        f"**Scanned at:** {data['scanned_at']}  ",
    ]
    if data.get("source_url"):
        lines.append(f"**Source URL:** {data['source_url']}  ")
    if data.get("branch"):
        lines.append(f"**Branch:** {data['branch']}  ")
    lines.extend(
        [
            f"**Files scanned:** {data.get('files_scanned', 0)}",
            "",
            "## Summary",
            "",
            f"- **API / middleware routes:** {len(data.get('api_routes', []))}",
            f"- **Static file routes:** {len(data.get('static_routes', []))}",
            "",
            "## API & middleware routes",
            "",
        ]
    )

    api_rows = []
    middleware_rows = []
    client_rows = []
    for route in data.get("api_routes", []):
        row = [
            route["method"],
            f"`{route['path']}`",
            route["handler"],
            f"`{route['file']}:{route['line']}`",
            route["framework"],
            route.get("environment", "all"),
        ]
        if route.get("notes"):
            row[-1] += f" — {route['notes']}"
        if route["framework"] == "client-fetch":
            client_rows.append(row)
        elif route.get("kind") == "middleware":
            middleware_rows.append(row)
        else:
            api_rows.append(row)

    lines.append("### Server-defined routes\n")
    lines.append(
        _table(
            ["Method", "Path", "Handler", "Source", "Framework", "Environment / notes"],
            api_rows + middleware_rows,
        )
    )

    if client_rows:
        lines.append("### Client fetch targets (consumed by UI)\n")
        lines.append(
            _table(
                ["Method", "Path", "Handler", "Source", "Framework", "Environment / notes"],
                client_rows,
            )
        )

    lines.extend(["## Static routes\n"])
    static_rows = [
        [
            route["method"],
            f"`{route['path']}`",
            route["handler"],
            f"`{route['file']}`",
            route.get("notes") or "",
        ]
        for route in data.get("static_routes", [])
    ]
    lines.append(_table(["Method", "Path", "Handler", "Source", "Notes"], static_rows))
    return "\n".join(lines)


def render_frontend_report(data: dict) -> str:
    lines = [
        "# Frontend Route Map",
        "",
        f"**Root:** `{data['root']}`  ",
        f"**Scanned at:** {data['scanned_at']}  ",
        "",
        "## Summary",
        "",
        f"- **Client-side routes:** {len(data.get('frontend_routes', []))}",
        "",
        "## React / SPA routes",
        "",
    ]

    rows = [
        [
            f"`{route['path']}`",
            route["handler"],
            f"`{route['file']}:{route['line']}`",
            route["framework"],
            route.get("notes") or "",
        ]
        for route in data.get("frontend_routes", [])
    ]
    lines.append(_table(["Path", "Component / handler", "Source", "Framework", "Notes"], rows))

    lines.extend(
        [
            "",
            "## Runtime",
            "",
            "The reviewer app is a Vite + React SPA. In development (`npm run dev`),",
            "all unmatched paths fall through to the SPA shell after static/middleware handling.",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Render endpoint JSON to Markdown reports.")
    parser.add_argument("input_json", type=Path)
    parser.add_argument("api_output", type=Path)
    parser.add_argument("frontend_output", type=Path)
    args = parser.parse_args()

    data = json.loads(args.input_json.read_text(encoding="utf-8"))
    args.api_output.parent.mkdir(parents=True, exist_ok=True)
    args.frontend_output.parent.mkdir(parents=True, exist_ok=True)
    args.api_output.write_text(render_api_report(data), encoding="utf-8")
    args.frontend_output.write_text(render_frontend_report(data), encoding="utf-8")
    print(f"Wrote {args.api_output}")
    print(f"Wrote {args.frontend_output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
