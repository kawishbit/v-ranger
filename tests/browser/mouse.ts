import { cdp } from 'vitest/browser'

/**
 * A real mouse, through the browser's own input pipeline. Synthetic pointer
 * events do not move a native range input — only trusted ones do — so every
 * pointer claim about a Ranger has to be made from here.
 *
 * The test frame sits at the page origin, so client and page coordinates agree.
 */

interface Point {
  x: number
  y: number
}

const button = 'left'

/** Press, move, release: a drag along the track. */
export async function drag(from: Point, to: Point) {
  const mouse = cdp()

  await mouse.send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    button,
    clickCount: 1,
    ...from,
  })
  await mouse.send('Input.dispatchMouseEvent', { type: 'mouseMoved', button, buttons: 1, ...to })
  await mouse.send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    button,
    clickCount: 1,
    ...to,
  })
}

/**
 * A click at an element's centre, rather than `userEvent.click`, which waits for
 * its target to become clickable — and whether a target ever does is the whole
 * question about a disabled stop.
 */
export async function clickOn(element: Element) {
  const box = element.getBoundingClientRect()

  await drag(
    { x: box.x + box.width / 2, y: box.y + box.height / 2 },
    { x: box.x + box.width / 2, y: box.y + box.height / 2 },
  )
}
