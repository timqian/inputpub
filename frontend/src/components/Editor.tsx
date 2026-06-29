import { useEffect, useImperativeHandle, useRef, type Ref } from 'react'
import { Crepe } from '@milkdown/crepe'
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'
import './editor-theme.css' // our overrides — must load after the theme
import { isImageHostConfigured, uploadImage } from '../lib/imageHost'

export interface EditorHandle {
  getMarkdown: () => string
}

interface EditorProps {
  /** Initial content, loaded once on mount. */
  defaultValue: string
  /** Called (debounced by Milkdown) whenever the markdown changes. */
  onChange?: (markdown: string) => void
  /** Called when an image upload is attempted but no image host is configured,
   *  so the app can offer to configure one (or go Pro). */
  onImageUploadUnconfigured?: () => void
  /** Called when an image upload fails, so the app can surface the error. */
  onImageUploadError?: (message: string) => void
  ref?: Ref<EditorHandle>
}

export function Editor({
  defaultValue,
  onChange,
  onImageUploadUnconfigured,
  onImageUploadError,
  ref,
}: EditorProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const crepeRef = useRef<Crepe | null>(null)

  // Keep the latest callbacks without forcing the editor to re-create.
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])
  const onUnconfiguredRef = useRef(onImageUploadUnconfigured)
  useEffect(() => {
    onUnconfiguredRef.current = onImageUploadUnconfigured
  }, [onImageUploadUnconfigured])
  const onUploadErrorRef = useRef(onImageUploadError)
  useEffect(() => {
    onUploadErrorRef.current = onImageUploadError
  }, [onImageUploadError])

  useImperativeHandle(ref, () => ({
    getMarkdown: () => crepeRef.current?.getMarkdown() ?? '',
  }))

  useEffect(() => {
    if (!rootRef.current) return

    // Upload picked/pasted images to the configured image host and return the
    // raw URL for the editor to embed. With no host configured, prompt the user
    // (configure one, or go Pro) and insert nothing.
    const blockUpload = async (file: File): Promise<string> => {
      if (!isImageHostConfigured()) {
        onUnconfiguredRef.current?.()
        return ''
      }
      try {
        return await uploadImage(file)
      } catch (err) {
        onUploadErrorRef.current?.(err instanceof Error ? err.message : String(err))
        return ''
      }
    }

    // The "Upload file" control is a <label class="uploader"> that opens the OS
    // file picker. When there's no host yet, catch the click in the capture
    // phase so we prompt *before* the picker opens instead of after a file is
    // chosen. When a host is configured, let the picker open and the chosen
    // file flow into blockUpload above.
    const root = rootRef.current
    const onUploaderClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.closest('.uploader') && !isImageHostConfigured()) {
        e.preventDefault()
        e.stopPropagation()
        onUnconfiguredRef.current?.()
      }
    }
    root.addEventListener('click', onUploaderClick, true)

    const crepe = new Crepe({
      root: rootRef.current,
      defaultValue,
      featureConfigs: {
        [Crepe.Feature.Placeholder]: {
          text: 'Input here, publish anywhere.',
          mode: 'doc', // only when the whole doc is empty, not on every blank line
        },
        [Crepe.Feature.ImageBlock]: {
          onUpload: blockUpload,
          inlineOnUpload: blockUpload,
          blockOnUpload: blockUpload,
          inlineUploadPlaceholderText: 'Paste image link',
          blockUploadPlaceholderText: 'Paste image link',
        },
      },
    })
    crepe.on((api) => {
      api.markdownUpdated((_, markdown) => onChangeRef.current?.(markdown))
    })

    let destroyed = false
    crepe.create().then(() => {
      if (destroyed) crepe.destroy()
      else crepeRef.current = crepe
    })

    return () => {
      destroyed = true
      root.removeEventListener('click', onUploaderClick, true)
      crepeRef.current = null
      crepe.destroy()
    }
    // defaultValue is intentionally read once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fill the sheet so the whole page is a writing surface (the inner .milkdown
  // / .ProseMirror fill rules live in editor-theme.css, since Crepe injects
  // that DOM itself).
  return <div className="flex min-w-0 flex-1 flex-col" ref={rootRef} />
}
