from __future__ import annotations

import base64
import json
import os
import re
import shlex
import subprocess
import tempfile
import time
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path


WORKER_IMAGES = {
    "python": "python-runner:latest",
    "c": "c-runner:latest",
    "cpp": "cpp-runner:latest",
    "java": "java-runner:latest",
}

DEFAULT_FILES = {
    "python": "main.py",
    "c": "main.c",
    "cpp": "main.cpp",
    "java": "Main.java",
}

DEFAULT_PROFILES = {
    "python": "python3.10",
    "c": "c17",
    "cpp": "c++17",
    "java": "java17",
}

SUPPORTED_PROFILES = {
    "python": {"python3.10"},
    "c": {"c11", "c17"},
    "cpp": {"c++14", "c++17", "c++20", "c++23"},
    "java": {"java17"},
}


@dataclass
class PreparedExecution:
    language: str
    files: list[dict[str, str]]
    entry_file: str
    compiler_profile: str
    compiler_flags: str


SWING_IMPORT_PATTERN = re.compile(r"\bimport\s+(javax\.swing|java\.awt)\b")
SWING_USAGE_PATTERN = re.compile(
    r"\b(?:JFrame|JPanel|SwingUtilities|EventQueue|JButton|JLabel|JTextField|JTextArea|JDialog)\b"
)


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _safe_filename(raw_name: str, fallback: str) -> str:
    name = (raw_name or "").strip().replace("\\", "/")
    if not name:
        return fallback
    name = re.sub(r"/+", "/", name)
    parts = [part for part in name.split("/") if part not in {"", ".", ".."}]
    safe = "/".join(parts)
    return safe or fallback


def prepare_execution_request(payload: dict) -> PreparedExecution:
    language = (payload.get("language") or "").strip().lower()
    if language not in WORKER_IMAGES:
        raise ValueError(f"Unsupported language: {language}")

    raw_files = payload.get("files") or []
    files: list[dict[str, str]] = []

    if raw_files:
        for index, file_item in enumerate(raw_files):
            filename = _safe_filename(
                file_item.get("filename", ""),
                f"file_{index}_{DEFAULT_FILES[language]}",
            )
            files.append(
                {
                    "filename": filename,
                    "content": file_item.get("content", ""),
                }
            )
    else:
        files.append(
            {
                "filename": DEFAULT_FILES[language],
                "content": payload.get("code", ""),
            }
        )

    entry_file = _safe_filename(
        payload.get("entry_file", "") or files[0]["filename"],
        files[0]["filename"],
    )
    if not any(file_item["filename"] == entry_file for file_item in files):
        entry_file = files[0]["filename"]

    compiler_profile = (payload.get("compiler_profile") or DEFAULT_PROFILES[language]).strip().lower()
    if compiler_profile not in SUPPORTED_PROFILES[language]:
        compiler_profile = DEFAULT_PROFILES[language]

    compiler_flags = (payload.get("compiler_flags") or "").strip()

    return PreparedExecution(
        language=language,
        files=files,
        entry_file=entry_file,
        compiler_profile=compiler_profile,
        compiler_flags=compiler_flags,
    )


def _standard_flag(language: str, profile: str) -> str:
    if language == "c":
        return f"-std={profile} -O2"
    if language == "cpp":
        return f"-std={profile} -O2"
    return ""


def _shell_join_flags(flags: str) -> str:
    tokens = shlex.split(flags)
    return " ".join(shlex.quote(token) for token in tokens)


def _main_class(entry_file: str) -> str:
    return Path(entry_file).stem


def _uses_java_swing(prepared: PreparedExecution) -> bool:
    if prepared.language != "java":
        return False

    for file_item in prepared.files:
        content = file_item.get("content", "")
        if SWING_IMPORT_PATTERN.search(content) or SWING_USAGE_PATTERN.search(content):
            return True
    return False


