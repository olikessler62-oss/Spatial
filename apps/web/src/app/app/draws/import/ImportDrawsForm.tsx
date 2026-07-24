"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  importDraws,
  type ImportDrawsState,
} from "../../actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";

const initialState: ImportDrawsState | null = null;

interface DatasetOption {
  id: string;
  name: string;
}

export function ImportDrawsForm({
  datasets,
}: {
  datasets: readonly DatasetOption[];
}) {
  const [state, formAction, isPending] = useActionState(
    importDraws,
    initialState,
  );

  return (
    <>
      {state?.error && (
        <div role="alert">
          {state.error}
        </div>
      )}

      {state && !state.error && (
        <div role="status">
          <p>
            CSV-Zeilen: {state.receivedRows}
          </p>

          <p>
            Gültig: {state.acceptedRows}
          </p>

          <p>
            Ungültig: {state.rejectedRows}
          </p>

          <p>
            Neu importiert: {state.importedRows}
          </p>

          <p>
            Bereits vorhanden: {state.skippedRows}
          </p>
        </div>
      )}

      <form
        className="flex max-w-xl flex-col gap-4"
        action={formAction}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="datasetId">Dataset</Label>
          <NativeSelect
            id="datasetId"
            name="datasetId"
            required
            key={state?.datasetId ?? "dataset-default"}
            defaultValue={
              state?.datasetId
              ?? datasets.find((dataset) =>
                dataset.name.includes("Lotto 6 aus 49"),
              )?.id
              ?? datasets[0]?.id
              ?? ""
            }
          >
            {datasets.map((dataset) => (
              <option
                key={dataset.id}
                value={dataset.id}
              >
                {dataset.name}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="file">Importdatei</Label>
          <input
            id="file"
            type="file"
            name="file"
            accept=".csv,text/csv"
            required
            className="block w-full cursor-pointer rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium"
          />
        </div>

        <div className="flex items-center gap-3">
          <Link
            className={cn(buttonVariants({ variant: "outline" }))}
            href="/app/draws"
          >
            Abbrechen
          </Link>

          <Button
            type="submit"
            disabled={isPending || datasets.length === 0}
          >
            {isPending
              ? "Datei wird importiert ..."
              : "Datei importieren"}
          </Button>
        </div>
      </form>
    </>
  );
}
