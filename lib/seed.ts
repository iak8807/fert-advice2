// lib/seed.ts
import N_TABLES from "@/data/N_tables.min.json";
import P_TABLES from "@/data/P_tables.min.json";
import K_TABLES from "@/data/K_tables.min.json";
import type {
  AdjustmentRule,
  CropMeta,
  FertilizerProduct,
  PriceCatalog,
  SchedulePreset,
  SettingsV1
} from "@/lib/types";

export const SETTINGS_KEY = "fert_advice_settings_v1";

export const defaultCatalog: FertilizerProduct[] = [
  { id: "urea", name: "Üre", nutrients: { N: 0.46 } },
  { id: "as", name: "Amonyum Sülfat", nutrients: { N: 0.21, S: 0.24 } },
  { id: "an", name: "Amonyum Nitrat", nutrients: { N: 0.33 } },
  { id: "can", name: "CAN", nutrients: { N: 0.26 } },

  { id: "tsp", name: "TSP", nutrients: { P2O5: 0.46 } },
  { id: "dap", name: "DAP", nutrients: { N: 0.18, P2O5: 0.46 } },
  { id: "map", name: "MAP", nutrients: { N: 0.12, P2O5: 0.61 } },

  { id: "k2so4", name: "Potasyum Sülfat (K2SO4)", nutrients: { K2O: 0.5 } },
  { id: "kno3", name: "Potasyum Nitrat (KNO3)", nutrients: { N: 0.13, K2O: 0.46 } },
  { id: "kcl", name: "Potasyum Klorür (KCl)", nutrients: { K2O: 0.6 }, optional: true }
];

export const defaultPrices: PriceCatalog = Object.fromEntries(
  defaultCatalog.map((p) => [p.id, null])
);

export const defaultSchedulePresets: SchedulePreset[] = [
  {
    id: "classic",
    name: "Klasik (Taban + Üst)",
    rules: {
      buckets: {
        P: { applications: [{ label: "Taban", fraction: 1 }] },
        K: {
          applications: [
            { label: "Taban", fraction: 0.6 },
            { label: "Üst", fraction: 0.4 }
          ]
        },
        N: {
          applications: [
            { label: "Taban", fraction: 0.4 },
            { label: "Üst-1", fraction: 0.3 },
            { label: "Üst-2", fraction: 0.3 }
          ]
        }
      },
      sandyOverrides: {
        K: {
          applications: [
            { label: "Taban", fraction: 0.5 },
            { label: "Üst", fraction: 0.5 }
          ]
        }
      }
    }
  },
  {
    id: "drip6",
    name: "Damla (Fertigation, 6 uygulama)",
    rules: {
      buckets: {
        P: { applications: [{ label: "Taban", fraction: 1 }] },
        K: {
          applications: [
            { label: "U1", fraction: 1 / 6 },
            { label: "U2", fraction: 1 / 6 },
            { label: "U3", fraction: 1 / 6 },
            { label: "U4", fraction: 1 / 6 },
            { label: "U5", fraction: 1 / 6 },
            { label: "U6", fraction: 1 / 6 }
          ]
        },
        N: {
          applications: [
            { label: "U1", fraction: 0.1 },
            { label: "U2", fraction: 0.15 },
            { label: "U3", fraction: 0.2 },
            { label: "U4", fraction: 0.2 },
            { label: "U5", fraction: 0.2 },
            { label: "U6", fraction: 0.15 }
          ]
        }
      }
    }
  },
  {
    id: "orchard4",
    name: "Meyve Bahçesi (4 dönem)",
    rules: {
      buckets: {
        P: {
          applications: [
            { label: "Çiçek öncesi", fraction: 0.6 },
            { label: "Meyve tutumu", fraction: 0.4 }
          ]
        },
        K: {
          applications: [
            { label: "Çiçek öncesi", fraction: 0.2 },
            { label: "Meyve tutumu", fraction: 0.3 },
            { label: "Meyve büyümesi", fraction: 0.4 },
            { label: "Hasat sonrası", fraction: 0.1 }
          ]
        },
        N: {
          applications: [
            { label: "Çiçek öncesi", fraction: 0.3 },
            { label: "Meyve tutumu", fraction: 0.3 },
            { label: "Meyve büyümesi", fraction: 0.3 },
            { label: "Hasat sonrası", fraction: 0.1 }
          ]
        }
      }
    }
  }
];

