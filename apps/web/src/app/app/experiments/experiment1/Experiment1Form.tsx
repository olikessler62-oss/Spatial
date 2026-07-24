"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  runExperiment1Action,
  type Experiment1ActionState,
} from "./actions";

const initialState: Experiment1ActionState | null = null;

function pct(value: number): string {
  return `${(value * 100).toFixed(1)} %`;
}

function num(value: number, digits = 3): string {
  return value.toFixed(digits);
}

export function Experiment1Form() {
  const [state, formAction, isPending] = useActionState(
    runExperiment1Action,
    initialState,
  );

  const multi = state?.multi;
  const holdout = multi?.holdout;
  const selection = multi?.selection;
  const gaps = state?.gaps;
  const defaultSeed = multi?.bestSeedIndex ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-3">
        <form action={formAction}>
          <input type="hidden" name="mode" value="holdout" />
          <Button type="submit" disabled={isPending}>
            {isPending
              ? "Berechnung läuft …"
              : "Experiment 1 starten (Holdout + ≥2)"}
          </Button>
        </form>

        <form action={formAction} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="mode" value="gaps" />
          <label className="flex flex-col gap-1 text-sm">
            Layout-Seed
            <input
              name="seedIndex"
              type="number"
              min={0}
              max={9}
              defaultValue={defaultSeed}
              className="w-20 rounded-md border border-input bg-transparent px-2 py-1.5"
            />
          </label>
          <Button type="submit" variant="outline" disabled={isPending}>
            Häufigste Nicht-Treffer
          </Button>
        </form>
      </div>

      {state?.error && (
        <div role="alert" className="text-sm font-medium text-destructive">
          {state.error}
        </div>
      )}

      {gaps && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">
            Häufigste Nicht-Treffer-Serien
          </h2>
          <p className="text-sm text-muted-foreground">
            Layout {gaps.layoutSeed} · {gaps.drawCount} Ziehungen (
            {gaps.dateFrom} – {gaps.dateTo}). Gezählt wird: wie viele Ziehungen
            hintereinander die Form <strong>nicht</strong> trifft (0 = Treffer
            schon in der nächsten Ziehung). Welche Serie kam am häufigsten?
          </p>
          <div className="overflow-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shape</TableHead>
                  <TableHead>Serien gesamt</TableHead>
                  <TableHead>Häufigste Serie</TableHead>
                  <TableHead>Anzahl</TableHead>
                  <TableHead>Anteil</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gaps.shapes.map((shape) => (
                  <TableRow key={shape.shapeId}>
                    <TableCell>{shape.shapeName}</TableCell>
                    <TableCell>{shape.totalMissStreaks}</TableCell>
                    <TableCell className="tabular-nums">
                      {shape.mostCommonMissCount === null
                        ? "—"
                        : shape.mostCommonMissCount === 0
                          ? "0 Nicht-Treffer (direkt wieder)"
                          : `${shape.mostCommonMissCount} Nicht-Treffer`}
                    </TableCell>
                    <TableCell>{shape.mostCommonOccurrences}</TableCell>
                    <TableCell>{pct(shape.mostCommonShare)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {gaps.shapes.map((shape) => (
            <div key={`${shape.shapeId}-freq`} className="flex flex-col gap-2">
              <h3 className="font-medium">
                {shape.shapeName} — Top-Serien
              </h3>
              <div className="overflow-auto rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nicht-Treffer in Folge</TableHead>
                      <TableHead>Vorkommen</TableHead>
                      <TableHead>Anteil</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shape.missFrequencies.map((entry) => (
                      <TableRow key={entry.missCount}>
                        <TableCell className="tabular-nums">
                          {entry.missCount === 0
                            ? "0 (Treffer nächste Ziehung)"
                            : entry.missCount}
                        </TableCell>
                        <TableCell>{entry.occurrences}</TableCell>
                        <TableCell>{pct(entry.share)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </section>
      )}

      {multi && holdout && selection && (
        <>
          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">Protokoll</h2>
            <p className="text-sm text-muted-foreground">{multi.caution}</p>
            <ul className="text-sm tabular-nums">
              <li>
                Historie: Index 0–{multi.protocol.initialHistorySize - 1}
              </li>
              <li>
                Auswahl: {multi.protocol.selectionFromIndex}–
                {multi.protocol.selectionToIndexExclusive - 1} (Seed-Wahl nach
                Top-1 ≥2)
              </li>
              <li>
                Holdout: ab {multi.protocol.holdoutFromIndex} (Bestätigung)
              </li>
              <li>
                Bester Seed: <strong>{multi.bestSeedIndex}</strong>
              </li>
            </ul>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">Seed-Vergleich</h2>
            <div className="overflow-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seed</TableHead>
                    <TableHead>Auswahl ≥1</TableHead>
                    <TableHead>Auswahl ≥2</TableHead>
                    <TableHead>Holdout ≥1</TableHead>
                    <TableHead>Holdout ≥2</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {multi.runs.map((run) => (
                    <TableRow
                      key={run.seedIndex}
                      className={
                        run.seedIndex === multi.bestSeedIndex
                          ? "bg-muted/50 font-medium"
                          : undefined
                      }
                    >
                      <TableCell>
                        {run.seedIndex}
                        {run.seedIndex === multi.bestSeedIndex ? " ★" : ""}
                      </TableCell>
                      <TableCell>{pct(run.selectionTop1HitRate)}</TableCell>
                      <TableCell>
                        {pct(run.selectionTop1HitAtLeast2Rate)}
                      </TableCell>
                      <TableCell>{pct(run.holdoutTop1HitRate)}</TableCell>
                      <TableCell>
                        {pct(run.holdoutTop1HitAtLeast2Rate)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">
              Holdout (bestätigend, Seed {multi.bestSeedIndex})
            </h2>
            <p className="text-sm text-muted-foreground">
              {holdout.drawCount} Ziehungen · {holdout.dateFrom} –{" "}
              {holdout.dateTo}
            </p>
            <div className="overflow-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metrik</TableHead>
                    <TableHead>Pattern</TableHead>
                    <TableHead>Zufall räumlich</TableHead>
                    <TableHead>Kontrolle ohne Raum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Top-1 ≥1</TableCell>
                    <TableCell>{pct(holdout.summary.top1HitRate)}</TableCell>
                    <TableCell>
                      {pct(holdout.baseline.spatialTop1Min1.meanHitRate)}
                    </TableCell>
                    <TableCell>—</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Top-1 ≥2 (primär)</TableCell>
                    <TableCell>
                      {pct(holdout.summary.top1HitAtLeast2Rate)}
                    </TableCell>
                    <TableCell>
                      {pct(holdout.baseline.spatialTop1Min2.meanHitRate)}
                    </TableCell>
                    <TableCell>
                      {pct(holdout.baseline.nonSpatialTop1Min2.meanHitRate)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Δ ≥2 vs. räumlich</TableCell>
                    <TableCell colSpan={3}>
                      {pct(holdout.baseline.top1Min2DeltaSpatial)} · p≈
                      {num(holdout.baseline.top1Min2PValue, 3)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">Auswahlfenster (nur Seed-Wahl)</h2>
            <p className="text-sm text-muted-foreground">
              {selection.drawCount} Ziehungen · Top-1 ≥2:{" "}
              {pct(selection.summary.top1HitAtLeast2Rate)}
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">Holdout-Stabilität</h2>
            <div className="overflow-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Abschnitt</TableHead>
                    <TableHead>Ziehungen</TableHead>
                    <TableHead>≥1</TableHead>
                    <TableHead>≥2 (avg hits)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holdout.stability.map((segment) => (
                    <TableRow key={segment.label}>
                      <TableCell>{segment.label}</TableCell>
                      <TableCell>{segment.drawCount}</TableCell>
                      <TableCell>{pct(segment.top1HitRate)}</TableCell>
                      <TableCell>{num(segment.averageTop1Hits, 2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">Holdout je Shape</h2>
            <div className="overflow-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shape</TableHead>
                    <TableHead>Top-1 Wahlen</TableHead>
                    <TableHead>Top-1 ≥1</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holdout.byShape.map((row) => (
                    <TableRow key={row.shapeId}>
                      <TableCell>{row.shapeName}</TableCell>
                      <TableCell>{row.top1Selections}</TableCell>
                      <TableCell>{pct(row.top1HitRate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
