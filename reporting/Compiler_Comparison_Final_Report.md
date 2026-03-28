# Final Compiler Comparison Report

## Scope

This report presents a measured comparison between the current Cloud Compiler implementation and the locally available native toolchains on this machine.

Compared systems:

- Native local execution using `py -3`, `gcc`, and `g++`.
- Cloud Compiler synchronous execution using `backend/autoscaler/docker_manager.py`.
- Cloud Compiler asynchronous execution using Redis plus `worker/worker.py`.

Languages benchmarked:

- Python
- C
- C++

Language not benchmarked:

- Java, because a native local `javac` / `java` baseline was not available on this machine during the test run.

## Test Environment

- Date: 2026-03-28 16:58:37
- Host Python launcher: `C:\Users\dewan\AppData\Local\Programs\Python\Launcher\py.EXE`
- Local GCC: `C:\MinGW\bin\gcc.EXE`
- Local G++: `C:\MinGW\bin\g++.EXE`
- Benchmark virtualenv Python: `C:\Users\dewan\Programming Projects\Cloud Compiler\.venv\Scripts\python.exe`
- Docker Desktop: available and used for sync and async cloud execution.
- Redis: started in Docker for async queue benchmarking.
- Runs per benchmark case: 5

## Method

Three benchmark cases were used for each language:

- `hello_world`: minimal output latency.
- `cpu_loop`: arithmetic-heavy workload.
- `input_sort`: input parsing plus sorting workload.

Each case was executed five times in each mode. Reported latency values are wall-clock measurements that include the full user-visible turnaround for that mode.

## Optimization Results

### Per-Benchmark Results

| Language | Benchmark | Mode | Avg (ms) | Median (ms) | P95 (ms) | Success Rate |
| --- | --- | --- | --- | --- | --- | --- |
| python | hello_world | Native local | 73.93 | 73.72 | 82.28 | 100.0% |
| python | hello_world | Cloud sync | 878.94 | 866.76 | 988.38 | 100.0% |
| python | hello_world | Cloud async | 1830.82 | 1781.71 | 2196.99 | 100.0% |
| python | cpu_loop | Native local | 172.73 | 162.54 | 231.0 | 100.0% |
| python | cpu_loop | Cloud sync | 957.17 | 906.91 | 1182.67 | 100.0% |
| python | cpu_loop | Cloud async | 1811.93 | 1875.97 | 2451.89 | 100.0% |
| python | input_sort | Native local | 120.77 | 97.18 | 222.1 | 100.0% |
| python | input_sort | Cloud sync | 868.94 | 855.2 | 1066.68 | 100.0% |
| python | input_sort | Cloud async | 1777.58 | 1781.75 | 2269.65 | 100.0% |
| c | hello_world | Native local | 622.54 | 503.97 | 866.23 | 100.0% |
| c | hello_world | Cloud sync | 1088.8 | 1093.96 | 1269.62 | 100.0% |
| c | hello_world | Cloud async | 1743.98 | 1906.6 | 2315.41 | 100.0% |
| c | cpu_loop | Native local | 968.89 | 958.25 | 1150.5 | 100.0% |
| c | cpu_loop | Cloud sync | 1030.29 | 972.31 | 1294.04 | 100.0% |
| c | cpu_loop | Cloud async | 1691.77 | 1865.1 | 1925.38 | 100.0% |
| c | input_sort | Native local | 502.4 | 458.01 | 723.83 | 100.0% |
| c | input_sort | Cloud sync | 947.11 | 810.33 | 1221.43 | 100.0% |
| c | input_sort | Cloud async | 1617.01 | 1820.03 | 1839.44 | 100.0% |
| cpp | hello_world | Native local | 898.14 | 815.25 | 1242.99 | 100.0% |
| cpp | hello_world | Cloud sync | 1332.32 | 1348.64 | 1378.27 | 100.0% |
| cpp | hello_world | Cloud async | 2807.41 | 2761.88 | 3064.96 | 100.0% |
| cpp | cpu_loop | Native local | 723.31 | 690.36 | 816.61 | 100.0% |
| cpp | cpu_loop | Cloud sync | 1539.54 | 1599.2 | 1880.66 | 100.0% |
| cpp | cpu_loop | Cloud async | 2843.13 | 2834.18 | 3517.97 | 100.0% |
| cpp | input_sort | Native local | 2020.06 | 2139.38 | 2216.96 | 100.0% |
| cpp | input_sort | Cloud sync | 1791.24 | 1505.52 | 2536.92 | 100.0% |
| cpp | input_sort | Cloud async | 3189.06 | 3217.54 | 3809.23 | 100.0% |

