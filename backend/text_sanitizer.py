import re

NON_STANDARD_SPACES = re.compile(r"[\u00A0\u1680\u180E\u2000-\u200A\u202F\u205F\u3000]")
ZERO_WIDTH_CHARS = re.compile(r"[\u200B-\u200D\u2060\uFEFF]")
BOX_GLYPHS = re.compile(r"[\u25A0\u25A1]")


def sanitize_code_text(text: str | None) -> str:
    if not text:
        return ""

    sanitized = text.replace("\r\n", "\n").replace("\r", "\n")
    sanitized = NON_STANDARD_SPACES.sub(" ", sanitized)
    sanitized = ZERO_WIDTH_CHARS.sub("", sanitized)
    sanitized = BOX_GLYPHS.sub(" ", sanitized)
    return sanitized
