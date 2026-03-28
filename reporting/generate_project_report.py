from __future__ import annotations

import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parent
RESULTS_JSON = ROOT / "compiler_comparison_results.json"
OUTPUT_MD = ROOT / "Cloud_Compiler_Project_Report.md"
OUTPUT_DOCX = ROOT / "Cloud_Compiler_Project_Report.docx"
DOC_GENERATOR = ROOT / "generate_comparison_doc.ps1"
LANGUAGE_LABELS = {
    "python": "Python",
    "c": "C",
    "cpp": "C++",
}


def load_benchmark_summary() -> dict[str, dict[str, float]]:
    if not RESULTS_JSON.exists():
        return {}

    payload = json.loads(RESULTS_JSON.read_text(encoding="utf-8"))
    results = payload.get("results", [])
    grouped: dict[str, dict[str, list[float]]] = {}
    for item in results:
        lang = item["language"]
        grouped.setdefault(lang, {"native": [], "cloud_sync": [], "cloud_async": []})
        grouped[lang]["native"].append(item["modes"]["native"]["avg_ms"])
        grouped[lang]["cloud_sync"].append(item["modes"]["cloud_sync"]["avg_ms"])
        grouped[lang]["cloud_async"].append(item["modes"]["cloud_async"]["avg_ms"])

    return {
        lang: {
            mode: round(sum(values) / len(values), 2) if values else 0.0
            for mode, values in mode_map.items()
        }
        for lang, mode_map in grouped.items()
    }


