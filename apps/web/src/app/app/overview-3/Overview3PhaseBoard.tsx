"use client";

import { useEffect, useState, useTransition } from "react";
import type {
  NumberPhaseType,
  NumberRollingPhaseAnalysis,
  RollingNumberWindowAnalysis,
} from "@spatial/engine";

import { useAnalysisContext } from "@/context/AnalysisContext";
import {
  fetchOverview3PhaseAnalyses,
  type Overview3AnalysisPayload,
} from "@/app/app/overview-3/actions";

const PHASE_LABEL_DE: Record<NumberPhaseType, string> = {
  "short-interval": "Kurzintervallphase",
  normal: "Normalphase",
  "long-interval": "Langintervallphase",
  transition: "Übergangsphase",
  "insufficient-data": "Unzureichende Daten",
};

function phaseClass(phase: NumberPhaseType | undefined): string {
  switch (phase) {
    case "short-interval":
      return "overview3-phase overview3-phase--short";
    case "long-interval":
      return "overview3-phase overview3-phase--long";
    case "transition":
      return "overview3-phase overview3-phase--transition";
    case "insufficient-data":
      return "overview3-phase overview3-phase--insufficient";
    default:
      return "overview3-phase overview3-phase--normal";
  }
}

function formatRate(value: number): string {
  return `${(value * 100).toFixed(1)} %`;
}

function formatNullable(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  return value.toFixed(digits);
}

