# CONTEXT

Glossary for **ranger** — the vocabulary this repo uses when talking about the component.

- Repo: `ranger`
- npm package: **`v-ranger`**
- Component tag: `<Ranger>`
- CSS variables: `--ranger-*`

If a term you need isn't here, that's a signal: either you're inventing language the
project doesn't use (reconsider), or there's a real gap worth adding. Decisions behind
this vocabulary live in [`docs/adr/`](./docs/adr/).

## Anatomy

### Ranger

The component. A slider for expressing a choice on a small, colourful, labelled scale —
and, secondarily, a plain numeric slider. Not "the slider": that word is ambiguous
between the component, the native input inside it, and the track.

### Interaction engine

The real `<input type="range">` inside every Ranger, stretched over the track at
`opacity: 0`. It owns everything a native range input is good at: keyboard, pointer,
touch, focus, form participation, and screen-reader semantics. It is never styled for
appearance. See [ADR-0001](./docs/adr/0001-hybrid-native-range-input.md).

### Presentation layer

Everything visible: track, fill, thumb, labels, icons. Ordinary DOM, positioned from CSS
custom properties driven by the current **position**. Never handles pointer input except
for the click-to-jump affordance on labels and icons.

### Track

The full-width bar the thumb travels along. Carries the **gradient**.

### Fill

The portion of the track between the start and the thumb. Distinct from the track: the
track is the whole path, the fill is the travelled part.

### Thumb

The draggable marker. In the presentation layer it is a normal element, so it can hold
content and tint itself to the **selected stop**'s colour.

### Stop block

One stop's **label** and **icon**, as one clickable box above or below the track — what
spec §4.5 calls "the whole label + icon block" and what the `stop` slot replaces. Distinct
from the **stop marker**, which is the dot drawn on the track itself.

### Label

The text above a **stop** (`stop.label`). Clickable to jump the thumb there, but not
individually focusable — the interaction engine already provides a complete keyboard path
to every stop.

### Icon

The emoji, image, or component below a **stop** (`stop.icon` / `stop.image`). Never a
font dependency: unicode text, an `<img>`, or a Vue component the consumer supplies. An
image is described by `stop.alt`, falling back to the **label**.

## The model

### Stop

One addressable point on the **axis**:

```ts
{ value, label?, icon?, image?, alt?, color?, at?, disabled? }
```

`value` is what `v-model` carries. `at` pins the stop to a coordinate on a **numeric
axis** and is meaningless on an **ordinal axis**. Never called a "step" (that word is the
numeric increment) and never called a "bullet" (vlider's name for the marker dot).

### Axis

The coordinate space the thumb moves in. Exactly one of **ordinal** or **numeric**,
inferred from props rather than declared.
See [ADR-0002](./docs/adr/0002-inferred-ordinal-and-numeric-axes.md).

### Ordinal axis

`stops` with no `min`/`max`: _n_ stops, evenly spaced, position derived from index. The
hero case — an emotion scale, a satisfaction survey, a t-shirt size.

### Numeric axis

`min`, `max`, `step`: a continuous range. `stops` are optional decoration — pinned ticks
with labels and icons at `at` coordinates.

### Position

The thumb's location as a number from `0` to `1`, independent of axis kind. The single
value the presentation layer needs; exposed to CSS as `--ranger-position`. Not the same as
the model value, and not the same as a stop index.

### Selected stop

The stop the current model value resolves to. `null` when **unset**, and on a numeric axis
when the value falls between pinned stops.

### Nearest stop

The stop closest to the current **position**. On an ordinal axis this is always the
selected stop; on a numeric axis it usually isn't. Used for `aria-valuetext`.

The thumb's tint is read off the **gradient** at the thumb's position rather than off
this stop. Where a nearest stop exists the two agree — the ramp carries that stop's
colour at that stop's coordinate — and sampling also answers on a numeric axis with no
stops at all, where "the nearest stop" has none.

### Unset

`modelValue === null`: no choice has been made. A real state, visually distinct from
"chose the middle option", and the reason a survey can tell an answer from a non-answer.
See [ADR-0003](./docs/adr/0003-value-based-v-model-and-unset-state.md).

## Colour

### Gradient

The colour ramp painted across the **track**. Supplied by the `gradient` prop as a preset
name, an array of colours, or any CSS gradient string. A stop's own `color` overrides its
slice of the ramp.

### Gradient preset

A named ramp shipped with the package (`mood`, `sunset`, `ocean`, `heat`, …), so the
component is colourful with zero configuration.

### Token

A `--ranger-*` CSS custom property: the only supported way to restyle a Ranger. There are
no theme classes and no `theme` prop.
See [ADR-0004](./docs/adr/0004-css-custom-properties-over-sass.md).

### Recipe

A copy-pasteable block of **token** overrides published in the docs (the magenta look, a
minimal monochrome look, a dark-surface look). Recipes live in documentation, never in the
shipped stylesheet.

## Words we don't use

This governs how we talk about the project — code, comments, docs prose, issue
titles, commit messages. Two deliberate exemptions, because they address readers
who have never read this file:

- **npm keywords and the package description**, which exist to be found by people
  searching for "range slider".
- **User-facing text**, above all an accessible name. To a screen-reader user the
  control _is_ a slider; `aria-valuetext` and labels use the words a reader knows,
  not ours.

| Avoid                | Use instead                | Why                                                        |
| -------------------- | -------------------------- | ---------------------------------------------------------- |
| bullet               | thumb, or stop marker      | vlider's term; ambiguous between the thumb and stop dots    |
| `theme` / theme class| token, recipe              | there is no theme prop; restyling is tokens                 |
| `extras`             | the stop object itself      | vlider's catch-all bag; stops carry consumer fields directly |
| step (as a noun)     | stop                        | `step` is the numeric increment on a numeric axis            |
| index (in the API)   | value                       | `v-model` carries the stop's `value`, never its index        |
| slider               | Ranger, track, or engine    | ambiguous between three different things                     |
