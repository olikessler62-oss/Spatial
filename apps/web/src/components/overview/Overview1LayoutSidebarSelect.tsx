"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useAnalysisContext } from "@/context/AnalysisContext";
import {
  readStoredOverview1LayoutId,
  writeStoredOverview1LayoutId,
} from "@/lib/overview/overview1LocalState";
import { parseTrustedUuid } from "@/lib/security/trustedIds";

export type Overview1LayoutOption = {
  id: string;
  lotteryId: string;
  name: string;
  layoutType: string;
};

export function Overview1LayoutSidebarSelect({
  layouts,
}: {
  layouts: readonly Overview1LayoutOption[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { subjectId, domain } = useAnalysisContext();
  const [storedLayoutId, setStoredLayoutId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const onOverview1 =
    pathname === "/app/overview-1" || pathname.startsWith("/app/overview-1/");

  const selectedLotteryId =
    domain?.id === "lottery" && subjectId
      ? parseTrustedUuid(subjectId)
      : null;

  const layoutsForLottery = selectedLotteryId
    ? layouts.filter((layout) => layout.lotteryId === selectedLotteryId)
    : [];

  const selectedLayoutId =
    storedLayoutId
    && layoutsForLottery.some((layout) => layout.id === storedLayoutId)
      ? storedLayoutId
      : (layoutsForLottery[0]?.id ?? null);

  useEffect(() => {
    setStoredLayoutId(readStoredOverview1LayoutId());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!onOverview1 || !hydrated) {
      return;
    }

    if (searchParams.toString()) {
      router.replace("/app/overview-1");
    }
  }, [hydrated, onOverview1, router, searchParams]);

  useEffect(() => {
    if (!onOverview1 || !hydrated) {
      return;
    }

    writeStoredOverview1LayoutId(selectedLayoutId);
    setStoredLayoutId(selectedLayoutId);
  }, [hydrated, onOverview1, selectedLayoutId]);

  return null;
}
