// tests/balancer.test.ts
import { describe, expect, it } from "vitest";
import { balanceFertilizers } from "@/lib/engine/balancer";
import type { ProjectInput, SettingsV1 } from "@/lib/types";

describe("compound balancing math", () => {
  it("subtracts N contributed by DAP and KNO3", () => {
    const settings = {
      fertilizerCatalog: [
        { id: "dap", name: "DAP", nutrients: { N: 0.18, P2O5: 0.46 } },
        { id: "kno3", name: "KNO3", nutrients: { N: 0.13, K2O: 0.46 } },
        { id: "urea", name: "Urea", nutrients: { N: 0.46 } }
      ],
      priceCatalog: {},
      referenceTables: {} as any,
      schedulePresets: [],
      cropMeta: { aliases: {}, maintenanceRanges: {}, orchardCrops: [] },
      adjustmentRules: [],
      ui: { tone: "farmer", precisionKgDa: 0.1, units: { area: "da", ec: "uS/cm", p: "kg/da", k: "kg/da" } }
    } as SettingsV1;

    const input = {
      id: "p1",
      createdAtISO: new Date().toISOString(),
      projectName: "t",
      region: "Akdeniz",
      crop: "Zeytin",
      farming: "Kuru",
      allowFarmingFallback: false,
      irrigation: "Damla",
      area_da: 10,
      tone: "farmer",
      soil: {} as any,
      prefs: {
        enableLayer3Adjustments: false,
        avoidChloride: false,
        pSourceProductId: "dap",
        kSourceProductId: "kno3",
        nSourceProductId: "urea",
        precisionKgDa: 0.1,
        schedulePresetId: "classic",
        startMonth: "Mart",
        fertigationApplications: 6
      },
      prices: {}
    } as ProjectInput;

    const res = balanceFertilizers({
      input,
      settings,
      targets: { N: 20, P2O5: 10, K2O: 10 },
      blockedNutrients: { N: false, P2O5: false, K2O: false }
    });

    // DAP kg/da = 10 / 0.46 = 21.739 -> 21.7 (0.1 rounding)
    const dap = res.lines.find((l) => l.productId === "dap")!;
    expect(dap.kgDa).toBe(21.7);

    // DAP contributes N = 21.7*0.18 = 3.906 -> remaining N about 16.094 before KNO3
    // KNO3 kg/da = 10/0.46 = 21.739 -> 21.7 ; contributes N = 2.821
    // remaining N ~ 13.273 ; urea kg/da = 13.273/0.46 = 28.85 -> 28.9
    const urea = res.lines.find((l) => l.productId === "urea")!;
    expect(urea.kgDa).toBe(28.9);
  });
});
