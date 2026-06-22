import type { Destination } from './types'
import { x } from './x'
import { chatgpt } from './chatgpt'
import { claude } from './claude'
import { gemini } from './gemini'
import { email } from './email'
import { github } from './github'
import { githubGist } from './github-gist'
import { v2ex } from './v2ex'

/** Registry of all publish/send targets. Add a target = add a file + a line here. */
export const destinations: Destination[] = [
  x,
  github,
  githubGist,
  email,
  chatgpt,
  claude,
  gemini,
  v2ex,
]

export type { Destination } from './types'
