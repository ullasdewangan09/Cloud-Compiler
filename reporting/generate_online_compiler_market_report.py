from __future__ import annotations

import json
from pathlib import Path
from xml.sax.saxutils import escape


ROOT = Path(__file__).resolve().parents[1]
REPORTING_DIR = ROOT / "reporting"
GRAPHS_DIR = REPORTING_DIR / "graphs"
RESULTS_JSON = REPORTING_DIR / "compiler_comparison_results.json"
OUTPUT_MD = REPORTING_DIR / "Compiler_Platform_Comparison_Report.md"


PLATFORMS = [
    {
        "name": "Cloud Compiler",
        "language_count": 4,
        "usability_score": 8.0,
        "optimization_support_score": 5.0,
        "debugger": "No",
        "stdin": "Yes",
        "sharing": "Partial",
        "collaboration": "No",
        "api_embed": "Internal API only",
        "multi_file": "No",
        "version_selection": "No",
        "mobile": "No",
        "positioning": "Best for managed browser-based execution inside this project.",
        "source": "Local project analysis + measured benchmark run in reporting/compiler_comparison_results.json",
    },
    {
        "name": "Programiz",
        "language_count": 17,
        "usability_score": 5.5,
        "optimization_support_score": 2.0,
        "debugger": "No visible debugger",
        "stdin": "Not clearly documented on landing page",
        "sharing": "Yes",
        "collaboration": "No visible collaboration",
        "api_embed": "No visible API on examined pages",
        "multi_file": "No visible multi-file workflow",
        "version_selection": "No visible version selection",
        "mobile": "Not documented on examined pages",
        "positioning": "Good for quick learning-oriented browser execution and easy sharing.",
        "source": "https://programiz.io/ and https://www.programiz.com/c-programming/online-compiler/",
    },
    {
        "name": "OnlineGDB",
        "language_count": 45,
        "usability_score": 8.5,
        "optimization_support_score": 7.5,
        "debugger": "Yes",
        "stdin": "Yes",
        "sharing": "Yes",
        "collaboration": "Classroom support",
        "api_embed": "No prominent public API on examined page",
        "multi_file": "Yes",
        "version_selection": "Partial via language standards / variants",
        "mobile": "Browser-based",
        "positioning": "Strong educational IDE with live debugging and classroom support.",
        "source": "https://www.onlinegdb.com/ide",
    },
    {
        "name": "JDoodle",
        "language_count": 88,
        "usability_score": 9.5,
        "optimization_support_score": 10.0,
        "debugger": "Advanced IDE features",
        "stdin": "Yes",
        "sharing": "Yes",
        "collaboration": "Yes",
        "api_embed": "Yes",
        "multi_file": "Yes",
        "version_selection": "Yes",
        "mobile": "Yes",
        "positioning": "Most feature-rich documented platform in this comparison.",
        "source": "https://www.jdoodle.com/docs and https://www.jdoodle.com/docs/ide/languages-versions",
    },
    {
        "name": "OneCompiler",
        "language_count": 60,
        "usability_score": 8.5,
        "optimization_support_score": 6.5,
        "debugger": "No prominent debugger on examined pages",
        "stdin": "Likely in product flow, not highlighted on about pages",
        "sharing": "Yes",
        "collaboration": "Yes",
        "api_embed": "Yes",
        "multi_file": "Studio project environment available",
        "version_selection": "Not prominently documented",
        "mobile": "Yes",
        "positioning": "Strong general-purpose online coding platform with API and team features.",
        "source": "https://onecompiler.com/ , https://onecompiler.com/about , https://onecompiler.com/studio",
    },
    {
        "name": "Ideone",
        "language_count": 60,
        "usability_score": 6.0,
        "optimization_support_score": 4.5,
        "debugger": "Basic debugging positioning",
        "stdin": "Yes",
        "sharing": "Yes",
        "collaboration": "No visible collaboration suite",
        "api_embed": "Yes",
        "multi_file": "No visible multi-file workflow",
        "version_selection": "Time limit and language variants shown",
        "mobile": "Yes",
        "positioning": "Simple remote execution service with broad language coverage and API/widget hooks.",
        "source": "https://www.ideone.com/ and https://1.ideone.com/languages",
    },
]


def load_cloud_latency() -> dict[str, dict[str, float]]:
    payload = json.loads(RESULTS_JSON.read_text(encoding="utf-8"))
    results = payload["results"]
    grouped: dict[str, dict[str, list[float]]] = {}
    for item in results:
        lang = item["language"]
        grouped.setdefault(lang, {"native": [], "cloud_sync": [], "cloud_async": []})
        grouped[lang]["native"].append(item["modes"]["native"]["avg_ms"])
        grouped[lang]["cloud_sync"].append(item["modes"]["cloud_sync"]["avg_ms"])
        grouped[lang]["cloud_async"].append(item["modes"]["cloud_async"]["avg_ms"])

    summary: dict[str, dict[str, float]] = {}
    for lang, values in grouped.items():
        summary[lang] = {
            key: round(sum(series) / len(series), 2) for key, series in values.items()
        }
    return summary


