from __future__ import annotations

from pathlib import Path
from textwrap import dedent
import time

import win32com.client as win32


ROOT = Path(__file__).resolve().parent
OUTPUT_DOCX = ROOT / "Cloud_Compiler_Project_Report.docx"
OUTPUT_MD = ROOT / "Cloud_Compiler_Project_Report.md"


PROJECT = {
    "project_title": "CLOUD COMPILER: A DISTRIBUTED WEB-BASED CODE EXECUTION AND ANALYSIS PLATFORM",
    "student_name": "[Your Name]",
    "register_number": "[Register Number]",
    "guide_name": "[Guide Name]",
    "guide_designation": "[Guide Designation]",
    "degree": "BACHELOR OF TECHNOLOGY",
    "branch": "COMPUTER SCIENCE AND ENGINEERING",
    "department": "DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING",
    "institution": "[Institution Name]",
    "campus": "[Campus / City]",
    "month_year": "MARCH 2026",
    "place": "[Place]",
    "project_code": "PROJECT REPORT",
}


TABLE_TITLES = [
    "Table 1: Summary of Literature Insights",
    "Table 2: Comparative Study of Existing Execution Approaches",
    "Table 3: Functional Requirements and Design Mapping",
    "Table 4: Test Environment",
    "Table 5: Performance Metrics Used for Evaluation",
    "Table 6: Component Implementation Details",
    "Table 7: Technology Stack of the Project",
    "Table 8: Build and Static Verification Results",
    "Table 9: Functional Validation Matrix",
    "Table 10: Future Enhancement Roadmap",
]

FIGURE_TITLES = [
    "Figure 1: High-Level Cloud Compiler Architecture",
    "Figure 2: Asynchronous Execution Sequence Flow",
    "Figure 3: Authentication and Protected Route Flow",
    "Figure 4: Workspace Interaction Model",
    "Figure 5: Monitoring and Visualization Pipeline",
    "Figure 6: End-to-End Execution Lifecycle",
]

ABBREVIATIONS = [
    ("API", "Application Programming Interface"),
    ("ASGI", "Asynchronous Server Gateway Interface"),
    ("CPU", "Central Processing Unit"),
    ("CORS", "Cross-Origin Resource Sharing"),
    ("IDE", "Integrated Development Environment"),
    ("JSON", "JavaScript Object Notation"),
    ("JWT", "JSON Web Token"),
    ("RBAC", "Role-Based Access Control"),
    ("REST", "Representational State Transfer"),
    ("UI", "User Interface"),
    ("UX", "User Experience"),
    ("URL", "Uniform Resource Locator"),
]

REFERENCES = [
    "[1] FastAPI. \"OAuth2 with Password (and hashing), Bearer with JWT tokens.\" Available: https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/",
    "[2] Docker Documentation. \"Resource constraints.\" Available: https://docs.docker.com/engine/containers/resource_constraints/",
    "[3] Redis Documentation. \"BRPOP.\" Available: https://redis.io/docs/latest/commands/brpop/",
    "[4] Kubernetes Documentation. \"Deployments.\" Available: https://kubernetes.io/docs/concepts/workloads/controllers/deployment/",
    "[5] Kubernetes Documentation. \"Horizontal Pod Autoscaling.\" Available: https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/",
    "[6] React Documentation. \"Learn React.\" Available: https://react.dev/learn",
    "[7] Vite Documentation. \"Getting Started.\" Available: https://vite.dev/guide/",
    "[8] Monaco Editor API Documentation. Available: https://microsoft.github.io/monaco-editor/typedoc/",
    "[9] M. Jones, J. Bradley, and N. Sakimura, \"JSON Web Token (JWT),\" RFC 7519, May 2015. Available: https://datatracker.ietf.org/doc/html/rfc7519",
    "[10] J. Peterson, T. Fraser, M. Abu-Ghazaleh, and A. Pinkston, \"A Flexible Containment Mechanism for Executing Untrusted Code,\" 11th USENIX Security Symposium, 2002. Available: https://www.usenix.org/conference/11th-usenix-security-symposium/flexible-containment-mechanism-executing-untrusted-code",
    "[11] PostgreSQL Global Development Group. \"PostgreSQL Documentation.\" Available: https://www.postgresql.org/docs/current/",
    "[12] SQLAlchemy Documentation. Available: https://docs.sqlalchemy.org/",
]


WD_PAGE_BREAK = 7
WD_ALIGN_LEFT = 0
WD_ALIGN_CENTER = 1
WD_ALIGN_RIGHT = 2
WD_ALIGN_JUSTIFY = 3
WD_LINE_SPACE_SINGLE = 0
WD_LINE_SPACE_ONE_POINT_FIVE = 1
WD_STORY = 6
WD_COLLAPSE_END = 0
WD_PAPER_A4 = 7
WD_FORMAT_DOCUMENT_DEFAULT = 16
WD_HEADER_FOOTER_PRIMARY = 1
WD_STATISTIC_PAGES = 2


def clean(text: str) -> str:
    return " ".join(dedent(text).strip().split())


def cm_to_points(value_cm: float) -> float:
    return value_cm * 28.3464567


