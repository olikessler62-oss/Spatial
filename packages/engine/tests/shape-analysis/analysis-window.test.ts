import { describe, expect, it } from "vitest";

import {
  buildAnalysisCardSequence,
  buildForwardFromSelectedSequence,
  buildNewestToSelectedSequence,
  buildThroughSelectedSequence,
  countIgnoredNewerCards,
  countIgnoredOlderCards,
} from "../../src/shape-analysis/analysis-window.js";
import { ShapeAnalysisError } from "../../src/shape-analysis/shape-analysis-error.js";
import { createFilledCard } from "./test-helpers.js";

describe("analysis window", () => {
  const cards = [
    createFilledCard({
      id: "oldest",
      chronologicalIndex: 1,
      rowCount: 3,
      columnCount: 3,
    }),
    createFilledCard({
      id: "mid",
      chronologicalIndex: 2,
      rowCount: 3,
      columnCount: 3,
    }),
    createFilledCard({
      id: "selected",
      chronologicalIndex: 3,
      rowCount: 3,
      columnCount: 3,
    }),
    createFilledCard({
      id: "newer",
      chronologicalIndex: 4,
      rowCount: 3,
      columnCount: 3,
    }),
    createFilledCard({
      id: "newest",
      chronologicalIndex: 5,
      rowCount: 3,
      columnCount: 3,
    }),
  ];

  it("legacy: analyzes selected and older cards newest-first", () => {
    const sequence = buildAnalysisCardSequence(cards, "selected");

    expect(sequence.map((card) => card.id)).toEqual([
      "selected",
      "mid",
      "oldest",
    ]);
    expect(countIgnoredNewerCards(cards, "selected")).toBe(2);
  });

  it("through-selected: oldest → selected ascending; newer ignored", () => {
    const sequence = buildThroughSelectedSequence(cards, "selected");

    expect(sequence.map((card) => card.id)).toEqual([
      "oldest",
      "mid",
      "selected",
    ]);
    expect(countIgnoredNewerCards(cards, "selected")).toBe(2);
  });

  it("forward: analyzes selected through newest, ascending", () => {
    const sequence = buildForwardFromSelectedSequence(cards, "selected");

    expect(sequence.map((card) => card.id)).toEqual([
      "selected",
      "newer",
      "newest",
    ]);
    expect(countIgnoredOlderCards(cards, "selected")).toBe(2);
  });

  it("newest→selected: same window, descending for leftward walk", () => {
    const sequence = buildNewestToSelectedSequence(cards, "selected");

    expect(sequence.map((card) => card.id)).toEqual([
      "newest",
      "newer",
      "selected",
    ]);
  });

  it("forward: ignores older cards", () => {
    const sequence = buildForwardFromSelectedSequence(cards, "newer");

    expect(sequence.map((card) => card.id)).toEqual(["newer", "newest"]);
    expect(sequence.some((card) => card.id === "selected")).toBe(false);
  });

  it("rejects duplicate chronological indices", () => {
    const dupes = [
      createFilledCard({
        id: "a",
        chronologicalIndex: 1,
        rowCount: 2,
        columnCount: 2,
      }),
      createFilledCard({
        id: "b",
        chronologicalIndex: 1,
        rowCount: 2,
        columnCount: 2,
      }),
    ];

    expect(() => buildForwardFromSelectedSequence(dupes, "a")).toThrow(
      ShapeAnalysisError,
    );
  });
});
