import re


def _strip_comments(code: str, language: str) -> str:
    if language == "python":
        code = re.sub(r"(?m)#.*$", "", code)
        return code

    # C/C++/Java style comments
    code = re.sub(r"//.*", "", code)
    code = re.sub(r"/\*.*?\*/", "", code, flags=re.DOTALL)
    return code


def _function_names(code: str, language: str) -> list[str]:
    names: list[str] = []

    if language == "python":
        names = re.findall(r"(?m)^\s*def\s+([A-Za-z_]\w*)\s*\(", code)
    elif language == "java":
        names = re.findall(
            r"(?m)(?:public|private|protected)?\s*(?:static\s+)?[A-Za-z_<>\[\]]+\s+([A-Za-z_]\w*)\s*\(",
            code,
        )
    else:  # c/cpp
        names = re.findall(
            r"(?m)\b(?:int|long|float|double|char|void|bool|string|auto|size_t)\s+([A-Za-z_]\w*)\s*\(",
            code,
        )

    ignore = {"if", "for", "while", "switch", "catch"}
    return [name for name in names if name not in ignore]


def _recursion_type(code: str, language: str) -> str:
    names = _function_names(code, language)
    for name in names:
        matches = re.findall(rf"\b{name}\s*\(", code)
        # definition + at least one call
        if len(matches) >= 2:
            # crude branching recursion hint: multiple self-calls
            if len(matches) >= 3:
                return "branching"
            return "linear"
    return "none"


def _max_loop_depth_python(code: str) -> int:
    lines = code.splitlines()
    stack: list[tuple[int, bool]] = []  # (indent, is_loop)
    max_depth = 0

    for raw_line in lines:
        if not raw_line.strip():
            continue

        line = raw_line.replace("\t", "    ")
        indent = len(line) - len(line.lstrip(" "))
        stripped = line.strip()

        while stack and indent <= stack[-1][0]:
            stack.pop()

        is_loop = bool(re.match(r"^(for|while)\b", stripped))
        if is_loop:
            loop_depth = sum(1 for _, loop in stack if loop) + 1
            max_depth = max(max_depth, loop_depth)

        if stripped.endswith(":"):
            stack.append((indent, is_loop))

    return max_depth


def _max_loop_depth_brace_lang(code: str) -> int:
    lines = code.splitlines()
    depth = 0
    active_loop_depths: list[int] = []
    max_depth = 0

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            continue

        closing = line.count("}")
        if closing:
            depth = max(0, depth - closing)
            active_loop_depths = [d for d in active_loop_depths if d < depth]

        if re.search(r"\b(for|while)\b", line):
            current_loop_depth = len(active_loop_depths) + 1
            max_depth = max(max_depth, current_loop_depth)
            active_loop_depths.append(depth)

        opening = line.count("{")
        if opening:
            depth += opening

    return max_depth


def _has_log_pattern(code: str) -> bool:
    patterns = [
        r"/=\s*2",
        r">>=\s*1",
        r"\*\=\s*2",
        r"=\s*\w+\s*/\s*2",
        r"=\s*\w+\s*\*\s*2",
    ]
    return any(re.search(pattern, code) for pattern in patterns)


def _space_complexity(code: str, language: str, recursion_type: str) -> str:
    lowered = code.lower()

    if recursion_type != "none":
        return "O(n)"

    if language == "python":
        if re.search(r"\[\s*\[", code) or "matrix" in lowered:
            return "O(n^2)"
        if re.search(r"\b(list|dict|set)\s*\(", lowered) or re.search(r"\[[^\]]+\]", code):
            return "O(n)"
        return "O(1)"

    # c/cpp/java
    if re.search(r"\[[^\]]+\]\s*\[[^\]]+\]", code) or "vector<vector" in lowered:
        return "O(n^2)"

    if re.search(r"\b(new|malloc|calloc|realloc|vector<|arraylist|hashmap|unordered_map)\b", lowered):
        return "O(n)"

    if re.search(r"\[[^\]]+\]", code):
        return "O(n)"

    return "O(1)"


def analyze_complexity(code: str, language: str) -> dict:
    normalized_language = (language or "").strip().lower()
    supported = {"python", "c", "cpp", "java"}

    if normalized_language not in supported:
        return {
            "time_complexity": "N/A",
            "space_complexity": "N/A",
            "confidence": "low",
            "notes": [f"Unsupported language: {language}"],
        }

    cleaned = _strip_comments(code or "", normalized_language)
    recursion_type = _recursion_type(cleaned, normalized_language)

    if normalized_language == "python":
        loop_depth = _max_loop_depth_python(cleaned)
    else:
        loop_depth = _max_loop_depth_brace_lang(cleaned)

    has_log_loop = _has_log_pattern(cleaned)

    if recursion_type == "branching":
        time_complexity = "O(2^n)"
    elif recursion_type == "linear":
        time_complexity = "O(n^2)" if loop_depth >= 1 else "O(n)"
    elif loop_depth >= 3:
        time_complexity = "O(n^3)"
    elif loop_depth == 2:
        time_complexity = "O(n^2)"
    elif loop_depth == 1:
        time_complexity = "O(log n)" if has_log_loop else "O(n)"
    else:
        time_complexity = "O(1)"

    space_complexity = _space_complexity(cleaned, normalized_language, recursion_type)

    notes = [
        f"Estimated from static patterns for {normalized_language}.",
        f"Detected loop nesting depth: {loop_depth}.",
    ]
    if recursion_type != "none":
        notes.append(f"Detected {recursion_type} recursion.")
    if has_log_loop:
        notes.append("Detected divide/multiply-by-constant loop pattern.")

    confidence = "medium" if loop_depth or recursion_type != "none" else "low"
    if recursion_type == "branching" or loop_depth >= 2:
        confidence = "high"

    return {
        "time_complexity": time_complexity,
        "space_complexity": space_complexity,
        "confidence": confidence,
        "notes": notes,
    }
