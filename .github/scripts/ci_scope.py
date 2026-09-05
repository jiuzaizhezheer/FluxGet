"""Select CI jobs from the full Git diff, including deleted and renamed paths."""

import json
import os
import subprocess
from pathlib import Path


def affected_jobs(paths: list[str]) -> tuple[bool, bool]:
    frontend = backend = False
    for path in paths:
        if path.startswith(("src/", "public/")) or path in {
            "index.html",
            "package.json",
            "pnpm-lock.yaml",
            "pnpm-workspace.yaml",
            ".nvmrc",
            "eslint.config.js",
            ".prettierrc.json",
            ".prettierignore",
            "vite.config.ts",
            "tsconfig.json",
            "tsconfig.app.json",
            "tsconfig.node.json",
        }:
            frontend = True
        elif path.startswith("backend/") or path in {
            "pyproject.toml",
            "uv.lock",
            ".python-version",
            "Dockerfile.ffmpeg",
        }:
            backend = True
        elif path in {"README.md", "AGENTS.md", "CREATIVE_MODE_PROMPT.md"} or (
            path.startswith("docs/") and path.endswith(".md")
        ):
            continue
        else:
            # Shared CI/configuration and unclassified files run both checks.
            frontend = backend = True
    return frontend, backend


def main() -> None:
    event = json.loads(Path(os.environ["GITHUB_EVENT_PATH"]).read_text())
    if os.environ["GITHUB_EVENT_NAME"] == "pull_request":
        pr = event["pull_request"]
        revision = f"{pr['base']['sha']}...{pr['head']['sha']}"
    else:
        base = event["before"]
        if base == "0" * 40:
            # Initial branch push: inspect all files against the empty tree.
            base = (
                subprocess.check_output(
                    ["git", "hash-object", "-t", "tree", "--stdin"], input=b""
                )
                .decode()
                .strip()
            )
        revision = f"{base}..{event['after']}"
    changed = subprocess.check_output(
        ["git", "diff", "--name-only", "--no-renames", "-z", revision, "--"]
    )
    paths = [os.fsdecode(path) for path in changed.split(b"\0") if path]
    frontend, backend = affected_jobs(paths)
    with Path(os.environ["GITHUB_OUTPUT"]).open("a") as output:
        output.write(f"frontend={str(frontend).lower()}\n")
        output.write(f"backend={str(backend).lower()}\n")
    print(f"Changed files: {len(paths)}; frontend={frontend}; backend={backend}")


if __name__ == "__main__":
    main()
