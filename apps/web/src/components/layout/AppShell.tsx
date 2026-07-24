"use client";

import { Info, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";

import { AnalysisContextPanel } from "@/components/navigation/AnalysisContextPanel";
import { LanguageSelect } from "@/components/navigation/LanguageSelect";
import {
  Overview1LayoutSidebarSelect,
  type Overview1LayoutOption,
} from "@/components/overview/Overview1LayoutSidebarSelect";
import { Overview1Theme } from "@/components/overview/Overview1Theme";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  AnalysisContextProvider,
  useAnalysisContext,
} from "@/context/AnalysisContext";
import { LocaleProvider, useLocale } from "@/context/LocaleContext";
import {
  Overview1UiProvider,
  useOverview1Ui,
} from "@/context/Overview1UiContext";
import type { AnalysisCatalog } from "@/lib/analysis/catalog";
import type { ViewerProfile } from "@/lib/auth/roles";
import { isAdminRole } from "@/lib/auth/roles";
import { localizedScopeLabel } from "@/lib/i18n/catalogLabels";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/app/actions";

function Topbar({ viewer }: { viewer: ViewerProfile | null }) {
  const { scope, subject, hydrated } = useAnalysisContext();
  const { t } = useLocale();
  const pathname = usePathname();

  const parts = hydrated
    ? [
        scope
          ? localizedScopeLabel(scope.id, scope.label, t)
          : null,
        subject?.label ?? null,
      ].filter(Boolean)
    : [];
  const nextParam = encodeURIComponent(pathname || "/app/overview-1");

  return (
    <header className="app-topbar">
      <div className="app-topbar__left">
        {parts.length > 0 && (
          <span className="app-topbar__context" style={{ color: "#b4afd3" }}>
            {parts.join(" ")}
          </span>
        )}
      </div>

      <div className="app-topbar__right">
        {viewer ? (
          <div className="flex items-center gap-2">
            <Link
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              href="/app/account"
            >
              {t("nav.account")}
            </Link>
            <form action={signOut}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
              >
                {t("nav.signOut")}
              </Button>
            </form>
            <LanguageSelect />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              href={`/login?next=${nextParam}`}
            >
              {t("nav.signIn")}
            </Link>
            <Link
              className={cn(buttonVariants({ size: "sm" }))}
              href={`/register?next=${nextParam}`}
            >
              {t("nav.register")}
            </Link>
            <LanguageSelect />
          </div>
        )}
      </div>
    </header>
  );
}

function LotteryNavButton() {
  const { t } = useLocale();
  const { contextEditorOpen, toggleContextEditor } = useOverview1Ui();

  return (
    <button
      type="button"
      className="app-sidebar__nav-button app-sidebar__lottery-button"
      aria-expanded={contextEditorOpen}
      onClick={toggleContextEditor}
    >
      {t("nav.lottery")}
    </button>
  );
}

function Overview1SubHeader() {
  const { t } = useLocale();

  return (
    <div className="app-subheader">
      <div className="app-subheader__right">
        <button
          type="button"
          className="app-subheader__icon-btn"
          aria-label={t("nav.info")}
          title={t("nav.info")}
        >
          <Info aria-hidden size={16} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          className="app-subheader__icon-btn"
          aria-label={t("nav.settings")}
          title={t("nav.settings")}
        >
          <Settings aria-hidden size={16} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

function AdminSubmenu() {
  const pathname = usePathname();
  const { t } = useLocale();
  const adminActive =
    pathname.startsWith("/app/admin") || pathname.startsWith("/app/draws");
  const [open, setOpen] = useState(adminActive);

  return (
    <div className="app-sidebar__nested-group">
      <button
        type="button"
        className="app-sidebar__nav-button app-sidebar__group-toggle app-sidebar__nested-toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {t("nav.admin")}
        <span className="app-sidebar__group-caret">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div className="app-sidebar__submenu app-sidebar__submenu--nested">
          <Link {...navLinkProps(pathname, "/app/admin", { exact: true })}>
            {t("nav.adminOverview")}
          </Link>
          <Link {...navLinkProps(pathname, "/app/admin/accounts")}>
            {t("nav.accounts")}
          </Link>
          <Link {...navLinkProps(pathname, "/app/draws")}>{t("nav.draws")}</Link>
        </div>
      )}
    </div>
  );
}

