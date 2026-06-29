import type { ImageHost } from './types'
import { officialHost } from './official'
import { githubHost } from './github'
import { r2Host } from './r2'
import { s3Host } from './s3'
import { s3compatHost } from './s3compat'

/** Registry of image hosts, in display order. Add a host = add a file + a line. */
export const imageHosts: ImageHost[] = [officialHost, githubHost, r2Host, s3Host, s3compatHost]

/** localStorage config namespace for a host's fields. */
export const hostNs = (id: string) => `imghost.${id}`

export type { ImageHost } from './types'