def write_svg(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8")


def simple_bar_chart_svg(title: str, items: list[tuple[str, float]], color: str, max_value: float, x_label: str) -> str:
    width = 980
    height = 560
    left = 170
    right = 60
    top = 90
    bottom = 90
    chart_width = width - left - right
    chart_height = height - top - bottom
    bar_gap = 18
    bar_height = (chart_height - bar_gap * (len(items) - 1)) / max(1, len(items))

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
        '<rect width="100%" height="100%" fill="#f8fafc"/>',
        f'<text x="{width/2}" y="42" text-anchor="middle" font-family="Segoe UI, Arial" font-size="24" font-weight="700" fill="#0f172a">{escape(title)}</text>',
        f'<text x="{width/2}" y="{height-24}" text-anchor="middle" font-family="Segoe UI, Arial" font-size="14" fill="#475569">{escape(x_label)}</text>',
        f'<line x1="{left}" y1="{top}" x2="{left}" y2="{height-bottom}" stroke="#94a3b8" stroke-width="2"/>',
        f'<line x1="{left}" y1="{height-bottom}" x2="{width-right}" y2="{height-bottom}" stroke="#94a3b8" stroke-width="2"/>',
    ]

    for tick in range(6):
        value = max_value * tick / 5
        x = left + chart_width * tick / 5
        parts.append(f'<line x1="{x}" y1="{top}" x2="{x}" y2="{height-bottom}" stroke="#e2e8f0" stroke-width="1"/>')
        parts.append(f'<text x="{x}" y="{height-bottom+22}" text-anchor="middle" font-family="Segoe UI, Arial" font-size="12" fill="#64748b">{value:.0f}</text>')

    for index, (label, value) in enumerate(items):
        y = top + index * (bar_height + bar_gap)
        bar_width = 0 if max_value == 0 else chart_width * value / max_value
        parts.append(f'<text x="{left-12}" y="{y + bar_height/2 + 5}" text-anchor="end" font-family="Segoe UI, Arial" font-size="14" fill="#0f172a">{escape(label)}</text>')
        parts.append(f'<rect x="{left}" y="{y}" width="{bar_width}" height="{bar_height}" rx="8" fill="{color}"/>')
        parts.append(f'<text x="{left + bar_width + 10}" y="{y + bar_height/2 + 5}" font-family="Segoe UI, Arial" font-size="13" fill="#1e293b">{value:.1f}</text>')

    parts.append("</svg>")
    return "\n".join(parts)


def grouped_bar_chart_svg(title: str, categories: list[str], series: list[tuple[str, str, list[float]]], max_value: float, y_label: str) -> str:
    width = 1040
    height = 600
    left = 90
    right = 40
    top = 90
    bottom = 100
    chart_width = width - left - right
    chart_height = height - top - bottom
    group_width = chart_width / max(1, len(categories))
    bar_width = min(60, (group_width - 40) / max(1, len(series)))

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
        '<rect width="100%" height="100%" fill="#f8fafc"/>',
        f'<text x="{width/2}" y="42" text-anchor="middle" font-family="Segoe UI, Arial" font-size="24" font-weight="700" fill="#0f172a">{escape(title)}</text>',
        f'<text x="28" y="{height/2}" transform="rotate(-90 28 {height/2})" text-anchor="middle" font-family="Segoe UI, Arial" font-size="14" fill="#475569">{escape(y_label)}</text>',
        f'<line x1="{left}" y1="{top}" x2="{left}" y2="{height-bottom}" stroke="#94a3b8" stroke-width="2"/>',
        f'<line x1="{left}" y1="{height-bottom}" x2="{width-right}" y2="{height-bottom}" stroke="#94a3b8" stroke-width="2"/>',
    ]

    for tick in range(6):
        value = max_value * tick / 5
        y = height - bottom - chart_height * tick / 5
        parts.append(f'<line x1="{left}" y1="{y}" x2="{width-right}" y2="{y}" stroke="#e2e8f0" stroke-width="1"/>')
        parts.append(f'<text x="{left-12}" y="{y+4}" text-anchor="end" font-family="Segoe UI, Arial" font-size="12" fill="#64748b">{value:.0f}</text>')

    for cat_index, category in enumerate(categories):
        base_x = left + cat_index * group_width + 20
        for series_index, (_, color, values) in enumerate(series):
            value = values[cat_index]
            height_px = 0 if max_value == 0 else chart_height * value / max_value
            x = base_x + series_index * bar_width
            y = height - bottom - height_px
            parts.append(f'<rect x="{x}" y="{y}" width="{bar_width-8}" height="{height_px}" rx="8" fill="{color}"/>')
        parts.append(f'<text x="{base_x + (len(series)*bar_width)/2 - 6}" y="{height-bottom+26}" text-anchor="middle" font-family="Segoe UI, Arial" font-size="14" fill="#0f172a">{escape(category)}</text>')

    legend_x = width - 290
    legend_y = 60
    for index, (label, color, _) in enumerate(series):
        y = legend_y + index * 24
        parts.append(f'<rect x="{legend_x}" y="{y-10}" width="16" height="16" rx="3" fill="{color}"/>')
        parts.append(f'<text x="{legend_x + 24}" y="{y+3}" font-family="Segoe UI, Arial" font-size="13" fill="#1e293b">{escape(label)}</text>')

    parts.append("</svg>")
    return "\n".join(parts)


