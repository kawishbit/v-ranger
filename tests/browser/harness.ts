/**
 * The small things every browser suite needs and none of them owns: a tab stop
 * to aim at, a media preference to emulate, and a way to find a stop block the
 * way a reader finds one. `mouse.ts` is the other half — a real mouse — and the
 * mount lifecycles stay in each file, because issue 09 owns the interaction
 * matrix and the harness it wants.
 */
import { cdp } from 'vitest/browser'

/**
 * A tab stop of its own. Tabbing has to land somewhere, and "somewhere" must
 * not be the browser's own chrome: a test that tabs out of the document takes
 * the next test's focus with it.
 */
export function sentinel(): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = 'elsewhere'
  document.body.append(button)

  return button
}

/** Emulates media preferences; an empty list puts the page back as it was. */
export async function emulate(features: { name: string; value: string }[]): Promise<void> {
  await cdp().send('Emulation.setEmulatedMedia', { features })
}

/** The stop block for one stop, found the way a reader finds it: by its text. */
export function blockWithLabel(root: Element, label: string): HTMLElement {
  const block = [...root.querySelectorAll('.ranger__stop-block')].find((candidate) =>
    candidate.querySelector('.ranger__label')?.textContent?.includes(label),
  )

  if (!block) throw new Error(`no stop labelled ${label}`)

  return block as HTMLElement
}

/**
 * The stop block carrying one stop's icon. A label and an icon on the same
 * stop live in separate blocks — one per side (`labelPosition`/`iconPosition`)
 * — so this cannot be found through `blockWithLabel`.
 */
export function blockWithIcon(root: Element, icon: string): HTMLElement {
  const block = [...root.querySelectorAll('.ranger__stop-block')].find((candidate) =>
    candidate.querySelector('.ranger__icon')?.textContent?.includes(icon),
  )

  if (!block) throw new Error(`no stop with icon ${icon}`)

  return block as HTMLElement
}

/**
 * One macrotask. The unset key check watches a press rather than intercepting
 * it, so its answer lands after the platform has had the key — after every
 * keydown listener, and after the `input` the default action may fire.
 */
export function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve))
}
