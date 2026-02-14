import type {
  Gazeteer,
  Planet,
  SWNData,
  SectorInfo,
  System,
} from "../types";

export function parsePlanet(planetData: SWNData["planet"][string]): Planet {
  return {
    name: planetData.name,
    parent: planetData.parent,
    tech_level: planetData.attributes.techLevel,
    atmosphere: planetData.attributes.atmosphere,
    temperature: planetData.attributes.temperature,
    biosphere: planetData.attributes.biosphere,
    population: planetData.attributes.population,
    tags: planetData.attributes.tags.map((t) => t.name),
    trade_profile: null,
  };
}

function getParentInfo(
  data: SWNData,
  planetData: SWNData["planet"][string]
): { name: string; hex: string; x: number; y: number } {
  const parent = data[planetData.parentEntity][planetData.parent] as {
    name: string;
    x: number;
    y: number;
  };
  const hex = `${String(parent.x - 1).padStart(2, "0")}${String(parent.y - 1).padStart(2, "0")}`;
  return { name: parent.name, hex, x: parent.x, y: parent.y };
}

export function extractSectorInfo(data: SWNData): SectorInfo {
  if (data.sector) {
    const sectorData = Object.values(data.sector)[0] as {
      name?: string;
      rows?: number;
      columns?: number;
    };
    return {
      name: sectorData?.name ?? "Unknown Sector",
      rows: sectorData?.rows ?? 10,
      columns: sectorData?.columns ?? 8,
    };
  }
  // Infer from system positions
  let maxX = 8;
  let maxY = 10;
  if (data.system) {
    for (const sys of Object.values(data.system) as { x: number; y: number }[]) {
      if (sys.x > maxX) maxX = sys.x;
      if (sys.y > maxY) maxY = sys.y;
    }
  }
  return { name: "Unknown Sector", rows: maxY + 1, columns: maxX + 1 };
}

export function buildSystemGazeteer(data: SWNData): Gazeteer {
  const gazeteer: Gazeteer = {};

  for (const planetData of Object.values(data.planet)) {
    if (!(planetData.parent in gazeteer)) {
      const info = getParentInfo(data, planetData);
      gazeteer[planetData.parent] = {
        entity: planetData.parentEntity,
        name: info.name,
        hex: info.hex,
        x: info.x,
        y: info.y,
        children: [],
      };
    }
    gazeteer[planetData.parent].children.push(parsePlanet(planetData));
  }

  return gazeteer;
}

export function gazeteerFromDict(
  data: Record<string, unknown>
): Gazeteer {
  if ("gazeteer" in data) {
    return data.gazeteer as Gazeteer;
  }
  return data as Gazeteer;
}

export function systemToDict(system: System) {
  return {
    entity: system.entity,
    name: system.name,
    hex: system.hex,
    x: system.x,
    y: system.y,
    children: system.children.map((p) => ({ ...p })),
  };
}

export function gazeteerToDict(gazeteer: Gazeteer) {
  const result: Record<string, ReturnType<typeof systemToDict>> = {};
  for (const [k, v] of Object.entries(gazeteer)) {
    result[k] = systemToDict(v);
  }
  return result;
}
