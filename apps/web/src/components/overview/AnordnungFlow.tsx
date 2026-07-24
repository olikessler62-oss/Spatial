"use client";

import { useState } from "react";

import { AnordnungEditor } from "@/components/overview/AnordnungEditor";
import {
  AnordnungPicker,
  type AnordnungEditTarget,
} from "@/components/overview/AnordnungPicker";
import { AnordnungFormatModal } from "@/components/overview/AnordnungFormatModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocale } from "@/context/LocaleContext";
import type { NumberSpace } from "@/lib/analysis/catalog";
import { ANORDNUNG_CUSTOM_ID } from "@/lib/overview/anordnungOptions";
import type { AppliedRasterForm } from "@/lib/overview/rasterForm";

type AnordnungFlowProps = {
  readonly open: boolean;
  readonly numberSpace: NumberSpace | null;
  readonly lotteryId: string;
  readonly initialForm: AppliedRasterForm | null;
  readonly initialGrid: number[][] | null;
  readonly closeAllowed: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onCloseGateChange: (canClose: boolean) => void;
  readonly onApply: (form: AppliedRasterForm, grid: number[][]) => void;
};

type FlowView = "picker" | "edit";

function editTargetKey(target: AnordnungEditTarget): string {
  const form = target.form;
  const formKey =
    form.kind === "grid"
      ? `grid-${form.rows}x${form.columns}`
      : `ring-${form.size}`;
  return `${target.selectionId}-${formKey}-${target.grid ? "filled" : "empty"}`;
}

export function AnordnungFlow({
  open,
  numberSpace,
  lotteryId,
  initialForm,
  initialGrid,
  closeAllowed,
  onOpenChange,
  onCloseGateChange,
  onApply,
}: AnordnungFlowProps) {
  const { t } = useLocale();
  const [view, setView] = useState<FlowView>("picker");
  const [sizeOpen, setSizeOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AnordnungEditTarget | null>(null);
  const [editReady, setEditReady] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (!next && view === "edit" && !closeAllowed) {
      return;
    }
    if (!next && sizeOpen) {
      setSizeOpen(false);
      return;
    }
    if (!next) {
      setView("picker");
      setSizeOpen(false);
      setEditTarget(null);
      setEditReady(false);
      onCloseGateChange(true);
    }
    onOpenChange(next);
  };

  const openEdit = (target: AnordnungEditTarget) => {
    setSizeOpen(false);
    setEditReady(false);
    setEditTarget(target);
    setView("edit");
    onCloseGateChange(true);
  };

  const backToPicker = () => {
    setView("picker");
    setSizeOpen(false);
    setEditTarget(null);
    setEditReady(false);
    onCloseGateChange(true);
  };

  const editActive = open && view === "edit" && Boolean(editTarget) && Boolean(numberSpace);
  const editorKey = editTarget ? editTargetKey(editTarget) : "none";

  return (
    <>
      <Dialog
        open={open && view === "picker"}
        onOpenChange={handleOpenChange}
      >
        <DialogContent
          className="overview1-glass-modal overview1-glass-modal--anordnung overview1-glass-modal--anordnung-picker sm:max-w-3xl"
          showCloseButton={!sizeOpen}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{t("pattern.pickerTitle")}</DialogTitle>
          </DialogHeader>
          {open && numberSpace ? (
            <AnordnungPicker
              key={`picker-${lotteryId}-${numberSpace.size}`}
              lotteryId={lotteryId}
              numberSpace={numberSpace}
              initialForm={initialForm}
              initialGrid={initialGrid}
              onCancel={() => handleOpenChange(false)}
              onApply={(draft) => {
                onApply(draft.form, draft.grid);
                handleOpenChange(false);
              }}
              onEdit={openEdit}
              onRequestNewCustom={() => setSizeOpen(true)}
            />
          ) : open ? (
            <p className="overview1-anordnung-editor__error">
              {t("pattern.needContext")}
            </p>
          ) : null}

          {sizeOpen && numberSpace ? (
            <div
              className="overview1-anordnung-size-layer"
              role="presentation"
            >
              <button
                type="button"
                className="overview1-anordnung-size-layer__backdrop"
                aria-label={t("pattern.formatClose")}
                onClick={() => setSizeOpen(false)}
              />
              <div
                className="overview1-anordnung-size-layer__card overview1-glass-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="anordnung-size-title"
              >
                <AnordnungFormatModal
                  key={`format-${lotteryId}-${numberSpace.size}`}
                  numberSpace={numberSpace}
                  lotteryId={lotteryId}
                  onCancel={() => setSizeOpen(false)}
                  onConfirm={(choice) => {
                    if (choice.kind === "circle") {
                      openEdit({
                        mode: "circle",
                        selectionId: ANORDNUNG_CUSTOM_ID,
                        form: { kind: "ring", size: numberSpace.size },
                        grid: null,
                        draftName: choice.name,
                      });
                      return;
                    }
                    openEdit({
                      mode: "custom",
                      selectionId: ANORDNUNG_CUSTOM_ID,
                      form: {
                        kind: "grid",
                        rows: choice.rows,
                        columns: choice.columns,
                        size: numberSpace.size,
                      },
                      grid: null,
                      draftName: choice.name,
                    });
                  }}
                />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {editActive && numberSpace && editTarget && !editReady ? (
        <div className="overview1-anordnung-workshop-prep" aria-hidden="true">
            <AnordnungEditor
              key={`prep-${editorKey}`}
              variant="workshop"
              workshopMode={editTarget.mode}
              lotteryId={lotteryId}
              numberSpace={numberSpace}
              initialForm={editTarget.form}
              initialGrid={editTarget.grid}
              initialSelectionId={editTarget.selectionId}
              initialDraftName={editTarget.draftName}
              onCancel={backToPicker}
              onCloseGateChange={onCloseGateChange}
              onReady={() => setEditReady(true)}
              onApply={(form, grid) => {
                onApply(form, grid);
                handleOpenChange(false);
              }}
            />
          </div>
      ) : null}

      <Dialog
        open={editActive && editReady}
        onOpenChange={(next) => {
          if (!next) {
            if (!closeAllowed) {
              return;
            }
            backToPicker();
            return;
          }
        }}
      >
        <DialogContent
          className="overview1-glass-modal overview1-glass-modal--anordnung overview1-glass-modal--anordnung-workshop sm:max-w-[calc(56rem+100px)]"
          showCloseButton={closeAllowed}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>
              {editTarget?.draftName
                ? t("pattern.createTitle")
                : t("pattern.editTitle")}
            </DialogTitle>
          </DialogHeader>
          {editActive && editReady && numberSpace && editTarget ? (
            <AnordnungEditor
              key={`edit-${editorKey}`}
              variant="workshop"
              workshopMode={editTarget.mode}
              lotteryId={lotteryId}
              numberSpace={numberSpace}
              initialForm={editTarget.form}
              initialGrid={editTarget.grid}
              initialSelectionId={editTarget.selectionId}
              initialDraftName={editTarget.draftName}
              onCancel={backToPicker}
              onCloseGateChange={onCloseGateChange}
              onApply={(form, grid) => {
                onApply(form, grid);
                handleOpenChange(false);
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
