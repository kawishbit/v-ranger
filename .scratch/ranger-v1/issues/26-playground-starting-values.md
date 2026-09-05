# 26: Give playground demos a starting value

**What to build:** Issue 15 made the track always paint its full gradient, unset or not,
but deliberately left the thumb faded and untinted while unset — and explicitly deferred
giving the playground's own demo components a starting value as an out-of-scope, optional
follow-up. Most playground demos have no `model-value`/`v-model` initial value today, so
they mount unset and show that faded, colourless thumb until the first click. Give every
demo whose own point isn't the unset state itself a starting value, so its thumb shows
real colour from first paint — matching what `SizesExample`, `TokensExample`, and three of
`StatesExample`'s four demos already do.

`StatesExample`'s dedicated `<Ranger :stops="moods" :model-value="null" aria-label="Unset"
/>` demo is explicitly out of scope: unset is the whole point of that demo and it must stay
unset.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] `OrdinalAxisExample`, `NumericAxisExample`, `UncontrolledExample`,
      `LabelsIconsExample`, `GradientPresetsExample`, `OtherShapesExample`, `SlotsExample`,
      and `RtlExample` each mount with a starting value, so every Ranger they render shows
      a coloured (not faded/grey) thumb on first paint.
- [x] `StatesExample`'s "Unset" demo is untouched and still mounts with no value.
- [x] Any demo that relies on `@change`/committed-value display (e.g. `lastCommit`) still
      makes sense with a starting value already present.
- [x] `npm run dev` shows a coloured thumb on load for every affected section, with no
      console errors.
- [x] `npm run typecheck`, `npm run lint`, and `npm run test` stay clean.

## Comments

**Resolved.** `OrdinalAxisExample`/`NumericAxisExample` (already `v-model`) got a
non-null starting value in their existing ref. The rest were fully uncontrolled (no
`model-value` at all); each got a local ref, seeded to a real stop value, wired through
`v-model` — `GradientPresetsExample`'s `v-for` loop over presets uses one ref per preset
name so each Ranger in the loop keeps its own value. Confirmed with a scripted check
(Playwright, all 26 playground Rangers) that only the deliberately-unset `StatesExample`
demo still carries `data-unset`.

One trade-off worth recording: `UncontrolledExample` had no `model-value` prop at all, and
`Ranger` has no "default value" concept for its self-managed (uncontrolled) state — its
internal ref always starts `null` (ADR-0003, unset is a state, not a value) — so the only
way to give it a starting value was `v-model`, which makes it `Ranger`-controlled rather
than genuinely uncontrolled. Its heading was reworded from "Uncontrolled, and disabled
stops" to "A starting value, and disabled stops" so the demo no longer claims behaviour it
no longer shows; the file/component name is left as `UncontrolledExample` since renaming it
would ripple into `App.vue` and the ticket didn't ask for a rename.

Verified with static `model-value` (e.g. `SizesExample`'s `model-value="wow"`) that a
Ranger's own thumb-following-drag stops working once the prop is set-but-never-updated —
this is the same bug issue 28 fixes for `TokensExample`, which is why every demo here uses
`v-model` rather than a static prop.

`npm run typecheck`, `npm run lint`, and the full unit suite are clean.