function MetricSparkline({
  windows,
  pick,
  stroke,
}: {
  readonly windows: readonly RollingNumberWindowAnalysis[];
  readonly pick: (window: RollingNumberWindowAnalysis) => number | null;
  readonly stroke: string;
}) {
  const points = windows
    .map((window, index) => {
      const value = pick(window);
      return value === null || !Number.isFinite(value)
        ? null
        : { index, value };
    })
    .filter((point): point is { index: number; value: number } => point !== null);

  if (points.length < 2) {
    return <p className="overview3-chart-empty">Zu wenig Daten für das Diagramm.</p>;
  }

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const width = 320;
  const height = 72;
  const path = points
    .map((point, order) => {
      const x = (order / (points.length - 1)) * width;
      const y = height - ((point.value - min) / span) * (height - 8) - 4;
      return `${order === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      className="overview3-sparkline"
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      role="img"
      aria-hidden
    >
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.5} />
    </svg>
  );
}

export function Overview3PhaseBoard() {
  const { catalog, subjectId } = useAnalysisContext();
  const [payload, setPayload] = useState<Overview3AnalysisPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [windowSize, setWindowSize] = useState(50);
  const [isPending, startTransition] = useTransition();

  const subject = catalog.subjects.find((entry) => entry.id === subjectId);
  const minimum = subject?.numberSpace.minimumValue ?? 1;
  const maximum = subject?.numberSpace.maximumValue ?? 49;

  useEffect(() => {
    if (!subjectId) {
      setPayload(null);
      return;
    }

    let cancelled = false;
    startTransition(() => {
      void fetchOverview3PhaseAnalyses({
        lotteryIdRaw: subjectId,
        minimumNumber: minimum,
        maximumNumber: maximum,
      }).then((result) => {
        if (cancelled) {
          return;
        }
        if ("error" in result) {
          setError(result.error);
          setPayload(null);
          return;
        }
        setError(null);
        setPayload(result);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [subjectId, minimum, maximum]);

  const analyses = payload?.analyses ?? [];
  const selected = analyses.find(
    (analysis) => analysis.number === selectedNumber,
  ) as NumberRollingPhaseAnalysis | undefined;

  const selectedWindows = selected?.windowsBySize[windowSize] ?? [];

  return (
    <section className="overview3">
      <header className="overview3-header">
        <p className="overview3-header__eyebrow">Übersicht 3</p>
        <h1 className="overview3-header__title">Zeitliche Phasenanalyse</h1>
      </header>

      <aside className="overview3-disclaimer" role="note">
        Die dargestellten Phasen beschreiben ausschließlich historische Veränderungen
        innerhalb der ausgewählten Ziehungen. Sie stellen keine Vorhersage dar und
        verändern nicht die mathematische Wahrscheinlichkeit einer Zahl in der nächsten
        Ziehung.
      </aside>

      {error && <p className="overview3-error">{error}</p>}
      {isPending && <p className="overview3-muted">Berechne Phasenanalyse…</p>}
      {!isPending && !payload && !error && (
        <p className="overview3-muted">
          Keine validierten Ziehungen für die gewählte Lotterie.
        </p>
      )}

      {payload && analyses.length > 0 && (
        <>
          <p className="overview3-muted">
            {payload.drawCount} Ziehungen · Zahlen {payload.minimumNumber}–
            {payload.maximumNumber} · Fenster 25 / 50 / 100
          </p>

          <div className="overview3-table-wrap">
            <table className="overview3-table">
              <thead>
                <tr>
                  <th>Zahl</th>
                  <th>Treffer</th>
                  <th>Aktuell nicht</th>
                  <th>Globaler Median</th>
                  <th>25</th>
                  <th>50</th>
                  <th>100</th>
                </tr>
              </thead>
              <tbody>
                {analyses.map((analysis) => {
                  const assessment = analysis.currentPhaseAssessment;
                  return (
                    <tr
                      key={analysis.number}
                      className={
                        selectedNumber === analysis.number
                          ? "overview3-row overview3-row--active"
                          : "overview3-row"
                      }
                      onClick={() => setSelectedNumber(analysis.number)}
                    >
                      <td>{analysis.number}</td>
                      <td>{analysis.globalStatistics.hitCount}</td>
                      <td>{analysis.globalStatistics.trailingMissStreak}</td>
                      <td>
                        {formatNullable(
                          analysis.globalStatistics.missStreakStatistics.median,
                        )}
                      </td>
                      <td>
                        <span className={phaseClass(assessment.shortTerm?.phaseType)}>
                          {PHASE_LABEL_DE[assessment.shortTerm?.phaseType ?? "insufficient-data"]}
                        </span>
                      </td>
                      <td>
                        <span className={phaseClass(assessment.mediumTerm?.phaseType)}>
                          {PHASE_LABEL_DE[assessment.mediumTerm?.phaseType ?? "insufficient-data"]}
                        </span>
                      </td>
                      <td>
                        <span className={phaseClass(assessment.longTerm?.phaseType)}>
                          {PHASE_LABEL_DE[assessment.longTerm?.phaseType ?? "insufficient-data"]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {selected && (
        <div className="overview3-detail">
          <h2>Zahl {selected.number}</h2>
          <p className="overview3-muted">
            Kombiniert: {selected.currentPhaseAssessment.combinedAssessment.pattern}
          </p>

          <dl className="overview3-stats">
            <div>
              <dt>Gesamttreffer</dt>
              <dd>{selected.globalStatistics.hitCount}</dd>
            </div>
            <div>
              <dt>Globale Trefferquote</dt>
              <dd>{formatRate(selected.globalStatistics.hitRate)}</dd>
            </div>
            <div>
              <dt>Aktuelle Nichttreffer-Serie</dt>
              <dd>{selected.globalStatistics.trailingMissStreak}</dd>
            </div>
            <div>
              <dt>Globaler Median</dt>
              <dd>
                {formatNullable(
                  selected.globalStatistics.missStreakStatistics.median,
                )}
              </dd>
            </div>
            <div>
              <dt>Getrimmter Mittelwert</dt>
              <dd>
                {formatNullable(
                  selected.globalStatistics.missStreakStatistics
                    .trimmedMean10Percent,
                )}
              </dd>
            </div>
            <div>
              <dt>Max. Nichttreffer-Serie</dt>
              <dd>
                {formatNullable(selected.globalStatistics.maximumMissStreak, 0)}
              </dd>
            </div>
          </dl>

          <div className="overview3-window-tabs">
            {[25, 50, 100].map((size) => (
              <button
                key={size}
                type="button"
                className={
                  windowSize === size
                    ? "overview3-tab overview3-tab--active"
                    : "overview3-tab"
                }
                onClick={() => setWindowSize(size)}
              >
                Fenster {size}
              </button>
            ))}
          </div>

          {selectedWindows.length === 0 ? (
            <p className="overview3-muted">
              Weniger Ziehungen als Fenstergröße {windowSize}.
            </p>
          ) : (
            <>
              <div className="overview3-charts">
                <figure>
                  <figcaption>Trefferquote über rollierende Fenster</figcaption>
                  <MetricSparkline
                    windows={selectedWindows}
                    pick={(window) => window.hitRate}
                    stroke="#0f766e"
                  />
                </figure>
                <figure>
                  <figcaption>Median der Nichttreffer-Serien</figcaption>
                  <MetricSparkline
                    windows={selectedWindows}
                    pick={(window) => window.missStreakStatistics.median}
                    stroke="#1d4ed8"
                  />
                </figure>
                <figure>
                  <figcaption>Getrimmter Mittelwert (10 %)</figcaption>
                  <MetricSparkline
                    windows={selectedWindows}
                    pick={(window) =>
                      window.missStreakStatistics.trimmedMean10Percent
                    }
                    stroke="#7c3aed"
                  />
                </figure>
                <figure>
                  <figcaption>Maximale Nichttreffer-Serie</figcaption>
                  <MetricSparkline
                    windows={selectedWindows}
                    pick={(window) => window.missStreakStatistics.maximum}
                    stroke="#b45309"
                  />
                </figure>
              </div>

              <div className="overview3-table-wrap">
                <table className="overview3-table overview3-table--dense">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Ende</th>
                      <th>Treffer</th>
                      <th>Quote</th>
                      <th>Median</th>
                      <th>Trim-Ø</th>
                      <th>Max</th>
                      <th>Trailing</th>
                      <th>Δ Quote</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...selectedWindows].reverse().slice(0, 40).map((window) => (
                      <tr key={`${window.windowStartIndex}-${window.windowEndIndex}`}>
                        <td>
                          {window.windowStartIndex + 1}–{window.windowEndIndex + 1}
                        </td>
                        <td>{window.windowEndDate ?? "—"}</td>
                        <td>{window.hitCount}</td>
                        <td>{formatRate(window.hitRate)}</td>
                        <td>
                          {formatNullable(window.missStreakStatistics.median)}
                        </td>
                        <td>
                          {formatNullable(
                            window.missStreakStatistics.trimmedMean10Percent,
                          )}
                        </td>
                        <td>
                          {formatNullable(
                            window.missStreakStatistics.maximum,
                            0,
                          )}
                        </td>
                        <td>{window.trailingMissStreak}</td>
                        <td>
                          {formatNullable(
                            window.comparisonToGlobal.hitRateDifference * 100,
                          )}{" "}
                          pp
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
