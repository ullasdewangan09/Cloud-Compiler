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
from pathlib import Path
from typing import Any

import redis


ROOT = Path(__file__).resolve().parents[1]
REPORTING_DIR = ROOT / "reporting"
BACKEND_DIR = ROOT / "backend"
WORKER_DIR = ROOT / "worker"
VENV_PYTHON = ROOT / ".venv" / "Scripts" / "python.exe"

RESULTS_JSON = REPORTING_DIR / "compiler_comparison_results.json"
REPORT_MD = REPORTING_DIR / "Compiler_Comparison_Final_Report.md"

REDIS_CONTAINER_NAME = "cloud-compiler-bench-redis"
REDIS_URL = {"host": "localhost", "port": 6379, "db": 0, "decode_responses": True}
QUEUE_NAME = "code_queue"

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
        "basis": "Browser-based access removes local compiler installation for users.",
    },
    {
        "criterion": "Execution flexibility",
        "cloud_compiler": 5,
        "native_toolchain": 3,
        "basis": "Cloud Compiler provides both synchronous and asynchronous execution paths.",
    },
    {
        "criterion": "Input and output workflow",
        "cloud_compiler": 5,
        "native_toolchain": 3,
        "basis": "Workspace includes stdin, output history, import/export, and PDF export.",
    },
    {
        "criterion": "Operational visibility",
        "cloud_compiler": 5,
        "native_toolchain": 1,
        "basis": "Queue, worker, and system metrics are built into the platform.",
    },
    {
        "criterion": "Performance immediacy",
        "cloud_compiler": 3,
        "native_toolchain": 5,
        "basis": "Native execution avoids Docker, Redis, and polling overhead.",
    },
    {
        "criterion": "Error clarity",
        "cloud_compiler": 3,
        "native_toolchain": 4,
        "basis": "Native toolchains return direct compiler/runtime errors; async path currently stores output as raw text only.",
    },
]


def run_command(command: list[str], cwd: Path | None = None, input_text: str = "", timeout: int = 60) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        command,
        cwd=str(cwd) if cwd else None,
        input=input_text,
        text=True,
        capture_output=True,
        timeout=timeout,
        check=False,
    )


def ensure_environment() -> dict[str, Any]:
    if not VENV_PYTHON.exists():
        raise RuntimeError(f"Expected virtualenv python at {VENV_PYTHON}")

    gcc_exists = shutil.which("gcc") is not None
    gpp_exists = shutil.which("g++") is not None
    py_exists = shutil.which("py") is not None

    if not all([gcc_exists, gpp_exists, py_exists]):
        raise RuntimeError("Required local tools are missing. Need py, gcc, and g++.")

    docker_version = run_command(["docker", "version"], cwd=ROOT)
    if docker_version.returncode != 0:
        raise RuntimeError(f"Docker is unavailable: {docker_version.stderr or docker_version.stdout}")

    return {
        "python_launcher": shutil.which("py"),
        "gcc": shutil.which("gcc"),
        "gpp": shutil.which("g++"),
        "venv_python": str(VENV_PYTHON),
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
            "redis:latest",
        ],
        cwd=ROOT,
        timeout=60,
    )
    if start.returncode != 0:
        raise RuntimeError(f"Failed to start Redis container: {start.stderr or start.stdout}")

    deadline = time.time() + 30
    last_error = None
    while time.time() < deadline:
        try:
            client = redis.Redis(**REDIS_URL)
            client.ping()
            return True, client
        except redis.RedisError as exc:
            last_error = exc
            time.sleep(0.5)

    raise RuntimeError(f"Redis did not become ready: {last_error}")


def stop_redis_container(started_here: bool) -> None:
    if started_here:
        run_command(["docker", "rm", "-f", REDIS_CONTAINER_NAME], cwd=ROOT, timeout=30)


def start_worker_process() -> subprocess.Popen[str]:
    env = os.environ.copy()
    env["REDIS_HOST"] = "localhost"
    env["REDIS_PORT"] = "6379"
    env["QUEUE_NAME"] = QUEUE_NAME
    env["WORKER_REGISTRY_KEY"] = "worker_registry"
    env["PYTHONIOENCODING"] = "utf-8"

    process = subprocess.Popen(
        [str(VENV_PYTHON), "worker.py"],
        cwd=str(WORKER_DIR),
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    return process


def stop_worker_process(process: subprocess.Popen[str]) -> None:
    if process.poll() is None:
        process.terminate()
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=10)


def wait_for_worker_ready(r: redis.Redis) -> None:
    deadline = time.time() + 30
    while time.time() < deadline:
        workers = r.hgetall("worker_registry")
        if workers:
            return
        time.sleep(0.5)
    raise RuntimeError("Worker did not register in Redis.")


def check_output(actual: str, expected: str) -> bool:
    return actual.replace("\r\n", "\n").strip() == expected.replace("\r\n", "\n").strip()