function navLinkProps(
  pathname: string,
  href: string,
  options?: { exact?: boolean },
) {
  const active = options?.exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);

  return {
    href,
    ...(active ? { "aria-current": "page" as const } : {}),
  };
}

function SettingsNavGroup({
  isRegistered,
  showAdmin,
}: {
  isRegistered: boolean;
  showAdmin: boolean;
}) {
  const pathname = usePathname();
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <div className="app-sidebar__group">
      <button
        type="button"
        className="app-sidebar__nav-button app-sidebar__group-toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {t("nav.settings")}
        <span className="app-sidebar__group-caret">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div className="app-sidebar__submenu">
          <Link {...navLinkProps(pathname, "/app/overview-1")}>
            {t("nav.overview1")}
          </Link>
          <Link {...navLinkProps(pathname, "/app/overview-2")}>
            {t("nav.overview2")}
          </Link>
          <Link {...navLinkProps(pathname, "/app/overview-3")}>
            {t("nav.overview3")}
          </Link>
          <Link {...navLinkProps(pathname, "/app/experiments")}>
            {t("nav.experiments")}
          </Link>
          <Link {...navLinkProps(pathname, "/app/shapes")}>{t("nav.shapes")}</Link>
          <Link {...navLinkProps(pathname, "/app/layouts")}>{t("nav.layouts")}</Link>
          {isRegistered ? (
            <>
              <Link {...navLinkProps(pathname, "/app/analyses")}>
                {t("nav.analyses")}
              </Link>
              <Link {...navLinkProps(pathname, "/app/account")}>
                {t("nav.account")}
              </Link>
            </>
          ) : (
            <Link
              href="/register?next=%2Fapp%2Fanalyses"
              className="app-sidebar__nav-muted"
            >
              {t("nav.analysesRegister")}
            </Link>
          )}
          {showAdmin && <AdminSubmenu />}
        </div>
      )}
    </div>
  );
}

export function AppShell({
  catalog,
  viewer,
  layouts,
  children,
}: {
  catalog: AnalysisCatalog;
  viewer: ViewerProfile | null;
  layouts: readonly Overview1LayoutOption[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const showAdmin = isAdminRole(viewer?.role);
  const isRegistered = viewer !== null;
  const isOverview1 = (pathname ?? "").startsWith("/app/overview-1");
  const isOverview3 = (pathname ?? "").startsWith("/app/overview-3");
  const useOverviewTheme = isOverview1 || isOverview3;

  return (
    <AnalysisContextProvider catalog={catalog}>
      <LocaleProvider>
        <Overview1UiProvider>
          <div
            className={cn(
              "app-shell",
              useOverviewTheme && "app-shell--overview1",
              isOverview3 && "app-shell--overview3",
            )}
          >
            {useOverviewTheme ? <Overview1Theme /> : null}
            <aside className="app-sidebar">
              <div className="app-sidebar__brand">Spatial</div>

              <nav className="app-sidebar__navigation">
                <LotteryNavButton />
                <AnalysisContextPanel />
                <Suspense fallback={null}>
                  <Overview1LayoutSidebarSelect layouts={layouts} />
                </Suspense>
                <SettingsNavGroup
                  isRegistered={isRegistered}
                  showAdmin={showAdmin}
                />
              </nav>
            </aside>

            <div className="app-main">
              <Topbar viewer={viewer} />
              {isOverview1 ? <Overview1SubHeader /> : null}
              <main className="app-content">
                {children}
              </main>
            </div>
          </div>
        </Overview1UiProvider>
      </LocaleProvider>
    </AnalysisContextProvider>
  );
}
