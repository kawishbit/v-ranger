import { ref } from 'vue'
import type { Resolved } from '../src/axis'

/** Each caller gets its own `lastCommit` ref — never share the return value across examples. */
export function useLastCommit<V>() {
  const lastCommit = ref('nothing committed yet')

  function record(resolved: Resolved<V>) {
    lastCommit.value = JSON.stringify(resolved, null, 2)
  }

  return { lastCommit, record }
}