def _build_runner_script(prepared: PreparedExecution) -> str:
    quoted_flags = _shell_join_flags(prepared.compiler_flags)
    std_flag = _standard_flag(prepared.language, prepared.compiler_profile)
    compile_parts = [part for part in [std_flag, quoted_flags] if part]
    compile_flags = " ".join(compile_parts).strip()

    if prepared.language == "python":
        run_command = f"python {quoted_flags} {shlex.quote(prepared.entry_file)}".strip()
        return f"""#!/bin/sh
set +e
start=$(date +%s%3N)
{run_command} > stdout.txt 2> stderr.txt
exit_code=$?
end=$(date +%s%3N)
status="success"
if [ "$exit_code" -ne 0 ]; then
  status="runtime_error"
fi
cat <<EOF > meta.env
STATUS=$status
EXIT_CODE=$exit_code
COMPILE_TIME_MS=0
EXECUTION_TIME_MS=$((end-start))
EOF
exit 0
"""

    if prepared.language == "c":
        compile_command = f"gcc {compile_flags} *.c -o program".strip()
        run_command = """./program > stdout.txt 2> stderr.txt
run_exit=$?"""
    elif prepared.language == "cpp":
        compile_command = f"g++ {compile_flags} *.cpp -o program".strip()
        run_command = """./program > stdout.txt 2> stderr.txt
run_exit=$?"""
    elif prepared.language == "java":
        compile_command = f"javac {quoted_flags} *.java".strip()
        main_class = _main_class(prepared.entry_file)
        if _uses_java_swing(prepared):
            run_command = f"""DISPLAY=:99
export DISPLAY
Xvfb :99 -screen 0 1280x800x24 > xvfb.log 2>&1 &
xvfb_pid=$!
sleep 1
java {main_class} > stdout.txt 2> stderr.txt &
app_pid=$!
preview_captured=0
preview_note=""
sleep 2
if kill -0 "$app_pid" 2>/dev/null; then
  if import -display :99 -window root swing-preview.png >/dev/null 2>&1; then
    preview_captured=1
    preview_note="Swing preview captured from a virtual display. The GUI is not interactive yet."
  else
    preview_note="Swing UI started, but preview capture was unavailable."
  fi
  kill "$app_pid" >/dev/null 2>&1
fi
wait "$app_pid"
run_exit=$?
kill "$xvfb_pid" >/dev/null 2>&1
wait "$xvfb_pid" >/dev/null 2>&1
if [ "$preview_captured" -eq 1 ] && [ "$run_exit" -eq 143 ]; then
  run_exit=0
fi
"""
        else:
            run_command = f"""java {main_class} > stdout.txt 2> stderr.txt
run_exit=$?"""
    else:
        raise ValueError(f"Unsupported language: {prepared.language}")

    preview_meta = ""
    if prepared.language == "java" and _uses_java_swing(prepared):
        preview_meta = """
GUI_PREVIEW_CAPTURED=$preview_captured
GUI_PREVIEW_NOTE=$preview_note"""

    return f"""#!/bin/sh
set +e
compile_start=$(date +%s%3N)
{compile_command} > compile_stdout.txt 2> compile_stderr.txt
compile_exit=$?
compile_end=$(date +%s%3N)
if [ "$compile_exit" -ne 0 ]; then
  cat compile_stdout.txt > stdout.txt
  cat compile_stderr.txt > stderr.txt
  cat <<EOF > meta.env
STATUS=compile_error
EXIT_CODE=$compile_exit
COMPILE_TIME_MS=$((compile_end-compile_start))
EXECUTION_TIME_MS=0
EOF
  exit 0
fi

run_start=$(date +%s%3N)
{run_command}
run_end=$(date +%s%3N)
status="success"
if [ "$run_exit" -ne 0 ]; then
  status="runtime_error"
fi
cat <<EOF > meta.env
STATUS=$status
EXIT_CODE=$run_exit
COMPILE_TIME_MS=$((compile_end-compile_start))
EXECUTION_TIME_MS=$((run_end-run_start))
{preview_meta}
EOF
exit 0
"""


