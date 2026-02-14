import type {
  Gazeteer,
  Planet,
  SWNData,
  System,
  TradeProfile,
  TradeProfileCollection,
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

function getParentSystemAndHex(
  data: SWNData,
  planetData: SWNData["planet"][string]
): [string, string] {
  const parent =
    data[planetData.parentEntity][planetData.parent] as unknown as {
      name: string;
      x: number;
      y: number;
    };
  const hex = `${String(parent.x - 1).padStart(2, "0")}${String(parent.y - 1).padStart(2, "0")}`;
  return [parent.name, hex];
}

export function buildSystemGazeteer(data: SWNData): Gazeteer {
  const gazeteer: Gazeteer = {};

  for (const planetData of Object.values(data.planet)) {
    if (!(planetData.parent in gazeteer)) {
      const [parentName, parentHex] = getParentSystemAndHex(data, planetData);
      gazeteer[planetData.parent] = {
        entity: planetData.parentEntity,
        name: parentName,
        hex: parentHex,
        children: [],
      };
    }
    gazeteer[planetData.parent].children.push(parsePlanet(planetData));
  }

  return gazeteer;
}

export function parseTradeProfileCollection(
  data: Record<string, TradeProfile>
): TradeProfileCollection {
  return data;
}

export function gazeteerFromDict(
  data: Record<string, unknown>
): Gazeteer {
  if ("gazeteer" in data) {
    return data.gazeteer as Gazeteer;
  }
  return data as Gazeteer;
}

export function planetFromDict(data: Record<string, unknown>): Planet {
  const d = ("gazeteer" in data ? data.gazeteer : data) as Planet;
  return {
    name: d.name,
    parent: d.parent,
    tech_level: d.tech_level,
    atmosphere: d.atmosphere,
    temperature: d.temperature,
    biosphere: d.biosphere,
    population: d.population,
    tags: d.tags,
    trade_profile: d.trade_profile ?? null,
  };
}

export function systemToDict(system: System) {
  return {
    entity: system.entity,
    name: system.name,
    hex: system.hex,
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
