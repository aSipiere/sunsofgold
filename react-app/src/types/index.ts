export interface TradeGood {
  trade_good: string;
  types: string[];
  cost: number;
}

export interface TradeProfile {
  friction: number;
  modifiers: Record<string, number>;
  trade_goods: TradeGood[];
  trouble_chance: string;
  troubles: string[];
}

export interface Planet {
  name: string;
  parent: string;
  tech_level: string;
  atmosphere: string;
  temperature: string;
  biosphere: string;
  population: string;
  tags: string[];
  trade_profile: TradeProfile | null;
}

export interface System {
  entity: string;
  name: string;
  hex: string;
  children: Planet[];
}

export type Gazeteer = Record<string, System>;

export type TradeProfileCollection = Record<string, TradeProfile>;

export interface StandardCommodity {
  cargo: string;
  cost_per_unit: number;
  min_tech_level: number;
  types: string;
}

export interface SWNPlanetData {
  name: string;
  parent: string;
  parentEntity: string;
  attributes: {
    techLevel: string;
    atmosphere: string;
    temperature: string;
    biosphere: string;
    population: string;
    tags: { name: string }[];
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SWNData = Record<string, any> & {
  planet: Record<string, SWNPlanetData>;
};