def build_report(cloud_latency: dict[str, dict[str, float]]) -> str:
    language_rows = "\n".join(
        f"| {p['name']} | {p['language_count']} | {p['usability_score']} | {p['optimization_support_score']} |"
        for p in PLATFORMS
    )

    feature_rows = "\n".join(
        f"| {p['name']} | {p['debugger']} | {p['stdin']} | {p['sharing']} | {p['collaboration']} | {p['api_embed']} | {p['multi_file']} | {p['version_selection']} | {p['mobile']} |"
        for p in PLATFORMS
    )

    platform_notes = "\n".join(
        f"- **{p['name']}**: {p['positioning']}"
        for p in PLATFORMS
    )

    source_rows = "\n".join(
        f"| {p['name']} | {p['source']} |"
        for p in PLATFORMS
    )

    return f"""# Online Compiler Comparison Report

## Scope

This report compares **Cloud Compiler** with **Programiz**, **OnlineGDB**, **JDoodle**, **OneCompiler**, and **Ideone**.

The report is intentionally split into two evidence types:

- **Measured results**: real benchmark data for Cloud Compiler versus the locally available native toolchains on this machine.
- **Documented platform comparison**: feature-based comparison of Programiz and other online compilers using their official product pages and documentation.

This separation matters because external browser platforms were not benchmarked through an automated speed test in this workspace, so any direct runtime-speed claim about Programmiz, JDoodle, Ideone, or similar services would be weaker than the measured Cloud Compiler data.

## Method

### Measured optimization data

- Source: local benchmark run already generated in `reporting/compiler_comparison_results.json`
- Languages measured: Python, C, C++
- Modes measured: native local, Cloud Compiler sync, Cloud Compiler async

### Documented comparison data

The external platforms were scored on:

- **Usability score (0-10)**: setup simplicity, sharing, input/output flow, collaboration, and accessibility
- **Optimization-support score (0-10)**: debugger depth, version selection, multi-file support, API/embed options, and advanced execution controls

These are **feature-support scores**, not raw runtime-speed measurements.

## Graphs

### Graph 1: Supported Language Count

![Supported Language Count](graphs/platform_language_count.svg)

### Graph 2: Usability Score

![Usability Score](graphs/platform_usability_score.svg)

### Graph 3: Optimization-Support Score

![Optimization Support Score](graphs/platform_optimization_support_score.svg)

### Graph 4: Cloud Compiler Measured Average Latency

![Cloud Compiler Latency](graphs/cloud_compiler_latency.svg)

## Platform Summary Table

| Platform | Supported languages | Usability score | Optimization-support score |
| --- | --- | --- | --- |
{language_rows}

## Feature Comparison

| Platform | Debugger | Stdin | Sharing | Collaboration | API / Embed | Multi-file | Version selection | Mobile / Anywhere |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
{feature_rows}

## What the Graphs Show

### Programmiz versus other online compilers

- **Programiz** is easy to use and share, which makes it good for quick learning tasks and short examples.
- Compared with **OnlineGDB**, **JDoodle**, and **OneCompiler**, Programiz exposes fewer advanced workflow features from the examined product pages.
- Programiz appears weaker than **OnlineGDB** for debugging, weaker than **JDoodle** for configurable IDE workflows and APIs, and weaker than **OneCompiler** for organizations, embedded editors, and team use.
- Against **Ideone**, Programiz looks more learning-oriented, while Ideone looks more like a remote execution service with API/widget roots and time-limit controls.

### Where Cloud Compiler stands

- **Cloud Compiler** is much narrower in language coverage than Programiz and the larger commercial platforms.
- Its strongest differentiators are the combination of **browser execution**, **Docker isolation**, **sync plus async execution**, and **built-in worker/queue/system metrics**.
- In measured latency, Cloud Compiler is slower than native execution, especially in async mode.
- In managed usability, Cloud Compiler compares surprisingly well because it bundles stdin, output history, import/export, complexity analysis, and admin observability in one project.

## Cross-Platform Takeaways

{platform_notes}

## Measured Cloud Compiler Performance Snapshot

| Language | Native avg (ms) | Cloud sync avg (ms) | Cloud async avg (ms) |
| --- | --- | --- | --- |
| Python | {cloud_latency['python']['native']} | {cloud_latency['python']['cloud_sync']} | {cloud_latency['python']['cloud_async']} |
| C | {cloud_latency['c']['native']} | {cloud_latency['c']['cloud_sync']} | {cloud_latency['c']['cloud_async']} |
| C++ | {cloud_latency['cpp']['native']} | {cloud_latency['cpp']['cloud_sync']} | {cloud_latency['cpp']['cloud_async']} |

## Final Interpretation

- If the priority is **fast local execution**, native compilers remain the best baseline.
- If the priority is **simple browser use for beginners**, Programiz is attractive because of its low-friction interface.
- If the priority is **debugging and classroom use**, OnlineGDB is stronger than Programiz.
- If the priority is **enterprise-grade integrations, collaboration, multi-file projects, APIs, and configurable versions**, JDoodle is the strongest documented platform in this comparison.
- If the priority is **broad browser-based coding with APIs and team workflows**, OneCompiler is also very strong.
- **Cloud Compiler** is best positioned as a custom, observable, Docker-isolated educational or institutional platform rather than as the fastest compiler service in this group.

## Recommendations for Your Project

1. Add multi-file project support if you want to compete more directly with JDoodle, OneCompiler, and OnlineGDB.
2. Add structured async telemetry and queue wait graphs so your observability advantage becomes more visible.
3. Add compiler version selection and advanced run flags for C, C++, Java, and Python.
4. Add sharing or saved project links to compete better with Programiz and Ideone.
5. Add debugger-oriented tooling or richer error grouping if debugging experience is part of your evaluation.
6. Keep using measured benchmark graphs for your own platform, but describe external platforms using documented features unless you can run controlled benchmarks against them fairly.

## Sources

| Platform | Source |
| --- | --- |
{source_rows}

Local benchmark source:

- `reporting/compiler_comparison_results.json`
- `reporting/Compiler_Comparison_Final_Report.md`
"""


