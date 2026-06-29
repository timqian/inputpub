import { useState } from 'react'
import { Button, Modal, ModalActions, ModalNote, ModalTitle } from '../Modal'
import { loadFromUrl } from '../../lib/sources'

const inputCls =
  'rounded-lg border border-line bg-bg px-[0.6rem] py-2 text-inherit focus:border-accent focus:outline-none'

/** Load content into the editor from a local file, a GitHub repo file, or a
 *  GitHub Gist. The link input auto-detects repo vs gist. */
export function LoadDialog({
  hasContent,
  onLoaded,
  onClose,
}: {
  /** Read at apply time whether the editor already has content (so we confirm
   *  before replacing it). */
  hasContent: () => boolean
  onLoaded: (text: string) => void
  onClose: () => void
}) {
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirmReplace = () => !hasContent() || window.confirm('Replace the current content?')

  // Apply loaded text (after a replace confirmation) and close the dialog.
  function apply(text: string) {
    if (!confirmReplace()) return
    onLoaded(text)
    onClose()
  }

  function openLocal() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.md,.markdown,.mdx,.txt,text/markdown,text/plain'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (file) apply(await file.text())
    }
    input.click()
  }

  async function loadUrl() {
    if (!url.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      apply(await loadFromUrl(url))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <ModalTitle>Load content</ModalTitle>
      <ModalNote>Replaces the current content.</ModalNote>

      <Button variant="ghost" className="w-full" onClick={openLocal}>
        Open a local file…
      </Button>

      <div className="flex items-center gap-2 text-[0.72rem] text-muted">
        <span className="h-px flex-1 bg-line" />
        or from a link
        <span className="h-px flex-1 bg-line" />
      </div>

      <label className="flex flex-col gap-[0.3rem] text-[0.82rem]">
        <span>Paste a link</span>
        <input
          className={inputCls}
          value={url}
          autoFocus
          placeholder="https://github.com/owner/repo/blob/main/post.md"
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadUrl()}
        />
        <span className="text-[0.72rem] leading-snug text-muted">
          The source is detected automatically — a GitHub repo file
          (github.com/…/blob/…) or a Gist (gist.github.com/…) today, with more to come. Private
          sources reuse the token saved under Customize.
        </span>
      </label>

      {error && <p className="m-0 text-[0.78rem] text-[#e5484d]">{error}</p>}

      <ModalActions>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={!url.trim() || busy} onClick={loadUrl}>
          {busy ? 'Loading…' : 'Load'}
        </Button>
      </ModalActions>
    </Modal>
  )
}
