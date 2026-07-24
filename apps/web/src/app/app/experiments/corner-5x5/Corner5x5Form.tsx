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
  runCorner5x5Action,
  type Corner5x5ActionState,
} from "./actions";

const initialState: Corner5x5ActionState | null = null;

function pct(value: number): string {
  return `${(value * 100).toFixed(1)} %`;
}

export function Corner5x5Form() {
  const [state, formAction, isPending] = useActionState(
    runCorner5x5Action,
    initialState,
  );

  const report = state?.report;

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction}>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Analysiere …" : "Corner 5×5 starten"}
        </Button>
      </form>

      {state?.error && (
        <div role="alert" className="text-sm font-medium text-destructive">
          {state.error}
        </div>
      )}

      {report && (
        <>
          <section className="flex flex-col gap-2 text-sm">
            <h2 className="text-lg font-semibold">Aktuelle Ziehung</h2>
            <p>
              Datum: <span className="tabular-nums">{report.latestDrawDate}</span>
            </p>
            <p className="tabular-nums">
              Zahlen: {report.latestMainNumbers.join(" · ")}
            </p>
            <p>
              Layout-Seed (einmalig fest):{" "}
              <code>{report.layoutSeed}</code>
            </p>
            <p>
              Platzierungen im 5×5: {report.placementCountInWindow} · getroffen:{" "}
              {report.hitOnLatestCount} · nicht getroffen:{" "}
              {report.missedOnLatest.length}
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">
              Muster ohne Treffer in der letzten Ziehung
            </h2>
            <p className="text-sm text-muted-foreground">
              Pro Platzierung: aktuelle Nicht-Treffer-Serie und wie oft diese
              Form historisch nicht getroffen wurde.
            </p>
            <div className="overflow-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Muster</TableHead>
                    <TableHead>Zahlen</TableHead>
                    <TableHead>Aktuelle Serie</TableHead>
                    <TableHead>Hist. Nicht-Treffer</TableHead>
                    <TableHead>Häufigste vergangene Serie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.missedOnLatest.map((item) => (
                    <TableRow key={item.resultId}>
                      <TableCell>{item.shapeName}</TableCell>
                      <TableCell className="tabular-nums">
                        {item.values.join(" · ")}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {item.currentMissStreak}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {item.historicalMissCount}/{item.historicalDrawCount} (
                        {pct(item.historicalMissRate)})
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {item.missStreakFrequencies[0]
                          ? `${item.missStreakFrequencies[0].missCount}× Pause (${pct(item.missStreakFrequencies[0].share)})`
                          : "—"}
                      </TableCell>
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
