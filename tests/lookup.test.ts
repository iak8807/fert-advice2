// tests/lookup.test.ts
import { describe, expect, it } from "vitest";
import { lookupBaseDose } from "@/lib/engine/lookup";
import type { SettingsV1, NutrientTablesJson } from "@/lib/types";

const makeSettings = (): SettingsV1 =>
  ({
    referenceTables: { N: {} as any, P: {} as any, K: {} as any },
    fertilizerCatalog: [],
    priceCatalog: {},
    schedulePresets: [],
    cropMeta: { aliases: { zeytin: "Zeytin" }, maintenanceRanges: {}, orchardCrops: [] },
    adjustmentRules: [],
    ui: { tone: "farmer", precisionKgDa: 0.1, units: { area: "da", ec: "uS/cm", p: "kg/da", k: "kg/da" } }
  }) as any;

describe("lookup regionTableKey selection", () => {
  it("prefers table with crop match; then lower table number", () => {
    const json: NutrientTablesJson = {
      bins: ["0-9999"],
      supported_region_tables: ["Ege|table18", "Ege|table16"],
      tables_by_regionTable: {
        "Ege|table18": { Zeytin: { Kuru: { "0-9999": 10 } } } as any,
        "Ege|table16": { Zeytin: { Kuru: { "0-9999": 9 } }, Buğday: { Kuru: { "0-9999": 1 } } } as any
      }
    };

    const settings = makeSettings();
    const ex = lookupBaseDose({
      nutrient: "K2O",
      nutrientJson: json,
      settings,
      region: "Ege",
      crop: "Zeytin",
      farming: "Kuru",
      allowFarmingFallback: false,
      soilValue: 5,
      soilUnitLabel: "kg/da"
    });

    // both match crop; lower table number (16) should win
    expect(ex.regionTableKey).toBe("Ege|table16");
  });
});
