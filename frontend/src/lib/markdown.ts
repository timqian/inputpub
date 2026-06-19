/**
 * Convert Markdown into clean, readable plain text for destinations that don't
 * render Markdown (X, mailto email). Strips syntax markers while keeping the
 * text, line structure, and link URLs.
 *
 * Intentionally dependency-free and good enough for typical note content —
 * not a full CommonMark parser.
 */
export function markdownToText(markdown: string): string {
  let text = markdown.replace(/\r\n/g, '\n')

  // Fenced code blocks: keep the inner code, drop the ``` fences.
  text = text.replace(/```[^\n]*\n([\s\S]*?)```/g, (_, code: string) =>
    code.replace(/\n$/, ''),
  )

  // Line-level markers.
  text = text
    .split('\n')
    .map((line) => {
      // Horizontal rule -> blank line.
      if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) return ''
      return line
        .replace(/^\s{0,3}#{1,6}\s+/, '') // heading markers
        .replace(/^\s{0,3}>\s?/, '') // blockquote markers
        .replace(/^(\s*)[*+]\s+/, '$1- ') // normalize bullets to "- "
    })
    .join('\n')

  // Inline constructs.
  text = text
    .replace(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g, (_, alt, url) => url || alt) // image -> url
    .replace(/\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g, (_, label, url) =>
      !label || label === url ? url : `${label} (${url})`,
    ) // link -> "label (url)"
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // italic
    .replace(/~~(.*?)~~/g, '$1') // strikethrough
    .replace(/`([^`]+)`/g, '$1') // inline code

  // Tidy whitespace.
  return text.replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim()
}