def _parse_meta(meta_path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not meta_path.exists():
        return values
    for line in meta_path.read_text(encoding="utf-8").splitlines():
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip()
    return values


def _build_diagnostics(status: str, stderr: str, stdout: str) -> dict:
    details: list[str] = []
    error_text = stderr or stdout
    for line in error_text.splitlines():
        stripped = line.strip()
        if stripped:
            details.append(stripped)
        if len(details) >= 6:
            break

    if status == "compile_error":
        summary = details[0] if details else "Compilation failed."
        stage = "compile"
    elif status == "runtime_error":
        summary = details[0] if details else "Program exited with a runtime error."
        stage = "runtime"
    elif status == "timeout":
        summary = "Execution exceeded the configured time limit."
        stage = "timeout"
    elif status == "system_error":
        summary = details[0] if details else "System execution error."
        stage = "system"
    else:
        summary = ""
        stage = None

    return {
        "summary": summary,
        "details": details,
        "error_stage": stage,
    }


def _build_artifacts(temp_dir: Path, meta: dict[str, str]) -> list[dict]:
    preview_path = temp_dir / "swing-preview.png"
    if not preview_path.exists():
        return []

    encoded = base64.b64encode(preview_path.read_bytes()).decode("ascii")
    return [
        {
            "kind": "image",
            "label": "Java Swing Preview",
            "mime_type": "image/png",
            "base64_data": encoded,
            "description": meta.get(
                "GUI_PREVIEW_NOTE",
                "Swing preview captured from the container display.",
            ),
        }
    ]


def execute_in_docker(
    payload: dict,
    *,
    max_execution_time: int = 10,
    memory_limit: str = "256m",
    cpu_limit: str = "1",
    pids_limit: str = "100",
) -> dict:
    submitted_at = payload.get("submitted_at") or utc_now_iso()
    prepared = prepare_execution_request(payload)
    image_name = WORKER_IMAGES[prepared.language]
    container_name = f"exec_{uuid.uuid4().hex}"
    started_at = utc_now_iso()
    host_start = time.perf_counter()

    try:
        with tempfile.TemporaryDirectory() as temp_dir_name:
            temp_dir = Path(temp_dir_name)

            for file_item in prepared.files:
                file_path = temp_dir / file_item["filename"]
                file_path.parent.mkdir(parents=True, exist_ok=True)
                file_path.write_text(file_item["content"], encoding="utf-8")

            if payload.get("input", ""):
                (temp_dir / "input.txt").write_text(payload.get("input", ""), encoding="utf-8")

            runner_script = _build_runner_script(prepared)
            runner_path = temp_dir / "runner.sh"
            runner_path.write_text(runner_script, encoding="utf-8", newline="\n")

            command = [
                "docker",
                "run",
                "--name",
                container_name,
                "--rm",
                "--memory",
                memory_limit,
                "--cpus",
                cpu_limit,
                "--pids-limit",
                pids_limit,
                "--network",
                "none",
                "-v",
                f"{temp_dir.resolve()}:/app",
                "-w",
                "/app",
                image_name,
                "sh",
                "-lc",
                "chmod +x runner.sh && if [ -f input.txt ]; then ./runner.sh < input.txt; else ./runner.sh; fi",
            ]

            process = subprocess.Popen(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )

            try:
                docker_stdout, docker_stderr = process.communicate(timeout=max_execution_time)
            except subprocess.TimeoutExpired:
                subprocess.run(
                    ["docker", "kill", container_name],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                )
                process.communicate()
                finished_at = utc_now_iso()
                total_time_ms = round((time.perf_counter() - host_start) * 1000, 2)
                diagnostics = _build_diagnostics("timeout", "", "")
                return {
                    "status": "timeout",
                    "output": "",
                    "stdout": "",
                    "stderr": "",
                    "error": diagnostics["summary"],
                    "diagnostics": diagnostics,
                    "execution_time": None,
                    "compile_time_ms": None,
                    "execution_time_ms": None,
                    "total_time_ms": total_time_ms,
                    "queue_wait_ms": payload.get("queue_wait_ms"),
                    "submitted_at": submitted_at,
                    "started_at": started_at,
                    "finished_at": finished_at,
                    "entry_file": prepared.entry_file,
                    "compiler_profile": prepared.compiler_profile,
                    "compiler_flags": prepared.compiler_flags,
                    "files": prepared.files,
                    "artifacts": [],
                    "exit_code": None,
                }

            meta = _parse_meta(temp_dir / "meta.env")
            stdout = (temp_dir / "stdout.txt").read_text(encoding="utf-8") if (temp_dir / "stdout.txt").exists() else docker_stdout
            stderr = (temp_dir / "stderr.txt").read_text(encoding="utf-8") if (temp_dir / "stderr.txt").exists() else docker_stderr
            status = meta.get("STATUS", "system_error")
            exit_code = int(meta.get("EXIT_CODE", "-1"))
            compile_time_ms = float(meta.get("COMPILE_TIME_MS", "0") or 0)
            execution_time_ms = float(meta.get("EXECUTION_TIME_MS", "0") or 0)
            total_time_ms = round((time.perf_counter() - host_start) * 1000, 2)
            finished_at = utc_now_iso()
            diagnostics = _build_diagnostics(status, stderr, stdout)
            artifacts = _build_artifacts(temp_dir, meta)

            return {
                "status": status,
                "output": stdout if status == "success" else stderr or stdout,
                "stdout": stdout,
                "stderr": stderr,
                "error": diagnostics["summary"],
                "diagnostics": diagnostics,
                "execution_time": round(execution_time_ms, 2),
                "compile_time_ms": round(compile_time_ms, 2),
                "execution_time_ms": round(execution_time_ms, 2),
                "total_time_ms": total_time_ms,
                "queue_wait_ms": payload.get("queue_wait_ms"),
                "submitted_at": submitted_at,
                "started_at": started_at,
                "finished_at": finished_at,
                "entry_file": prepared.entry_file,
                "compiler_profile": prepared.compiler_profile,
                "compiler_flags": prepared.compiler_flags,
                "files": prepared.files,
                "artifacts": artifacts,
                "exit_code": exit_code,
            }
    except Exception as exc:
        finished_at = utc_now_iso()
        total_time_ms = round((time.perf_counter() - host_start) * 1000, 2)
        diagnostics = _build_diagnostics("system_error", str(exc), "")
        return {
            "status": "system_error",
            "output": "",
            "stdout": "",
            "stderr": str(exc),
            "error": diagnostics["summary"],
            "diagnostics": diagnostics,
            "execution_time": None,
            "compile_time_ms": None,
            "execution_time_ms": None,
            "total_time_ms": total_time_ms,
            "queue_wait_ms": payload.get("queue_wait_ms"),
            "submitted_at": submitted_at,
            "started_at": started_at,
            "finished_at": finished_at,
            "entry_file": payload.get("entry_file"),
            "compiler_profile": payload.get("compiler_profile"),
            "compiler_flags": payload.get("compiler_flags", ""),
            "files": payload.get("files", []),
            "artifacts": [],
            "exit_code": None,
        }


def serialize_result(job_id: str, language: str, result: dict, username: str = "anonymous") -> str:
    payload = {
        "job_id": job_id,
        "language": language,
        "username": username,
        **result,
    }
    return json.dumps(payload)
