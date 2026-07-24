async function defaultSleep(ms, signal) {
    if (ms <= 0) {
        return;
    }
    await new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(new DOMException("Aborted", "AbortError"));
            return;
        }
        const timer = setTimeout(() => {
            signal?.removeEventListener("abort", onAbort);
            resolve();
        }, ms);
        const onAbort = () => {
            clearTimeout(timer);
            reject(new DOMException("Aborted", "AbortError"));
        };
        signal?.addEventListener("abort", onAbort, { once: true });
    });
}
/**
 * Plays a prepared visualization plan. Does not run analysis.
 */
export async function playShapeVisualizationPlan(plan, options = {}) {
    const sleep = options.sleep ?? defaultSleep;
    for (const step of plan.steps) {
        if (options.signal?.aborted) {
            throw new DOMException("Aborted", "AbortError");
        }
        await sleep(step.delayAfterPreviousMs, options.signal);
        options.onStep?.(step);
    }
}
//# sourceMappingURL=visualization-runner.js.map