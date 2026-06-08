#!/usr/bin/env python3
"""Append Codex prompt/response hook events to a repo-local JSONL log."""

from __future__ import annotations

import datetime as dt
import hashlib
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Any


SECRET_PATTERNS = [
    re.compile(r"sk-[A-Za-z0-9_-]{20,}"),
    re.compile(r"(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}"),
    re.compile(
        r"(?i)(api[_-]?key|access[_-]?token|secret|password)(\s*[:=]\s*)([^\s\"']+)"
    ),
]

TEXT_KEYS = (
    "prompt",
    "message",
    "input",
    "text",
    "content",
    "response",
    "final_response",
    "answer",
)


def repo_root() -> Path:
    try:
        root = subprocess.check_output(
            ["git", "rev-parse", "--show-toplevel"],
            stderr=subprocess.DEVNULL,
            text=True,
        ).strip()
        if root:
            return Path(root)
    except Exception:
        pass
    return Path.cwd()


def redact_text(value: str) -> str:
    redacted = value
    for pattern in SECRET_PATTERNS:
        if pattern.pattern.startswith("(?i)"):
            redacted = pattern.sub(r"\1\2[REDACTED]", redacted)
        else:
            redacted = pattern.sub("[REDACTED]", redacted)
    return redacted


def redact(value: Any) -> Any:
    if isinstance(value, str):
        return redact_text(value)
    if isinstance(value, list):
        return [redact(item) for item in value]
    if isinstance(value, dict):
        output: dict[str, Any] = {}
        for key, item in value.items():
            if re.search(r"(?i)(token|secret|password|api[_-]?key)", str(key)):
                output[key] = "[REDACTED]"
            else:
                output[key] = redact(item)
        return output
    return value


def load_stdin() -> Any:
    raw = sys.stdin.read()
    if not raw.strip():
        return {}
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"raw_stdin": raw}


def find_text_fields(value: Any, prefix: str = "") -> dict[str, str]:
    found: dict[str, str] = {}
    if isinstance(value, dict):
        for key, item in value.items():
            path = f"{prefix}.{key}" if prefix else str(key)
            if isinstance(item, str) and key in TEXT_KEYS:
                found[path] = item
            elif isinstance(item, (dict, list)):
                found.update(find_text_fields(item, path))
    elif isinstance(value, list):
        for index, item in enumerate(value):
            found.update(find_text_fields(item, f"{prefix}[{index}]"))
    return found


def event_id(payload: dict[str, Any]) -> str:
    seed = json.dumps(payload, ensure_ascii=False, sort_keys=True, default=str)
    return hashlib.sha256(seed.encode("utf-8")).hexdigest()[:16]


def main() -> int:
    event = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("CODEX_HOOK_EVENT", "unknown")
    payload = redact(load_stdin())
    now = dt.datetime.now(dt.timezone.utc).astimezone()

    record = {
        "id": event_id({"event": event, "payload": payload, "time": now.isoformat()}),
        "event": event,
        "timestamp": now.isoformat(),
        "cwd": str(Path.cwd()),
        "summary_fields": redact(find_text_fields(payload)),
        "payload": payload,
    }

    log_dir = repo_root() / ".codex" / "conversation-logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    log_file = log_dir / f"{now.date().isoformat()}.jsonl"

    with log_file.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