class ReportWriter:
    def __init__(self, output_docx: Path, output_md: Path):
        self.output_docx = output_docx
        self.output_md = output_md
        self.markdown: list[str] = []

        self.word = win32.DispatchEx("Word.Application")
        self.word.Visible = False
        self.word.DisplayAlerts = 0
        self.doc = self.word.Documents.Add()
        self.selection = self.word.Selection

        self._configure_document()

    def _configure_document(self) -> None:
        setup = self._retry(lambda: self.doc.PageSetup)
        setup.PaperSize = WD_PAPER_A4
        setup.TopMargin = cm_to_points(2.54)
        setup.BottomMargin = cm_to_points(2.54)
        setup.LeftMargin = cm_to_points(3.0)
        setup.RightMargin = cm_to_points(2.54)

        normal = self._retry(lambda: self.doc.Styles("Normal"))
        normal.Font.Name = "Times New Roman"
        normal.Font.Size = 12
        normal.ParagraphFormat.Alignment = WD_ALIGN_JUSTIFY
        normal.ParagraphFormat.LineSpacingRule = WD_LINE_SPACE_ONE_POINT_FIVE
        normal.ParagraphFormat.SpaceAfter = 6
        normal.ParagraphFormat.SpaceBefore = 0

        heading1 = self._retry(lambda: self.doc.Styles("Heading 1"))
        heading1.Font.Name = "Times New Roman"
        heading1.Font.Size = 16
        heading1.Font.Bold = True
        heading1.ParagraphFormat.Alignment = WD_ALIGN_CENTER
        heading1.ParagraphFormat.SpaceBefore = 12
        heading1.ParagraphFormat.SpaceAfter = 6

        heading2 = self._retry(lambda: self.doc.Styles("Heading 2"))
        heading2.Font.Name = "Times New Roman"
        heading2.Font.Size = 14
        heading2.Font.Bold = True
        heading2.ParagraphFormat.Alignment = WD_ALIGN_LEFT
        heading2.ParagraphFormat.SpaceBefore = 12
        heading2.ParagraphFormat.SpaceAfter = 6

        heading3 = self._retry(lambda: self.doc.Styles("Heading 3"))
        heading3.Font.Name = "Times New Roman"
        heading3.Font.Size = 12
        heading3.Font.Bold = True
        heading3.ParagraphFormat.Alignment = WD_ALIGN_LEFT
        heading3.ParagraphFormat.SpaceBefore = 8
        heading3.ParagraphFormat.SpaceAfter = 4

        title = self._retry(lambda: self.doc.Styles("Title"))
        title.Font.Name = "Times New Roman"
        title.Font.Size = 20
        title.Font.Bold = True
        title.ParagraphFormat.Alignment = WD_ALIGN_CENTER

    def _retry(self, func, attempts: int = 10, delay: float = 0.5):
        last_exc = None
        for _ in range(attempts):
            try:
                return func()
            except Exception as exc:
                last_exc = exc
                time.sleep(delay)
        raise last_exc

    def _set_style(self, style: str, alignment: int) -> None:
        self.selection.Style = self.doc.Styles(style)
        self.selection.ParagraphFormat.Alignment = alignment

    def add_blank(self) -> None:
        self.selection.TypeParagraph()
        self.markdown.append("")

    def add_page_break(self) -> None:
        self.selection.InsertBreak(WD_PAGE_BREAK)
        self.markdown.append("\n---\n")

    def heading(self, level: int, text: str, center: bool = False) -> None:
        style = {1: "Heading 1", 2: "Heading 2", 3: "Heading 3"}.get(level, "Normal")
        align = WD_ALIGN_CENTER if center else WD_ALIGN_LEFT
        self._set_style(style, align)
        self.selection.Font.Bold = True
        self.selection.TypeText(text)
        self.selection.TypeParagraph()
        self.selection.Font.Bold = False
        self.markdown.append(f'{"#" * level} {text}')
        self.markdown.append("")

    def paragraph(self, text: str, center: bool = False, bold: bool = False, italic: bool = False) -> None:
        self._set_style("Normal", WD_ALIGN_CENTER if center else WD_ALIGN_JUSTIFY)
        self.selection.Font.Bold = bold
        self.selection.Font.Italic = italic
        self.selection.TypeText(clean(text))
        self.selection.TypeParagraph()
        self.selection.Font.Bold = False
        self.selection.Font.Italic = False
        self.markdown.append(clean(text))
        self.markdown.append("")

    def line(self, text: str, center: bool = False, bold: bool = False) -> None:
        self._set_style("Normal", WD_ALIGN_CENTER if center else WD_ALIGN_LEFT)
        self.selection.Font.Bold = bold
        self.selection.TypeText(text)
        self.selection.TypeParagraph()
        self.selection.Font.Bold = False
        self.markdown.append(text)
        self.markdown.append("")

    def bullets(self, items: list[str]) -> None:
        for item in items:
            self._set_style("Normal", WD_ALIGN_JUSTIFY)
            self.selection.TypeText(f"- {clean(item)}")
            self.selection.TypeParagraph()
            self.markdown.append(f"- {clean(item)}")
        self.markdown.append("")

    def numbered(self, items: list[str]) -> None:
        for idx, item in enumerate(items, start=1):
            self._set_style("Normal", WD_ALIGN_JUSTIFY)
            self.selection.TypeText(f"{idx}. {clean(item)}")
            self.selection.TypeParagraph()
            self.markdown.append(f"{idx}. {clean(item)}")
        self.markdown.append("")

    def simple_list(self, items: list[str]) -> None:
        for item in items:
            self._set_style("Normal", WD_ALIGN_LEFT)
            self.selection.TypeText(item)
            self.selection.TypeParagraph()
            self.markdown.append(item)
        self.markdown.append("")

    def table(self, title: str, headers: list[str], rows: list[list[str]], note: str | None = None) -> None:
        self.line(title, center=True, bold=True)
        table = self.doc.Tables.Add(self.selection.Range, len(rows) + 1, len(headers))
        table.Style = "Table Grid"
        table.Rows.Alignment = WD_ALIGN_CENTER

        for col, header in enumerate(headers, start=1):
            table.Cell(1, col).Range.Text = header
            table.Cell(1, col).Range.Bold = True

        for row_idx, row in enumerate(rows, start=2):
            for col_idx, value in enumerate(row, start=1):
                table.Cell(row_idx, col_idx).Range.Text = value

        self.selection.SetRange(table.Range.End, table.Range.End)
        self.selection.TypeParagraph()

        self.markdown.append(f"**{title}**")
        self.markdown.append("")
        self.markdown.append("| " + " | ".join(headers) + " |")
        self.markdown.append("| " + " | ".join(["---"] * len(headers)) + " |")
        for row in rows:
            self.markdown.append("| " + " | ".join(row) + " |")
        self.markdown.append("")

        if note:
            self.paragraph(note, italic=True)

    def figure(self, title: str, art: str, note: str | None = None) -> None:
        self.line(title, center=True, bold=True)
        figure_table = self.doc.Tables.Add(self.selection.Range, 1, 1)
        figure_table.Style = "Table Grid"
        rng = figure_table.Cell(1, 1).Range
        rng.Text = dedent(art).strip()
        rng.Font.Name = "Consolas"
        rng.Font.Size = 9
        self.selection.SetRange(figure_table.Range.End, figure_table.Range.End)
        self.selection.TypeParagraph()

        self.markdown.append(f"**{title}**")
        self.markdown.append("")
        self.markdown.append("```text")
        self.markdown.extend(dedent(art).strip().splitlines())
        self.markdown.append("```")
        self.markdown.append("")

        if note:
            self.paragraph(note, italic=True)

    def code(self, title: str, snippet: str) -> None:
        self.line(title, bold=True)
        code_table = self.doc.Tables.Add(self.selection.Range, 1, 1)
        code_table.Style = "Table Grid"
        rng = code_table.Cell(1, 1).Range
        rng.Text = dedent(snippet).strip()
        rng.Font.Name = "Consolas"
        rng.Font.Size = 9
        self.selection.SetRange(code_table.Range.End, code_table.Range.End)
        self.selection.TypeParagraph()

        self.markdown.append(f"**{title}**")
        self.markdown.append("")
        self.markdown.append("```python")
        self.markdown.extend(dedent(snippet).strip().splitlines())
        self.markdown.append("```")
        self.markdown.append("")

    def add_toc_placeholder(self) -> None:
        self.heading(2, "TABLE OF CONTENTS", center=True)
        toc = self.doc.TablesOfContents.Add(
            Range=self.selection.Range,
            RightAlignPageNumbers=True,
            UseHeadingStyles=True,
            UpperHeadingLevel=1,
            LowerHeadingLevel=3,
        )
        self.selection.SetRange(toc.Range.End, toc.Range.End)
        self.selection.TypeParagraph()
        self.markdown.append("_Generated automatically in the Word document._")
        self.markdown.append("")

    def add_page_numbers(self) -> None:
        for section in self.doc.Sections:
            footer = section.Footers(WD_HEADER_FOOTER_PRIMARY)
            footer.PageNumbers.Add()

    def finalize(self) -> int:
        for toc in self.doc.TablesOfContents:
            toc.Update()
        self.add_page_numbers()
        self.doc.SaveAs(str(self.output_docx), FileFormat=WD_FORMAT_DOCUMENT_DEFAULT)
        self.output_md.write_text("\n".join(self.markdown), encoding="utf-8")
        page_count = int(self.doc.ComputeStatistics(WD_STATISTIC_PAGES))
        self.doc.Close(False)
        self.word.Quit()
        return page_count


