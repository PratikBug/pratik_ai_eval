#!/usr/bin/env python3
"""Scan a repository and inventory major artifacts by category."""

from __future__ import annotations

import argparse
import ast
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

SOURCE_EXTENSIONS = {
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
    ".yaml",
    ".yml",
    ".toml",
    ".json",
    ".properties",
    ".env",
    ".cfg",
    ".ini",
    ".xml",
}

CONFIG_NAME_HINTS = (
    "config",
    "settings",
    "application",
    "bootstrap",
    "docker-compose",
    "vite.config",
    "webpack",
    "tsconfig",
    "pyproject",
    "setup.cfg",
    "gradle",
    "pom.xml",
    "Makefile",
)

UTILITY_NAME_HINTS = ("util", "utils", "helper", "helpers", "common", "shared")


@dataclass
class Artifact:
    name: str
    kind: str
    file: str
    line: int | None = None
    language: str | None = None
    inferred: bool = False


@dataclass
class Inventory:
    root: str
    scanned_at: str
    files_scanned: int = 0
    classes: list[Artifact] = field(default_factory=list)
    interfaces: list[Artifact] = field(default_factory=list)
    services: list[Artifact] = field(default_factory=list)
    controllers: list[Artifact] = field(default_factory=list)
    models: list[Artifact] = field(default_factory=list)
    repositories: list[Artifact] = field(default_factory=list)
    jobs: list[Artifact] = field(default_factory=list)
    consumers: list[Artifact] = field(default_factory=list)
    configs: list[Artifact] = field(default_factory=list)
    utilities: list[Artifact] = field(default_factory=list)


def iter_source_files(root: Path) -> Iterable[Path]:
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if path.suffix.lower() in SOURCE_EXTENSIONS or path.name in CONFIG_NAME_HINTS:
            yield path


def rel(root: Path, path: Path) -> str:
    return str(path.relative_to(root))


def classify_by_name(name: str, file_path: str) -> list[tuple[str, bool]]:
    """Return list of (category, inferred) based on naming conventions."""
    lower = name.lower()
    path_lower = file_path.lower()
    hits: list[tuple[str, bool]] = []

    if name.endswith("Controller") or "/controller" in path_lower or "controller." in path_lower:
        hits.append(("controllers", False))
    if name.endswith("Service") or "/service" in path_lower or "service." in path_lower:
        hits.append(("services", False))
    if name.endswith("Repository") or "/repository" in path_lower or "repo." in path_lower:
        hits.append(("repositories", False))
    if name.endswith("Model") or "/model" in path_lower or "/entity" in path_lower or "/entities" in path_lower:
        hits.append(("models", False))
    if "Consumer" in name or "/consumer" in path_lower:
        hits.append(("consumers", False))
    if name.endswith("Job") or "/job" in path_lower or "/jobs/" in path_lower or "scheduler" in path_lower:
        hits.append(("jobs", False))
    if any(h in path_lower or h in lower for h in UTILITY_NAME_HINTS):
        hits.append(("utilities", True))

    return hits


def scan_python(path: Path, root: Path, inventory: Inventory) -> None:
    try:
        source = path.read_text(encoding="utf-8", errors="replace")
        tree = ast.parse(source, filename=str(path))
    except (SyntaxError, UnicodeDecodeError, OSError):
        return

    rel_path = rel(root, path)
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            artifact = Artifact(
                name=node.name,
                kind="class",
                file=rel_path,
                line=node.lineno,
                language="python",
            )
            inventory.classes.append(artifact)
            for category, inferred in classify_by_name(node.name, rel_path):
                _append(inventory, category, artifact, inferred)
        elif isinstance(node, ast.FunctionDef):
            if node.name.endswith("_job") or node.name.endswith("_consumer"):
                category = "jobs" if "job" in node.name else "consumers"
                _append(
                    inventory,
                    category,
                    Artifact(
                        name=node.name,
                        kind="function",
                        file=rel_path,
                        line=node.lineno,
                        language="python",
                    ),
                    False,
                )


JAVA_TS_PATTERNS = [
    (re.compile(r"\b(?:public\s+)?(?:abstract\s+)?class\s+(\w+)"), "classes", "class"),
    (re.compile(r"\binterface\s+(\w+)"), "interfaces", "interface"),
    (re.compile(r"\b(?:public\s+)?(?:abstract\s+)?class\s+(\w+Service)\b"), "services", "class"),
    (re.compile(r"\b(?:public\s+)?class\s+(\w+Controller)\b"), "controllers", "class"),
    (re.compile(r"\b(?:public\s+)?class\s+(\w+Repository)\b"), "repositories", "class"),
    (re.compile(r"\b(?:public\s+)?class\s+(\w+Model)\b"), "models", "class"),
    (re.compile(r"\b(?:public\s+)?class\s+(\w+Consumer)\b"), "consumers", "class"),
    (re.compile(r"\b(?:public\s+)?class\s+(\w+Job)\b"), "jobs", "class"),
]

GO_PATTERNS = [
    (re.compile(r"^type\s+(\w+)\s+struct\b", re.MULTILINE), "classes", "struct"),
    (re.compile(r"^type\s+(\w+)\s+interface\b", re.MULTILINE), "interfaces", "interface"),
]

RUST_PATTERNS = [
    (re.compile(r"\bstruct\s+(\w+)"), "classes", "struct"),
    (re.compile(r"\btrait\s+(\w+)"), "interfaces", "trait"),
    (re.compile(r"\benum\s+(\w+)"), "models", "enum"),
]


