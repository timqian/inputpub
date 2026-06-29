import { s3PutObject, type S3Target } from '../lib/s3'
import type { ImageHostContext } from './types'

/** Read a required config value or throw a clear error. */
export function req(ctx: ImageHostContext, key: string, label: string): string {
  const v = ctx.getConfig(key)?.trim()
  if (!v) throw new Error(`Missing ${label}`)
  return v
}

function sanitize(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^[-.]+|-+$/g, '') || 'image'
  )
}

/** A collision-proof object name from the original file name. */
export function uniqueName(name: string): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${sanitize(name)}`
}

/** Upload to an S3-compatible target and return the URL to embed: the public
 *  base (if configured) joined with the key, else the raw object URL. */
export async function uploadToS3(
  target: S3Target,
  file: File,
  prefix: string | undefined,
  baseUrl: string | undefined,
): Promise<string> {
  const dir = (prefix ?? '').replace(/^\/+|\/+$/g, '')
  const key = dir ? `${dir}/${uniqueName(file.name)}` : uniqueName(file.name)
  const body = await file.arrayBuffer()
  const objectUrl = await s3PutObject(target, key, body, file.type || 'application/octet-stream')

  let base = (baseUrl ?? '').trim().replace(/\/+$/, '')
  // Tolerate a base entered without a scheme (e.g. "imgs.example.com"), which
  // would otherwise yield a scheme-relative/relative URL that fails to load.
  if (base && !/^https?:\/\//i.test(base)) base = `https://${base}`
  if (base) return `${base}/${key.split('/').map(encodeURIComponent).join('/')}`
  return objectUrl
}
