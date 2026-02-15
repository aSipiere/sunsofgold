import type { StandardCommodity } from "../types";

/**
 * Parse tech level string (e.g., "TL4", "TL 4", "4") to numeric value
 */
export function parseTechLevel(techLevel: string): number {
  const match = techLevel.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Check if a commodity is allowed at the given tech level
 */
export function isCommodityAllowed(
  commodity: StandardCommodity,
  worldTL: number,
  planetTags: string[] = []
): boolean {
  // Special case tags that allow Pretech at TL4 (salvage only)
  const specialTags = [
    "Mandate Base",
    "Hivemind",
    "Immortals",
    "Sealed Menace",
    "Pretech Cultists",
    "Tomb World",
    "Forbidden Tech",
  ];

  const hasSpecialTag = planetTags.some((tag) => specialTags.includes(tag));
  const types = commodity.types.split(", ");
  const hasPretech = types.includes("Pretech");

  // Special handling for Pretech
  if (hasPretech) {
    // "Pretech Junk (salvaged)" is allowed at any TL (min_tech_level = 0)
    if (commodity.min_tech_level === 0) {
      return true;
    }
    // Manufactured Pretech requires TL5
    if (commodity.min_tech_level >= 5) {
      return worldTL >= 5;
    }
    // Other Pretech: TL4 with special tag (salvage), TL5 for manufacturing
    if (hasSpecialTag && worldTL >= 4) {
      return true;
    }
  }

  // Standard enforcement
  return worldTL >= commodity.min_tech_level;
}

/**
 * Downgrade map: maps high-tech commodities to lower-tech equivalents
 */
const DOWNGRADE_MAP: Record<string, string> = {
  // Housewares
  "Housewares (Pretech)": "Housewares (Postech)",
  "Housewares (Postech)": "Housewares (Basic)",

  // Medical Supplies
  "Medical Supplies (Pretech)": "Medical Supplies (Postech)",

  // Small Arms
  "Small Arms (Pretech)": "Small Arms (Energy)",
  "Small Arms (Energy)": "Small Arms (Projectile)",

  // Tools
  "Tools (Industrial)": "Tools (Basic Hand Tools)",
  "Tools (Astronautic)": "Tools (Basic Hand Tools)",

  // Parts
  "Parts (Pretech Industry)": "Parts (Basic Industry)",
  "Parts (Starship Maintenance)": "Parts (Basic Industry)",

  // Postech Building Material (downgrade to basic tools)
  "Postech Building Material": "Parts (Basic Industry)",

  // Pretech Junk (made) downgrades to salvaged version
  "Pretech Junk (made)": "Pretech Junk (salvaged)",
};

/**
 * Attempt to downgrade a commodity name to a lower-tech equivalent
 */
export function downgradeCommodity(
  commodityName: string,
  allCommodities: StandardCommodity[],
  worldTL: number,
  planetTags: string[] = []
): StandardCommodity | null {
  let currentName = commodityName;
  let attempts = 0;
  const maxAttempts = 5; // Prevent infinite loops

  while (attempts < maxAttempts) {
    const downgradeName = DOWNGRADE_MAP[currentName];
    if (!downgradeName) {
      // No further downgrade available
      return null;
    }

    const downgraded = allCommodities.find((c) => c.cargo === downgradeName);
    if (!downgraded) {
      // Downgrade not found in commodities list
      return null;
    }

    // Check if this downgraded version is allowed
    if (isCommodityAllowed(downgraded, worldTL, planetTags)) {
      return downgraded;
    }

    // Try to downgrade further
    currentName = downgradeName;
    attempts++;
  }

  return null;
}

/**
 * Filter commodities based on tech level, with automatic downgrading
 */
export function filterCommoditiesByTechLevel(
  commodities: StandardCommodity[],
  worldTL: number,
  planetTags: string[] = []
): StandardCommodity[] {
  const result: StandardCommodity[] = [];
  const seenNames = new Set<string>();

  for (const commodity of commodities) {
    if (seenNames.has(commodity.cargo)) {
      continue;
    }

    if (isCommodityAllowed(commodity, worldTL, planetTags)) {
      // Commodity is allowed as-is
      result.push(commodity);
      seenNames.add(commodity.cargo);
    } else {
      // Try to downgrade
      const downgraded = downgradeCommodity(
        commodity.cargo,
        commodities,
        worldTL,
        planetTags
      );
      if (downgraded && !seenNames.has(downgraded.cargo)) {
        result.push(downgraded);
        seenNames.add(downgraded.cargo);
      }
      // If no valid downgrade, the commodity is simply not included
    }
  }

  return result;
}

/**
 * Get all commodities that are valid exports for a given tech level
 */
export function getValidExports(
  allCommodities: StandardCommodity[],
  worldTL: number,
  planetTags: string[] = []
): StandardCommodity[] {
  return allCommodities.filter((c) =>
    isCommodityAllowed(c, worldTL, planetTags)
  );
}