### Language-Level Average Latency

| Language | Native Avg (ms) | Cloud Sync Avg (ms) | Cloud Async Avg (ms) |
| --- | --- | --- | --- |
| c | 697.94 | 1022.07 | 1684.25 |
| cpp | 1213.84 | 1554.37 | 2946.53 |
| python | 122.48 | 901.68 | 1806.78 |

### Optimization Interpretation

- Native local execution was generally the fastest path because it avoids container startup, bind mounts, queueing, and Redis polling.
- Cloud sync execution was usually slower than native execution, but it provided the closest cloud experience to an immediate 'Run' action.
- Cloud async execution was the slowest mode because it includes queue submission, worker polling, and the worker loop delay in addition to container startup.
- Some native C and C++ averages showed large outliers on Windows, so the median values are often a better indicator of steady-state local performance than the raw average alone.
- All reported success rates should be read as execution correctness on the chosen benchmarks, not as a full reliability guarantee across all programs.

## Efficient Usability Comparison

| Criterion | Cloud Compiler (1-5) | Native Toolchain (1-5) | Basis |
| --- | --- | --- | --- |
| Setup effort for end users | 5 | 2 | Browser-based access removes local compiler installation for users. |
| Execution flexibility | 5 | 3 | Cloud Compiler provides both synchronous and asynchronous execution paths. |
| Input and output workflow | 5 | 3 | Workspace includes stdin, output history, import/export, and PDF export. |
| Operational visibility | 5 | 1 | Queue, worker, and system metrics are built into the platform. |
| Performance immediacy | 3 | 5 | Native execution avoids Docker, Redis, and polling overhead. |
| Error clarity | 3 | 4 | Native toolchains return direct compiler/runtime errors; async path currently stores output as raw text only. |

Overall usability score: Cloud Compiler `26/30`, Native toolchain `18/30`.

### Usability Interpretation

- Cloud Compiler is clearly stronger for end-user accessibility because the user only needs a browser-facing interface rather than separate local compiler installation and configuration.
- Native toolchains are stronger for immediate performance and direct low-level error feedback.
- Cloud Compiler offers better operational usability for teaching, demos, or managed environments because it includes queue monitoring, worker visibility, stdin handling, export features, and a shared UI.
- The current async result model reduces usability quality because compile errors, runtime errors, and timeouts are not stored as structured result objects.

## Key Findings

- For optimization, native execution is the performance winner.
- For managed usability, Cloud Compiler is the usability winner.
- Cloud sync is the best balance inside this project when low latency matters.
- Cloud async is the right architecture for scale, but it currently pays a noticeable latency cost and needs better telemetry.

## Project Improvements Recommended from the Measured Comparison

1. Store structured async results with `status`, `stdout`, `stderr`, `submitted_at`, `started_at`, `finished_at`, and `total_time_ms`.
2. Move async worker execution into a per-job temporary directory instead of the shared `worker/` working directory.
3. Add queue wait time and execution time metrics to the monitoring API and frontend charts.
4. Fix misleading metrics labels so charts reflect real execution metrics rather than host CPU and memory under execution-time labels.
5. Add a reusable benchmark endpoint or admin-only benchmark runner so future comparisons can be repeated automatically.
6. Externalize secrets and deployment configuration before production use.

## Conclusion

The measured comparison shows that Cloud Compiler should not be presented as faster than native compilers. Its real strength is efficient usability: centralized access, sandboxed execution, dual sync and async workflows, and built-in observability. If the project adds structured timing telemetry and improves the async execution path, it will be much better positioned for rigorous optimization comparisons in future evaluations.
