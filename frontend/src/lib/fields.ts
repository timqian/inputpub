import type { Destination } from '../destinations'
import type { ConfigField } from '../destinations/types'
import { getConfig } from './storage'

// Helpers for locating and reading a destination's config/prompt fields.
// Shared between App (publish-time context) and the config dialogs.

/** Where a config field is stored: a shared global key, or the destination's
 *  own namespace. Lets GitHub + Gist share one token. */
export function fieldLoc(dest: Destination, field: ConfigField): [string, string] {
  return field.shared ? ['shared', field.shared] : [dest.id, field.key]
}

export function findField(dest: Destination, key: string): ConfigField | undefined {
  return (
    (dest.config ?? []).find((f) => f.key === key) ??
    (dest.prompt ?? []).find((f) => f.key === key)
  )
}

export function readField(dest: Destination, field: ConfigField): string {
  const [d, k] = fieldLoc(dest, field)
  return getConfig(d, k) ?? ''
}
