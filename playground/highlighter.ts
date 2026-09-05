import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import vue from '@shikijs/langs/vue'
import json from '@shikijs/langs/json'
import githubDark from '@shikijs/themes/github-dark'

export const THEME = 'github-dark'

let instance: ReturnType<typeof createHighlighterCore> | null = null

/**
 * One highlighter, shared by every code and value block in the playground.
 *
 * Built from `shiki/core` plus exactly the two languages and one theme this
 * playground uses, imported by their own module rather than by name through
 * `shiki`'s bundled `createHighlighter` — that convenience import pulls in
 * every language and theme shiki ships as a separate chunk, since a bundler
 * cannot tree-shake a lookup keyed by a runtime string. Naming the modules
 * here instead is what keeps `build:playground`'s output to the two grammars
 * this playground actually renders.
 *
 * The JS regex engine only — never the WASM oniguruma one `shiki`'s full
 * bundle defaults to — so highlighting works with no `fetch` for a `.wasm`
 * asset, whether `npm run dev` serves this over HTTP or `build:playground`'s
 * standalone output is opened straight from disk (issue 25).
 */
export function highlighter() {
  instance ??= createHighlighterCore({
    langs: [vue, json],
    themes: [githubDark],
    engine: createJavaScriptRegexEngine(),
  })

  return instance
}
