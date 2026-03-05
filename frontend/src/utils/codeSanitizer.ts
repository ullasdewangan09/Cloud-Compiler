const NON_STANDARD_SPACES = /[\u00A0\u1680\u180E\u2000-\u200A\u202F\u205F\u3000]/g;
const ZERO_WIDTH_CHARS = /[\u200B-\u200D\u2060\uFEFF]/g;
const BOX_GLYPHS = /[\u25A0\u25A1]/g;

export function sanitizeCodeText(input: string): string {
  if (!input) {
    return '';
  }

  return input
    .replace(/\r\n?/g, '\n')
    .replace(NON_STANDARD_SPACES, ' ')
    .replace(ZERO_WIDTH_CHARS, '')
    .replace(BOX_GLYPHS, ' ');
}
