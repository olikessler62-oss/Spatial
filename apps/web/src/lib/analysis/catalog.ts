export interface NumberSpace {
  readonly minimumValue: number;
  readonly maximumValue: number;
  /** Count of distinct layout positions (= max - min + 1 for contiguous main pools). */
  readonly size: number;
  readonly mainValueCount: number;
  readonly ruleSetId: string | null;
}

export interface AnalysisSubject {
  readonly id: string;
  readonly label: string;
  readonly scopeId: string;
  readonly numberSpace: NumberSpace;
}

export interface AnalysisScope {
  readonly id: string;
  readonly label: string;
  readonly domainId: string;
}

export interface AnalysisDomain {
  readonly id: string;
  readonly label: string;
  readonly enabled: boolean;
}

export interface AnalysisCatalog {
  readonly domains: readonly AnalysisDomain[];
  readonly scopes: readonly AnalysisScope[];
  readonly subjects: readonly AnalysisSubject[];
}

const COUNTRY_LABELS: Record<string, string> = {
  DE: "Deutschland",
  EU: "Europa",
  AT: "Österreich",
  CH: "Schweiz",
};

export function countryLabel(code: string | null | undefined): string {
  if (!code) {
    return "International";
  }

  return COUNTRY_LABELS[code] ?? code;
}

export function buildLotteryCatalog(
  lotteries: readonly {
    id: string;
    name: string;
    country_code: string | null;
    is_active: boolean;
  }[],
  ruleSets: readonly {
    id: string;
    lottery_id: string;
    valid_from: string;
    valid_to: string | null;
    main_value_min: number;
    main_value_max: number;
    main_value_count: number;
  }[],
): AnalysisCatalog {
  const domains: AnalysisDomain[] = [
    { id: "lottery", label: "Lotterie", enabled: true },
    { id: "geo", label: "Geodatenanalyse", enabled: false },
    { id: "weather", label: "Wetterdatenanalyse", enabled: false },
  ];

  const activeLotteries = lotteries.filter((lottery) => lottery.is_active);

  const scopeIds = [
    ...new Set(
      activeLotteries.map((lottery) => lottery.country_code ?? "INT"),
    ),
  ].sort();

  const scopes: AnalysisScope[] = scopeIds.map((scopeId) => ({
    id: scopeId,
    label: countryLabel(scopeId === "INT" ? null : scopeId),
    domainId: "lottery",
  }));

  const subjects: AnalysisSubject[] = activeLotteries.map((lottery) => {
    const scopeId = lottery.country_code ?? "INT";
    const covering = ruleSets
      .filter((ruleSet) => ruleSet.lottery_id === lottery.id)
      .sort((left, right) => right.valid_from.localeCompare(left.valid_from));

    const current =
      covering.find((ruleSet) => ruleSet.valid_to === null) ?? covering[0];

    const minimumValue = current?.main_value_min ?? 1;
    const maximumValue = current?.main_value_max ?? 49;

    return {
      id: lottery.id,
      label: lottery.name,
      scopeId,
      numberSpace: {
        minimumValue,
        maximumValue,
        size: maximumValue - minimumValue + 1,
        mainValueCount: current?.main_value_count ?? 6,
        ruleSetId: current?.id ?? null,
      },
    };
  });

  return { domains, scopes, subjects };
}

/** All grid partitions where rows * columns === size. */
export function gridPartitions(
  size: number,
): readonly { rows: number; columns: number }[] {
  if (!Number.isInteger(size) || size <= 0) {
    return [];
  }

  const partitions: { rows: number; columns: number }[] = [];

  for (let rows = 1; rows <= size; rows += 1) {
    if (size % rows === 0) {
      partitions.push({ rows, columns: size / rows });
    }
  }

  return partitions;
}

export function shuffleValues(
  minimumValue: number,
  maximumValue: number,
  seed: string,
): number[] {
  const values = Array.from(
    { length: maximumValue - minimumValue + 1 },
    (_, index) => minimumValue + index,
  );

  let state = hashSeed(seed);

  for (let index = values.length - 1; index > 0; index -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const swapIndex = state % (index + 1);
    const current = values[index]!;
    values[index] = values[swapIndex]!;
    values[swapIndex] = current;
  }

  return values;
}

function hashSeed(seed: string): number {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}
