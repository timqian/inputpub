import { getConfig, getImageHostDefault } from './storage'
import { imageHosts, hostNs, type ImageHost } from '../imagehosts'

// Drives image uploads through the user's chosen image host. Each host stores
// its config under the `imghost.<id>` namespace; the chosen default is stored
// separately (see storage.getImageHostDefault).

function ctxFor(host: ImageHost) {
  return { getConfig: (key: string) => getConfig(hostNs(host.id), key) }
}

/** A host can upload when it has an `upload` fn and every required field is set. */
export function isHostConfigured(host: ImageHost): boolean {
  if (!host.upload) return false
  return (host.config ?? []).every((f) => f.optional || getConfig(hostNs(host.id), f.key)?.trim())
}

/** The host used for uploads: the chosen default (respected even if not ready),
 *  otherwise the first configured host. Returns it only when actually usable. */
export function defaultUploadHost(): ImageHost | undefined {
  const chosen = imageHosts.find((h) => h.id === getImageHostDefault())
  const host = chosen ?? imageHosts.find(isHostConfigured)
  return host && isHostConfigured(host) ? host : undefined
}

/** Whether an upload would succeed right now (a usable default host exists). */
export function isImageHostConfigured(): boolean {
  return !!defaultUploadHost()
}

export async function uploadImage(file: File): Promise<string> {
  const host = defaultUploadHost()
  if (!host?.upload) throw new Error('No image host configured')
  return host.upload(file, ctxFor(host))
}
