"use server";

import { loadOverview1Moves } from "@/lib/overview/loadOverview1Moves";
import type { Overview1Move } from "@/lib/overview/overview1Moves";
import { parseTrustedUuid } from "@/lib/security/trustedIds";

export async function fetchOverview1Moves(
  lotteryIdRaw: string,
): Promise<Overview1Move[]> {
  const lotteryId = parseTrustedUuid(lotteryIdRaw);
  if (!lotteryId) {
    return [];
  }

  return loadOverview1Moves(lotteryId);
}
