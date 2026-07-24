"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import type { AppliedRasterForm } from "@/lib/overview/rasterForm";

type Overview1UiValue = {
  readonly contextEditorOpen: boolean;
  readonly setContextEditorOpen: (open: boolean) => void;
  readonly openContextEditor: () => void;
  readonly closeContextEditor: () => void;
  readonly toggleContextEditor: () => void;
  readonly anordnungOpen: boolean;
  readonly setAnordnungOpen: (open: boolean) => void;
  readonly openAnordnung: () => void;
  readonly closeAnordnung: () => void;
  readonly toggleAnordnung: () => void;
  readonly appliedRasterForm: AppliedRasterForm | null;
  readonly setAppliedRasterForm: Dispatch<
    SetStateAction<AppliedRasterForm | null>
  >;
  /** Notes for the overview panel session (survive modal close/reopen). */
  readonly panelNotes: string;
  readonly setPanelNotes: (notes: string) => void;
};

const Overview1UiContext = createContext<Overview1UiValue | null>(null);

type PanelKind = "context" | "anordnung";

export function Overview1UiProvider({ children }: { children: ReactNode }) {
  const [contextEditorOpen, setContextEditorOpenState] = useState(false);
  const [anordnungOpen, setAnordnungOpenState] = useState(false);
  const [appliedRasterForm, setAppliedRasterForm] =
    useState<AppliedRasterForm | null>(null);
  const [panelNotes, setPanelNotes] = useState("");

  const closeOthers = useCallback((keep: PanelKind) => {
    if (keep !== "context") {
      setContextEditorOpenState(false);
    }
    if (keep !== "anordnung") {
      setAnordnungOpenState(false);
    }
  }, []);

  const setContextEditorOpen = useCallback(
    (open: boolean) => {
      setContextEditorOpenState(open);
      if (open) {
        closeOthers("context");
      }
    },
    [closeOthers],
  );

  const setAnordnungOpen = useCallback(
    (open: boolean) => {
      setAnordnungOpenState(open);
      if (open) {
        closeOthers("anordnung");
      }
    },
    [closeOthers],
  );

  const openContextEditor = useCallback(
    () => setContextEditorOpen(true),
    [setContextEditorOpen],
  );
  const closeContextEditor = useCallback(
    () => setContextEditorOpen(false),
    [setContextEditorOpen],
  );
  const toggleContextEditor = useCallback(() => {
    setContextEditorOpenState((open) => {
      const next = !open;
      if (next) {
        closeOthers("context");
      }
      return next;
    });
  }, [closeOthers]);

  const openAnordnung = useCallback(
    () => setAnordnungOpen(true),
    [setAnordnungOpen],
  );
  const closeAnordnung = useCallback(
    () => setAnordnungOpen(false),
    [setAnordnungOpen],
  );
  const toggleAnordnung = useCallback(() => {
    setAnordnungOpenState((open) => {
      const next = !open;
      if (next) {
        closeOthers("anordnung");
      }
      return next;
    });
  }, [closeOthers]);

  const value = useMemo(
    () => ({
      contextEditorOpen,
      setContextEditorOpen,
      openContextEditor,
      closeContextEditor,
      toggleContextEditor,
      anordnungOpen,
      setAnordnungOpen,
      openAnordnung,
      closeAnordnung,
      toggleAnordnung,
      appliedRasterForm,
      setAppliedRasterForm,
      panelNotes,
      setPanelNotes,
    }),
    [
      contextEditorOpen,
      setContextEditorOpen,
      openContextEditor,
      closeContextEditor,
      toggleContextEditor,
      anordnungOpen,
      setAnordnungOpen,
      openAnordnung,
      closeAnordnung,
      toggleAnordnung,
      appliedRasterForm,
      panelNotes,
    ],
  );

  return (
    <Overview1UiContext.Provider value={value}>
      {children}
    </Overview1UiContext.Provider>
  );
}

export function useOverview1Ui(): Overview1UiValue {
  const value = useContext(Overview1UiContext);
  if (!value) {
    throw new Error("useOverview1Ui must be used within Overview1UiProvider");
  }
  return value;
}

export function useOverview1UiOptional(): Overview1UiValue | null {
  return useContext(Overview1UiContext);
}