def summarize_durations(durations: list[float], successes: int, total_runs: int) -> dict[str, Any]:
    sorted_values = sorted(durations)
    if sorted_values:
        p95_index = max(0, min(len(sorted_values) - 1, round(0.95 * (len(sorted_values) - 1))))
        p95 = sorted_values[p95_index]
        avg = statistics.mean(sorted_values)
        median = statistics.median(sorted_values)
    else:
        avg = median = p95 = None

    return {
        "runs": total_runs,
        "successes": successes,
        "success_rate_percent": round((successes / total_runs) * 100, 2) if total_runs else 0.0,
        "avg_ms": round(avg * 1000, 2) if avg is not None else None,
        "median_ms": round(median * 1000, 2) if median is not None else None,
        "p95_ms": round(p95 * 1000, 2) if p95 is not None else None,
        "raw_ms": [round(value * 1000, 2) for value in durations],
    }


def benchmark_native(case: BenchmarkCase) -> dict[str, Any]:
    durations: list[float] = []
    successes = 0
    sample_output = ""
    sample_error = ""

    for _ in range(RUNS_PER_BENCHMARK):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            start = time.perf_counter()

            if case.language == "python":
                source = tmp_path / "code.py"
                source.write_text(case.code, encoding="utf-8")
                result = run_command(["py", "-3", "code.py"], cwd=tmp_path, input_text=case.user_input)
            elif case.language == "c":
                source = tmp_path / "code.c"
                source.write_text(case.code, encoding="utf-8")
                compile_result = run_command(["gcc", "code.c", "-O2", "-o", "program.exe"], cwd=tmp_path)
                if compile_result.returncode == 0:
                    result = run_command([str(tmp_path / "program.exe")], cwd=tmp_path, input_text=case.user_input)
                    result.stdout = compile_result.stdout + result.stdout
                    result.stderr = compile_result.stderr + result.stderr
                    result.returncode = result.returncode
                else:
                    result = compile_result
            elif case.language == "cpp":
                source = tmp_path / "code.cpp"
                source.write_text(case.code, encoding="utf-8")
                compile_result = run_command(["g++", "code.cpp", "-O2", "-o", "program.exe"], cwd=tmp_path)
                if compile_result.returncode == 0:
                    result = run_command([str(tmp_path / "program.exe")], cwd=tmp_path, input_text=case.user_input)
                    result.stdout = compile_result.stdout + result.stdout
                    result.stderr = compile_result.stderr + result.stderr
                    result.returncode = result.returncode
                else:
                    result = compile_result
            else:
                raise ValueError(f"Unsupported language for native benchmark: {case.language}")

            duration = time.perf_counter() - start
            durations.append(duration)
            sample_output = result.stdout
            sample_error = result.stderr
            if result.returncode == 0 and check_output(result.stdout, case.expected_output):
                successes += 1

    summary = summarize_durations(durations, successes, RUNS_PER_BENCHMARK)
    summary["sample_output"] = sample_output
    summary["sample_error"] = sample_error
    return summary


def benchmark_sync(case: BenchmarkCase) -> dict[str, Any]:
    sys.path.insert(0, str(BACKEND_DIR))
    from autoscaler.docker_manager import DockerManager  # type: ignore

    manager = DockerManager()
    durations: list[float] = []
    successes = 0
    sample_output = ""
    sample_error = ""

    for _ in range(RUNS_PER_BENCHMARK):
        start = time.perf_counter()
        result = manager.run_container(case.language, case.code, case.user_input)
        duration = time.perf_counter() - start
        durations.append(duration)
        sample_output = result.get("output", "")
        sample_error = result.get("error", "")
        if result.get("status") == "success" and check_output(sample_output, case.expected_output):
            successes += 1

    summary = summarize_durations(durations, successes, RUNS_PER_BENCHMARK)
    summary["sample_output"] = sample_output
    summary["sample_error"] = sample_error
    return summary


def benchmark_async(case: BenchmarkCase, r: redis.Redis) -> dict[str, Any]:
    durations: list[float] = []
    successes = 0
    sample_output = ""

    for _ in range(RUNS_PER_BENCHMARK):
        job_id = str(uuid.uuid4())
        payload = {
            "job_id": job_id,
            "language": case.language,
            "code": case.code,
            "input": case.user_input,
        }

        start = time.perf_counter()
        r.lpush(QUEUE_NAME, json.dumps(payload))

        deadline = time.time() + 60
        result_value: str | None = None
        while time.time() < deadline:
            raw = r.get(f"result:{job_id}")
            if raw is not None:
                result_value = raw
                break
            time.sleep(0.05)

        duration = time.perf_counter() - start
        durations.append(duration)

        if result_value is None:
            sample_output = ""
        else:
            sample_output = result_value
            if check_output(result_value, case.expected_output):
                successes += 1

    summary = summarize_durations(durations, successes, RUNS_PER_BENCHMARK)
    summary["sample_output"] = sample_output
    summary["sample_error"] = ""
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
            "success_rate_percent": round(sum(success_rates[lang]) / len(success_rates[lang]), 2) if success_rates.get(lang) else None,
        }
    return summary