def add_cover_page(w: ReportWriter) -> None:
    w.line(PROJECT["project_code"], center=True, bold=True)
    w.add_blank()
    w.heading(1, PROJECT["project_title"], center=True)
    w.add_blank()
    w.line("A PROJECT REPORT", center=True, bold=True)
    w.add_blank()
    w.line("Submitted by", center=True)
    w.line(f'{PROJECT["student_name"]}  [{PROJECT["register_number"]}]', center=True, bold=True)
    w.add_blank()
    w.line("Under the guidance of", center=True)
    w.line(PROJECT["guide_name"], center=True, bold=True)
    w.line(PROJECT["guide_designation"], center=True)
    w.add_blank()
    w.line("in partial fulfillment of the requirements for the degree of", center=True)
    w.line(PROJECT["degree"], center=True, bold=True)
    w.line("in", center=True)
    w.line(PROJECT["branch"], center=True, bold=True)
    w.add_blank()
    w.line(PROJECT["department"], center=True, bold=True)
    w.line(PROJECT["institution"], center=True, bold=True)
    w.line(PROJECT["campus"], center=True)
    w.add_blank()
    w.line(PROJECT["month_year"], center=True, bold=True)


def add_declaration(w: ReportWriter) -> None:
    w.heading(2, "DECLARATION", center=True)
    w.paragraph(
        """
        I hereby declare that the project report entitled "Cloud Compiler: A Distributed Web-Based
        Code Execution and Analysis Platform" submitted in partial fulfillment of the requirements
        for the award of the degree stated on the title page is my original work. The report has
        been prepared from the design, implementation, and analysis of the software system present
        in the Cloud Compiler project workspace. The work described here has not been submitted, in
        whole or in part, to any other university or institution for the award of any degree,
        diploma, or similar academic recognition.
        """
    )
    w.line(f'Place: {PROJECT["place"]}')
    w.line(f'Date: {PROJECT["month_year"]}')
    w.add_blank()
    w.line(f'{PROJECT["student_name"]}  [{PROJECT["register_number"]}]', bold=True)


def add_certificate(w: ReportWriter) -> None:
    w.heading(2, "BONAFIDE CERTIFICATE", center=True)
    w.paragraph(
        """
        Certified that this project report titled "Cloud Compiler: A Distributed Web-Based Code
        Execution and Analysis Platform" is the bonafide work of the student named on the title
        page, who carried out the project work under my supervision. To the best of my knowledge,
        the work reported herein does not form part of any other project report or dissertation on
        the basis of which a degree or award was conferred earlier on this or any other candidate.
        """
    )
    w.add_blank()
    w.line(f'Guide: {PROJECT["guide_name"]}', bold=True)
    w.line(PROJECT["guide_designation"])
    w.add_blank()
    w.line("Head of Department: [Name and Signature]", bold=True)


def add_acknowledgement(w: ReportWriter) -> None:
    w.heading(2, "ACKNOWLEDGEMENTS", center=True)
    w.paragraph(
        """
        The completion of this project report and the underlying Cloud Compiler system has been the
        result of sustained academic support, technical guidance, and personal encouragement. I wish
        to express my sincere gratitude to the management and faculty of the institution for
        providing the facilities, laboratory access, and academic environment required to develop a
        full-stack software system of this scale.
        """
    )
    w.paragraph(
        """
        I extend my heartfelt thanks to my project guide for offering direction at each major stage
        of the work, from problem selection and requirements framing to architecture review and
        implementation refinement. The suggestions on system modularity, security, and project
        presentation substantially improved both the software and this report.
        """
    )
    w.paragraph(
        """
        I also acknowledge the value of the open-source ecosystem on which this project is built.
        Frameworks such as React, Vite, FastAPI, Redis, Docker, and PostgreSQL made it possible to
        explore modern software engineering ideas in a practical way. Finally, I thank my family,
        friends, and classmates for their encouragement and patience throughout the development,
        verification, and documentation phases of this project.
        """
    )


def add_abstract(w: ReportWriter) -> None:
    w.heading(2, "ABSTRACT", center=True)
    w.paragraph(
        """
        Cloud Compiler is a distributed web platform that allows users to write code in the browser,
        choose a programming language, provide input, and obtain execution results without requiring
        a local compiler toolchain. The system combines a React and TypeScript frontend, a FastAPI
        backend, Redis-based asynchronous job handling, a Python worker service, Docker-based
        sandboxed execution, PostgreSQL-backed authentication, and monitoring endpoints for runtime
        visibility. The goal of the project is to transform code execution from a local,
        machine-specific activity into a managed service that is accessible, observable, and safer
        to operate.
        """
    )


def add_preliminary_sections(w: ReportWriter) -> None:
    w.add_page_break()
    add_declaration(w)
    w.add_page_break()
    add_certificate(w)
    w.add_page_break()
    add_acknowledgement(w)
    w.add_page_break()
    add_abstract(w)
    w.add_page_break()
    w.add_toc_placeholder()
    w.add_page_break()
    w.heading(2, "LIST OF TABLES", center=True)
    w.simple_list(TABLE_TITLES)
    w.heading(2, "LIST OF FIGURES", center=True)
    w.simple_list(FIGURE_TITLES)
    w.heading(2, "ABBREVIATIONS", center=True)
    w.table(
        "Abbreviations Used in the Report",
        ["Abbreviation", "Expansion"],
        [[abbr, meaning] for abbr, meaning in ABBREVIATIONS],
    )


