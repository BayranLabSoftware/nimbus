# Nimbus 1.0

_Draft for the head of the `[1.0.0]` changelog section. The details are
in the changelog below it; this is what the release is._

Nimbus simulates asteroid impacts, nuclear and conventional explosions,
earthquakes, volcanic eruptions, submarine landslides and the tsunamis
they cause, on a 3D globe, with an estimated death toll — for anyone
who wants to understand the difference between a kiloton and a
megaton, a magnitude 6 and a magnitude 9, an evacuated eruption and one
nobody was warned about.

## What 1.0 promises

- **Every figure traces to a published source.** The equations, their
  citations and the conventions for every uncertain input are in
  `docs/SCIENCE.md`, the in-app methodology page, and the equation
  cards of every printed report.
- **Every death toll carries a band that can be wrong.** Nine in ten
  plausible versions of the event land inside it: 200 realisations
  drawn from the published scatter of the inputs, not the gentlest and
  harshest rows of a vulnerability table.
- **The model is checked against the record, in public.** Counted
  death tolls, buoy and survey wave heights and USGS ShakeMap
  footprints, on the validation page and in `docs/VALIDATION_REPORT.md`
  — misses included, each with a named cause.
- **The check cannot go stale.** CI regenerates the validation report
  from the code on every push and refuses a push whose committed copy
  differs. Every printed simulation report names the commit that
  produced it and links to the report for that commit.
- **It costs nothing to use or to run.** No accounts, no API keys, no
  paid services; every dataset is public.

## What 1.0 does not do

Stated here so nobody has to discover it — the validation page carries
the same list, kept current by the same generator.

- A warned tsunami coast evacuates on a timer, not on the shaking, so
  a prepared coast like Tōhoku's is over-counted about three times.
- Distant coasts of very long ruptures, like Sumatra 2004's, get too
  small a wave, and the cause is not yet settled.
- The shaking model paints four intensity bands the recorded
  earthquakes never reached.
- No asteroid impact in recorded history has a death toll, so an impact
  toll can never be validated.
- Fallout, initial radiation, famine, disease and climate are outside
  the count.
