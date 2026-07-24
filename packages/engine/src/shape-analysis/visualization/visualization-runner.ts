import type {
  ShapeVisualizationPlan,
  ShapeVisualizationStep,
} from "./visualization-types.js";

export interface ShapeVisualizationRunnerOptions {
  readonly signal?: AbortSignal;
  readonly onStep?: (step: ShapeVisualizationStep) => void;
  readonly sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
}

async function defaultSleep(
  ms: number,
  signal?: AbortSignal,
): Promise<void> {
  if (ms <= 0) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    const onAbort = (): void => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * Plays a prepared visualization plan. Does not run analysis.
 */
export async function playShapeVisualizationPlan(
  plan: ShapeVisualizationPlan,
  options: ShapeVisualizationRunnerOptions = {},
): Promise<void> {
  const sleep = options.sleep ?? defaultSleep;

  for (const step of plan.steps) {
    if (options.signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    await sleep(step.delayAfterPreviousMs, options.signal);
    options.onStep?.(step);
  }
}