def chapter_one(w: ReportWriter) -> None:
    w.add_page_break()
    w.heading(1, "CHAPTER 1", center=True)
    w.heading(2, "INTRODUCTION")
    w.heading(3, "INTRODUCTION")
    w.paragraph(
        """
        The modern software development workflow increasingly depends on tools that can be accessed
        from anywhere, on any operating system, with minimal setup overhead. In classrooms,
        laboratories, coding assessments, and lightweight prototyping environments, local
        installation problems still act as a barrier: students may lack compatible compilers,
        different machines may produce different behaviors, and faculty or administrators may find
        it difficult to standardize the execution environment across a batch of users. Cloud
        Compiler addresses this problem by presenting programming as a web service rather than as a
        locally provisioned toolchain.
        """
    )
    w.paragraph(
        """
        The project provides a browser-first interface where users can authenticate, write programs,
        supply standard input, run code, inspect output, export files, and review execution history.
        Behind this user-facing simplicity lies a distributed execution workflow. The frontend is
        responsible for interaction quality, but the backend and worker services coordinate
        execution, isolate untrusted code within Docker containers, and expose metrics that make the
        system transparent to administrators. This combination is valuable because a cloud compiler
        is not merely an editor with a run button; it is an operational platform that must balance
        usability, responsiveness, and risk containment.
        """
    )
    w.paragraph(
        """
        Another important aspect of the project is the separation between immediate execution and
        queued execution. The synchronous path supports quick feedback and helps in local or
        low-volume use cases. The asynchronous path, backed by Redis and a dedicated worker, makes
        it possible to absorb spikes in demand and preserve API responsiveness. The design therefore
        mirrors patterns used in production systems, where latency-sensitive interfaces delegate
        expensive processing to background workers. This makes the project relevant not only as a
        student application but also as a compact demonstration of modern service-oriented system
        design.
        """
    )
    w.heading(3, "PROBLEM STATEMENT")
    w.paragraph(
        """
        Existing code execution workflows in academic and small-team environments often suffer from
        one or more of the following limitations: heavy local setup requirements, inconsistent
        compiler versions, lack of sandboxing for untrusted code, poor visibility into queued work,
        and insufficient support for operational monitoring. Traditional local IDEs solve the coding
        problem but not the administration problem; online editors may offer convenience but do not
        always expose execution transparency, role-aware access control, or clear extensibility
        toward scaling. There is therefore a need for a platform that unifies browser-based coding,
        isolated multi-language execution, input and output handling, authentication, and runtime
        observability in a single manageable system.
        """
    )
    w.heading(3, "OBJECTIVE")
    w.paragraph(
        """
        The main objective of the Cloud Compiler project is to build a reliable, web-accessible, and
        modular platform that allows users to compile and execute code remotely while preserving
        isolation, responsiveness, and administrative visibility. The project seeks to demonstrate
        that a compact distributed architecture can provide a meaningful alternative to local
        execution for learning, testing, and lightweight development workflows.
        """
    )
    w.heading(3, "SPECIFIC OBJECTIVES")
    w.bullets(
        [
            "To design a responsive browser-based workspace using React, TypeScript, and the Monaco editor for multi-language code authoring.",
            "To implement secure user registration and login using PostgreSQL-backed user data, password hashing, and JWT-based session tokens.",
            "To support Python, C, C++, and Java execution through Docker containers with CPU, memory, process, and network restrictions.",
            "To provide both synchronous and asynchronous execution pathways so that the interface remains usable under different load conditions.",
            "To maintain a Redis-backed worker registry and job history that can be exposed through metrics and visualization endpoints.",
            "To add practical utility features such as file import, text export, PDF export, stdin handling, and static complexity estimation.",
            "To establish an architecture that can be scaled later through worker orchestration and Kubernetes integration hooks.",
        ]
    )
    w.heading(3, "SCOPE")
    w.paragraph(
        """
        The current scope of the project includes the complete application flow required for a
        working cloud compilation platform: authentication, protected routes, a code editor,
        execution APIs, worker-side job consumption, result retrieval, monitoring endpoints, and an
        administrative dashboard. The project is intentionally designed as a full-stack application
        rather than a single demo endpoint, because a report-worthy compiler service must include
        both the user experience and the system operations perspective.
        """
    )
    w.paragraph(
        """
        The scope also covers selected non-functional requirements such as security boundaries,
        code text sanitization, execution timeout handling, and resource limits. At the same time,
        some production-grade capabilities remain outside the present implementation boundary. These
        include distributed result persistence across multiple database tables, advanced role
        management interfaces, language-specific static analysis beyond heuristic complexity
        estimation, and autoscaling logic fully wired to a live Kubernetes deployment. Those items
        are treated as future extensions rather than omitted concerns.
        """
    )
    w.heading(3, "INNOVATION")
    w.paragraph(
        """
        The innovation in this project lies in how several practical software engineering ideas are
        composed into one coherent system. The application does not stop at browser-based code
        editing; it pairs that interface with queue-aware execution, container isolation, runtime
        metrics, and visualization support. This gives the project a stronger systems dimension than
        a standard online compiler assignment.
        """
    )
    w.bullets(
        [
            "Dual execution model: the system offers immediate synchronous execution for fast feedback and a queued asynchronous path for scalable workloads.",
            "Operational visibility: active workers, queue depth, job outcomes, and host resource metrics are exposed through dedicated endpoints and UI dashboards.",
            "Input sanitation on both frontend and backend: hidden Unicode spacing and zero-width characters are normalized before execution, reducing copy-paste related runtime surprises.",
            "Built-in complexity estimation: the workspace includes a lightweight static analyzer that estimates time and space complexity for supported languages.",
            "Autoscaling readiness: the backend launches an autoscaler loop and includes Kubernetes deployment hooks, showing a clear path from local use to orchestrated execution pools.",
        ]
    )


def chapter_two(w: ReportWriter) -> None:
    w.add_page_break()
    w.heading(1, "CHAPTER 2", center=True)
    w.heading(2, "LITERATURE SURVEY")
    w.heading(3, "OVERVIEW")
    w.paragraph(
        """
        The design of a cloud compiler sits at the intersection of several technical domains: web
        user interfaces, browser-based code editing, API-centric backend services, secure execution
        of untrusted programs, asynchronous messaging, and operational monitoring. No single
        framework solves all of these concerns. A useful literature survey for this project
        therefore examines both existing execution models and the enabling technologies that make
        the final system practical. In that sense, the survey functions as a design review of
        available approaches rather than only a catalog of finished products.
        """
    )


