import { getConfig } from './storage'

// Pull Markdown into the editor from external sources. Counterpart to the
// publish destinations: these *read* content rather than send it. Private
// sources reuse the same Personal Access Tokens stored under Customize.

interface GitHubRef {
  owner: string
  repo: string
  ref: string
  path: string
}

/** Parse a github.com `…/blob/<ref>/<path>` (or `/raw/…`) or a
 *  raw.githubusercontent.com URL. Assumes a single-segment ref (e.g. `main`). */
function parseGitHubUrl(input: string): GitHubRef | null {
  try {
    const u = new URL(input.trim())
    const parts = u.pathname.split('/').filter(Boolean).map(decodeURIComponent)
    if (u.hostname === 'raw.githubusercontent.com') {
      const [owner, repo, ref, ...rest] = parts
      if (owner && repo && ref && rest.length) return { owner, repo, ref, path: rest.join('/') }
    } else if (u.hostname === 'github.com' || u.hostname === 'www.github.com') {
      const [owner, repo, kind, ref, ...rest] = parts
      if (owner && repo && (kind === 'blob' || kind === 'raw') && ref && rest.length)
        return { owner, repo, ref, path: rest.join('/') }
    }
  } catch {
    /* not a URL */
  }
  return null
}

/** Extract a gist id from a gist.github.com URL or a bare id. */
function parseGistId(input: string): string | null {
  const s = input.trim()
  try {
    const u = new URL(s)
    if (u.hostname === 'gist.github.com') {
      const id = u.pathname.split('/').filter(Boolean).pop()
      if (id) return id.replace(/\.git$/, '')
    }
  } catch {
    /* not a URL */
  }
  return /^[0-9a-f]{8,}$/i.test(s) ? s : null
}

async function loadFromGitHub(input: string): Promise<string> {
  const ref = parseGitHubUrl(input)
  if (!ref) throw new Error('Not a GitHub file URL (expected github.com/owner/repo/blob/…)')

  const token = getConfig('github', 'token')?.trim()
  const path = ref.path.split('/').map(encodeURIComponent).join('/')
  const url =
    `https://api.github.com/repos/${encodeURIComponent(ref.owner)}/${encodeURIComponent(ref.repo)}` +
    `/contents/${path}?ref=${encodeURIComponent(ref.ref)}`
  const headers: Record<string, string> = { Accept: 'application/vnd.github.raw' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, { headers })
  if (!res.ok) {
    const hint =
      res.status === 404 ? ' — check the path, or add a token in Customize for private repos' : ''
    throw new Error(`Couldn't load the file (${res.status})${hint}`)
  }
  return res.text()
}

interface GistFile {
  filename: string
  content?: string
  language?: string | null
  truncated?: boolean
  raw_url?: string
}

async function loadFromGist(input: string): Promise<string> {
  const id = parseGistId(input)
  if (!id) throw new Error('Not a valid Gist URL or id')

  const token = getConfig('github-gist', 'token')?.trim()
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`https://api.github.com/gists/${encodeURIComponent(id)}`, { headers })
  if (!res.ok) {
    const hint =
      res.status === 404 ? ' — check the id, or add a token in Customize for secret gists' : ''
    throw new Error(`Couldn't load the gist (${res.status})${hint}`)
  }

  const data = (await res.json()) as { files?: Record<string, GistFile> }
  const files = Object.values(data.files ?? {})
  if (!files.length) throw new Error('That gist has no files')

  // Prefer a Markdown/text file, else the first one.
  const file =
    files.find((f) => f.language === 'Markdown') ??
    files.find((f) => /\.(md|markdown|mdx|txt)$/i.test(f.filename)) ??
    files[0]

  // Files over ~1MB come back truncated; fetch the full content from raw_url.
  if (file.truncated && file.raw_url) {
    const raw = await fetch(file.raw_url, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
    if (!raw.ok) throw new Error("Couldn't fetch the gist content")
    return raw.text()
  }
  return file.content ?? ''
}

/** Load Markdown from a pasted link, auto-detecting GitHub repo files vs gists. */
export async function loadFromUrl(input: string): Promise<string> {
  const s = input.trim()
  if (!s) throw new Error('Paste a link first')
  if (/gist\.github\.com/.test(s) || /^[0-9a-f]{8,}$/i.test(s)) return loadFromGist(s)
  if (/github\.com|githubusercontent\.com/.test(s)) return loadFromGitHub(s)
  throw new Error('Unrecognized link — paste a GitHub file URL or a Gist URL')
}
