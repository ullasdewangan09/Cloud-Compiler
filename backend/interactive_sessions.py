from __future__ import annotations

import shutil
import subprocess
import tempfile
import threading
import time
import urllib.request
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path

from execution_engine import (
    _main_class,
    _shell_join_flags,
    _uses_java_swing,
    prepare_execution_request,
    utc_now_iso,
)


@dataclass
class InteractiveSession:
    session_id: str
    container_name: str
    temp_dir: Path
    host_port: int
    interactive_url: str
    created_at: str
    expires_at: str
    entry_file: str
    compiler_profile: str
    compiler_flags: str
    username: str


_SESSION_LOCK = threading.Lock()
_SESSIONS: dict[str, InteractiveSession] = {}
_NOVNC_CONTAINER_PORT = "6080/tcp"


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _read_text(path: Path) -> str:
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8")


def _docker_command(args: list[str], *, check: bool = True) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["docker", *args],
        check=check,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )


def _build_interactive_runner(main_class: str, compiler_flags: str) -> str:
    quoted_flags = _shell_join_flags(compiler_flags)
    compile_command = f"javac {quoted_flags} *.java".strip()
    return f"""#!/bin/sh
set +e
DISPLAY=:99
export DISPLAY

cleanup() {{
  kill "$app_pid" "$websockify_pid" "$x11vnc_pid" "$openbox_pid" "$xvfb_pid" >/dev/null 2>&1 || true
}}

Xvfb :99 -screen 0 1440x900x24 >/tmp/xvfb.log 2>&1 &
xvfb_pid=$!
sleep 1
openbox >/tmp/openbox.log 2>&1 &
openbox_pid=$!
x11vnc -display :99 -forever -shared -nopw -rfbport 5900 -listen 0.0.0.0 >/tmp/x11vnc.log 2>&1 &
x11vnc_pid=$!
websockify --web=/usr/share/novnc/ 6080 localhost:5900 >/tmp/websockify.log 2>&1 &
websockify_pid=$!

trap cleanup EXIT INT TERM

{compile_command} > compile_stdout.txt 2> compile_stderr.txt
compile_exit=$?
if [ "$compile_exit" -ne 0 ]; then
  cat compile_stdout.txt >&1
  cat compile_stderr.txt >&2
  exit "$compile_exit"
fi

java {main_class} > app_stdout.txt 2> app_stderr.txt &
app_pid=$!
wait "$app_pid"
exit $?
"""


def _inspect_container_status(container_name: str) -> str | None:
    result = _docker_command(
        ["inspect", "-f", "{{.State.Status}}", container_name],
        check=False,
    )
    if result.returncode != 0:
        return None
    return result.stdout.strip()


def _published_port(container_name: str) -> int | None:
    result = _docker_command(["port", container_name, _NOVNC_CONTAINER_PORT], check=False)
    if result.returncode != 0:
        return None

    port_text = result.stdout.strip()
    if ":" not in port_text:
        return None

    try:
        return int(port_text.rsplit(":", 1)[-1])
    except ValueError:
        return None


def _wait_for_novnc(interactive_url: str, container_name: str, *, timeout_seconds: int = 15) -> bool:
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        status = _inspect_container_status(container_name)
        if status and status != "running":
            return False

        try:
            with urllib.request.urlopen(interactive_url, timeout=1):
                return True
        except Exception:
            time.sleep(0.5)

    return False


def _session_logs(temp_dir: Path) -> tuple[str, str]:
    stdout = _read_text(temp_dir / "app_stdout.txt") or _read_text(temp_dir / "compile_stdout.txt")
    stderr = _read_text(temp_dir / "app_stderr.txt") or _read_text(temp_dir / "compile_stderr.txt")
    return stdout, stderr


def _cleanup_session_resources(session: InteractiveSession, *, remove_container: bool = True) -> None:
    if remove_container:
        _docker_command(["rm", "-f", session.container_name], check=False)
    shutil.rmtree(session.temp_dir, ignore_errors=True)


def cleanup_expired_sessions() -> None:
    now = _utc_now()
    expired_ids: list[str] = []

    with _SESSION_LOCK:
        for session_id, session in _SESSIONS.items():
            try:
                expires_at = datetime.fromisoformat(session.expires_at)
            except ValueError:
                expires_at = now
            if expires_at <= now:
                expired_ids.append(session_id)

        for session_id in expired_ids:
            session = _SESSIONS.pop(session_id)
            _cleanup_session_resources(session)


