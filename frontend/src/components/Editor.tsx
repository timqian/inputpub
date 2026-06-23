import { useEffect, useImperativeHandle, useRef, type Ref } from 'react'
import { Crepe } from '@milkdown/crepe'
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'
import './editor-theme.css' // our overrides — must load after the theme

export interface EditorHandle {
  getMarkdown: () => string
}

interface EditorProps {
  /** Initial content, loaded once on mount. */
  defaultValue: string
  /** Called (debounced by Milkdown) whenever the markdown changes. */
  onChange?: (markdown: string) => void
  /** Called when the user tries to upload a local image file (upload is
   *  intentionally disabled — they should paste an image URL instead). */
  onImageUploadAttempt?: () => void
  ref?: Ref<EditorHandle>
}

export function Editor({ defaultValue, onChange, onImageUploadAttempt, ref }: EditorProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const crepeRef = useRef<Crepe | null>(null)

  // Keep the latest callbacks without forcing the editor to re-create.
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])
  const onUploadAttemptRef = useRef(onImageUploadAttempt)
  useEffect(() => {
    onUploadAttemptRef.current = onImageUploadAttempt
  }, [onImageUploadAttempt])

  useImperativeHandle(ref, () => ({
    getMarkdown: () => crepeRef.current?.getMarkdown() ?? '',
  }))

  useEffect(() => {
    if (!rootRef.current) return

    // Local image upload is a Pro feature. Intercept every upload path so the
    // user is sent to the Pro page instead. Pasting an image URL still works
    // via the image block's URL field.
    const blockUpload = async (): Promise<string> => {
      onUploadAttemptRef.current?.()
      return ''
    }

    // The "Upload file" control is a <label class="uploader"> that opens the OS
    // file picker. Catch the click in the capture phase so we redirect *before*
    // the picker opens, instead of after a file is chosen.
    const root = rootRef.current
    const onUploaderClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.closest('.uploader')) {
        e.preventDefault()
        e.stopPropagation()
        onUploadAttemptRef.current?.()
      }
    }
    root.addEventListener('click', onUploaderClick, true)

    const crepe = new Crepe({
      root: rootRef.current,
      defaultValue,
      featureConfigs: {
        [Crepe.Feature.Placeholder]: {
          text: 'Input here. Hit Publish to send anywhere.',
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

  return <div className="editor" ref={rootRef} />
}
