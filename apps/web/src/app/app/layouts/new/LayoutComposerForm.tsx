"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { createLayout } from "../../actions";
import { useAnalysisContext } from "@/context/AnalysisContext";
import { gridPartitions } from "@/lib/analysis/catalog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";

function isNextRedirectError(error: unknown): boolean {
  return (
    typeof error === "object"
    && error !== null
    && "digest" in error
    && typeof error.digest === "string"
    && error.digest.startsWith("NEXT_REDIRECT")
  );
}

export function LayoutComposerForm() {
  const { subject, domain } = useAnalysisContext();
  const [layoutType, setLayoutType] = useState<"grid" | "circle">("grid");
  const [partitionKey, setPartitionKey] = useState("");
  const [orderingMode, setOrderingMode] = useState<"ordered" | "unordered">(
    "ordered",
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const partitions = useMemo(
    () => (subject ? gridPartitions(subject.numberSpace.size) : []),
    [subject],
  );

  const selectedPartition = useMemo(() => {
    if (!partitionKey) {
      return partitions[0] ?? null;
    }

    const [rows, columns] = partitionKey.split("x").map(Number);
    return partitions.find(
      (partition) =>
        partition.rows === rows && partition.columns === columns,
    ) ?? partitions[0] ?? null;
  }, [partitionKey, partitions]);

  if (!subject || domain?.id !== "lottery") {
    return (
      <div className="empty-state">
        <h2>Analysekontext wählen</h2>
        <p>
          Wähle links eine Lottozahlenanalyse mit Land und Lotterie, bevor du
          ein Layout komponierst.
        </p>
      </div>
    );
  }

  const numberSpace = subject.numberSpace;
  const defaultName =
    layoutType === "circle"
      ? `Ring ${numberSpace.size}`
      : selectedPartition
        ? `Raster ${selectedPartition.rows}×${selectedPartition.columns}`
        : "";

  function handleSubmit(formData: FormData) {
    setError(null);

    startTransition(async () => {
      try {
        await createLayout(formData);
      } catch (submitError) {
        if (isNextRedirectError(submitError)) {
          throw submitError;
        }

        setError(
          submitError instanceof Error
            ? submitError.message
            : "Layout konnte nicht gespeichert werden.",
        );
      }
    });
  }

  return (
    <form
      className="flex max-w-xl flex-col gap-4 rounded-xl border border-border bg-card p-6"
      action={handleSubmit}
    >
      {error && <div role="alert">{error}</div>}

      <input
        type="hidden"
        name="lotteryId"
        value={subject.id}
      />
      <input
        type="hidden"
        name="minimumValue"
        value={numberSpace.minimumValue}
      />
      <input
        type="hidden"
        name="maximumValue"
        value={numberSpace.maximumValue}
      />

      <p className="text-sm text-muted-foreground">
        Lotterie {subject.label} · Zahlenraum {numberSpace.minimumValue}–
        {numberSpace.maximumValue}
        {" "}({numberSpace.size} Positionen) · Ziehung {numberSpace.mainValueCount} Zahlen
      </p>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name (Geometrie)</Label>
        <Input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaultName}
          key={defaultName}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="layoutType">Form</Label>
        <NativeSelect
          id="layoutType"
          name="layoutType"
          value={layoutType}
          onChange={(event) =>
            setLayoutType(event.target.value as "grid" | "circle")
          }
        >
          <option value="grid">Raster / Rechteck</option>
          <option value="circle">Ring / Kreis</option>
        </NativeSelect>
      </div>

      {layoutType === "grid" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="partition">Aufteilung (Zeilen × Spalten)</Label>
          <NativeSelect
            id="partition"
            name="partition"
            required
            value={
              selectedPartition
                ? `${selectedPartition.rows}x${selectedPartition.columns}`
                : ""
            }
            onChange={(event) => setPartitionKey(event.target.value)}
          >
            {partitions.map((partition) => (
              <option
                key={`${partition.rows}x${partition.columns}`}
                value={`${partition.rows}x${partition.columns}`}
              >
                {partition.rows}×{partition.columns}
                {" "}(= {partition.rows * partition.columns})
              </option>
            ))}
          </NativeSelect>
          <input
            type="hidden"
            name="rows"
            value={selectedPartition?.rows ?? ""}
          />
          <input
            type="hidden"
            name="columns"
            value={selectedPartition?.columns ?? ""}
          />
        </div>
      )}

      {layoutType === "circle" && (
        <p className="text-sm text-muted-foreground">
          Ring mit genau {numberSpace.size} Positionen auf dem Umfang.
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="orderingMode">Zahlenordnung</Label>
        <NativeSelect
          id="orderingMode"
          name="orderingMode"
          value={orderingMode}
          onChange={(event) =>
            setOrderingMode(event.target.value as "ordered" | "unordered")
          }
        >
          <option value="ordered">Geordnet (deterministisch)</option>
          <option value="unordered">Ungeordnet (einfrieren nach Shuffle)</option>
        </NativeSelect>
      </div>

      {orderingMode === "unordered" && (
        <p className="text-sm text-muted-foreground">
          Die zufällige Zuordnung wird mit dem Layout Version gespeichert und
          bleibt für Experimente reproduzierbar.
        </p>
      )}

      <div className="flex items-center gap-3">
        <Link
          className={cn(buttonVariants({ variant: "outline" }))}
          href="/app/layouts"
        >
          Abbrechen
        </Link>
        <Button
          type="submit"
          disabled={isPending || (layoutType === "grid" && !selectedPartition)}
        >
          {isPending ? "Wird gespeichert ..." : "Layout speichern"}
        </Button>
      </div>
    </form>
  );
}
