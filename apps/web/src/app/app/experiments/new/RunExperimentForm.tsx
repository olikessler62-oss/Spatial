"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";

import { createAndRunExperiment } from "../../actions";
import { useAnalysisContext } from "@/context/AnalysisContext";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface LotteryOption {
  id: string;
  name: string;
}

export interface DatasetVersionOption {
  id: string;
  label: string;
  lotteryId: string;
  eventCount: number;
}

export interface LayoutVersionOption {
  id: string;
  label: string;
  lotteryId: string;
}

export interface ShapeVersionOption {
  id: string;
  label: string;
}

function isNextRedirectError(error: unknown): boolean {
  return (
    typeof error === "object"
    && error !== null
    && "digest" in error
    && typeof error.digest === "string"
    && error.digest.startsWith("NEXT_REDIRECT")
  );
}

export function RunExperimentForm({
  lotteries,
  datasetVersions,
  layoutVersions,
  shapeVersions,
}: {
  lotteries: readonly LotteryOption[];
  datasetVersions: readonly DatasetVersionOption[];
  layoutVersions: readonly LayoutVersionOption[];
  shapeVersions: readonly ShapeVersionOption[];
}) {
  const { subjectId, setSubjectId } = useAnalysisContext();
  const initialLotteryId =
    lotteries.find((lottery) => lottery.id === subjectId)?.id
    ?? lotteries[0]?.id
    ?? "";

  const [lotteryId, setLotteryId] = useState(initialLotteryId);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredDatasets = useMemo(
    () =>
      datasetVersions.filter(
        (dataset) => dataset.lotteryId === lotteryId,
      ),
    [datasetVersions, lotteryId],
  );

  const filteredLayouts = useMemo(
    () =>
      layoutVersions.filter(
        (layout) => layout.lotteryId === lotteryId,
      ),
    [layoutVersions, lotteryId],
  );

  const [datasetVersionId, setDatasetVersionId] = useState(
    () =>
      datasetVersions.find((dataset) => dataset.lotteryId === initialLotteryId)
        ?.id
      ?? "",
  );
  const [layoutVersionId, setLayoutVersionId] = useState(
    () =>
      layoutVersions.find((layout) => layout.lotteryId === initialLotteryId)
        ?.id
      ?? "",
  );
  const [shapeVersionId, setShapeVersionId] = useState(
    shapeVersions[0]?.id ?? "",
  );

  useEffect(() => {
    if (!subjectId || subjectId === lotteryId) {
      return;
    }

    if (!lotteries.some((lottery) => lottery.id === subjectId)) {
      return;
    }

    handleLotteryChange(subjectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync from sidebar context only
  }, [subjectId]);

  function handleLotteryChange(nextLotteryId: string) {
    setLotteryId(nextLotteryId);
    setSubjectId(nextLotteryId);

    const nextDatasets = datasetVersions.filter(
      (dataset) => dataset.lotteryId === nextLotteryId,
    );
    const nextLayouts = layoutVersions.filter(
      (layout) => layout.lotteryId === nextLotteryId,
    );

    setDatasetVersionId(nextDatasets[0]?.id ?? "");
    setLayoutVersionId(nextLayouts[0]?.id ?? "");
  }

  function handleSubmit(formData: FormData) {
    setError(null);

    startTransition(async () => {
      try {
        await createAndRunExperiment(formData);
      } catch (submitError) {
        if (isNextRedirectError(submitError)) {
          throw submitError;
        }

        setError(
          submitError instanceof Error
            ? submitError.message
            : "Die Analyse konnte nicht gestartet werden.",
        );
      }
    });
  }

  return (
    <form
      className="flex max-w-xl flex-col gap-4 rounded-xl border border-border bg-card p-6"
      action={handleSubmit}
    >
      {error && (
        <div role="alert">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Zum Beispiel: EuroJackpot Quadrat-Analyse"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="lotteryId">Lottery</Label>
        <NativeSelect
          id="lotteryId"
          name="lotteryId"
          required
          value={lotteryId}
          onChange={(event) => handleLotteryChange(event.target.value)}
        >
          {lotteries.map((lottery) => (
            <option
              key={lottery.id}
              value={lottery.id}
            >
              {lottery.name}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="datasetVersionId">Dataset / Ziehungen</Label>
        <NativeSelect
          id="datasetVersionId"
          name="datasetVersionId"
          required
          value={datasetVersionId}
          onChange={(event) => setDatasetVersionId(event.target.value)}
        >
          {filteredDatasets.length === 0 ? (
            <option value="" disabled>
              Keine Dataset-Version für diese Lottery
            </option>
          ) : (
            filteredDatasets.map((dataset) => (
              <option
                key={dataset.id}
                value={dataset.id}
              >
                {dataset.label}
              </option>
            ))
          )}
        </NativeSelect>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="layoutVersionId">Layout</Label>
        <NativeSelect
          id="layoutVersionId"
          name="layoutVersionId"
          required
          value={layoutVersionId}
          onChange={(event) => setLayoutVersionId(event.target.value)}
        >
          {filteredLayouts.length === 0 ? (
            <option value="" disabled>
              Kein Layout für diese Lottery
            </option>
          ) : (
            filteredLayouts.map((layout) => (
              <option
                key={layout.id}
                value={layout.id}
              >
                {layout.label}
              </option>
            ))
          )}
        </NativeSelect>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="shapeVersionId">Form</Label>
        <NativeSelect
          id="shapeVersionId"
          name="shapeVersionId"
          required
          value={shapeVersionId}
          onChange={(event) => setShapeVersionId(event.target.value)}
        >
          {shapeVersions.map((shape) => (
            <option
              key={shape.id}
              value={shape.id}
            >
              {shape.label}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Beschreibung</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Optionale Beschreibung"
        />
      </div>

      <div className="flex items-center gap-3">
        <Link
          className={cn(buttonVariants({ variant: "outline" }))}
          href="/app/experiments"
        >
          Abbrechen
        </Link>

        <Button
          type="submit"
          disabled={
            isPending
            || !datasetVersionId
            || !layoutVersionId
            || !shapeVersionId
          }
        >
          {isPending ? "Analyse läuft ..." : "Analyse starten"}
        </Button>
      </div>
    </form>
  );
}
