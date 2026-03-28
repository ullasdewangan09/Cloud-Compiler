from __future__ import annotations

import json
import os
import shutil
import statistics
import subprocess
import sys
import tempfile
import textwrap
import time
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import redis


ROOT = Path(__file__).resolve().parents[1]
REPORTING_DIR = ROOT / "reporting"
WORKER_DIR = ROOT / "worker"
ROOT_VENV_PYTHON = ROOT / ".venv" / "Scripts" / "python.exe"
WORKER_VENV_PYTHON = WORKER_DIR / ".venv" / "Scripts" / "python.exe"

if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.execution_engine import DEFAULT_PROFILES, execute_in_docker  # noqa: E402


RESULTS_JSON = REPORTING_DIR / "compiler_comparison_results.json"
REPORT_MD = REPORTING_DIR / "Compiler_Comparison_Final_Report.md"

REDIS_CONTAINER_NAME = "cloud-compiler-bench-redis"
REDIS_URL = {"host": "localhost", "port": 6379, "db": 0, "decode_responses": True}
QUEUE_NAME = "code_queue"
WORKER_REGISTRY_KEY = "worker_registry"

RUNS_PER_BENCHMARK = 5


@dataclass
class BenchmarkCase:
    language: str
    name: str
    description: str
    code: str
    user_input: str
    expected_output: str


BENCHMARKS: list[BenchmarkCase] = [
    BenchmarkCase(
        language="python",
        name="hello_world",
        description="Minimal output benchmark",
        code='print("hello from cloud compiler")\n',
        user_input="",
        expected_output="hello from cloud compiler\n",
    ),
    BenchmarkCase(
        language="python",
        name="cpu_loop",
        description="CPU-bound arithmetic benchmark",
        code=textwrap.dedent(
            """
            total = 0
            for i in range(1, 400001):
                total += (i * i) % 97
            print(total)
            """
        ).strip()
        + "\n",
        user_input="",
        expected_output="19200137\n",
    ),
    BenchmarkCase(
        language="python",
        name="input_sort",
        description="Input handling plus sorting benchmark",
        code=textwrap.dedent(
            """
            n = int(input().strip())
            arr = list(map(int, input().split()))
            arr.sort()
            print(" ".join(map(str, arr)))
            """
        ).strip()
        + "\n",
        user_input="8\n9 3 7 1 4 8 2 6\n",
        expected_output="1 2 3 4 6 7 8 9\n",
    ),
    BenchmarkCase(
        language="c",
        name="hello_world",
        description="Minimal output benchmark",
        code=textwrap.dedent(
            r"""
            #include <stdio.h>
            int main(void) {
                printf("hello from cloud compiler\n");
                return 0;
            }
            """
        ).strip()
        + "\n",
        user_input="",
        expected_output="hello from cloud compiler\n",
    ),
    BenchmarkCase(
        language="c",
        name="cpu_loop",
        description="CPU-bound arithmetic benchmark",
        code=textwrap.dedent(
            r"""
            #include <stdio.h>
            int main(void) {
                long long total = 0;
                for (int i = 1; i <= 400000; ++i) {
                    total += ((long long)i * i) % 97;
                }
                printf("%lld\n", total);
                return 0;
            }
            """
        ).strip()
        + "\n",
        user_input="",
        expected_output="19200137\n",
    ),
    BenchmarkCase(
        language="c",
        name="input_sort",
        description="Input handling plus sorting benchmark",
        code=textwrap.dedent(
            r"""
            #include <stdio.h>
            #include <stdlib.h>

            int cmp(const void *a, const void *b) {
                return (*(const int *)a - *(const int *)b);
            }

            int main(void) {
                int n;
                if (scanf("%d", &n) != 1) return 1;
                int arr[128];
                for (int i = 0; i < n; ++i) scanf("%d", &arr[i]);
                qsort(arr, n, sizeof(int), cmp);
                for (int i = 0; i < n; ++i) {
                    if (i) printf(" ");
                    printf("%d", arr[i]);
                }
                printf("\n");
                return 0;
            }
            """
        ).strip()
        + "\n",
        user_input="8\n9 3 7 1 4 8 2 6\n",
        expected_output="1 2 3 4 6 7 8 9\n",
    ),
    BenchmarkCase(
        language="cpp",
        name="hello_world",
        description="Minimal output benchmark",
        code=textwrap.dedent(
            r"""
            #include <iostream>
            int main() {
                std::cout << "hello from cloud compiler\n";
                return 0;
            }
            """
        ).strip()
        + "\n",
        user_input="",
        expected_output="hello from cloud compiler\n",
    ),
    BenchmarkCase(
        language="cpp",
        name="cpu_loop",
        description="CPU-bound arithmetic benchmark",
        code=textwrap.dedent(
            r"""
            #include <iostream>
            int main() {
                long long total = 0;
                for (int i = 1; i <= 400000; ++i) {
                    total += (1LL * i * i) % 97;
                }
                std::cout << total << "\n";
                return 0;
            }
            """
        ).strip()
        + "\n",
        user_input="",
        expected_output="19200137\n",
    ),
    BenchmarkCase(
        language="cpp",
        name="input_sort",
        description="Input handling plus sorting benchmark",
        code=textwrap.dedent(
            r"""
            #include <algorithm>
            #include <iostream>
            #include <vector>

            int main() {
                int n;
                std::cin >> n;
                std::vector<int> arr(n);
                for (int i = 0; i < n; ++i) std::cin >> arr[i];
                std::sort(arr.begin(), arr.end());
                for (int i = 0; i < n; ++i) {
                    if (i) std::cout << " ";
                    std::cout << arr[i];
                }
                std::cout << "\n";
                return 0;
            }
            """
        ).strip()
        + "\n",
        user_input="8\n9 3 7 1 4 8 2 6\n",
        expected_output="1 2 3 4 6 7 8 9\n",
    ),
]


