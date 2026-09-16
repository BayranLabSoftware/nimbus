# Running the impulse wave manual's own tool

The wave a landslide raises is held to the field's method: the impulse wave
manual, Evers, Heller, Fuchs, Hager & Boes (2019), _Landslide-generated Impulse
Waves in Reservoirs — Basics and Computation_, 2nd edition, VAW-Mitteilung 254,
ETH Zürich, doi:10.3929/ethz-b-000413216, in its version 2.1 of June 2023. Its
authors publish a spreadsheet that computes it, and
`scripts/benchmark/impulse-wave-against-tool.ts` runs Nimbus against that
spreadsheet (rules 162 to 167 of `src/physics/validation/impulseWaveRules.ts`).
Nothing of the spreadsheet is in this repository.

## The manual

`3768-BFE_VAW_Impulse_Wave_Manual_2023.pdf`, from the Swiss Federal Office of
Energy's publication database, https://pubdb.bfe.admin.ch/en/publication/download/3768
(8 303 362 bytes, SHA-256
`ea1968816dc8b1c077c62716954158f2dfc17abd985bfbc267595ce006c75286`).

## The tool

`BFE_VAW_Impulse_Wave_Manual_Computational_Tool_v1-0.xlsm`, Zenodo record
3492000, doi:10.5281/zenodo.3492000, CC-BY-4.0 (5 013 099 bytes, MD5
`a0b1c78f6ec282207e653f277d8d8a84` as Zenodo publishes it, SHA-256
`4310c603b3c425877ec0f24090a6efa3a6aa6bcef53e0848111a7ff88f6c8344`). The
addendum of 2023 names a version 1.1 at doi:10.5281/zenodo.4715565, which did not
resolve on 17 September 2026; version 1.0 predates the addendum's shallow
angles, and the rules say how that is handled.

The workbook carries macros. The manual says they only clear the input cells,
and nothing here runs them: the file is an Office Open XML zip, and the copy
the script drives has its VBA project taken out.

```bash
mkdir tool && cd tool && unzip ../BFE_VAW_Impulse_Wave_Manual_Computational_Tool_v1-0.xlsm
```

Then delete `xl/vbaProject.bin`, remove its `Relationship` from
`xl/_rels/workbook.xml.rels` and its `Override` and `Default Extension="bin"`
from `[Content_Types].xml`, set the workbook's content type to
`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml`,
and zip the tree back as an `.xlsx`. Microsoft Excel for Mac opens files in its
own container without asking, so place the copy there:

```bash
mkdir -p ~/Library/Containers/com.microsoft.Excel/Data/nimbus-validation
```

## Running it

```bash
pnpm exec tsx scripts/benchmark/impulse-wave-against-tool.ts heldout ~/Library/Containers/com.microsoft.Excel/Data/nimbus-validation/impulse-tool.xlsx benchmark/results/impulse-wave-against-tool.json
```

The script writes each slide into the sheet "Generation | Propagation (3D)"
(cells F6 to F16), asks Excel to calculate, and reads back F, S, M, D, V, B and
P (M18 to M29) and the three initial amplitudes (F23 to F25). The first run asks
macOS to let the terminal control Microsoft Excel. The manual says the tool also
runs in LibreOffice Calc; the script drives Excel only.
