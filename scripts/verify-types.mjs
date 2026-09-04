// Runs `vue-tsc` against `type-tests/good.vue` and `type-tests/bad.vue` and
// checks each landed the way it should: `good.vue` proves props, emits and
// slots infer from a consumer's own generic; `bad.vue` is the control that
// proves the inference is real - if it ever stops erroring, `good.vue` was
// never testing anything either.
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const vueTsc = fileURLToPath(new URL('../node_modules/vue-tsc/bin/vue-tsc.js', import.meta.url))

function typecheck(config) {
  return spawnSync(process.execPath, [vueTsc, '--noEmit', '-p', config], {
    cwd: root,
    encoding: 'utf8',
  })
}

const failures = []

const good = typecheck('type-tests/tsconfig.good.json')
if (good.status !== 0) {
  failures.push(
    `good.vue: expected to type-check clean, but vue-tsc exited ${good.status}\n${good.stdout}`,
  )
}

const bad = typecheck('type-tests/tsconfig.bad.json')
if (bad.status === 0) {
  failures.push(
    'bad.vue: expected a type error binding a boolean v-model against string-valued stops, but vue-tsc passed it clean',
  )
}

if (failures.length > 0) {
  console.error('verify:types failed:\n' + failures.map((line) => `  - ${line}`).join('\n'))
  process.exitCode = 1
} else {
  console.log('verify:types passed — good.vue is clean, bad.vue is rejected')
}