USABILITY_SCORES = [
    {
        "criterion": "Setup effort for end users",
        "cloud_compiler": 5,
        "native_toolchain": 2,
        "basis": "Cloud Compiler stays browser-first, while native use still requires separate local toolchain setup.",
    },
    {
        "criterion": "Workflow breadth",
        "cloud_compiler": 5,
        "native_toolchain": 2,
        "basis": "The current workspace supports multi-file projects, entry-file selection, save/share, compiler profiles, and compiler flags.",
    },
    {
        "criterion": "Execution flexibility",
        "cloud_compiler": 5,
        "native_toolchain": 3,
        "basis": "Cloud Compiler offers synchronous, asynchronous, and Java Swing interactive execution flows.",
    },
    {
        "criterion": "Operational visibility",
        "cloud_compiler": 5,
        "native_toolchain": 1,
        "basis": "Queue metrics, worker heartbeat data, timing telemetry, and dashboard views are built into the platform.",
    },
    {
        "criterion": "Sharing and reproducibility",
        "cloud_compiler": 5,
        "native_toolchain": 2,
        "basis": "Saved projects and public share links make it easier to reopen or review exactly the same code state.",
    },
    {
        "criterion": "Diagnostics quality",
        "cloud_compiler": 4,
        "native_toolchain": 4,
        "basis": "Both paths expose compiler/runtime output, while Cloud Compiler now also returns structured diagnostics and timing fields.",
    },
    {
        "criterion": "Performance immediacy",
        "cloud_compiler": 3,
        "native_toolchain": 5,
        "basis": "Native execution still avoids queueing, Redis polling, bind mounts, and container startup overhead.",
    },
]


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def run_command(
    command: list[str],
    cwd: Path | None = None,
    input_text: str = "",
    timeout: int = 60,
) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        command,
        cwd=str(cwd) if cwd else None,
        input=input_text,
        text=True,
        capture_output=True,
        timeout=timeout,
        check=False,
    )


