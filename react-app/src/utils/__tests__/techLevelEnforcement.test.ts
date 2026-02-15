import { describe, it, expect } from "vitest";
import {
  parseTechLevel,
  isCommodityAllowed,
  downgradeCommodity,
  filterCommoditiesByTechLevel,
} from "../techLevelEnforcement";
import type { StandardCommodity } from "../../types";

describe("Tech Level Enforcement", () => {
  describe("parseTechLevel", () => {
    it("parses various tech level formats", () => {
      expect(parseTechLevel("TL4")).toBe(4);
      expect(parseTechLevel("TL 4")).toBe(4);
      expect(parseTechLevel("4")).toBe(4);
      expect(parseTechLevel("TL0")).toBe(0);
    });
  });

  describe("isCommodityAllowed", () => {
    const postechItem: StandardCommodity = {
      cargo: "Fusion Plants",
      cost_per_unit: 10000,
      min_tech_level: 4,
      types: "Postech, Tool, Bulky",
    };

    const pretechSalvage: StandardCommodity = {
      cargo: "Pretech Junk (salvaged)",
      cost_per_unit: 50000,
      min_tech_level: 0,
      types: "Pretech",
    };

    const pretechMade: StandardCommodity = {
      cargo: "Pretech Junk (made)",
      cost_per_unit: 50000,
      min_tech_level: 5,
      types: "Pretech",
    };

    it("allows items at or above min tech level", () => {
      expect(isCommodityAllowed(postechItem, 4)).toBe(true);
      expect(isCommodityAllowed(postechItem, 5)).toBe(true);
    });

    it("blocks items below min tech level", () => {
      expect(isCommodityAllowed(postechItem, 3)).toBe(false);
    });

    it("allows pretech salvage at any tech level", () => {
      expect(isCommodityAllowed(pretechSalvage, 0)).toBe(true);
      expect(isCommodityAllowed(pretechSalvage, 2)).toBe(true);
      expect(isCommodityAllowed(pretechSalvage, 5)).toBe(true);
    });

    it("requires TL5 for manufactured pretech", () => {
      expect(isCommodityAllowed(pretechMade, 4)).toBe(false);
      expect(isCommodityAllowed(pretechMade, 5)).toBe(true);
    });

    it("allows pretech at TL4 with special tags", () => {
      const pretechItem: StandardCommodity = {
        cargo: "Medical Supplies (Pretech)",
        cost_per_unit: 200000,
        min_tech_level: 5,
        types: "Medical, Pretech, Compact",
      };

      // Without special tag
      expect(isCommodityAllowed(pretechItem, 4, [])).toBe(false);

      // With special tag - still requires TL5 for manufactured
      expect(isCommodityAllowed(pretechItem, 4, ["Mandate Base"])).toBe(false);
      expect(isCommodityAllowed(pretechItem, 5, ["Mandate Base"])).toBe(true);
    });
  });

  describe("downgradeCommodity", () => {
    const allCommodities: StandardCommodity[] = [
      {
        cargo: "Small Arms (Pretech)",
        cost_per_unit: 100000,
        min_tech_level: 5,
        types: "Military, Pretech",
      },
      {
        cargo: "Small Arms (Energy)",
        cost_per_unit: 10000,
        min_tech_level: 4,
        types: "Military, Postech",
      },
      {
        cargo: "Small Arms (Projectile)",
        cost_per_unit: 5000,
        min_tech_level: 3,
        types: "Military, Low Tech",
      },
    ];

    it("downgrades to valid alternative", () => {
      const result = downgradeCommodity(
        "Small Arms (Energy)",
        allCommodities,
        3
      );
      expect(result?.cargo).toBe("Small Arms (Projectile)");
    });

    it("downgrades multiple levels if needed", () => {
      const result = downgradeCommodity(
        "Small Arms (Pretech)",
        allCommodities,
        3
      );
      expect(result?.cargo).toBe("Small Arms (Projectile)");
    });

    it("returns null if no valid downgrade exists", () => {
      const result = downgradeCommodity(
        "Small Arms (Projectile)",
        allCommodities,
        0
      );
      expect(result).toBeNull();
    });
  });

  describe("filterCommoditiesByTechLevel", () => {
    const commodities: StandardCommodity[] = [
      {
        cargo: "Metawheat",
        cost_per_unit: 500,
        min_tech_level: 0,
        types: "Common, Agricultural, Bulky",
      },
      {
        cargo: "Small Arms (Projectile)",
        cost_per_unit: 5000,
        min_tech_level: 3,
        types: "Military, Low Tech",
      },
      {
        cargo: "Small Arms (Energy)",
        cost_per_unit: 10000,
        min_tech_level: 4,
        types: "Military, Postech",
      },
      {
        cargo: "Housewares (Postech)",
        cost_per_unit: 5000,
        min_tech_level: 4,
        types: "Consumer, Postech",
      },
      {
        cargo: "Housewares (Basic)",
        cost_per_unit: 2000,
        min_tech_level: 1,
        types: "Low Tech, Consumer",
      },
    ];

    it("filters by tech level at TL2", () => {
      const result = filterCommoditiesByTechLevel(commodities, 2);
      expect(result).toHaveLength(2);
      expect(result.map((c) => c.cargo)).toContain("Metawheat");
      expect(result.map((c) => c.cargo)).toContain("Housewares (Basic)");
    });

    it("includes higher TL items at TL4", () => {
      const result = filterCommoditiesByTechLevel(commodities, 4);
      expect(result).toHaveLength(5);
    });

    it("downgrades when possible", () => {
      const result = filterCommoditiesByTechLevel(
        [
          {
            cargo: "Housewares (Postech)",
            cost_per_unit: 5000,
            min_tech_level: 4,
            types: "Consumer, Postech",
          },
          {
            cargo: "Housewares (Basic)",
            cost_per_unit: 2000,
            min_tech_level: 1,
            types: "Low Tech, Consumer",
          },
        ],
        2
      );
      // Should downgrade Postech to Basic
      expect(result).toHaveLength(1);
      expect(result[0].cargo).toBe("Housewares (Basic)");
    });
  });
});
