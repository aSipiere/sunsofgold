import { useState } from "react";
import type {
  Planet,
  TradeProfile,
  TradeProfileCollection,
  StandardCommodity,
} from "../types";
import { TradeProfileDisplay } from "./TradeProfileDisplay";
import { TradeProfileGenerator } from "./TradeProfileGenerator";

interface Props {
  planet: Planet;
  templates: TradeProfileCollection;
  standardCommodities: StandardCommodity[];
  onApplyProfile: (profile: TradeProfile) => void;
}

export function PlanetCard({
  planet,
  templates,
  standardCommodities,
  onApplyProfile,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const hasProfile = !!planet.trade_profile;

  return (
    <div className={`planet-card ${expanded ? "planet-card-expanded" : ""}`}>
      <div
        className="planet-card-header"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="planet-card-title">
          <h3>{planet.name}</h3>
          <div className="planet-card-badges">
            <span className="badge badge-tech">{planet.tech_level}</span>
            {hasProfile ? (
              <span className="badge badge-profile">Trade Profile</span>
            ) : (
              <span className="badge badge-no-profile">No Profile</span>
            )}
          </div>
        </div>
        <div className="planet-card-summary">
          <span>{planet.population}</span>
          <span className="separator">|</span>
          <span>{planet.atmosphere}</span>
          <span className="separator">|</span>
          <span>{planet.temperature}</span>
        </div>
        <span className={`expand-arrow ${expanded ? "expanded" : ""}`}>
          &#9662;
        </span>
      </div>

      {expanded && (
        <div className="planet-card-body">
          <div className="planet-detail-grid">
            <div className="detail-item">
              <span className="detail-label">Biosphere</span>
              <span className="detail-value">{planet.biosphere}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Population</span>
              <span className="detail-value">{planet.population}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Atmosphere</span>
              <span className="detail-value">{planet.atmosphere}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Temperature</span>
              <span className="detail-value">{planet.temperature}</span>
            </div>
          </div>

          {planet.tags.length > 0 && (
            <div className="planet-tags">
              {planet.tags.map((tag) => (
                <span key={tag} className="tag-chip">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {planet.population === "Failed colony" && (
            <div className="warning-banner">
              Little to no trade infrastructure, possible salvage opportunity.
            </div>
          )}

          {planet.trade_profile && (
            <TradeProfileDisplay profile={planet.trade_profile} />
          )}

          <TradeProfileGenerator
            templates={templates}
            standardCommodities={standardCommodities}
            onApply={onApplyProfile}
          />
        </div>
      )}
    </div>
  );
}
