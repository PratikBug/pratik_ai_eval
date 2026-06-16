#!/usr/bin/env python3
"""Scan a repository for externally exposed API routes and frontend routes."""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

SKIP_DIRS = {
    ".git",
    ".venv",
    "venv",
    "node_modules",
    "__pycache__",
    ".pytest_cache",
    "dist",
    "build",
    ".next",
    "target",
    ".idea",
    ".vscode",
    "coverage",
    ".turbo",
    ".cache",
}

SCAN_EXTENSIONS = {
    ".py",
    ".java",
    ".kt",
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".go",
    ".rs",
    ".rb",
    ".cs",
    ".php",
    ".scala",
}


@dataclass
class Route:
    kind: str  # api | frontend | static | middleware
    method: str
    path: str
    handler: str
    file: str
    line: int
    framework: str
    environment: str = "all"
    notes: str | None = None


@dataclass
class EndpointMap:
    root: str
    scanned_at: str
    source_url: str | None = None
    branch: str | None = None
    files_scanned: int = 0
    api_routes: list[Route] = field(default_factory=list)
    frontend_routes: list[Route] = field(default_factory=list)
    static_routes: list[Route] = field(default_factory=list)


def iter_source_files(root: Path) -> Iterable[Path]:
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if path.suffix.lower() in SCAN_EXTENSIONS:
            yield path


def rel(root: Path, path: Path) -> str:
    return str(path.relative_to(root))


def add_route(
    routes: list[Route],
    *,
    kind: str,
    method: str,
    path: str,
    handler: str,
    file: str,
    line: int,
    framework: str,
    environment: str = "all",
    notes: str | None = None,
) -> None:
    key = (kind, method.upper(), path, file, line)
    existing = {(r.kind, r.method.upper(), r.path, r.file, r.line) for r in routes}
    if key in existing:
        return
    routes.append(
        Route(
            kind=kind,
            method=method.upper(),
            path=path,
            handler=handler,
            file=file,
            line=line,
            framework=framework,
            environment=environment,
            notes=notes,
        )
    )


def scan_fastapi_and_flask(content: str, file: str, routes: list[Route]) -> None:
    patterns = [
        (
            re.compile(
                r"@(?P<target>\w+)\.(?P<method>get|post|put|patch|delete|head|options)\(\s*[\"'](?P<path>[^\"']+)[\"']",
                re.IGNORECASE,
            ),
            "fastapi",
        ),
        (
            re.compile(
                r"@(?P<target>\w+)\.route\(\s*[\"'](?P<path>[^\"']+)[\"']",
                re.IGNORECASE,
            ),
            "flask",
        ),
    ]
    for pattern, framework in patterns:
        for match in pattern.finditer(content):
            method = match.groupdict().get("method", "ANY")
            add_route(
                routes,
                kind="api",
                method=method,
                path=match.group("path"),
                handler=match.group("target"),
                file=file,
                line=content[: match.start()].count("\n") + 1,
                framework=framework,
            )


def scan_spring(content: str, file: str, routes: list[Route]) -> None:
    mapping = re.compile(
        r"@(?P<annotation>Get|Post|Put|Patch|Delete|Request)Mapping\s*\(\s*(?:value\s*=\s*)?[\"'](?P<path>[^\"']+)[\"']",
        re.IGNORECASE,
    )
    for match in mapping.finditer(content):
        annotation = match.group("annotation").upper()
        method = annotation.replace("MAPPING", "") if annotation != "REQUEST" else "ANY"
        add_route(
            routes,
            kind="api",
            method=method,
            path=match.group("path"),
            handler=annotation,
            file=file,
            line=content[: match.start()].count("\n") + 1,
            framework="spring",
        )


def scan_express(content: str, file: str, routes: list[Route]) -> None:
    pattern = re.compile(
        r"(?P<target>app|router)\.(?P<method>get|post|put|patch|delete|all)\(\s*[\"'](?P<path>[^\"']+)[\"']",
        re.IGNORECASE,
    )
    for match in pattern.finditer(content):
        add_route(
            routes,
            kind="api",
            method=match.group("method"),
            path=match.group("path"),
            handler=match.group("target"),
            file=file,
            line=content[: match.start()].count("\n") + 1,
            framework="express",
        )