def chapter_three(w: ReportWriter) -> None:
    w.add_page_break()
    w.heading(1, "CHAPTER 3", center=True)
    w.heading(2, "PROPOSED WORK")
    w.heading(3, "GENERAL INTRODUCTION TO CLOUD COMPILER")
    w.paragraph(
        """
        The proposed system is a layered cloud compilation platform composed of a browser-based user
        interface, an API service, a queue layer, an execution worker, and supporting data stores.
        The design goal is to allow users to submit source programs without worrying about local
        compiler installation, while ensuring that execution remains controlled and observable. The
        final application exposes a workspace for coding, a backend for request orchestration, and a
        worker process that translates queued jobs into isolated Docker executions.
        """
    )
    w.paragraph(
        """
        Development was approached incrementally. Authentication and routing formed the first layer
        because controlled access is essential even in academic environments. The second phase
        focused on the editor, execution endpoints, and Docker-based language runners. The third
        phase introduced background job submission, worker registration, metrics, and dashboards.
        The final phase refined usability through import and export features, output history, PDF
        generation, code text sanitization, and a static complexity analyzer. This progression kept
        the system testable at each stage and reduced integration risk.
        """
    )
    w.table(
        TABLE_TITLES[2],
        ["Requirement", "Implementation Decision", "Project Module"],
        [
            ["User authentication", "JWT-based login and protected routes", "auth_routes.py, auth_utils.py, AuthContext.tsx"],
            ["Write and edit code", "Monaco-based browser editor", "CodeEditor.tsx, Workspace.tsx"],
            ["Run code instantly", "Direct backend-to-Docker execution path", "execution_routes.py, docker_manager.py"],
            ["Run code asynchronously", "Redis queue and worker consumer", "queue_sender.py, worker.py"],
            ["Track system state", "Metrics and visualization routes", "metrics_collector.py, metrics_routes.py, visualization_routes.py"],
            ["Support multi-language use", "Language-specific runner mapping", "DockerManager.LANGUAGE_CONFIG, worker execute_code"],
            ["Preserve usability", "History, stdin, file import/export, PDF export", "Workspace.tsx, OutputPanel.tsx"],
        ],
    )
    w.heading(3, "DESIGN OF CLOUD COMPILER")
    w.paragraph(
        """
        At the design level, Cloud Compiler is organized into presentation, application, execution,
        data, and operations layers. The presentation layer is the React application. It manages
        routing, authentication state, editor interaction, and API invocation. The application layer
        is implemented through FastAPI, which receives requests, validates payloads, applies text
        sanitization, and chooses between synchronous and asynchronous execution paths. The execution
        layer is split between a direct Docker manager and a dedicated worker process for queued
        jobs. The data layer includes PostgreSQL for user accounts and Redis for jobs, results, and
        worker heartbeat information. The operations layer includes metrics, dashboards, and
        autoscaling hooks.
        """
    )
    w.figure(
        FIGURE_TITLES[0],
        """
        +--------------------+        +-------------------------+
        | Browser Client     | -----> | FastAPI Backend         |
        | React + Monaco UI  |        | Auth, Execute, Metrics  |
        +--------------------+        +-----------+-------------+
                                                  |
                               +------------------+------------------+
                               |                                     |
                               v                                     v
                    +--------------------+                +--------------------+
                    | DockerManager      |                | Redis Queue        |
                    | Sync execution     |                | Async job buffer   |
                    +---------+----------+                +---------+----------+
                              |                                     |
                              v                                     v
                    +--------------------+                +--------------------+
                    | Docker Containers  | <------------  | Worker Service     |
                    | Python/C/C++/Java  |                | Job consumer       |
                    +--------------------+                +---------+----------+
                                                                       |
                                                                       v
                                                          +--------------------+
                                                          | Redis Result Store |
                                                          | Worker Registry    |
                                                          +--------------------+
        """,
        "The architecture uses two execution paths so that quick runs and queue-backed runs can co-exist within one interface.",
    )
    w.heading(3, "EXPERIMENTAL STUDY")
    w.paragraph(
        """
        The evaluation approach for this project combines implementation verification, build
        validation, and workflow analysis. Because the full end-to-end system depends on Docker,
        Redis, and PostgreSQL services running together, the report distinguishes between static
        readiness and runtime deployment validation. Static readiness asks whether modules compile,
        routes are wired, assets build, and core algorithms behave as expected. Runtime deployment
        validation concerns how these verified modules behave when all external services are active.
        """
    )
    w.table(
        TABLE_TITLES[3],
        ["Item", "Configuration / Observation"],
        [
            ["Operating environment", "Windows workstation with PowerShell-based project workspace"],
            ["Backend runtime", "Python virtual environment with FastAPI-oriented dependencies"],
            ["Frontend runtime", "Node.js / Vite build pipeline with installed node_modules"],
            ["Queue / cache", "Redis expected on localhost:6379"],
            ["Execution isolation", "Docker Desktop and per-language runner images"],
            ["Persistence", "PostgreSQL configured through backend/database.py"],
            ["Verification commands", "Python compileall, Vite production build, targeted module checks"],
        ],
    )
    w.heading(3, "PERFORMANCE METRICS")
    w.table(
        TABLE_TITLES[4],
        ["Metric", "Meaning", "How it is used in this report"],
        [
            ["Build success", "Whether frontend assets compile for production", "Used to validate deployability of the client application"],
            ["Module compilation", "Whether backend and worker Python files parse correctly", "Used as static correctness evidence"],
            ["Execution pathway availability", "Whether sync and async paths are implemented end-to-end in code", "Used in the functional validation matrix"],
            ["Queue depth visibility", "Availability of queue length metrics", "Used to assess operational observability"],
            ["Worker visibility", "Availability of worker registry and status", "Used to assess distributed execution traceability"],
            ["Result availability", "Mechanism to retrieve completed output", "Used to confirm the async job lifecycle"],
            ["Bundle size warning", "Whether the frontend emits optimization warnings", "Used as an honest indicator of future performance work"],
        ],
    )


