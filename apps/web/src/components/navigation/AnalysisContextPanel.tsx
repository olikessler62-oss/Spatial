"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { useAnalysisContext } from "@/context/AnalysisContext";
import { useLocale } from "@/context/LocaleContext";
import { useOverview1Ui } from "@/context/Overview1UiContext";
import {
  localizedDomainLabel,
  localizedScopeLabel,
} from "@/lib/i18n/catalogLabels";
import { cn } from "@/lib/utils";

export function AnalysisContextPanel() {
  const {
    catalog,
    domainId,
    scopeId,
    subjectId,
    applySelection,
  } = useAnalysisContext();
  const { t } = useLocale();
  const {
    contextEditorOpen,
    closeContextEditor,
  } = useOverview1Ui();

  const [portalReady, setPortalReady] = useState(false);
  const [draftDomainId, setDraftDomainId] = useState(domainId);
  const [draftScopeId, setDraftScopeId] = useState(scopeId);
  const [draftSubjectId, setDraftSubjectId] = useState(subjectId);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!contextEditorOpen) {
      return;
    }

    setDraftDomainId(domainId);
    setDraftScopeId(scopeId);
    setDraftSubjectId(subjectId);
  }, [contextEditorOpen, domainId, scopeId, subjectId]);

  const draftScopes = useMemo(
    () => catalog.scopes.filter((scope) => scope.domainId === draftDomainId),
    [catalog.scopes, draftDomainId],
  );

  const draftSubjects = useMemo(
    () =>
      catalog.subjects.filter((subject) => subject.scopeId === draftScopeId),
    [catalog.subjects, draftScopeId],
  );

  const draftSubject = draftSubjects.find(
    (subject) => subject.id === draftSubjectId,
  ) ?? null;

  function handleDraftDomainChange(nextDomainId: string) {
    const nextScopes = catalog.scopes.filter(
      (scope) => scope.domainId === nextDomainId,
    );
    const nextScopeId = nextScopes[0]?.id ?? "";
    const nextSubjects = catalog.subjects.filter(
      (subject) => subject.scopeId === nextScopeId,
    );

    setDraftDomainId(nextDomainId);
    setDraftScopeId(nextScopeId);
    setDraftSubjectId(nextSubjects[0]?.id ?? "");
  }

  function handleDraftScopeChange(nextScopeId: string) {
    const nextSubjects = catalog.subjects.filter(
      (subject) => subject.scopeId === nextScopeId,
    );

    setDraftScopeId(nextScopeId);
    setDraftSubjectId(nextSubjects[0]?.id ?? "");
  }

  function handleCancel() {
    closeContextEditor();
  }

  function handleConfirm() {
    applySelection({
      domainId: draftDomainId,
      scopeId: draftScopeId,
      subjectId: draftSubjectId,
    });
    closeContextEditor();
  }

  const slide =
    portalReady
      ? createPortal(
          <div
            className={
              contextEditorOpen
                ? "overview1-pattern-editor-slide overview1-pattern-editor-slide--context overview1-pattern-editor-slide--open"
                : "overview1-pattern-editor-slide overview1-pattern-editor-slide--context"
            }
            aria-hidden={!contextEditorOpen}
          >
            <button
              type="button"
              className="overview1-pattern-editor-slide__close"
              aria-label={t("context.close")}
              onClick={closeContextEditor}
            >
              ×
            </button>

            {contextEditorOpen ? (
              <section className="overview1-context-editor">
                <header className="overview1-context-editor__header">
                  <h2 className="overview1-context-editor__title">
                    {t("context.open")}
                  </h2>
                </header>

                <div className="overview1-context-editor__fields">
                  <label className="overview1-context-editor__field">
                    <span className="overview1-context-editor__label">
                      {t("context.domain")}
                    </span>
                    <select
                      className="overview1-context-editor__select"
                      value={draftDomainId}
                      onChange={(event) =>
                        handleDraftDomainChange(event.target.value)
                      }
                    >
                      {catalog.domains.map((domain) => (
                        <option
                          key={domain.id}
                          value={domain.id}
                          disabled={!domain.enabled}
                        >
                          {localizedDomainLabel(domain.id, domain.label, t)}
                          {!domain.enabled ? t("context.comingSoon") : ""}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="overview1-context-editor__field">
                    <span className="overview1-context-editor__label">
                      {t("context.scope")}
                    </span>
                    <select
                      className="overview1-context-editor__select"
                      value={draftScopeId}
                      onChange={(event) =>
                        handleDraftScopeChange(event.target.value)
                      }
                      disabled={draftScopes.length === 0}
                    >
                      {draftScopes.length === 0 ? (
                        <option value="">{t("context.noScopes")}</option>
                      ) : (
                        draftScopes.map((scope) => (
                          <option
                            key={scope.id}
                            value={scope.id}
                          >
                            {localizedScopeLabel(scope.id, scope.label, t)}
                          </option>
                        ))
                      )}
                    </select>
                  </label>

                  <label className="overview1-context-editor__field">
                    <span className="overview1-context-editor__label">
                      {t("context.subject")}
                    </span>
                    <select
                      className="overview1-context-editor__select"
                      value={draftSubjectId}
                      onChange={(event) =>
                        setDraftSubjectId(event.target.value)
                      }
                      disabled={draftSubjects.length === 0}
                    >
                      {draftSubjects.length === 0 ? (
                        <option value="">{t("context.noSubjects")}</option>
                      ) : (
                        draftSubjects.map((entry) => (
                          <option
                            key={entry.id}
                            value={entry.id}
                          >
                            {entry.label}
                          </option>
                        ))
                      )}
                    </select>
                  </label>

                  {draftSubject ? (
                    <p className="overview1-context-editor__meta">
                      {t("context.numberSpace", {
                        min: String(draftSubject.numberSpace.minimumValue),
                        max: String(draftSubject.numberSpace.maximumValue),
                        count: String(draftSubject.numberSpace.size),
                      })}
                    </p>
                  ) : null}
                </div>

                <footer className="overview1-context-editor__footer">
                  <button
                    type="button"
                    className="overview1-raster-editor__btn"
                    onClick={handleCancel}
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="button"
                    className="overview1-raster-editor__btn overview1-raster-editor__btn--primary"
                    disabled={!draftSubjectId}
                    onClick={handleConfirm}
                  >
                    {t("common.apply")}
                  </button>
                </footer>
              </section>
            ) : null}
          </div>,
          document.body,
        )
      : null;

  return slide;
}

export function AnalysisContextOpenButton({
  className,
}: {
  readonly className?: string;
}) {
  const { contextEditorOpen, toggleContextEditor } = useOverview1Ui();
  const { t } = useLocale();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn(className)}
      aria-expanded={contextEditorOpen}
      onClick={toggleContextEditor}
    >
      {contextEditorOpen ? t("context.close") : t("context.open")}
    </Button>
  );
}