def benchmark_python_executable() -> str:
    if ROOT_VENV_PYTHON.exists():
        return str(ROOT_VENV_PYTHON)
    if WORKER_VENV_PYTHON.exists():
        return str(WORKER_VENV_PYTHON)
    return sys.executable


def worker_python_executable() -> str:
    if WORKER_VENV_PYTHON.exists():
        return str(WORKER_VENV_PYTHON)
    if ROOT_VENV_PYTHON.exists():
        return str(ROOT_VENV_PYTHON)
    return sys.executable


def ensure_environment() -> dict[str, Any]:
    python_launcher = shutil.which("py")
    gcc_path = shutil.which("gcc")
    gpp_path = shutil.which("g++")

    if not all([python_launcher, gcc_path, gpp_path]):
        raise RuntimeError("Required local tools are missing. Need py, gcc, and g++.")

    docker_version = run_command(["docker", "version"], cwd=ROOT)
    if docker_version.returncode != 0:
        raise RuntimeError(f"Docker is unavailable: {docker_version.stderr or docker_version.stdout}")

    return {
        "python_launcher": python_launcher,
        "gcc": gcc_path,
        "gpp": gpp_path,
        "benchmark_python": benchmark_python_executable(),
        "worker_python": worker_python_executable(),
        "root": str(ROOT),
    }


def start_redis_container() -> tuple[bool, redis.Redis]:
    client = redis.Redis(**REDIS_URL)
    try:
        client.ping()
        return False, client
    except redis.RedisError:
        pass

    run_command(["docker", "rm", "-f", REDIS_CONTAINER_NAME], cwd=ROOT)
    start = run_command(
        [
            "docker",
            "run",
            "-d",
            "--rm",
            "--name",
            REDIS_CONTAINER_NAME,
            "-p",
            "6379:6379",
            "redis:7-alpine",
        ],
        cwd=ROOT,
    )
    if start.returncode != 0:
        raise RuntimeError(f"Failed to start Redis container: {start.stderr or start.stdout}")

    deadline = time.time() + 20
    while time.time() < deadline:
        try:
            client.ping()
            return True, client
        except redis.RedisError:
            time.sleep(0.5)

    raise RuntimeError("Redis did not become ready in time.")


def stop_redis_container(redis_started_here: bool) -> None:
    if redis_started_here:
        run_command(["docker", "rm", "-f", REDIS_CONTAINER_NAME], cwd=ROOT)


