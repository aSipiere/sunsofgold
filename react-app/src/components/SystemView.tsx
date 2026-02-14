import { useState } from "react";
import type {
  Gazeteer,
  TradeProfile,
  TradeProfileCollection,
} from "../types";
import { PlanetDisplay } from "./PlanetDisplay";
import { TradeProfileGenerator } from "./TradeProfileGenerator";

interface StandardCommodity {
  cargo: string;
  cost_per_unit: number;
  min_tech_level: number;
  types: string;
}

interface Props {
  gazeteer: Gazeteer;
  templates: TradeProfileCollection;
  standardCommodities: StandardCommodity[];
  onUpdateGazeteer: (gazeteer: Gazeteer) => void;
}

export function SystemView({
  gazeteer,
  templates,
  standardCommodities,
  onUpdateGazeteer,
}: Props) {
  const systemEntries = Object.entries(gazeteer).map(([id, system]) => ({
    id,
    label: `${system.name} ${system.hex}`,
    system,
  }));

  const [selectedSystemId, setSelectedSystemId] = useState(
    systemEntries[0]?.id ?? ""
  );
  const [activeTab, setActiveTab] = useState(0);

  const selectedSystem = gazeteer[selectedSystemId];

  if (!selectedSystem) return null;

  const planets = selectedSystem.children;

  const handleApplyProfile = (planetIndex: number, profile: TradeProfile) => {
    const updated = structuredClone(gazeteer);
    updated[selectedSystemId].children[planetIndex].trade_profile = profile;
    onUpdateGazeteer(updated);
  };

  return (
    <main className="system-view">
      <div className="form-group">
        <label>System:</label>
        <select
          value={selectedSystemId}
          onChange={(e) => {
            setSelectedSystemId(e.target.value);
            setActiveTab(0);
          }}
        >
          {systemEntries.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.label}
            </option>
          ))}
        </select>
      </div>

      <div className="planet-tabs">
        {planets.map((planet, i) => (
          <button
            key={planet.name}
            className={`tab-btn ${i === activeTab ? "active" : ""}`}
            onClick={() => setActiveTab(i)}
          >
            {planet.name}
          </button>
        ))}
      </div>

      {planets[activeTab] && (
        <div className="planet-tab-content">
          <PlanetDisplay planet={planets[activeTab]} />

          {!planets[activeTab].trade_profile && (
            <div className="warning-banner">
              No Trade Profile for this Planet.
            </div>
          )}

          <TradeProfileGenerator
            templates={templates}
            standardCommodities={standardCommodities}
            onApply={(profile) => handleApplyProfile(activeTab, profile)}
          />
        </div>
      )}
    </main>
  );
}