def chapter_four(w: ReportWriter) -> None:
    w.add_page_break()
    w.heading(1, "CHAPTER 4", center=True)
    w.heading(2, "SYSTEM ARCHITECTURE AND IMPLEMENTATION")
    w.heading(3, "OVERVIEW")
    w.paragraph(
        """
        The Cloud Compiler implementation is intentionally modular. Each major responsibility is
        assigned to a dedicated file or component set: authentication logic, execution routing,
        queue submission, worker-side execution, monitoring, visualization, frontend pages, and UI
        widgets. This structure makes the codebase readable and keeps the project extensible. The
        backend remains relatively thin at the API layer because complex work is delegated either to
        helper modules or to the worker process.
        """
    )
    w.heading(3, "SYSTEM ARCHITECTURE")
    w.figure(
        FIGURE_TITLES[1],
        """
        User -> Workspace UI -> POST /execute
                                 |
                                 v
                         Backend sanitizes code
                                 |
                                 v
                         Redis queue stores job
                                 |
                                 v
                       Worker BRPOP consumes job
                                 |
                                 v
                     Docker container executes code
                                 |
                                 v
                       Worker stores result in Redis
                                 |
                                 v
                       UI polls /execute/result/{id}
                                 |
                                 v
                         Output displayed to user
        """,
        "The asynchronous path keeps the request-response cycle lightweight while a worker handles execution in the background.",
    )
    w.paragraph(
        """
        The frontend uses React Router to separate login, registration, workspace, metrics, and
        dashboard views. Protected routes are enforced through the authentication context, which
        stores the JWT access token in local storage and adds it to subsequent API requests. The
        workspace page manages language selection, code, stdin, export naming, complexity results,
        output state, and local execution history. This gives the user a coherent workstation-like
        experience even though the actual code execution takes place remotely.
        """
    )
    w.paragraph(
        """
        The backend centers around FastAPI route groups. Authentication routes create and validate
        users. Execution routes expose complexity analysis, synchronous execution, asynchronous
        submission, result lookup, file import, and file export. Metrics routes expose queue, worker,
        system, and job summaries to authorized admins. Visualization routes aggregate system state
        into a dashboard-friendly response. The backend also starts an autoscaler thread during
        application lifespan startup, demonstrating the intended control loop for worker scaling.
        """
    )
    w.table(
        TABLE_TITLES[5],
        ["Component", "Implementation Detail", "Role in the System"],
        [
            ["Auth routes", "Register and login endpoints using SQLAlchemy session access", "Creates users and issues JWT tokens"],
            ["Auth utilities", "bcrypt hashing with SHA-256 pre-hash plus JWT creation", "Protects passwords and signs tokens"],
            ["Execution routes", "Sync, async, result, import/export, complexity endpoints", "Acts as the main orchestration layer"],
            ["Docker manager", "Temporary directory + docker run + timeouts", "Executes synchronous jobs in isolated containers"],
            ["Queue sender", "Redis LPUSH with generated job_id", "Moves async work out of the request thread"],
            ["Worker service", "BRPOP consumer with registry heartbeat updates", "Executes queued jobs and records results"],
            ["Metrics collector", "Reads Redis state and psutil host metrics", "Supports monitoring and admin views"],
            ["Visualization routes", "Aggregates recent executions and system summaries", "Feeds dashboard-style pages"],
        ],
    )
    w.heading(3, "AUTHENTICATION AND ACCESS CONTROL")
    w.figure(
        FIGURE_TITLES[2],
        """
        +-----------+     register/login     +----------------+
        | User UI   | ---------------------> | FastAPI Auth   |
        +-----------+                        +-------+--------+
                                                    |
                                                    v
                                           +------------------+
                                           | PostgreSQL users |
                                           +------------------+
                                                    |
                                  JWT token <-------+
                                                    |
                                                    v
                                           +------------------+
                                           | Protected routes |
                                           | Metrics / Dash   |
                                           +------------------+
        """,
        "Only authenticated users enter the workspace; admin-only routes add one more authorization layer using the role claim and database lookup.",
    )
    w.paragraph(
        """
        Password handling is implemented carefully. Before bcrypt hashing, the password is
        pre-hashed with SHA-256 so that bcrypt's 72-byte input limitation does not cause truncation
        issues. The verification path preserves backward compatibility for previously stored hashes.
        The JWT payload carries both the subject and role, allowing the backend to restrict metrics
        and dashboard endpoints through a dedicated require_admin dependency. Although the secret key
        is currently hardcoded and should be externalized for production, the overall authentication
        structure is sound for the current project stage.
        """
    )
    w.heading(3, "WORKSPACE IMPLEMENTATION")
    w.figure(
        FIGURE_TITLES[3],
        """
        +----------------------------- Workspace -----------------------------+
        | Language tabs | Import | Export | Export PDF | Analyze | Run       |
        +--------------------------------------------------------------------+
        | Monaco editor (code)                       | Stdin | Complexity    |
        |                                            |       | Output panel  |
        |                                            |       |               |
        +--------------------------------------------------------------------+
        | Execution history                                                   |
        +--------------------------------------------------------------------+
        """,
        "The workspace consolidates authoring, execution, analysis, and review into one interaction surface.",
    )
    w.paragraph(
        """
        The workspace is the most feature-rich page in the frontend. It coordinates language
        selection, code sanitization, async polling, sync execution, import and export operations,
        toasts, and history playback. Each major function is encapsulated in a dedicated component:
        CodeEditor for Monaco integration, OutputPanel for execution status and logs, StdinInput for
        user-provided input, and ExecutionHistory for quick recall of recent runs. This component
        decomposition keeps the page large in capability but manageable in structure.
        """
    )
    w.paragraph(
        """
        A notable usability feature is text sanitization on both frontend and backend. Hidden spaces,
        zero-width characters, and box glyphs are normalized before execution. This is a practical
        design choice because pasted code often contains invisible characters that cause frustrating
        runtime or syntax errors. By cleaning text on both sides, the system reduces the chance that
        a malformed clipboard event becomes a hard-to-diagnose bug for the user.
        """
    )
    w.heading(3, "MONITORING AND VISUALIZATION")
    w.figure(
        FIGURE_TITLES[4],
        """
        Queue metrics ----+
                         |
        Worker metrics --+--> /visualization/dashboard --> Dashboard page
                         |
        System metrics --+
                         |
        Recent jobs -----+
        """,
        "Monitoring data is aggregated server-side so the dashboard can render one coherent system view.",
    )
    w.paragraph(
        """
        The monitoring subsystem is intentionally simple but meaningful. Queue metrics expose current
        backlog. Worker metrics expose active workers and the jobs they are processing. System
        metrics expose host CPU and memory usage through psutil. Job metrics estimate completed and
        failed runs by scanning recent execution history. The dashboard route aggregates these into a
        single response that the frontend converts into cards, worker status lists, and charts. This
        design choice reduces client complexity and centralizes the monitoring contract.
        """
    )
    w.heading(3, "SYSTEM FLOW")
    w.numbered(
        [
            "A user logs in through the frontend and receives a JWT access token.",
            "The user opens the workspace, selects a language, enters code, and optionally provides stdin.",
            "Before submission, the frontend sanitizes the editor text and input text.",
            "For synchronous runs, the backend creates a temporary execution directory and invokes Docker directly.",
            "For asynchronous runs, the backend sanitizes the payload, generates a job ID, and pushes the job into the Redis queue.",
            "The worker process blocks on BRPOP, retrieves the job, updates its registry state, and maps the request to the correct runner image.",
            "The worker mounts the current working directory inside the container, executes the compile or run command, and captures stdout or stderr.",
            "The result is stored in Redis using the job ID as the lookup key, and the worker returns to idle state.",
            "The frontend polls the result endpoint, updates the output panel, and stores the execution snapshot in local history.",
            "Admins can inspect queue status, worker state, system load, and recent jobs through the metrics and dashboard pages.",
        ]
    )
    w.heading(3, "TECHNOLOGY STACK")
    w.table(
        TABLE_TITLES[6],
        ["Layer", "Technology", "Reason for Selection"],
        [
            ["Frontend", "React 18 + TypeScript + Vite", "Fast developer workflow, component model, typed client logic"],
            ["Editor", "Monaco Editor", "Rich browser-based code editing and syntax support"],
            ["Styling", "Tailwind-inspired utility styling + custom theme CSS", "Rapid UI composition with a distinct visual style"],
            ["Backend", "FastAPI", "Clear route definition, modern Python typing, simple dependency injection"],
            ["Authentication", "JWT + bcrypt + OAuth2-compatible flow", "Stateless access control with secure password hashing"],
            ["Queue / cache", "Redis", "Lightweight job buffering and result storage"],
            ["Worker", "Python worker service", "Simple integration with Redis and Docker SDK"],
            ["Isolation", "Docker", "Resource-limited multi-language execution environment"],
            ["Persistence", "PostgreSQL + SQLAlchemy", "Reliable relational storage for users and roles"],
            ["Operations", "psutil, dashboard routes, autoscaler hooks", "Runtime visibility and scale-readiness"],
        ],
    )
    w.heading(3, "END-TO-END EXECUTION LIFECYCLE")
    w.figure(
        FIGURE_TITLES[5],
        """
        Source code entered
                |
                v
        Validation + sanitization
                |
        +-------+--------+
        |                |
        v                v
        Sync route       Async route
        |                |
        v                v
        DockerManager    Redis queue
        |                |
        v                v
        Container run    Worker run
        |                |
        +-------+--------+
                |
                v
          Output / error
                |
                v
        UI display + history
        """,
        "Both execution paths converge on the same user-facing output model, preserving a consistent interface.",
    )


