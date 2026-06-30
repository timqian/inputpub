// Theme preference: 'system' follows the OS via the prefers-color-scheme media
// query (the CSS in index.css / editor-theme.css handles that case with no
// attribute set); 'light'/'dark' force a scheme via a data-theme attribute on
// <html>, which those same stylesheets read to override the media query.

export type ThemePref = 'system' | 'light' | 'dark'

const KEY = 'theme'

export function getThemePref(): ThemePref {
  const v = localStorage.getItem(KEY)
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system'
}

/** Apply a preference to the document (and persist it). Call before first paint
 *  to avoid a flash, and again whenever the user changes it. */
export function applyThemePref(pref: ThemePref): void {
  const root = document.documentElement
  if (pref === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', pref)
  localStorage.setItem(KEY, pref)
}

/** Next preference in the System → Light → Dark cycle. */
export function nextThemePref(pref: ThemePref): ThemePref {
  return pref === 'system' ? 'light' : pref === 'light' ? 'dark' : 'system'
}