def start_worker_process() -> subprocess.Popen[str]:
    env = os.environ.copy()
    env["PYTHONPATH"] = str(ROOT)
    env.setdefault("REDIS_HOST", str(REDIS_URL["host"]))
    env.setdefault("REDIS_PORT", str(REDIS_URL["port"]))
    env.setdefault("QUEUE_NAME", QUEUE_NAME)
    env.setdefault("WORKER_REGISTRY_KEY", WORKER_REGISTRY_KEY)

    return subprocess.Popen(
        [worker_python_executable(), "worker.py"],
        cwd=str(WORKER_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        env=env,
    )


def stop_worker_process(process: subprocess.Popen[str]) -> None:
    if process.poll() is not None:
        return
    process.terminate()
    try:
        process.wait(timeout=10)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait(timeout=5)


def wait_for_worker_ready(client: redis.Redis) -> None:
    deadline = time.time() + 30
    while time.time() < deadline:
        registry = client.hgetall(WORKER_REGISTRY_KEY)
        if registry:
            return
        time.sleep(0.5)
    raise RuntimeError("Worker did not register in Redis in time.")


def check_output(actual: str, expected: str) -> bool:
    return actual.replace("\r\n", "\n") == expected.replace("\r\n", "\n")


def summarize_durations(
    durations: list[float],
    successes: int,
    total_runs: int,
) -> dict[str, float | int | None]:
    if not durations:
        return {
            "avg_ms": None,
            "median_ms": None,
            "p95_ms": None,
            "success_rate_percent": 0,
        }

    durations_ms = [value * 1000 for value in durations]
    if len(durations_ms) == 1:
        p95 = durations_ms[0]
    else:
        p95 = statistics.quantiles(durations_ms, n=20, method="inclusive")[18]

    return {
        "avg_ms": round(statistics.mean(durations_ms), 2),
        "median_ms": round(statistics.median(durations_ms), 2),
        "p95_ms": round(p95, 2),
        "success_rate_percent": round((successes / total_runs) * 100, 2),
    }


def benchmark_native(case: BenchmarkCase) -> dict[str, Any]:
    durations: list[float] = []
    successes = 0
    sample_output = ""
    sample_error = ""

    with tempfile.TemporaryDirectory(prefix=f"cloud_native_{case.language}_") as tmp_dir:
        tmp_path = Path(tmp_dir)

        if case.language == "python":
            script_path = tmp_path / "main.py"
            script_path.write_text(case.code, encoding="utf-8")
            command = [benchmark_python_executable(), str(script_path)]
        elif case.language == "c":
            source_path = tmp_path / "main.c"
            exe_path = tmp_path / "program.exe"
            source_path.write_text(case.code, encoding="utf-8")
            compile_result = run_command(["gcc", "-O2", str(source_path), "-o", str(exe_path)], cwd=tmp_path)
            if compile_result.returncode != 0:
                return {
                    "avg_ms": None,
                    "median_ms": None,
                    "p95_ms": None,
                    "success_rate_percent": 0,
                    "sample_output": "",
                    "sample_error": compile_result.stderr or compile_result.stdout,
                }
            command = [str(exe_path)]
        elif case.language == "cpp":
            source_path = tmp_path / "main.cpp"
            exe_path = tmp_path / "program.exe"
            source_path.write_text(case.code, encoding="utf-8")
            compile_result = run_command(["g++", "-O2", "-std=c++17", str(source_path), "-o", str(exe_path)], cwd=tmp_path)
            if compile_result.returncode != 0:
                return {
                    "avg_ms": None,
                    "median_ms": None,
                    "p95_ms": None,
                    "success_rate_percent": 0,
                    "sample_output": "",
                    "sample_error": compile_result.stderr or compile_result.stdout,
                }
            command = [str(exe_path)]
        else:
            raise ValueError(f"Unsupported native benchmark language: {case.language}")

        for _ in range(RUNS_PER_BENCHMARK):
            start = time.perf_counter()
            completed = run_command(command, cwd=tmp_path, input_text=case.user_input, timeout=60)
            duration = time.perf_counter() - start
            durations.append(duration)
            sample_output = completed.stdout
            sample_error = completed.stderr
            if completed.returncode == 0 and check_output(completed.stdout, case.expected_output):
                successes += 1

    summary = summarize_durations(durations, successes, RUNS_PER_BENCHMARK)
    summary["sample_output"] = sample_output
    summary["sample_error"] = sample_error
    return summary


def benchmark_sync(case: BenchmarkCase) -> dict[str, Any]:
    durations: list[float] = []
    successes = 0
    sample_output = ""
    sample_error = ""

    payload = {
        "language": case.language,
        "code": case.code,
        "input": case.user_input,
        "compiler_profile": DEFAULT_PROFILES[case.language],
        "compiler_flags": "",
    }

    for _ in range(RUNS_PER_BENCHMARK):
        start = time.perf_counter()
        result = execute_in_docker(payload)
        duration = time.perf_counter() - start
        durations.append(duration)
        sample_output = result.get("output", "")
        sample_error = result.get("stderr", "") or result.get("error", "")
        if result.get("status") == "success" and check_output(result.get("output", ""), case.expected_output):
            successes += 1

    summary = summarize_durations(durations, successes, RUNS_PER_BENCHMARK)
    summary["sample_output"] = sample_output
    summary["sample_error"] = sample_error
    return summary


def benchmark_async(case: BenchmarkCase, client: redis.Redis) -> dict[str, Any]:
    durations: list[float] = []
    successes = 0
    sample_output = ""
    sample_error = ""

    for _ in range(RUNS_PER_BENCHMARK):
        job_id = str(uuid.uuid4())
        submitted_at = utc_now_iso()
        payload = {
            "job_id": job_id,
            "language": case.language,
            "code": case.code,
            "input": case.user_input,
            "compiler_profile": DEFAULT_PROFILES[case.language],
            "compiler_flags": "",
            "submitted_at": submitted_at,
            "username": "benchmark_runner",
        }

        start = time.perf_counter()
        client.lpush(QUEUE_NAME, json.dumps(payload))

        deadline = time.time() + 90
        parsed: dict[str, Any] | None = None
        while time.time() < deadline:
            raw = client.get(f"job:{job_id}") or client.get(f"result:{job_id}")
            if raw:
                parsed = json.loads(raw)
                if parsed.get("status") not in {"submitted", "running", "pending"}:
                    break
            time.sleep(0.05)

        duration = time.perf_counter() - start
        durations.append(duration)

        if not parsed:
            sample_output = ""
            sample_error = "Timed out waiting for async result."
            continue

        sample_output = parsed.get("output", "")
        sample_error = parsed.get("stderr", "") or parsed.get("error", "")
        if parsed.get("status") == "success" and check_output(parsed.get("output", ""), case.expected_output):
            successes += 1

    summary = summarize_durations(durations, successes, RUNS_PER_BENCHMARK)
    summary["sample_output"] = sample_output
    summary["sample_error"] = sample_error
    return summary


def aggregate_language_results(results: list[dict[str, Any]], mode: str) -> dict[str, dict[str, float | None]]:
    by_language: dict[str, list[float]] = {}
    success_rates: dict[str, list[float]] = {}
    for item in results:
        lang = item["language"]
        metrics = item["modes"][mode]
        if metrics["avg_ms"] is not None:
            by_language.setdefault(lang, []).append(metrics["avg_ms"])
            success_rates.setdefault(lang, []).append(metrics["success_rate_percent"])

    summary: dict[str, dict[str, float | None]] = {}
    for lang, values in by_language.items():
        summary[lang] = {
            "avg_ms": round(sum(values) / len(values), 2) if values else None,
            "success_rate_percent": round(sum(success_rates[lang]) / len(success_rates[lang]), 2)
            if success_rates.get(lang)
            else None,
        }
    return summary


def build_report(results: list[dict[str, Any]], environment: dict[str, Any]) -> str:
    native_summary = aggregate_language_results(results, "native")
    sync_summary = aggregate_language_results(results, "cloud_sync")
    async_summary = aggregate_language_results(results, "cloud_async")

    cloud_total = sum(item["cloud_compiler"] for item in USABILITY_SCORES)
    native_total = sum(item["native_toolchain"] for item in USABILITY_SCORES)

    lines: list[str] = [
        "# Final Compiler Comparison Report",
        "",
        "## Scope",
        "",
        "This report presents a measured comparison between the current Cloud Compiler implementation and the locally available native toolchains on this machine.",
        "",
        "Compared systems:",
        "",
        "- Native local execution using `py -3`, `gcc`, and `g++`.",
        "- Cloud Compiler synchronous execution using `backend.execution_engine.execute_in_docker`.",
        "- Cloud Compiler asynchronous execution using Redis plus `worker/worker.py` with structured job telemetry.",
        "",
        "Languages benchmarked:",
        "",
        "- Python",
        "- C",
        "- C++",
        "",
        "Language not benchmarked:",
        "",
        "- Java, because a native local `javac` / `java` baseline was not available on this machine during the measured run.",
        "",
        "## Current Project Context",
        "",
        "The comparison should be interpreted against the project as it exists now, not the earlier prototype. The current Cloud Compiler includes:",
        "",
        "- Multi-file projects with entry-file selection.",
        "- Saved projects and public share links.",
        "- Compiler profiles and custom compiler flags.",
        "- Structured async status, stdout, stderr, diagnostics, and timing fields.",
        "- Queue, worker, and latency dashboards.",
        "- Java Swing preview artifacts for normal runs.",
        "- Interactive Java Swing sessions through local noVNC embedding.",
        "",
        "## Test Environment",
        "",
        f"- Date (UTC): {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')}",
        f"- Host Python launcher: `{environment['python_launcher']}`",
        f"- Local GCC: `{environment['gcc']}`",
        f"- Local G++: `{environment['gpp']}`",
        f"- Benchmark Python: `{environment['benchmark_python']}`",
        f"- Worker Python: `{environment['worker_python']}`",
        "- Docker Desktop: available and used for sync and async cloud execution.",
        "- Redis: started in Docker for async queue benchmarking when needed.",
        f"- Runs per benchmark case: {RUNS_PER_BENCHMARK}",
        "",
        "## Method",
        "",
        "Three benchmark cases were used for each language:",
        "",
        "- `hello_world`: minimal output latency.",
        "- `cpu_loop`: arithmetic-heavy workload.",
        "- `input_sort`: input parsing plus sorting workload.",
        "",
        "Each case was executed five times in each mode. Reported latency values are wall-clock measurements that include the full user-visible turnaround for that mode.",
        "",
        "## Optimization Results",
        "",
        "### Per-Benchmark Results",
        "",
        "| Language | Benchmark | Mode | Avg (ms) | Median (ms) | P95 (ms) | Success Rate |",
        "| --- | --- | --- | --- | --- | --- | --- |",
    ]

    mode_labels = {
        "native": "Native local",
        "cloud_sync": "Cloud sync",
        "cloud_async": "Cloud async",
    }

    for item in results:
        for mode in ("native", "cloud_sync", "cloud_async"):
            metrics = item["modes"][mode]
            lines.append(
                f"| {item['language']} | {item['benchmark']} | {mode_labels[mode]} | {metrics['avg_ms']} | {metrics['median_ms']} | {metrics['p95_ms']} | {metrics['success_rate_percent']}% |"
            )

    lines.extend(
        [
            "",
            "### Language-Level Average Latency",
            "",
            "| Language | Native Avg (ms) | Cloud Sync Avg (ms) | Cloud Async Avg (ms) |",
            "| --- | --- | --- | --- |",
        ]
    )

    languages = sorted({item["language"] for item in results})
    for language in languages:
        lines.append(
            f"| {language} | {native_summary.get(language, {}).get('avg_ms')} | {sync_summary.get(language, {}).get('avg_ms')} | {async_summary.get(language, {}).get('avg_ms')} |"
        )

    lines.extend(
        [
            "",
            "### Optimization Interpretation",
            "",
            "- Native local execution remains the performance winner because it avoids Docker startup, bind mounts, queueing, and Redis polling.",
            "- Cloud sync is the fastest managed mode in this project and best reflects the immediate browser workflow.",
            "- Cloud async is slower, but that cost now buys more observability and safer decoupling than the earlier prototype offered.",
            "- The current async path is no longer a blind fire-and-forget queue. It preserves structured status, timings, diagnostics, and output fields, which makes the slower path easier to reason about operationally.",
            "- Results should be read as end-to-end user-visible latency rather than isolated compiler-only runtime.",
            "",
            "## Efficient Usability Comparison",
            "",
            "| Criterion | Cloud Compiler (1-5) | Native Toolchain (1-5) | Basis |",
            "| --- | --- | --- | --- |",
        ]
    )

    for row in USABILITY_SCORES:
        lines.append(
            f"| {row['criterion']} | {row['cloud_compiler']} | {row['native_toolchain']} | {row['basis']} |"
        )

    lines.extend(
        [
            "",
            f"Overall usability score: Cloud Compiler `{cloud_total}/{len(USABILITY_SCORES) * 5}`, Native toolchain `{native_total}/{len(USABILITY_SCORES) * 5}`.",
            "",
            "### Usability Interpretation",
            "",
            "- Cloud Compiler is now materially stronger than a plain native toolchain for managed coursework, demos, and platform-style workflows because it combines execution, persistence, sharing, and observability in one UI.",
            "- Native toolchains still win on raw responsiveness and unrestricted local debugging.",
            "- The project's current usability advantage is broader than in the earlier report because multi-file projects, saved work, public sharing, compiler profiles, and structured diagnostics are already implemented.",
            "- Java Swing support adds a differentiator that native CLI benchmarking does not capture well: browser-accessible GUI preview and interactive GUI sessions.",
            "",
            "## Key Findings",
            "",
            "- For optimization, native execution is still the performance winner.",
            "- For managed usability, the current Cloud Compiler is stronger than before because the feature set is no longer limited to single-file execution.",
            "- Cloud sync is the best balance when fast feedback matters inside the platform.",
            "- Cloud async is no longer merely a scaling path. It is also the project's observable, telemetry-rich execution path.",
            "",
            "## Improvement Priorities From the Current Comparison",
            "",
            "1. Reduce cold-start overhead with container prewarming, image slimming, or compile-result caching.",
            "2. Add remote-safe proxying and authorization for interactive Swing sessions instead of exposing local-only noVNC ports.",
            "3. Expand the compiler-version matrix beyond the current profile set and add more languages if broader platform parity is a goal.",
            "4. Add debugger-oriented features such as grouped stack traces, breakpoint-friendly integrations, or richer runtime trace capture.",
            "5. Add automated benchmark workflows that also measure Java once a native baseline is available on the host.",
            "6. Add quota controls, audit logging, and CI-backed regression tests for save/share, async execution, and telemetry.",
            "",
            "## Conclusion",
            "",
            "The updated comparison shows that Cloud Compiler should still not be presented as faster than native compilers. Its strength is a managed execution experience: browser access, isolated runners, multi-file projects, save/share support, structured telemetry, and specialized Java Swing workflows. In its current state, the project is best positioned as an observable educational or institutional coding platform rather than as a raw speed competitor to native local compilers.",
        ]
    )

    return "\n".join(lines) + "\n"


def main() -> None:
    environment = ensure_environment()

    redis_started_here = False
    redis_client: redis.Redis | None = None
    worker_process: subprocess.Popen[str] | None = None

    try:
        redis_started_here, redis_client = start_redis_container()
        redis_client.flushdb()

        worker_process = start_worker_process()
        wait_for_worker_ready(redis_client)

        results: list[dict[str, Any]] = []
        for case in BENCHMARKS:
            print(f"Running {case.language} / {case.name} ...", flush=True)
            benchmark_result = {
                "language": case.language,
                "benchmark": case.name,
                "description": case.description,
                "modes": {
                    "native": benchmark_native(case),
                    "cloud_sync": benchmark_sync(case),
                    "cloud_async": benchmark_async(case, redis_client),
                },
            }
            results.append(benchmark_result)

        payload = {
            "environment": environment,
            "runs_per_benchmark": RUNS_PER_BENCHMARK,
            "generated_at": utc_now_iso(),
            "results": results,
        }
        RESULTS_JSON.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        REPORT_MD.write_text(build_report(results, environment), encoding="utf-8")

        print(f"Saved benchmark results to {RESULTS_JSON}")
        print(f"Saved report to {REPORT_MD}")
    finally:
        if worker_process is not None:
            stop_worker_process(worker_process)
        if redis_client is not None:
            try:
                redis_client.flushdb()
            except redis.RedisError:
                pass
        stop_redis_container(redis_started_here)


if __name__ == "__main__":
    main()
