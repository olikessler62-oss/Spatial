"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  AnalysisCatalog,
  AnalysisDomain,
  AnalysisScope,
  AnalysisSubject,
} from "@/lib/analysis/catalog";

const STORAGE_KEY = "spatial.analysis-context.v1";

interface AnalysisContextValue {
  readonly catalog: AnalysisCatalog;
  readonly domainId: string;
  readonly scopeId: string;
  readonly subjectId: string;
  readonly domain: AnalysisDomain | null;
  readonly scope: AnalysisScope | null;
  readonly subject: AnalysisSubject | null;
  readonly hydrated: boolean;
  readonly setDomainId: (domainId: string) => void;
  readonly setScopeId: (scopeId: string) => void;
  readonly setSubjectId: (subjectId: string) => void;
  readonly applySelection: (selection: {
    domainId: string;
    scopeId: string;
    subjectId: string;
  }) => void;
}

const AnalysisContext = createContext<AnalysisContextValue | null>(null);

function readStoredSelection(): {
  domainId?: string;
  scopeId?: string;
  subjectId?: string;
} {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as {
      domainId?: string;
      scopeId?: string;
      subjectId?: string;
    }) : {};
  } catch {
    return {};
  }
}

export function AnalysisContextProvider({
  catalog,
  children,
}: {
  catalog: AnalysisCatalog;
  children: ReactNode;
}) {
  const enabledDomains = catalog.domains.filter((domain) => domain.enabled);
  const defaultDomainId = enabledDomains[0]?.id ?? "";

  const [domainId, setDomainIdState] = useState(defaultDomainId);
  const [scopeId, setScopeIdState] = useState("");
  const [subjectId, setSubjectIdState] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredSelection();
    const nextDomain =
      catalog.domains.find(
        (domain) => domain.enabled && domain.id === stored.domainId,
      )?.id
      ?? defaultDomainId;

    const scopesForDomain = catalog.scopes.filter(
      (scope) => scope.domainId === nextDomain,
    );
    const nextScope =
      scopesForDomain.find((scope) => scope.id === stored.scopeId)?.id
      ?? scopesForDomain[0]?.id
      ?? "";

    const subjectsForScope = catalog.subjects.filter(
      (subject) => subject.scopeId === nextScope,
    );
    const nextSubject =
      subjectsForScope.find((subject) => subject.id === stored.subjectId)?.id
      ?? subjectsForScope[0]?.id
      ?? "";

    setDomainIdState(nextDomain);
    setScopeIdState(nextScope);
    setSubjectIdState(nextSubject);
    setHydrated(true);
  }, [catalog, defaultDomainId]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ domainId, scopeId, subjectId }),
    );
  }, [domainId, scopeId, subjectId, hydrated]);

  const scopesForDomain = useMemo(
    () => catalog.scopes.filter((scope) => scope.domainId === domainId),
    [catalog.scopes, domainId],
  );

  const subjectsForScope = useMemo(
    () => catalog.subjects.filter((subject) => subject.scopeId === scopeId),
    [catalog.subjects, scopeId],
  );

  const value = useMemo<AnalysisContextValue>(() => {
    const domain =
      catalog.domains.find((entry) => entry.id === domainId) ?? null;
    const scope =
      scopesForDomain.find((entry) => entry.id === scopeId) ?? null;
    const subject =
      subjectsForScope.find((entry) => entry.id === subjectId) ?? null;

    return {
      catalog,
      domainId,
      scopeId,
      subjectId,
      domain,
      scope,
      subject,
      hydrated,
      setDomainId(nextDomainId: string) {
        const nextScopes = catalog.scopes.filter(
          (entry) => entry.domainId === nextDomainId,
        );
        const nextScopeId = nextScopes[0]?.id ?? "";
        const nextSubjects = catalog.subjects.filter(
          (entry) => entry.scopeId === nextScopeId,
        );

        setDomainIdState(nextDomainId);
        setScopeIdState(nextScopeId);
        setSubjectIdState(nextSubjects[0]?.id ?? "");
      },
      setScopeId(nextScopeId: string) {
        const nextSubjects = catalog.subjects.filter(
          (entry) => entry.scopeId === nextScopeId,
        );

        setScopeIdState(nextScopeId);
        setSubjectIdState(nextSubjects[0]?.id ?? "");
      },
      setSubjectId(nextSubjectId: string) {
        setSubjectIdState(nextSubjectId);
      },
      applySelection(selection) {
        setDomainIdState(selection.domainId);
        setScopeIdState(selection.scopeId);
        setSubjectIdState(selection.subjectId);
      },
    };
  }, [
    catalog,
    domainId,
    scopeId,
    subjectId,
    hydrated,
    scopesForDomain,
    subjectsForScope,
  ]);

  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysisContext(): AnalysisContextValue {
  const value = useContext(AnalysisContext);

  if (!value) {
    throw new Error("useAnalysisContext must be used within AnalysisContextProvider");
  }

  return value;
}