def chapter_five(w: ReportWriter) -> None:
    w.add_page_break()
    w.heading(1, "CHAPTER 5", center=True)
    w.heading(2, "RESULTS AND DISCUSSION")
    w.heading(3, "EXPERIMENTAL RESULT ANALYSIS")
    w.paragraph(
        """
        The results for this project should be interpreted in the context of a full-stack system
        whose behavior depends partly on local services such as Docker, Redis, and PostgreSQL. For
        that reason, the evaluation in this report prioritizes evidence that was directly observed in
        the current workspace and separates it from environment-dependent runtime outcomes. Static
        readiness checks confirm whether the codebase builds and whether important modules parse
        correctly. Functional analysis confirms whether the implementation pathways exist and are
        coherently wired. Together, these observations provide a credible picture of project
        maturity without claiming benchmark data that was not collected.
        """
    )
    w.table(
        TABLE_TITLES[7],
        ["Check", "Observed Result", "Interpretation"],
        [
            ["Python backend / worker compilation", "Successful through compileall", "Core Python modules are syntactically valid in the workspace"],
            ["Frontend production build", "Successful via Vite build", "Client application can be bundled for deployment"],
            ["Frontend bundle analysis", "Large JS chunk warning at 768.47 kB", "Application works, but code-splitting should be improved"],
            ["Complexity analyzer sample", "Returned O(n) time and O(1) space for a simple Python loop", "Static analysis endpoint is functionally active"],
            ["Auth, metrics, dashboard routes", "Present and connected through router configuration", "Administrative capabilities are integrated at the API level"],
        ],
        "The verification commands were executed in the project workspace on March 25, 2026.",
    )
    w.heading(3, "FUNCTIONAL PERFORMANCE")
    w.table(
        TABLE_TITLES[8],
        ["Feature", "Status", "Evidence / Discussion"],
        [
            ["User registration", "Implemented", "FastAPI route checks username uniqueness and stores user in PostgreSQL-backed model."],
            ["User login", "Implemented", "OAuth2 password flow issues bearer JWT tokens with role claim."],
            ["Protected workspace access", "Implemented", "React ProtectedRoute relies on stored access token."],
            ["Synchronous execution", "Implemented", "DockerManager runs language-specific commands inside temporary containerized workspaces."],
            ["Asynchronous execution", "Implemented", "Backend pushes jobs into Redis and worker consumes them with BRPOP."],
            ["Result polling", "Implemented", "Frontend polls result endpoint until job completion."],
            ["Complexity analysis", "Implemented and sampled", "Backend performs heuristic static complexity estimation for four languages."],
            ["File import and export", "Implemented", "Source code import, text export, and PDF export are available from the workspace."],
            ["Metrics dashboard", "Implemented", "Queue, worker, system, and job metrics feed dedicated monitoring pages."],
            ["Autoscaling extension point", "Partially integrated", "Autoscaler loop and Kubernetes scaling hook exist but require live infrastructure."],
        ],
    )
    w.paragraph(
        """
        The most visible strength of the system is the way user experience and operational design are
        tied together. The user receives a polished workspace with modern controls, but the backend
        simultaneously tracks worker health and queue depth. This is important because educational
        compiler platforms often focus exclusively on the front of the application and neglect the
        service behavior that becomes critical as more users submit jobs.
        """
    )
    w.paragraph(
        """
        The presence of both synchronous and asynchronous execution modes is another strong design
        result. Short programs benefit from immediate execution, whereas high-concurrency or
        slower-running programs benefit from queue decoupling. The implementation therefore scales in
        architectural sophistication without forcing the user to learn different workflows. On the
        same screen, the user simply chooses Run Sync or Run Async, while the system internally
        selects the appropriate path.
        """
    )
    w.paragraph(
        """
        The results also reveal improvement areas. The frontend build completed successfully, but
        Vite reported a JavaScript chunk larger than 500 kB after minification. This indicates that
        the UI, especially with Monaco and charting dependencies, would benefit from route-level or
        component-level code splitting. In addition, some backend configuration values such as the
        secret key and database URL are hardcoded. These choices are acceptable during development
        but should be externalized before deployment in a shared environment.
        """
    )
    w.heading(3, "OUTPUTS AND USER-FACING MODULES")
    w.bullets(
        [
            "Login and registration modules provide token-based access control with modern form design and validation feedback.",
            "The workspace offers language switching, code editing, input entry, output display, complexity reporting, and local execution history.",
            "The metrics page summarizes queue depth, worker count, job status distribution, CPU usage, and memory usage in chart form.",
            "The dashboard page aggregates distributed state into a visualization-oriented operational view for administrators.",
        ]
    )
    w.paragraph(
        """
        Overall, the results indicate that Cloud Compiler has moved beyond proof-of-concept status.
        The application compiles, the client builds, the route model is coherent, the execution
        paths are properly separated, and the project contains enough operational instrumentation to
        support discussion of scale and reliability. The remaining work is less about basic
        functionality and more about hardening, optimization, and deployment discipline.
        """
    )