def build_report() -> str:
    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    benchmark_summary = load_benchmark_summary()

    benchmark_rows = "\n".join(
        f"| {LANGUAGE_LABELS.get(language, language.title())} | {values['native']} | {values['cloud_sync']} | {values['cloud_async']} |"
        for language, values in sorted(benchmark_summary.items())
    ) or "| Pending | Pending | Pending | Pending |"

    benchmark_note = (
        "Measured benchmark data was loaded from `reporting/compiler_comparison_results.json`."
        if benchmark_summary
        else "Measured benchmark data was not available yet when this report was generated."
    )

    return f"""# Cloud Compiler Project Report

## Abstract

Cloud Compiler is a full-stack browser-based coding platform that lets users write, run, save, share, and monitor code execution without requiring local compiler installation. The current project combines a React and TypeScript frontend, a FastAPI backend, Redis-backed asynchronous execution, a Python worker service, Docker-based language runners, PostgreSQL-backed authentication, and admin metrics dashboards. In its current state, the project is no longer only a single-file online compiler. It now behaves more like a compact educational coding platform with multi-file projects, structured telemetry, and Java Swing browser workflows.

Generated from the repository state on **{generated_at}**.

## Current System Summary

### Core capabilities

- Browser-based coding workspace with Monaco editor
- Python, C, C++, and Java execution in isolated Docker containers
- Synchronous execution for immediate results
- Asynchronous execution through Redis queue + worker processing
- Multi-file projects with entry-file selection
- Compiler profiles and custom compiler flags
- Saved projects and public share links
- File import, code export, and PDF export
- Complexity analysis for supported languages
- Metrics dashboards for queue, workers, system state, and job timings
- Java Swing preview artifacts for regular runs
- Interactive Java Swing sessions through embedded noVNC

### High-level architecture

```text
+--------------------+        +--------------------------+
| Frontend           | -----> | FastAPI Backend          |
| React + Monaco UI  |        | Auth, execute, projects  |
+--------------------+        +-----------+--------------+
                                           |
                      +--------------------+--------------------+
                      |                                         |
                      v                                         v
             +--------------------+                  +--------------------+
             | Direct sync runner |                  | Redis queue        |
             | execution_engine   |                  | async job buffer   |
             +---------+----------+                  +---------+----------+
                       |                                       |
                       v                                       v
             +--------------------+                  +--------------------+
             | Docker containers  | <--------------  | Worker service     |
             | python/c/cpp/java  |                  | structured results |
             +--------------------+                  +--------------------+
```

## Implementation Status

| Area | Current condition |
| --- | --- |
| Authentication | JWT-based registration/login with PostgreSQL user records |
| Workspace | Multi-file editor, entry-file selection, stdin, compiler profile, flags |
| Execution | Sync + async container execution with structured result payloads |
| Persistence | Save/update/list/share project APIs with share IDs |
| Observability | Queue, worker, system, and job metrics in backend + frontend dashboards |
| Java UX | Swing preview for normal runs and interactive noVNC session support |
| Security | Container resource limits, disabled network in execution containers, text sanitization |

## Major Improvements Reflected in the Current Project

Compared with the earlier reports, the project has materially improved in the following ways:

1. Multi-file project support is implemented in the workspace and persisted through project APIs.
2. Save and share workflows are implemented, including public read-only project links.
3. Async execution now stores structured status, timings, diagnostics, stdout, stderr, and output fields.
4. Queue wait, compile time, execution time, and total time are surfaced in metrics dashboards.
5. Java Swing support now covers both preview capture and interactive browser sessions.
6. Compiler profile selection and custom compiler flags are already part of the execution payload.

## Detailed Feature Inventory

| Feature | Present now | Notes |
| --- | --- | --- |
| Multi-language execution | Yes | Python, C, C++, Java |
| Multi-file projects | Yes | Entry-file selection supported |
| Saved projects | Yes | User-owned project persistence |
| Public share links | Yes | Read-only shared project page |
| Sync execution | Yes | Immediate execution path |
| Async execution | Yes | Redis queue + worker path |
| Structured diagnostics | Yes | Status, summary, details, error stage |
| Timing telemetry | Yes | Queue wait, compile, execution, total time |
| Admin metrics UI | Yes | Queue, worker, latency, and system views |
| Compiler profiles | Yes | Language-specific profile options |
| Custom flags | Yes | User-configurable compiler/runtime flags |
| Swing preview | Yes | Returned as execution artifacts |
| Interactive Swing | Yes | Browser-embedded noVNC session |
| Step debugger | No | Still a future enhancement |
| Collaborative editing | No | Still a future enhancement |

## Benchmark Snapshot

{benchmark_note}

| Language | Native avg (ms) | Cloud sync avg (ms) | Cloud async avg (ms) |
| --- | --- | --- | --- |
{benchmark_rows}

### Benchmark interpretation

- Native local execution is still the fastest baseline.
- Cloud sync is the fastest managed mode inside the platform.
- Cloud async has the highest latency, but it is now also the most observable execution mode because it preserves structured lifecycle data.
- The benchmark does not capture the value of project persistence, sharing, dashboards, or interactive Swing sessions, so optimization results should be read together with usability findings.

## Optimization and Usability Positioning

### Optimization

- The project is optimized for safe browser-based execution rather than raw compiler speed.
- Docker startup, bind mounts, and queue handling add overhead compared with native local execution.
- The current architecture improves operational quality by returning structured telemetry and making async execution measurable.

### Efficient usability

- The platform now supports a complete user workflow: write, run, save, share, reopen, and monitor.
- Multi-file support and compiler configuration make the workspace meaningfully more practical for real coursework and demos.
- Java Swing support is a distinctive feature because it extends the platform beyond console-only programs.

## Current Limitations

The current project is much stronger than the earlier report described, but some limitations still remain:

- No built-in step debugger or breakpoint tooling
- Interactive Swing sessions are local-only and would need backend proxying for safer remote deployment
- Language coverage is still limited compared with large commercial online compilers
- Collaboration is link-based rather than live multi-user editing
- Full automated regression coverage for execution, share flow, and telemetry can still be expanded

## Recommended Next Steps

1. Add debugger-oriented tooling or richer runtime trace capture.
2. Proxy interactive sessions through authenticated backend routes for production use.
3. Expand supported compiler versions and languages if competitive breadth matters.
4. Add collaboration features such as comments, instructor review, or live editing.
5. Add CI-backed benchmark and regression pipelines so future report updates stay reproducible.

## Conclusion

Cloud Compiler has evolved from a basic distributed execution demo into a more complete coding platform. The current version supports multi-file workspaces, save/share flows, structured async telemetry, dashboard observability, and specialized Java Swing workflows. Its main competitive advantage is not raw execution speed; it is the combination of browser accessibility, isolated execution, operational visibility, and practical usability features in a single project.

## Appendix: Report Assets

- Benchmark data: `reporting/compiler_comparison_results.json`
- Measured comparison report: `reporting/Compiler_Comparison_Final_Report.md`
- Market/platform comparison report: `reporting/Compiler_Platform_Comparison_Report.md`

![Supported Language Count](graphs/platform_language_count.svg)

![Usability Score](graphs/platform_usability_score.svg)

![Optimization Support Score](graphs/platform_optimization_support_score.svg)

![Cloud Compiler Latency](graphs/cloud_compiler_latency.svg)
"""


def build_docx() -> None:
    if not DOC_GENERATOR.exists():
        return

    subprocess.run(
        [
            "powershell",
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            str(DOC_GENERATOR),
            "-Source",
            OUTPUT_MD.name,
            "-Output",
            OUTPUT_DOCX.name,
        ],
        cwd=str(ROOT),
        check=True,
    )


def main() -> None:
    OUTPUT_MD.write_text(build_report(), encoding="utf-8")
    print(f"Saved markdown report to {OUTPUT_MD}")
    build_docx()
    if OUTPUT_DOCX.exists():
        print(f"Saved Word report to {OUTPUT_DOCX}")


if __name__ == "__main__":
    sys.exit(main())
