# FCM round 3 — the opening document

Rules 1162 to 1168 (`src/physics/validation/fcmRound3Charter.ts`), on the reviewer's verdict of round 1
(rule 1161): «ready in a restricted domain for an independent test of the atmospheric release only».
Written and pushed before any value of the fourth set is read. The inventory of candidates:
`docs/FOURTH_SET_REGISTER.md` (rule 1158).

## What is frozen

| Rule | What                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1162 | **The candidate**: the files of the engine, the draws of rule 1152, the rules that hold its priors and the 1976 atmosphere, sealed by their SHA-256 and checked by a test — any change makes another version. Untuned priors; both structures and both clouds; 10 m steps and bins; floor 1 g; bound 10⁵ retried at 10⁶; no aggregated tail. The 1976 standard as reference, the exponential as sensitivity. Round 3 never retouches it; the survival round runs apart.                                                                                                                                      |
| 1163 | **The domain and its boundary**: 0.1–10 m, 1 500–4 000 kg/m³, 11.2–30 km/s, 15°–90° — a proposed bound, not a domain verified in every combination (the map exercised 592 runs below 10 m, all completed). An event is in it when the 5th–95th percentiles of its drawn diameter lie in 0.1–10 m and the medians of the rest in their ranges, decided from inputs alone. Draws not completed stay in the denominator; fewer than 90 % produced is a failure on that event; more than 20 % not robust gives no single release there. Double peaks and the atmosphere's sensitivity published for every event. |
| 1164 | **The observable, two kinds**: primary — the maximum of an energy-deposition curve the source reconstructs from a calibrated light curve with its luminous efficiency and uncertainty; proxy — the brightest flare's altitude on a measured trajectory, qualified, with its own tolerance and half the weight; diagnostic — the rest. Each event's kind fixed from its metadata now, able only to fall at extraction.                                                                                                                                                                                        |
| 1165 | **The comparison, paired with Collins**: intervals by the source's quality (A ± stated uncertainty; B ± at least 1 km; C not judged); favourable where the branch's median is closer than the baseline's by 1 km (primary) or 2 km (proxy), unfavourable where farther by as much; the interval score guarding against wide bands; a favourable outcome standing only if not unfavourable under the exponential atmosphere.                                                                                                                                                                                  |
| 1166 | **The four configurations and the mixture**: each configuration's predictions frozen beside the equal-weight mixture's, weights a convention; a configuration missing by more than 5 km (primary) or 7 km (proxy), or producing the release in fewer than half its draws, fails severely — if any does on a third of the assessable events, the verdict is at most «inconclusive»; the sensitivity to the weights published, never chosen on the new events.                                                                                                                                                 |
| 1167 | **The verdict, on the release only**: «favourable» with at least five assessable events, three of them primary or proxy of quality A, the mixture favourable on 60 % of the weighted outcomes, no primary unfavourable, at most one proxy unfavourable, and no structural failure; «unfavourable» when the unfavourable outweigh the favourable; «inconclusive» otherwise. No class B of the full entry, no mass, survival, crater or product integration.                                                                                                                                                   |
| 1168 | **The order**: these rules pushed; the final preparation dossier (list and exclusions frozen from metadata) sent once; on the reviewer's leave and Andrea's for the downloads, the sources pinned by DOI and SHA-256, the inputs extracted by a procedure written before and the domain decided; the predictions run and pushed; only then the targets extracted by their own procedure and the verdict computed; every outcome published.                                                                                                                                                                   |

## Where the register stands against the verdict's minimum

From the metadata alone: one primary (Benenitra, «to check»: whether its deposition comes from a
government-sensor light curve), five proxies (Grimsby, Bunburra Rockhole, Mason Gully, Aguas Zarcas,
Neuschwanstein — the last «to check» against Borovička et al. 2020's sample), and fifteen diagnostic.
Rule 1167 asks at least five assessable events, three of them strong: the register reaches it only if
the «to check» hold and the extraction does not lower their kinds. It is said now, before any value:
the search may continue from metadata — the compilation «Bolide light curve systematics from 75
recovered meteorites» (Jenniskens 2026, MAPS), named in rule 943 and never read, is the one source that
might give light curves for many falls at once — and if the minimum is not met, round 3's verdict is
«inconclusive» by rule, not a reason to loosen it.

## The final preparation dossier (rules 1169 to 1174)

The reviewer approved rules 1162 to 1168 with two corrections, written before any value is read:

- **1169** — a single severe structural failure of any configuration on one primary event of quality A
  makes the verdict at most «inconclusive» (beside rule 1166's clause on a third of the events).
- **1170** — an event whose drawn diameter leaves 0.1–10 m at its 5th or 95th percentile (or whose
  median density, speed or angle leaves its range) is out of the domain: not assessable, not counted
  toward the five events or the three strong ones; its predictions published as a diagnostic outside
  the domain; decided from the inputs alone, finally, before any target.

And the checks he asked for, from metadata and from what the project has already read:

- **1171, the exposure** — the repository and every source text the project read searched for each
  candidate's name, each line classified by the kinds of numbers beside it, and where one could be a
  target, read with every digit masked. Criterion: a candidate is excluded where a read source shows an
  altitude of its release beside its name; nothing else excludes. None excluded: Grimsby's one such
  line is the town, under 2022 WJ1's flares; Neuschwanstein has a strength and an entry mass in Kenkmann
  et al. (2009), registered, and is not in Borovička et al. (2020)'s sample.
- **1172, the «to check»** — Neuschwanstein, Benenitra, Ischgl and the Central Italy bolide candidates;
  Tighert excluded (a CNEOS row the project read on its date). Jenniskens (2026), doi:10.1111/maps.70203:
  no candidate and no target number in its abstract; it enters only as a source of targets for events
  already listed, never to add one.
- **1173, the list** — Benenitra (primary); Grimsby, Bunburra Rockhole, Mason Gully, Aguas Zarcas,
  Neuschwanstein (proxies): six events, nothing added after. If two kinds fall at extraction or two events
  leave the domain, the verdict is «inconclusive» by rule.
- **1174, the procedures** — the inputs (speed, angle, initial mass, bulk density or its type's range
  from Flynn et al. 2018, each with its place in the source; 200 draws per event) extracted first; the
  targets (the deposition maximum, or the brightest flare's altitude, with its uncertainty and quality)
  only after the predictions are pushed.