def scan_vite_middleware(content: str, file: str, routes: list[Route]) -> None:
    exact = re.compile(
        r"req\.method\s*(?:!==|===|!=|==)\s*[\"'](?P<method>GET|POST|PUT|PATCH|DELETE)[\"']"
        r".*?"
        r"req\.url\s*(?:!==|===|!=|==)\s*[\"'](?P<path>[^\"']+)[\"']",
        re.IGNORECASE | re.DOTALL,
    )
    for match in exact.finditer(content):
        add_route(
            routes,
            kind="api",
            method=match.group("method"),
            path=match.group("path"),
            handler="middleware handler",
            file=file,
            line=content[: match.start()].count("\n") + 1,
            framework="vite-middleware",
            environment="dev/preview",
            notes="Vite dev/preview server only",
        )

    prefix = re.compile(r"url\.startsWith\([\"'](?P<path>/[^\"']+/)[\"']\)", re.IGNORECASE)
    for match in prefix.finditer(content):
        add_route(
            routes,
            kind="middleware",
            method="GET",
            path=f"{match.group('path')}*",
            handler="serve-repo-artifacts middleware",
            file=file,
            line=content[: match.start()].count("\n") + 1,
            framework="vite-middleware",
            environment="dev/preview",
            notes="Serves matching repo files with inferred content type",
        )


def scan_react_router(content: str, file: str, routes: list[Route]) -> None:
    if "<Route" not in content and "createBrowserRouter" not in content:
        return

    index_pattern = re.compile(
        r"<Route\s+index\s+element=\{<(?P<component>\w+)", re.IGNORECASE
    )
    for match in index_pattern.finditer(content):
        add_route(
            routes,
            kind="frontend",
            method="GET",
            path="/",
            handler=match.group("component"),
            file=file,
            line=content[: match.start()].count("\n") + 1,
            framework="react-router",
        )

    path_pattern = re.compile(
        r"<Route\s+path=[\"'](?P<path>[^\"']+)[\"']\s+element=\{<(?P<component>\w+)",
        re.IGNORECASE,
    )
    for match in path_pattern.finditer(content):
        raw_path = match.group("path")
        if raw_path == "*":
            continue
        add_route(
            routes,
            kind="frontend",
            method="GET",
            path=f"/{raw_path.lstrip('/')}",
            handler=match.group("component"),
            file=file,
            line=content[: match.start()].count("\n") + 1,
            framework="react-router",
        )

    redirect_pattern = re.compile(r"<Route\s+path=[\"']\*[\"']", re.IGNORECASE)
    for match in redirect_pattern.finditer(content):
        add_route(
            routes,
            kind="frontend",
            method="GET",
            path="*",
            handler="Navigate → /",
            file=file,
            line=content[: match.start()].count("\n") + 1,
            framework="react-router",
            notes="Catch-all redirect to /",
        )


def scan_nextjs(content: str, file: str, routes: list[Route]) -> None:
    if "export async function GET" in content or "export function GET" in content:
        route_path = _next_route_path(file)
        if route_path:
            add_route(
                routes,
                kind="api",
                method="GET",
                path=route_path,
                handler="GET",
                file=file,
                line=_first_line(content, r"export (async )?function GET"),
                framework="nextjs",
            )
    for method in ("POST", "PUT", "PATCH", "DELETE"):
        if f"export async function {method}" in content or f"export function {method}" in content:
            route_path = _next_route_path(file)
            if route_path:
                add_route(
                    routes,
                    kind="api",
                    method=method,
                    path=route_path,
                    handler=method,
                    file=file,
                    line=_first_line(content, rf"export (async )?function {method}"),
                    framework="nextjs",
                )


def _next_route_path(file: str) -> str | None:
    normalized = file.replace("\\", "/")
    if "/app/" in normalized and "/route." in normalized:
        segment = normalized.split("/app/", 1)[1]
        segment = segment.rsplit("/route.", 1)[0]
        return "/" + segment.strip("/")
    if "/pages/api/" in normalized:
        segment = normalized.split("/pages/api/", 1)[1]
        segment = segment.rsplit(".", 1)[0]
        return "/api/" + segment.strip("/")
    return None


def _first_line(content: str, pattern: str) -> int:
    compiled = re.compile(pattern)
    for index, line in enumerate(content.splitlines(), start=1):
        if compiled.search(line):
            return index
    return 1


def scan_go(content: str, file: str, routes: list[Route]) -> None:
    pattern = re.compile(
        r"(?P<router>\w+)\.(?P<method>Get|Post|Put|Patch|Delete)\(\s*[\"'](?P<path>[^\"']+)[\"']",
    )
    for match in pattern.finditer(content):
        add_route(
            routes,
            kind="api",
            method=match.group("method"),
            path=match.group("path"),
            handler=match.group("router"),
            file=file,
            line=content[: match.start()].count("\n") + 1,
            framework="go-http",
        )


