import type {
  System,
  TradeProfile,
  TradeProfileCollection,
  StandardCommodity,
} from "../types";
import { PlanetCard } from "./PlanetCard";

interface Props {
  systemId: string;
  system: System;
  templates: TradeProfileCollection;
  standardCommodities: StandardCommodity[];
  onApplyProfile: (planetIndex: number, profile: TradeProfile) => void;
  onClose: () => void;
}

export function SystemDetailPanel({
  system,
  templates,
  standardCommodities,
  onApplyProfile,
  onClose,
}: Props) {
  const profileCount = system.children.filter(
    (p) => p.trade_profile !== null
  ).length;

  return (
    <div className="system-detail-panel">
      <div className="panel-header">
        <div className="panel-header-info">
          <h2>{system.name}</h2>
          <span className="panel-hex">Hex {system.hex}</span>
          <span className="panel-stat">
            {system.children.length} planet{system.children.length !== 1 ? "s" : ""}
            {" "}&middot;{" "}
            {profileCount} trade profile{profileCount !== 1 ? "s" : ""}
          </span>
        </div>
        <button className="panel-close-btn" onClick={onClose}>
          &times;
        </button>
      </div>

      <div className="panel-body">
        {system.children.map((planet, i) => (
          <PlanetCard
            key={planet.name}
            planet={planet}
            templates={templates}
            standardCommodities={standardCommodities}
            onApplyProfile={(profile) => onApplyProfile(i, profile)}
          />
        ))}
      </div>
    </div>
  );
}
