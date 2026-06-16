#!/usr/bin/env python3
"""Clone a Bitbucket repo (or scan locally) and write endpoint JSON + Markdown."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

SRC_DIR = Path(__file__).resolve().parent
TASK_DIR = SRC_DIR.parent
DEFAULT_ARTIFACTS = TASK_DIR / "artifacts"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Scan a local path or Bitbucket URL and emit endpoint map artifacts."
    )
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--root", type=Path, help="Local repository root")
    source.add_argument(
        "--repo-url",
        type=str,
        help="Bitbucket web or git URL (https://bitbucket.org/workspace/repo)",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_ARTIFACTS,
        help=f"Directory for endpoint outputs (default: {DEFAULT_ARTIFACTS})",
    )
    parser.add_argument("--branch", type=str, help="Git branch to clone")
    parser.add_argument("--keep-clone", action="store_true")
    parser.add_argument("--full-clone", action="store_true")
    args = parser.parse_args()

    output_dir = args.output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    if args.repo_url:
        from repo_source import default_output_stem, parse_repo_url

        stem = default_output_stem(parse_repo_url(args.repo_url))
    else:
        stem = args.root.resolve().name

    json_path = output_dir / f"{stem}-endpoints.json"
    api_md_path = output_dir / f"{stem}-api-endpoint-map.md"
    frontend_md_path = output_dir / f"{stem}-frontend-routes.md"

    scan_cmd = [
        sys.executable,
        str(SRC_DIR / "endpoint_scanner.py"),
        "--output",
        str(json_path),
    ]
    if args.repo_url:
        scan_cmd.extend(["--repo-url", args.repo_url])
        if args.branch:
            scan_cmd.extend(["--branch", args.branch])
        if args.keep_clone:
            scan_cmd.append("--keep-clone")
        if args.full_clone:
            scan_cmd.append("--full-clone")
    else:
        scan_cmd.extend(["--root", str(args.root.resolve())])

    render_cmd = [
        sys.executable,
        str(SRC_DIR / "render_endpoint_report.py"),
        str(json_path),
        str(api_md_path),
        str(frontend_md_path),
    ]

    for cmd in (scan_cmd, render_cmd):
        result = subprocess.run(cmd)
        if result.returncode != 0:
            return result.returncode

    print(f"Endpoint JSON: {json_path}")
    print(f"API map: {api_md_path}")
    print(f"Frontend routes: {frontend_md_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
