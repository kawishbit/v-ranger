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

/** Presses the button down, without moving or releasing — half a drag, for a
 * test that has to look at the world while the pointer is still held. */
export async function press(at: Point) {
  await cdp().send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    button,
    clickCount: 1,
    ...at,
  })
}

/** Moves a held button to a point, firing the same `mousemove` a real drag would. */
export async function moveTo(at: Point) {
  await cdp().send('Input.dispatchMouseEvent', { type: 'mouseMoved', button, buttons: 1, ...at })
}

/** Releases a held button at a point. */
export async function release(at: Point) {
  await cdp().send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    button,
    clickCount: 1,
    ...at,
  })
}

/** Press, move, release: a drag along the track. */
export async function drag(from: Point, to: Point) {
  await press(from)
  await moveTo(to)
  await release(to)
}

/** One finger's worth of `Input.dispatchTouchEvent`'s `touchPoints`. */
function finger(at: Point) {
  return [{ x: at.x, y: at.y, id: 0 }]
}

/** Touches down, without moving or lifting — the touch half of `press`. */
export async function touchDown(at: Point) {
  await cdp().send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: finger(at) })
}

/** Moves a held touch to a point. */
export async function touchMoveTo(at: Point) {
  await cdp().send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: finger(at) })
}

/** Lifts the finger. */
export async function touchUp() {
  await cdp().send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}

/** Touch down, move, up: the touch equivalent of `drag`. */
export async function touchDrag(from: Point, to: Point) {
  await touchDown(from)
  await touchMoveTo(to)
  await touchUp()
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
