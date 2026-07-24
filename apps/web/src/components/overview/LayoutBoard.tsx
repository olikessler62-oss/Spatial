import type { LayoutDisplayModel } from "@/lib/overview/resolveLayoutDisplay";

export function LayoutBoard({
  model,
  title,
}: {
  model: LayoutDisplayModel;
  title?: string;
}) {
  if (model.form === "unsupported") {
    return (
      <div className="empty-state">
        <h2>Form noch nicht unterstützt</h2>
        <p>
          Diese Layout-Form kann in Übersicht 1 noch nicht dargestellt werden.
        </p>
      </div>
    );
  }

  if (model.cells.length === 0) {
    return (
      <div className="empty-state">
        <h2>Keine Positionen</h2>
        <p>Für dieses Layout sind keine Zahlen hinterlegt.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {title ? (
        <p className="text-sm text-muted-foreground">{title}</p>
      ) : null}

      {model.form === "grid" ? (
        <div
          className="mx-auto w-fit rounded-xl border border-border bg-card p-4 shadow-md"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${model.columns}, minmax(2.5rem, 3rem))`,
            gap: "0.35rem",
          }}
        >
          {model.cells.map((cell) => (
            <div
              key={`${cell.index}-${cell.value}`}
              className="flex aspect-square items-center justify-center rounded-md border border-border bg-background text-sm font-semibold tabular-nums"
            >
              {cell.value}
            </div>
          ))}
        </div>
      ) : (
        <div className="mx-auto aspect-square w-full max-w-md rounded-xl border border-border bg-card p-4 shadow-md">
          <div className="relative h-full w-full">
            {model.cells.map((cell) => (
              <div
                key={`${cell.index}-${cell.value}`}
                className="absolute flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-xs font-semibold tabular-nums shadow-sm"
                style={{
                  left: `${(cell.x ?? 0.5) * 100}%`,
                  top: `${(cell.y ?? 0.5) * 100}%`,
                }}
              >
                {cell.value}
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Zahlenraum {model.minimumValue}–{model.maximumValue}
        {" · "}
        {model.form === "grid"
          ? `Raster ${model.rows}×${model.columns}`
          : `Ring ${model.cells.length}`}
      </p>
    </div>
  );
}
