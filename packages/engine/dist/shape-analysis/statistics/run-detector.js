export function resolveBoundaryStatus(startIndex, endIndex, cardCount) {
    const touchesLeft = startIndex === 0;
    const touchesRight = endIndex === cardCount - 1;
    if (touchesLeft && touchesRight) {
        return "both-censored";
    }
    if (touchesLeft) {
        return "left-censored";
    }
    if (touchesRight) {
        return "right-censored";
    }
    return "complete";
}
/**
 * Detect contiguous free runs from a presence sequence (true = free).
 * Cards must already be sorted oldest → newest.
 */
export function detectShapeRuns(options) {
    const { cards, presence, nextId } = options;
    const runs = [];
    let activeStart = null;
    const closeRun = (endIndex) => {
        if (activeStart === null) {
            return;
        }
        const startCard = cards[activeStart];
        const endCard = cards[endIndex];
        if (startCard === undefined || endCard === undefined) {
            activeStart = null;
            return;
        }
        const boundaryStatus = resolveBoundaryStatus(activeStart, endIndex, cards.length);
        runs.push({
            id: nextId(),
            startCardId: startCard.id,
            endCardId: endCard.id,
            startChronologicalIndex: startCard.chronologicalIndex,
            endChronologicalIndex: endCard.chronologicalIndex,
            length: endIndex - activeStart + 1,
            boundaryStatus,
            isComplete: boundaryStatus === "complete",
        });
        activeStart = null;
    };
    for (let index = 0; index < presence.length; index += 1) {
        const isFree = presence[index] === true;
        if (isFree) {
            if (activeStart === null) {
                activeStart = index;
            }
            continue;
        }
        if (activeStart !== null) {
            closeRun(index - 1);
        }
    }
    if (activeStart !== null) {
        closeRun(presence.length - 1);
    }
    return runs;
}
//# sourceMappingURL=run-detector.js.map