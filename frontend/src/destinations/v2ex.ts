import type { Destination } from './types'
import { V2exIcon } from './icons'

/**
 * V2EX has no public topic-creation API or compose prefill, so copy the content
 * to the clipboard and open the "new topic" page — the user picks a node and
 * pastes. Off by default (niche destination).
 */
export const v2ex: Destination = {
  id: 'v2ex',
  name: 'V2EX',
  icon: V2exIcon,
  defaultEnabled: false,
  async send(markdown) {
    let copied = false
    try {
      await navigator.clipboard.writeText(markdown)
      copied = true
    } catch {
      // clipboard may be unavailable; still open V2EX
    }
    window.open('https://www.v2ex.com/write', '_blank', 'noopener,noreferrer')
    return copied ? '内容已复制，粘贴到 V2EX 发帖框' : '已打开 V2EX 发帖页，请手动粘贴'
  },
}
