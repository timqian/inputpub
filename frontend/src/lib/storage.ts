const DRAFT_KEY = 'inputpub.draft'
const configKey = (destId: string, field: string) => `inputpub.config.${destId}.${field}`
const enabledKey = (destId: string) => `inputpub.enabled.${destId}`
const IMAGE_HOST_DEFAULT_KEY = 'inputpub.imagehost.default'

export function loadDraft(): string {
  try {
    return localStorage.getItem(DRAFT_KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveDraft(markdown: string): void {
  try {
    localStorage.setItem(DRAFT_KEY, markdown)
  } catch {
    /* storage unavailable — ignore */
  }
}

export function getConfig(destId: string, field: string): string | undefined {
  try {
    return localStorage.getItem(configKey(destId, field)) ?? undefined
  } catch {
    return undefined
  }
}

export function setConfig(destId: string, field: string, value: string): void {
  try {
    localStorage.setItem(configKey(destId, field), value)
  } catch {
    /* storage unavailable — ignore */
  }
}

/** Whether a destination is enabled (shown in the menu). undefined = unset. */
export function getEnabled(destId: string): boolean | undefined {
  try {
    const v = localStorage.getItem(enabledKey(destId))
    return v == null ? undefined : v === '1'
  } catch {
    return undefined
  }
}

export function setEnabled(destId: string, on: boolean): void {
  try {
    localStorage.setItem(enabledKey(destId), on ? '1' : '0')
  } catch {
    /* storage unavailable — ignore */
  }
}

/** The id of the image host chosen as default for uploads (unset = none). */
export function getImageHostDefault(): string | undefined {
  try {
    return localStorage.getItem(IMAGE_HOST_DEFAULT_KEY) ?? undefined
  } catch {
    return undefined
  }
}

export function setImageHostDefault(id: string): void {
  try {
    localStorage.setItem(IMAGE_HOST_DEFAULT_KEY, id)
  } catch {
    /* storage unavailable — ignore */
  }
}

/** Debounce a function by `wait` ms. */
export function debounce<A extends unknown[]>(fn: (...args: A) => void, wait: number) {
  let timer: ReturnType<typeof setTimeout> | undefined
  return (...args: A) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), wait)
  }
}