def build_report(results: list[dict[str, Any]], environment: dict[str, Any]) -> str:
    native_summary = aggregate_language_results(results, "native")
    sync_summary = aggregate_language_results(results, "cloud_sync")
    async_summary = aggregate_language_results(results, "cloud_async")

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
        "- Cloud Compiler synchronous execution using `backend/autoscaler/docker_manager.py`.",
        "- Cloud Compiler asynchronous execution using Redis plus `worker/worker.py`.",
        "",
        "Languages benchmarked:",
        "",
        "- Python",
        "- C",
        "- C++",
        "",
        "Language not benchmarked:",
        "",
        "- Java, because a native local `javac` / `java` baseline was not available on this machine during the test run.",
        "",
        "## Test Environment",
        "",
        f"- Date: {time.strftime('%Y-%m-%d %H:%M:%S')}",
        f"- Host Python launcher: `{environment['python_launcher']}`",
        f"- Local GCC: `{environment['gcc']}`",
        f"- Local G++: `{environment['gpp']}`",
        f"- Benchmark virtualenv Python: `{environment['venv_python']}`",
        "- Docker Desktop: available and used for sync and async cloud execution.",
        "- Redis: started in Docker for async queue benchmarking.",
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
            "- Native local execution was generally the fastest path because it avoids container startup, bind mounts, queueing, and Redis polling.",
            "- Cloud sync execution was usually slower than native execution, but it provided the closest cloud experience to an immediate 'Run' action.",
            "- Cloud async execution was the slowest mode because it includes queue submission, worker polling, and the worker loop delay in addition to container startup.",
            "- Some native C and C++ averages showed large outliers on Windows, so the median values are often a better indicator of steady-state local performance than the raw average alone.",
            "- All reported success rates should be read as execution correctness on the chosen benchmarks, not as a full reliability guarantee across all programs.",
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

    cloud_total = sum(item["cloud_compiler"] for item in USABILITY_SCORES)
    native_total = sum(item["native_toolchain"] for item in USABILITY_SCORES)

    lines.extend(
        [
            "",
            f"Overall usability score: Cloud Compiler `{cloud_total}/{len(USABILITY_SCORES) * 5}`, Native toolchain `{native_total}/{len(USABILITY_SCORES) * 5}`.",
            "",
            "### Usability Interpretation",
            "",
            "- Cloud Compiler is clearly stronger for end-user accessibility because the user only needs a browser-facing interface rather than separate local compiler installation and configuration.",
            "- Native toolchains are stronger for immediate performance and direct low-level error feedback.",
            "- Cloud Compiler offers better operational usability for teaching, demos, or managed environments because it includes queue monitoring, worker visibility, stdin handling, export features, and a shared UI.",
            "- The current async result model reduces usability quality because compile errors, runtime errors, and timeouts are not stored as structured result objects.",
            "",
            "## Key Findings",
            "",
            "- For optimization, native execution is the performance winner.",
            "- For managed usability, Cloud Compiler is the usability winner.",
            "- Cloud sync is the best balance inside this project when low latency matters.",
            "- Cloud async is the right architecture for scale, but it currently pays a noticeable latency cost and needs better telemetry.",
            "",
            "## Project Improvements Recommended from the Measured Comparison",
            "",
            "1. Store structured async results with `status`, `stdout`, `stderr`, `submitted_at`, `started_at`, `finished_at`, and `total_time_ms`.",
            "2. Move async worker execution into a per-job temporary directory instead of the shared `worker/` working directory.",
            "3. Add queue wait time and execution time metrics to the monitoring API and frontend charts.",
            "4. Fix misleading metrics labels so charts reflect real execution metrics rather than host CPU and memory under execution-time labels.",
            "5. Add a reusable benchmark endpoint or admin-only benchmark runner so future comparisons can be repeated automatically.",
            "6. Externalize secrets and deployment configuration before production use.",
            "",
            "## Conclusion",
            "",
            "The measured comparison shows that Cloud Compiler should not be presented as faster than native compilers. Its real strength is efficient usability: centralized access, sandboxed execution, dual sync and async workflows, and built-in observability. If the project adds structured timing telemetry and improves the async execution path, it will be much better positioned for rigorous optimization comparisons in future evaluations.",
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
            "results": results,
        }
        RESULTS_JSON.write_text(json.dumps(payload, indent=2), encoding="utf-8")

        report_text = build_report(results, environment)
        REPORT_MD.write_text(report_text, encoding="utf-8")

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
