import type { ReactNode } from 'react'
import type { ConfigField } from '../destinations/types'

// An image host is a place to upload pasted/picked images and get back a public
// URL to embed. Mirrors the destinations registry, but for *uploading* binaries
// rather than publishing markdown. Config is stored locally under the host id.

export type { ConfigField }

export interface ImageHostContext {
  /** Read one of this host's stored config values. */
  getConfig: (key: string) => string | undefined
}

export interface ImageHost {
  /** Stable id, also the localStorage config namespace. */
  id: string
  name: string
  icon: ReactNode
  /** Pro-only host with no client-side upload yet; choosing it sends to /pro. */
  pro?: boolean
  /** Fields to configure before this host can upload. */
  config?: ConfigField[]
  /** Upload a file and resolve to a public URL. Omitted for `pro` placeholders. */
  upload?: (file: File, ctx: ImageHostContext) => Promise<string>
}