def scan_file(root: Path, path: Path, endpoint_map: EndpointMap) -> None:
    content = path.read_text(encoding="utf-8", errors="replace")
    file = rel(root, path)
    suffix = path.suffix.lower()

    if suffix == ".py":
        scan_fastapi_and_flask(content, file, endpoint_map.api_routes)
    elif suffix in {".java", ".kt"}:
        scan_spring(content, file, endpoint_map.api_routes)
    elif suffix in {".ts", ".tsx", ".js", ".jsx"}:
        scan_fastapi_and_flask(content, file, endpoint_map.api_routes)
        scan_express(content, file, endpoint_map.api_routes)
        scan_vite_middleware(content, file, endpoint_map.api_routes)
        scan_react_router(content, file, endpoint_map.frontend_routes)
        scan_nextjs(content, file, endpoint_map.api_routes)
    elif suffix == ".go":
        scan_go(content, file, endpoint_map.api_routes)


def scan_public_static(root: Path, endpoint_map: EndpointMap) -> None:
    for public_dir in root.rglob("public"):
        if any(part in SKIP_DIRS for part in public_dir.parts):
            continue
        if public_dir.name != "public":
            continue
        for path in public_dir.rglob("*"):
            if not path.is_file():
                continue
            route_path = "/" + rel(public_dir, path).replace("\\", "/")
            add_route(
                endpoint_map.static_routes,
                kind="static",
                method="GET",
                path=route_path,
                handler="static file",
                file=rel(root, path),
                line=1,
                framework="static",
                notes="Served from public/ at dev and build time",
            )


def scan_fetch_calls(root: Path, endpoint_map: EndpointMap) -> None:
    pattern = re.compile(r"""fetch\(\s*[`'"]([^`'"]+)[`'"]""")
    for path in iter_source_files(root):
        if path.suffix.lower() not in {".ts", ".tsx", ".js", ".jsx"}:
            continue
        content = path.read_text(encoding="utf-8", errors="replace")
        for match in pattern.finditer(content):
            target = match.group(1)
            if target.startswith("http"):
                continue
            add_route(
                endpoint_map.api_routes,
                kind="api",
                method="GET/POST",
                path=target.split("?")[0],
                handler="fetch() client call",
                file=rel(root, path),
                line=content[: match.start()].count("\n") + 1,
                framework="client-fetch",
                notes="Consumed by frontend; not a server route definition",
            )


def scan_repository(root: Path, *, source_url: str | None = None, branch: str | None = None) -> EndpointMap:
    endpoint_map = EndpointMap(
        root=str(root.resolve()),
        scanned_at=datetime.now(timezone.utc).isoformat(),
        source_url=source_url,
        branch=branch,
    )

    for path in iter_source_files(root):
        endpoint_map.files_scanned += 1
        scan_file(root, path, endpoint_map)

    scan_public_static(root, endpoint_map)
    scan_fetch_calls(root, endpoint_map)

    endpoint_map.api_routes.sort(key=lambda r: (r.path, r.method, r.file))
    endpoint_map.frontend_routes.sort(key=lambda r: (r.path, r.file))
    endpoint_map.static_routes.sort(key=lambda r: r.path)
    return endpoint_map


def main() -> int:
    parser = argparse.ArgumentParser(description="Scan a repository for API and frontend routes.")
    parser.add_argument("--root", type=Path, help="Local repository root")
    parser.add_argument("--repo-url", type=str, help="Bitbucket or git URL to clone and scan")
    parser.add_argument("--branch", type=str, help="Git branch to clone")
    parser.add_argument("--keep-clone", action="store_true")
    parser.add_argument("--full-clone", action="store_true")
    parser.add_argument("--output", type=Path, required=True, help="Output JSON path")
    args = parser.parse_args()

    if not args.root and not args.repo_url:
        parser.error("Provide --root or --repo-url")

    temp_clone: Path | None = None
    source_url = None
    branch = args.branch
    try:
        if args.repo_url:
            from repo_source import clone_repository, remove_clone

            source_url = args.repo_url
            root, ref, temp_clone = clone_repository(
                args.repo_url,
                branch=args.branch,
                shallow=not args.full_clone,
            )
            branch = branch or ref.branch
        else:
            root = args.root.resolve()

        endpoint_map = scan_repository(root, source_url=source_url, branch=branch)
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(asdict(endpoint_map), indent=2), encoding="utf-8")
        print(f"Wrote {args.output}")
        print(
            f"API routes: {len(endpoint_map.api_routes)}, "
            f"frontend routes: {len(endpoint_map.frontend_routes)}, "
            f"static routes: {len(endpoint_map.static_routes)}"
        )
        return 0
    finally:
        if temp_clone and not args.keep_clone:
            from repo_source import remove_clone

            remove_clone(temp_clone)


if __name__ == "__main__":
    raise SystemExit(main())
