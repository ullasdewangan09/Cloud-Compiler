# Final Compiler Comparison Report

## Scope

This report presents a measured comparison between the current Cloud Compiler implementation and the locally available native toolchains on this machine.

Compared systems:

- Native local execution using `py -3`, `gcc`, and `g++`.
- Cloud Compiler synchronous execution using `backend.execution_engine.execute_in_docker`.
- Cloud Compiler asynchronous execution using Redis plus `worker/worker.py` with structured job telemetry.

Languages benchmarked:

- Python
- C
- C++

Language not benchmarked:

- Java, because a native local `javac` / `java` baseline was not available on this machine during the measured run.

## Current Project Context

The comparison should be interpreted against the project as it exists now, not the earlier prototype. The current Cloud Compiler includes:

- Multi-file projects with entry-file selection.
- Saved projects and public share links.
- Compiler profiles and custom compiler flags.
- Structured async status, stdout, stderr, diagnostics, and timing fields.
- Queue, worker, and latency dashboards.
- Java Swing preview artifacts for normal runs.
- Interactive Java Swing sessions through local noVNC embedding.

## Test Environment

- Date (UTC): 2026-03-28 19:49:50
- Host Python launcher: `C:\Users\dewan\AppData\Local\Programs\Python\Launcher\py.EXE`
- Local GCC: `C:\MinGW\bin\gcc.EXE`
- Local G++: `C:\MinGW\bin\g++.EXE`
- Benchmark Python: `C:\Users\dewan\Programming Projects\Cloud Compiler\.venv\Scripts\python.exe`
- Worker Python: `C:\Users\dewan\Programming Projects\Cloud Compiler\.venv\Scripts\python.exe`
- Docker Desktop: available and used for sync and async cloud execution.
- Redis: started in Docker for async queue benchmarking when needed.
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
| python | hello_world | Native local | 259.79 | 248.93 | 320.12 | 100.0% |
| python | hello_world | Cloud sync | 1505.11 | 1401.36 | 1762.09 | 100.0% |
| python | hello_world | Cloud async | 2625.39 | 2618.09 | 3185.04 | 100.0% |
| python | cpu_loop | Native local | 372.22 | 330.72 | 495.31 | 100.0% |
| python | cpu_loop | Cloud sync | 1517.1 | 1487.59 | 1661.21 | 100.0% |
| python | cpu_loop | Cloud async | 2488.5 | 2778.59 | 2846.85 | 100.0% |
| python | input_sort | Native local | 269.76 | 224.71 | 403.35 | 100.0% |
| python | input_sort | Cloud sync | 1614.63 | 1680.8 | 1798.32 | 100.0% |
| python | input_sort | Cloud async | 2487.97 | 2607.81 | 2916.51 | 100.0% |
| c | hello_world | Native local | 87.02 | 31.57 | 250.02 | 100.0% |
| c | hello_world | Cloud sync | 1620.74 | 1624.58 | 1799.01 | 100.0% |
| c | hello_world | Cloud async | 2612.81 | 2742.94 | 2885.03 | 100.0% |
| c | cpu_loop | Native local | 183.41 | 37.45 | 619.81 | 100.0% |
| c | cpu_loop | Cloud sync | 1581.84 | 1547.02 | 1867.72 | 100.0% |
| c | cpu_loop | Cloud async | 2572.53 | 2687.86 | 3020.9 | 100.0% |
| c | input_sort | Native local | 72.32 | 36.81 | 193.9 | 100.0% |
| c | input_sort | Cloud sync | 1679.81 | 1663.41 | 1900.44 | 100.0% |
| c | input_sort | Cloud async | 2516.06 | 2655.51 | 2704.78 | 100.0% |
| cpp | hello_world | Native local | 112.5 | 33.18 | 358.39 | 100.0% |
| cpp | hello_world | Cloud sync | 2701.47 | 2606.05 | 3181.77 | 100.0% |
| cpp | hello_world | Cloud async | 4003.18 | 4008.08 | 4387.33 | 100.0% |
| cpp | cpu_loop | Native local | 98.75 | 60.81 | 213.74 | 100.0% |
| cpp | cpu_loop | Cloud sync | 2349.99 | 2284.65 | 2614.68 | 100.0% |
| cpp | cpu_loop | Cloud async | 3976.88 | 4091.32 | 4420.41 | 100.0% |
| cpp | input_sort | Native local | 70.61 | 29.6 | 192.93 | 100.0% |
| cpp | input_sort | Cloud sync | 3086.6 | 3136.77 | 3476.61 | 100.0% |
| cpp | input_sort | Cloud async | 4903.79 | 4550.57 | 5807.63 | 100.0% |