def start_interactive_java_session(payload: dict, *, session_ttl_minutes: int = 15) -> dict:
    cleanup_expired_sessions()
    prepared = prepare_execution_request(payload)

    if prepared.language != "java":
        raise ValueError("Interactive mode is only available for Java.")
    if not _uses_java_swing(prepared):
        raise ValueError("Interactive mode requires Java Swing or AWT code.")

    session_id = uuid.uuid4().hex
    container_name = f"java_interactive_{session_id[:12]}"
    temp_dir = Path(tempfile.mkdtemp(prefix="cloud_compiler_java_"))
    created_at = utc_now_iso()
    expires_at = (_utc_now() + timedelta(minutes=session_ttl_minutes)).isoformat()

    for file_item in prepared.files:
        file_path = temp_dir / file_item["filename"]
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_text(file_item["content"], encoding="utf-8")

    runner_script = _build_interactive_runner(
        _main_class(prepared.entry_file),
        prepared.compiler_flags,
    )
    runner_path = temp_dir / "interactive-runner.sh"
    runner_path.write_text(runner_script, encoding="utf-8", newline="\n")

    run_command = [
        "run",
        "-d",
        "--name",
        container_name,
        "--memory",
        "512m",
        "--cpus",
        "1",
        "--pids-limit",
        "200",
        "-p",
        "127.0.0.1::6080",
        "-v",
        f"{temp_dir.resolve()}:/app",
        "-w",
        "/app",
        "java-runner:latest",
        "sh",
        "-lc",
        "chmod +x interactive-runner.sh && ./interactive-runner.sh",
    ]

    result = _docker_command(run_command, check=False)
    if result.returncode != 0:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise RuntimeError(result.stderr.strip() or "Failed to start interactive Java session.")

    host_port = _published_port(container_name)
    if host_port is None:
        _docker_command(["rm", "-f", container_name], check=False)
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise RuntimeError("Interactive Java session did not expose a browser port.")

    interactive_url = f"http://127.0.0.1:{host_port}/vnc.html?autoconnect=true&resize=scale&view_only=0"
    session = InteractiveSession(
        session_id=session_id,
        container_name=container_name,
        temp_dir=temp_dir,
        host_port=host_port,
        interactive_url=interactive_url,
        created_at=created_at,
        expires_at=expires_at,
        entry_file=prepared.entry_file,
        compiler_profile=prepared.compiler_profile,
        compiler_flags=prepared.compiler_flags,
        username=payload.get("username", "anonymous"),
    )

    if not _wait_for_novnc(interactive_url, container_name):
        status = _inspect_container_status(container_name)
        stdout, stderr = _session_logs(temp_dir)
        _cleanup_session_resources(session)
        if status and status != "running":
            return {
                "status": "compile_error" if stderr else "runtime_error",
                "session_id": session_id,
                "interactive_url": None,
                "created_at": created_at,
                "expires_at": expires_at,
                "stdout": stdout,
                "stderr": stderr,
                "message": stderr.splitlines()[0] if stderr else "Interactive session failed to start.",
            }
        raise RuntimeError("Interactive Java session did not become ready in time.")

    with _SESSION_LOCK:
        _SESSIONS[session_id] = session

    return {
        "status": "ready",
        "session_id": session_id,
        "interactive_url": interactive_url,
        "created_at": created_at,
        "expires_at": expires_at,
        "stdout": "",
        "stderr": "",
        "message": "Interactive Java Swing session started.",
    }


def get_interactive_java_session(session_id: str) -> dict:
    cleanup_expired_sessions()
    with _SESSION_LOCK:
        session = _SESSIONS.get(session_id)

    if not session:
        return {
            "status": "not_found",
            "session_id": session_id,
            "interactive_url": None,
            "stdout": "",
            "stderr": "",
            "message": "Interactive session not found.",
        }

    status = _inspect_container_status(session.container_name)
    stdout, stderr = _session_logs(session.temp_dir)

    if status == "running":
        return {
            "status": "running",
            "session_id": session_id,
            "interactive_url": session.interactive_url,
            "created_at": session.created_at,
            "expires_at": session.expires_at,
            "stdout": stdout,
            "stderr": stderr,
            "message": "Interactive session is running.",
        }

    return {
        "status": "ended",
        "session_id": session_id,
        "interactive_url": session.interactive_url,
        "created_at": session.created_at,
        "expires_at": session.expires_at,
        "stdout": stdout,
        "stderr": stderr,
        "message": "Interactive session has ended.",
    }


def stop_interactive_java_session(session_id: str) -> dict:
    with _SESSION_LOCK:
        session = _SESSIONS.pop(session_id, None)

    if not session:
        return {
            "status": "not_found",
            "session_id": session_id,
            "message": "Interactive session not found.",
        }

    _cleanup_session_resources(session)
    return {
        "status": "stopped",
        "session_id": session_id,
        "message": "Interactive session stopped.",
    }


def shutdown_interactive_sessions() -> None:
    with _SESSION_LOCK:
        sessions = list(_SESSIONS.values())
        _SESSIONS.clear()

    for session in sessions:
        _cleanup_session_resources(session)
