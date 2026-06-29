import type { ImageHost } from './types'
import { SparklesIcon } from '../destinations/icons'

/** Hosted image storage handled by us — a Pro feature. No client-side upload
 *  yet; selecting it (or trying to upload with it as default) sends to /pro. */
export const officialHost: ImageHost = {
  id: 'official',
  name: 'Official',
  icon: SparklesIcon,
  pro: true,
}