### Language-Level Average Latency

| Language | Native Avg (ms) | Cloud Sync Avg (ms) | Cloud Async Avg (ms) |
| --- | --- | --- | --- |
| c | 114.25 | 1627.46 | 2567.13 |
| cpp | 93.95 | 2712.69 | 4294.62 |
| python | 300.59 | 1545.61 | 2533.95 |

### Optimization Interpretation

- Native local execution remains the performance winner because it avoids Docker startup, bind mounts, queueing, and Redis polling.
- Cloud sync is the fastest managed mode in this project and best reflects the immediate browser workflow.
- Cloud async is slower, but that cost now buys more observability and safer decoupling than the earlier prototype offered.
- The current async path is no longer a blind fire-and-forget queue. It preserves structured status, timings, diagnostics, and output fields, which makes the slower path easier to reason about operationally.
- Results should be read as end-to-end user-visible latency rather than isolated compiler-only runtime.

## Efficient Usability Comparison

| Criterion | Cloud Compiler (1-5) | Native Toolchain (1-5) | Basis |
| --- | --- | --- | --- |
| Setup effort for end users | 5 | 2 | Cloud Compiler stays browser-first, while native use still requires separate local toolchain setup. |
| Workflow breadth | 5 | 2 | The current workspace supports multi-file projects, entry-file selection, save/share, compiler profiles, and compiler flags. |
| Execution flexibility | 5 | 3 | Cloud Compiler offers synchronous, asynchronous, and Java Swing interactive execution flows. |
| Operational visibility | 5 | 1 | Queue metrics, worker heartbeat data, timing telemetry, and dashboard views are built into the platform. |
| Sharing and reproducibility | 5 | 2 | Saved projects and public share links make it easier to reopen or review exactly the same code state. |
| Diagnostics quality | 4 | 4 | Both paths expose compiler/runtime output, while Cloud Compiler now also returns structured diagnostics and timing fields. |
| Performance immediacy | 3 | 5 | Native execution still avoids queueing, Redis polling, bind mounts, and container startup overhead. |

Overall usability score: Cloud Compiler `32/35`, Native toolchain `19/35`.

### Usability Interpretation

- Cloud Compiler is now materially stronger than a plain native toolchain for managed coursework, demos, and platform-style workflows because it combines execution, persistence, sharing, and observability in one UI.
- Native toolchains still win on raw responsiveness and unrestricted local debugging.
- The project's current usability advantage is broader than in the earlier report because multi-file projects, saved work, public sharing, compiler profiles, and structured diagnostics are already implemented.
- Java Swing support adds a differentiator that native CLI benchmarking does not capture well: browser-accessible GUI preview and interactive GUI sessions.

## Key Findings

- For optimization, native execution is still the performance winner.
- For managed usability, the current Cloud Compiler is stronger than before because the feature set is no longer limited to single-file execution.
- Cloud sync is the best balance when fast feedback matters inside the platform.
- Cloud async is no longer merely a scaling path. It is also the project's observable, telemetry-rich execution path.

## Improvement Priorities From the Current Comparison

1. Reduce cold-start overhead with container prewarming, image slimming, or compile-result caching.
2. Add remote-safe proxying and authorization for interactive Swing sessions instead of exposing local-only noVNC ports.
3. Expand the compiler-version matrix beyond the current profile set and add more languages if broader platform parity is a goal.
4. Add debugger-oriented features such as grouped stack traces, breakpoint-friendly integrations, or richer runtime trace capture.
5. Add automated benchmark workflows that also measure Java once a native baseline is available on the host.
6. Add quota controls, audit logging, and CI-backed regression tests for save/share, async execution, and telemetry.

## Conclusion

The updated comparison shows that Cloud Compiler should still not be presented as faster than native compilers. Its strength is a managed execution experience: browser access, isolated runners, multi-file projects, save/share support, structured telemetry, and specialized Java Swing workflows. In its current state, the project is best positioned as an observable educational or institutional coding platform rather than as a raw speed competitor to native local compilers.