def scan_with_patterns(
    path: Path,
    root: Path,
    inventory: Inventory,
    patterns: list[tuple[re.Pattern[str], str, str]],
    language: str,
) -> None:
    try:
        content = path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return

    rel_path = rel(root, path)
    lines = content.splitlines()

    for pattern, category, kind in patterns:
        for match in pattern.finditer(content):
            name = match.group(1)
            line = content[: match.start()].count("\n") + 1
            artifact = Artifact(name=name, kind=kind, file=rel_path, line=line, language=language)
            if category == "classes":
                inventory.classes.append(artifact)
            elif category == "interfaces":
                inventory.interfaces.append(artifact)
            else:
                _append(inventory, category, artifact, False)

            for extra_cat, inferred in classify_by_name(name, rel_path):
                if extra_cat != category:
                    _append(inventory, extra_cat, artifact, inferred)


def scan_typescript(path: Path, root: Path, inventory: Inventory) -> None:
    try:
        content = path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return

    rel_path = rel(root, path)
    patterns = [
        (re.compile(r"\bclass\s+(\w+)"), "classes", "class"),
        (re.compile(r"\binterface\s+(\w+)"), "interfaces", "interface"),
        (re.compile(r"\btype\s+(\w+)\s*="), "models", "type"),
    ]
    for pattern, category, kind in patterns:
        for match in pattern.finditer(content):
            name = match.group(1)
            line = content[: match.start()].count("\n") + 1
            artifact = Artifact(name=name, kind=kind, file=rel_path, line=line, language="typescript")
            if category == "classes":
                inventory.classes.append(artifact)
            elif category == "interfaces":
                inventory.interfaces.append(artifact)
            else:
                inventory.models.append(artifact)
            for cat, inferred in classify_by_name(name, rel_path):
                _append(inventory, cat, artifact, inferred)


def scan_config(path: Path, root: Path, inventory: Inventory) -> None:
    rel_path = rel(root, path)
    name = path.name
    lower = rel_path.lower()
    if any(h in lower for h in CONFIG_NAME_HINTS) or path.suffix in {".yaml", ".yml", ".toml", ".json", ".properties", ".cfg", ".ini"}:
        inventory.configs.append(
            Artifact(
                name=name,
                kind="config",
                file=rel_path,
                line=1,
                language=path.suffix.lstrip(".") or "file",
                inferred="config" not in lower,
            )
        )


def _append(inventory: Inventory, category: str, artifact: Artifact, inferred: bool) -> None:
    entry = Artifact(**{**asdict(artifact), "inferred": inferred})
    bucket = getattr(inventory, category)
    if not any(a.name == entry.name and a.file == entry.file for a in bucket):
        bucket.append(entry)


def scan_file(path: Path, root: Path, inventory: Inventory) -> None:
    suffix = path.suffix.lower()
    if suffix == ".py":
        scan_python(path, root, inventory)
    elif suffix in {".java", ".kt"}:
        scan_with_patterns(path, root, inventory, JAVA_TS_PATTERNS, suffix.lstrip("."))
    elif suffix in {".ts", ".tsx", ".js", ".jsx"}:
        scan_typescript(path, root, inventory)
    elif suffix == ".go":
        scan_with_patterns(path, root, inventory, GO_PATTERNS, "go")
    elif suffix == ".rs":
        scan_with_patterns(path, root, inventory, RUST_PATTERNS, "rust")

    scan_config(path, root, inventory)


def dedupe_artifacts(items: list[Artifact]) -> list[Artifact]:
    seen: set[tuple[str, str, str]] = set()
    result: list[Artifact] = []
    for item in sorted(items, key=lambda a: (a.file, a.line or 0, a.name)):
        key = (item.kind, item.name, item.file)
        if key in seen:
            continue
        seen.add(key)
        result.append(item)
    return result


def finalize(inventory: Inventory) -> Inventory:
    for field_name in (
        "classes",
        "interfaces",
        "services",
        "controllers",
        "models",
        "repositories",
        "jobs",
        "consumers",
        "configs",
        "utilities",
    ):
        setattr(inventory, field_name, dedupe_artifacts(getattr(inventory, field_name)))
    return inventory


def scan_repository(root: Path) -> Inventory:
    inventory = Inventory(
        root=str(root.resolve()),
        scanned_at=datetime.now(timezone.utc).isoformat(),
    )
    for path in iter_source_files(root):
        inventory.files_scanned += 1
        scan_file(path, root, inventory)
    return finalize(inventory)


def inventory_to_dict(inventory: Inventory) -> dict:
    data = asdict(inventory)
    return data


def main() -> int:
    parser = argparse.ArgumentParser(description="Inventory major repo artifacts.")
    parser.add_argument("--root", type=Path, required=True, help="Repository root to scan")
    parser.add_argument("--output", type=Path, required=True, help="Output JSON path")
    args = parser.parse_args()

    root = args.root.resolve()
    if not root.is_dir():
        print(f"Error: {root} is not a directory", file=sys.stderr)
        return 1

    inventory = scan_repository(root)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(inventory_to_dict(inventory), indent=2), encoding="utf-8")

    totals = {
        k: len(v)
        for k, v in inventory_to_dict(inventory).items()
        if isinstance(v, list)
    }
    print(f"Scanned {inventory.files_scanned} files under {root}")
    for category, count in totals.items():
        print(f"  {category}: {count}")
    print(f"Wrote {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