export const defaultCropMeta: CropMeta = {
  aliases: {
    "zeytın": "Zeytin",
    "olive": "Zeytin"
  },
  maintenanceRanges: {
    Zeytin: {
      N: { min: 8, max: 16 },
      P2O5: { min: 3, max: 10 },
      K2O: { min: 4, max: 12 }
    },
    Buğday: {
      N: { min: 12, max: 22 },
      P2O5: { min: 6, max: 14 },
      K2O: { min: 0, max: 14 }
    },
    Mısır: {
      N: { min: 18, max: 30 },
      P2O5: { min: 8, max: 18 },
      K2O: { min: 4, max: 18 }
    },
    Patates: {
      N: { min: 14, max: 26 },
      P2O5: { min: 10, max: 20 },
      K2O: { min: 6, max: 22 }
    }
  },
  orchardCrops: ["Zeytin", "Elma", "Armut", "Narenciye", "Bağ"]
};

export const defaultAdjustmentRules: AdjustmentRule[] = [
  {
    id: "ph_high_p_fix",
    enabledByDefault: false,
    appliesTo: ["P2O5"],
    condition: { pH_gte: 7.8 },
    multiplierByNutrient: { P2O5: 1.1 },
    messageFarmer: "pH yüksek: Fosforu biraz artır, bant uygulamayı düşün.",
    messageExpert:
      "pH≥7.8: P bağlanma riski (kalsiyum fosfat). P2O5 hedefi %10 artırıldı; bant uygulama önerilir."
  },
  {
    id: "lime_high_p_fix_microlock",
    enabledByDefault: false,
    appliesTo: ["P2O5"],
    condition: { limePct_gte: 15 },
    multiplierByNutrient: { P2O5: 1.1 },
    messageFarmer: "Kireç yüksek: Fosforu biraz artır; Zn/Fe/Mn kilitlenmesine dikkat.",
    messageExpert:
      "Kireç%≥15: P bağlanma riski. P2O5 hedefi %10 artırıldı. Zn/Fe/Mn alımı kısıtlanabilir (kilitlenme riski)."
  },
  {
    id: "om_low_n",
    enabledByDefault: false,
    appliesTo: ["N"],
    condition: { omPct_lt: 2 },
    multiplierByNutrient: { N: 1.1 },
    messageFarmer: "Organik madde düşük: Azotu biraz artır ve bölerek ver.",
    messageExpert: "OM%<2: Mineralizasyon düşük. N hedefi %10 artırıldı; bölerek uygulama önerilir."
  },
  {
    id: "salinity_warning",
    enabledByDefault: false,
    appliesTo: ["N", "P2O5", "K2O"],
    condition: { ec_dSm_gte: 2 },
    multiplierByNutrient: {},
    warningOnly: true,
    messageFarmer: "Tuzluluk riski: Sülfat formlarını tercih et, klorürden kaçın.",
    messageExpert:
      "EC≥2 dS/m: Tuzluluk riski. Klorür içeren kaynaklardan kaçın; sülfat formları tercih edilebilir."
  },
  {
    id: "drip_preset_hint",
    enabledByDefault: false,
    appliesTo: ["N", "P2O5", "K2O"],
    condition: { irrigationIs: "Damla" },
    multiplierByNutrient: {},
    warningOnly: true,
    messageFarmer: "Damla sulama: Damla (fertigation) planını seçebilirsin.",
    messageExpert: "Sulama sistemi Damla: Fertigation planı (6 uygulama) tercih edilebilir."
  }
];

export function makeSeedSettings(): SettingsV1 {
  return {
    referenceTables: {
      N: N_TABLES as any,
      P: P_TABLES as any,
      K: K_TABLES as any
    },
    fertilizerCatalog: defaultCatalog,
    priceCatalog: defaultPrices,
    schedulePresets: defaultSchedulePresets,
    cropMeta: defaultCropMeta,
    adjustmentRules: defaultAdjustmentRules,
    ui: {
      tone: "farmer",
      precisionKgDa: 0.1,
      units: { area: "da", ec: "uS/cm", p: "kg/da", k: "kg/da" }
    }
  };
}