def chapter_six(w: ReportWriter) -> None:
    w.add_page_break()
    w.heading(1, "CHAPTER 6", center=True)
    w.heading(2, "CONCLUSION AND FUTURE ENHANCEMENT")
    w.heading(3, "CONCLUSION")
    w.paragraph(
        """
        Cloud Compiler successfully demonstrates how a modern browser interface, a typed API layer, a
        background worker model, and container-based isolation can be composed into a single
        full-stack application. The project solves a practical problem: enabling users to write and
        execute programs without local toolchain setup while preserving a controlled execution
        environment. By supporting multiple languages, both sync and async execution, JWT-based
        authentication, file handling, complexity estimation, and administrative monitoring, the
        platform achieves a level of completeness that makes it suitable for academic demonstration
        and further extension.
        """
    )
    w.paragraph(
        """
        The project also illustrates an important lesson in software engineering: quality comes not
        only from user-facing features but also from system visibility and modularity. A compiler
        service becomes significantly more valuable when administrators can observe worker state,
        queue depth, job success, and host pressure. In that respect, Cloud Compiler is both an
        application and a compact study in distributed system design.
        """
    )
    w.heading(3, "FUTURE ENHANCEMENT")
    w.table(
        TABLE_TITLES[9],
        ["Improvement Area", "Recommended Enhancement", "Expected Benefit"],
        [
            ["Configuration management", "Move secrets, DB URLs, and Redis settings into environment variables", "Safer deployment and easier environment switching"],
            ["Frontend performance", "Add lazy loading and chunk splitting around heavy editor and chart modules", "Smaller initial bundle and faster page loads"],
            ["Persistent execution history", "Store structured job results in a database instead of only Redis output strings", "Long-term analytics and auditing"],
            ["Security hardening", "Add stronger sandbox policies, image scanning, and per-user quotas", "Better containment and abuse resistance"],
            ["Autoscaling completion", "Connect queue metrics to real deployment controllers", "Elastic execution capacity under burst traffic"],
            ["Language expansion", "Support additional runtimes such as JavaScript, Go, or Rust", "Wider applicability of the platform"],
            ["Testing discipline", "Add automated API, worker, and UI tests in CI", "Higher confidence during future changes"],
        ],
    )
    w.bullets(
        [
            "Introduce role-aware UI behavior so that admin-only pages are hidden or revealed based on decoded token claims.",
            "Improve output persistence by storing status, stderr, stdout, and execution time as separate fields.",
            "Expose queue wait time and average execution time for better operational analytics.",
            "Add user-level saved snippets or project files for a more IDE-like experience.",
            "Integrate health checks and deployment manifests for a smoother production rollout.",
        ]
    )


def references_and_appendices(w: ReportWriter) -> None:
    w.add_page_break()
    w.heading(2, "REFERENCES", center=True)
    w.simple_list(REFERENCES)

    w.add_page_break()
    w.heading(2, "APPENDIX I", center=True)
    w.heading(3, "A1. USER INTERFACE MODULES")
    w.table(
        "Appendix Table A1: User Interface Modules",
        ["Screen / Module", "Purpose", "Key Elements"],
        [
            ["Login", "Authenticate existing users", "Username or email field, password field, remember option, sign-in action"],
            ["Register", "Create new user accounts", "Username, email, password, confirmation, validation feedback"],
            ["Workspace", "Main coding environment", "Language selector, Monaco editor, stdin, output, history, import/export, analyze"],
            ["Metrics", "Admin monitoring view", "Queue depth, worker count, success rate, charts, system usage"],
            ["Dashboard", "Aggregated operational view", "System state cards, worker status list, recent executions"],
        ],
    )
    w.heading(3, "A2. API ENDPOINT SUMMARY")
    w.table(
        "Appendix Table A2: API Endpoint Summary",
        ["Method", "Endpoint", "Purpose", "Access"],
        [
            ["POST", "/auth/register", "Register a new user", "Public"],
            ["POST", "/auth/login", "Authenticate and issue JWT token", "Public"],
            ["GET", "/", "Health or greeting endpoint", "Public"],
            ["POST", "/execute", "Submit async execution job", "Authenticated user flow"],
            ["GET", "/execute/result/{job_id}", "Fetch async result", "Authenticated user flow"],
            ["POST", "/execute/sync", "Run immediate execution", "Authenticated user flow"],
            ["POST", "/complexity", "Estimate time and space complexity", "Authenticated user flow"],
            ["POST", "/import-file", "Upload and read source file contents", "Authenticated user flow"],
            ["POST", "/export-file", "Export source or PDF", "Authenticated user flow"],
            ["GET", "/metrics/*", "Queue, worker, system, and job metrics", "Admin only"],
            ["GET", "/visualization/dashboard", "Aggregated dashboard payload", "Admin only"],
        ],
    )

    w.add_page_break()
    w.heading(2, "APPENDIX II", center=True)
    w.heading(3, "A3. USER TABLE SCHEMA")
    w.table(
        "Appendix Table A3: User Schema",
        ["Column", "Type", "Description"],
        [
            ["id", "Integer", "Primary key for the user record"],
            ["username", "String", "Unique login identifier"],
            ["email", "String", "Unique email address"],
            ["hashed_password", "String", "Stored password hash"],
            ["role", "String", "Access role such as user or admin"],
            ["created_at", "DateTime", "Timestamp of account creation"],
        ],
    )
    w.heading(3, "A4. SAMPLE REQUEST AND RESPONSE PAYLOADS")
    w.code(
        "Sample asynchronous execution request",
        """
        {
            "code": "print('Hello, Cloud Compiler')",
            "language": "python",
            "input": ""
        }
        """,
    )
    w.code(
        "Sample asynchronous submission response",
        """
        {
            "status": "submitted",
            "job_id": "f3d7c8be-8b55-4f6c-9b99-1234567890ab",
            "output": "",
            "error": "",
            "execution_time": null
        }
        """,
    )
    w.code(
        "Representative backend excerpt: queue sender",
        """
        def send_to_queue(job_data: dict):
            payload = dict(job_data)
            payload.setdefault("job_id", str(uuid.uuid4()))
            r.lpush("code_queue", json.dumps(payload))
            return payload["job_id"]
        """,
    )
    w.code(
        "Representative backend excerpt: token creation",
        """
        def create_access_token(data: dict):
            to_encode = data.copy()
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            to_encode.update({"exp": expire})
            return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        """,
    )
    w.code(
        "Representative worker excerpt: heartbeat payload",
        """
        def update_worker_status(status: str, current_job: str | None = None):
            payload = {
                "status": status,
                "current_job": current_job,
                "updated_at": int(time.time())
            }
            r.hset(WORKER_REGISTRY_KEY, WORKER_ID, json.dumps(payload))
        """,
    )


def build_report() -> int:
    writer = ReportWriter(OUTPUT_DOCX, OUTPUT_MD)
    add_cover_page(writer)
    add_preliminary_sections(writer)
    chapter_one(writer)
    chapter_two(writer)
    chapter_three(writer)
    chapter_four(writer)
    chapter_five(writer)
    chapter_six(writer)
    references_and_appendices(writer)
    return writer.finalize()


if __name__ == "__main__":
    pages = build_report()
    print(f"Generated: {OUTPUT_DOCX}")
    print(f"Markdown copy: {OUTPUT_MD}")
    print(f"Approximate page count: {pages}")
