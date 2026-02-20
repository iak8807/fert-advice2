export type Tone = "farmer" | "expert";
export type FarmingType = "Sulu" | "Kuru";
export type IrrigationSystem = "Damla" | "Yağmurlama" | "Salma" | "Kuru";

export type NutrientKey = "N" | "P2O5" | "K2O";

export type NutrientTablesJson = {
  meta?: {
    preferredTableOrder?: string[];
    [k: string]: unknown;
  };
  bins: string[] | Record<string, string[]>;
  supported_region_tables: string[]; // ["Akdeniz|table12", ...]
  tables_by_regionTable: Record<
    string,
    Record<
      string,
      Record<
        string,
        Record<string, number | null> // bin -> dose (kg/da)
      >
    >
  >;
};

export type FertilizerProduct = {
  id: string;
  name: string;
  nutrients: Partial<Record<NutrientKey, number>> & { S?: number }; // fractions
  tags?: string[];
  optional?: boolean;
};

export type PriceCatalog = Record<string, number | null>; // productId -> TRY/kg

export type SchedulePreset = {
  id: string;
  name: string;
  rules: {
    // nutrient/product timing splits
    // deterministic: driven by product type buckets
    buckets: Record<
      "P" | "K" | "N",
      {
        // list of applications with label and fraction sum=1
        applications: { label: string; fraction: number }[];
      }
    >;
    sandyOverrides?: Partial<
      Record<"P" | "K" | "N", { applications: { label: string; fraction: number }[] }>
    >;
  };
};

export type CropMeta = {
  aliases: Record<string, string>; // alias -> canonical crop name
  maintenanceRanges: Record<
    string,
    Partial<
      Record<
        NutrientKey,
        {
          min: number;
          max: number;
        }
      >
    >
  >;
  orchardCrops: string[]; // perennials/orchards
};

export type AdjustmentRule = {
  id: string;
  enabledByDefault: boolean; // default OFF globally but kept for settings
  appliesTo: NutrientKey[];
  // deterministic conditions (AND)
  condition: {
    pH_gte?: number;
    limePct_gte?: number;
    omPct_lt?: number;
    ec_dSm_gte?: number;
    sandPct_gte?: number;
    irrigationIs?: IrrigationSystem;
  };
  multiplierByNutrient: Partial<Record<NutrientKey, number>>; // e.g. {P2O5:1.1}
  messageFarmer: string;
  messageExpert: string;
  warningOnly?: boolean; // if true, does not change dose, only warns
};

export type SettingsV1 = {
  referenceTables: {
    N: NutrientTablesJson;
    P: NutrientTablesJson;
    K: NutrientTablesJson;
  };
  fertilizerCatalog: FertilizerProduct[];
  priceCatalog: PriceCatalog;
  schedulePresets: SchedulePreset[];
  cropMeta: CropMeta;
  adjustmentRules: AdjustmentRule[];
  ui: {
    tone: Tone;
    precisionKgDa: 0.1 | 0.01;
    units: {
      area: "da" | "m2";
      ec: "dS/m" | "uS/cm";
      p: "kg/da" | "ppm";
      k: "kg/da" | "ppm";
    };
  };
};

export type ProjectInput = {
  id: string;
  createdAtISO: string;

  projectName: string;
  region: string;
  crop: string;
  farming: FarmingType;
  allowFarmingFallback: boolean;
  irrigation: IrrigationSystem;

  area_da: number;
  treeCount?: number | null;

  tone: Tone;

  soil: {
    pH?: number | null;
    ec_value?: number | null;
    ec_unit?: "dS/m" | "uS/cm";
    limePct?: number | null;
    omPct?: number | null;
    sandPct?: number | null;
    clayPct?: number | null;
    siltPct?: number | null;

    p_olsen_value?: number | null;
    p_olsen_unit?: "kg/da" | "ppm";

    k_available_value?: number | null;
    k_available_unit?: "kg/da" | "ppm";

    micros_ppm?: Partial<Record<"Fe" | "Mn" | "Zn" | "Cu" | "B", number | null>>;
  };

  leaf?: {
    enabled: boolean;
    n_pct?: number | null;
    p_pct?: number | null;
    k_pct?: number | null;
    micros_ppm?: Partial<Record<"Fe" | "Mn" | "Zn" | "Cu" | "B", number | null>>;
    enableLeafCorrectionAdvanced?: boolean; // default OFF; warnings only unless ON
  };

  prefs: {
    enableLayer3Adjustments: boolean;
    avoidChloride: boolean;
    pSourceProductId: string;
    kSourceProductId: string;
    nSourceProductId: string;
    precisionKgDa: 0.1 | 0.01;
    schedulePresetId: string;
    startMonth: string; // "Mart" etc.
    fertigationApplications: 4 | 6 | 8;
  };

  prices: PriceCatalog; // scenario active prices (can be partial)
  scenarios?: {
    A?: { label: string; prefs: ProjectInput["prefs"]; prices: PriceCatalog };
    B?: { label: string; prefs: ProjectInput["prefs"]; prices: PriceCatalog };
  };
};

export type ExplainabilityNutrient = {
  nutrient: NutrientKey;
  status: "ok" | "blocked" | "missing";
  messages: { farmer: string; expert: string }[];

  regionTableKey?: string;
  tableId?: string; // "tableXX"
  bin?: string;
  soilValueUsed?: number;
  soilUnitUsed?: string;

  cropMatched?: string;
  cropMatchStrategy?: "exact" | "normalized" | "alias";
  farmingRequested?: FarmingType;
  farmingUsed?: FarmingType;
  farmingFallbackUsed?: boolean;

  baseDoseKgDa?: number;
  clamped?: { before: number; after: number; min: number; max: number };

  adjustments?: {
    nutrient: NutrientKey;
    ruleId: string;
    multiplier: number;
    before: number;
    after: number;
    messageFarmer: string;
    messageExpert: string;
    warningOnly?: boolean;
  }[];

  finalDoseKgDa?: number;
};

export type EngineResult = {
  targets: Partial<Record<NutrientKey, number>>; // final targets after layers
  explain: Record<NutrientKey, ExplainabilityNutrient>;
  warnings: { farmer: string[]; expert: string[] };
};

export type BalancedLine = {
  productId: string;
  productName: string;
  kgDa: number;
  totalKg: number;
  kgPerTree?: number | null;
  contributes: Partial<Record<NutrientKey, number>>;
};

export type BalanceResult = {
  blocked: boolean;
  messages: { farmer: string[]; expert: string[] };
  lines: BalancedLine[];
  totals: {
    kgDa: number;
    totalKg: number;
  };
  remainingNkgDa: number;
};

export type CostLine = {
  productId: string;
  productName: string;
  kgDa: number;
  totalKg: number;
  unitPriceTryPerKg: number | null;
  lineCostTry: number | null;
};

export type CostResult = {
  available: boolean;
  costPerDaTry: number | null;
  totalCostTry: number | null;
  mostExpensive?: { productId: string; productName: string; lineCostTry: number } | null;
  lines: CostLine[];
};

export type ScheduleApplicationLine = {
  label: string;
  fraction: number;
  kgDa: number;
  totalKg: number;
};

export type ScheduleProductPlan = {
  productId: string;
  productName: string;
  applications: ScheduleApplicationLine[];
};

export type ScheduleResult = {
  presetId: string;
  presetName: string;
  startMonth: string;
  plans: ScheduleProductPlan[];
  messages: { farmer: string[]; expert: string[] };
};