def main() -> None:
    GRAPHS_DIR.mkdir(parents=True, exist_ok=True)
    cloud_latency = load_cloud_latency()

    write_svg(
        GRAPHS_DIR / "platform_language_count.svg",
        simple_bar_chart_svg(
            "Supported Language Count Across Platforms",
            [(p["name"], p["language_count"]) for p in PLATFORMS],
            "#2563eb",
            110,
            "Approximate supported language count from official product pages",
        ),
    )

    write_svg(
        GRAPHS_DIR / "platform_usability_score.svg",
        simple_bar_chart_svg(
            "Usability Score (0-10)",
            [(p["name"], p["usability_score"]) for p in PLATFORMS],
            "#16a34a",
            10,
            "Feature-based usability score from documented product capabilities",
        ),
    )

    write_svg(
        GRAPHS_DIR / "platform_optimization_support_score.svg",
        simple_bar_chart_svg(
            "Optimization-Support Score (0-10)",
            [(p["name"], p["optimization_support_score"]) for p in PLATFORMS],
            "#ea580c",
            10,
            "Feature-based score for debugger depth, versions, APIs, multi-file support, and run controls",
        ),
    )

    write_svg(
        GRAPHS_DIR / "cloud_compiler_latency.svg",
        grouped_bar_chart_svg(
            "Cloud Compiler Measured Average Latency",
            ["Python", "C", "C++"],
            [
                ("Native local", "#1d4ed8", [cloud_latency["python"]["native"], cloud_latency["c"]["native"], cloud_latency["cpp"]["native"]]),
                ("Cloud sync", "#059669", [cloud_latency["python"]["cloud_sync"], cloud_latency["c"]["cloud_sync"], cloud_latency["cpp"]["cloud_sync"]]),
                ("Cloud async", "#dc2626", [cloud_latency["python"]["cloud_async"], cloud_latency["c"]["cloud_async"], cloud_latency["cpp"]["cloud_async"]]),
            ],
            max(
                cloud_latency["python"]["cloud_async"],
                cloud_latency["c"]["cloud_async"],
                cloud_latency["cpp"]["cloud_async"],
            )
            * 1.15,
            "Average latency (ms)",
        ),
    )

    OUTPUT_MD.write_text(build_report(cloud_latency), encoding="utf-8")
    print(f"Generated report: {OUTPUT_MD}")
    print(f"Generated graphs in: {GRAPHS_DIR}")


if __name__ == "__main__":
    main()
