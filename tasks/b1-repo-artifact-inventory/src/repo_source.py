"""Resolve Bitbucket (and generic git) URLs into a local clone for scanning."""

from __future__ import annotations

import re
import shutil
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse

BITBUCKET_HOST = "bitbucket.org"

BITBUCKET_WEB = re.compile(
    r"^https?://bitbucket\.org/(?P<workspace>[^/]+)/(?P<repo>[^/]+?)(?:\.git)?(?:/|$)",
    re.IGNORECASE,
)
BITBUCKET_SSH = re.compile(
    r"^git@bitbucket\.org:(?P<workspace>[^/]+)/(?P<repo>[^/.]+?)(?:\.git)?$",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class RepoReference:
    clone_url: str
    workspace: str | None
    repo_name: str | None
    branch: str | None
    is_bitbucket: bool


def _strip_repo_suffix(name: str) -> str:
    return name.removesuffix(".git")


def parse_bitbucket_web_url(url: str) -> RepoReference | None:
    match = BITBUCKET_WEB.match(url.strip())
    if not match:
        return None

    workspace = match.group("workspace")
    repo_name = _strip_repo_suffix(match.group("repo"))
    branch: str | None = None

    src_marker = "/src/"
    if src_marker in url:
        tail = url.split(src_marker, 1)[1]
        branch = tail.split("/", 1)[0] or None

    clone_url = f"https://{BITBUCKET_HOST}/{workspace}/{repo_name}.git"
    return RepoReference(
        clone_url=clone_url,
        workspace=workspace,
        repo_name=repo_name,
        branch=branch,
        is_bitbucket=True,
    )


def parse_bitbucket_ssh_url(url: str) -> RepoReference | None:
    match = BITBUCKET_SSH.match(url.strip())
    if not match:
        return None

    workspace = match.group("workspace")
    repo_name = _strip_repo_suffix(match.group("repo"))
    return RepoReference(
        clone_url=url.strip(),
        workspace=workspace,
        repo_name=repo_name,
        branch=None,
        is_bitbucket=True,
    )


def parse_repo_url(url: str) -> RepoReference:
    """Parse a Bitbucket web/clone URL or fall back to a generic git URL."""
    cleaned = url.strip()
    if not cleaned:
        raise ValueError("Repository URL must not be empty")

    for parser in (parse_bitbucket_web_url, parse_bitbucket_ssh_url):
        ref = parser(cleaned)
        if ref is not None:
            return ref

    parsed = urlparse(cleaned)
    if parsed.scheme in {"http", "https", "ssh", "git"} or cleaned.startswith("git@"):
        repo_name = Path(parsed.path.rstrip("/")).name or None
        if repo_name:
            repo_name = _strip_repo_suffix(repo_name)
        return RepoReference(
            clone_url=cleaned,
            workspace=None,
            repo_name=repo_name,
            branch=None,
            is_bitbucket=BITBUCKET_HOST in cleaned.lower(),
        )

    raise ValueError(
        "Unsupported repository URL. Use a Bitbucket link such as "
        "https://bitbucket.org/workspace/repo or a git clone URL."
    )


def clone_repository(
    url: str,
    *,
    branch: str | None = None,
    shallow: bool = True,
    destination: Path | None = None,
) -> tuple[Path, RepoReference, bool]:
    """
    Clone a repository and return (local_path, repo_reference, is_temporary).

    When destination is None, a temporary directory is created and should be
    removed by the caller unless keep_clone is requested.
    """
    ref = parse_repo_url(url)
    effective_branch = branch or ref.branch

    temp_dir = destination is None
    if destination is None:
        destination = Path(tempfile.mkdtemp(prefix="b1-inventory-"))
    else:
        destination = destination.resolve()
        if destination.exists():
            raise FileExistsError(f"Destination already exists: {destination}")
        destination.parent.mkdir(parents=True, exist_ok=True)

    cmd = ["git", "clone"]
    if shallow:
        cmd.extend(["--depth", "1"])
    if effective_branch:
        cmd.extend(["--branch", effective_branch])
    cmd.extend([ref.clone_url, str(destination)])

    try:
        subprocess.run(
            cmd,
            check=True,
            capture_output=True,
            text=True,
        )
    except subprocess.CalledProcessError as exc:
        if temp_dir:
            shutil.rmtree(destination, ignore_errors=True)
        stderr = (exc.stderr or exc.stdout or "").strip()
        hint = ""
        if "Authentication failed" in stderr or "could not read Username" in stderr:
            hint = (
                " Private Bitbucket repos require git credentials "
                "(SSH key or HTTPS app password)."
            )
        raise RuntimeError(f"git clone failed: {stderr}{hint}") from exc
    except FileNotFoundError as exc:
        raise RuntimeError("git is not installed or not on PATH") from exc

    return destination, ref, temp_dir


def remove_clone(path: Path) -> None:
    shutil.rmtree(path, ignore_errors=True)


def default_output_stem(ref: RepoReference) -> str:
    if ref.workspace and ref.repo_name:
        return f"{ref.workspace}-{ref.repo_name}"
    if ref.repo_name:
        return ref.repo_name
    return "inventory"
