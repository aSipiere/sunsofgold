import type { Planet } from "../types";
import { TradeProfileDisplay } from "./TradeProfileDisplay";

interface Props {
  planet: Planet;
}

export function PlanetDisplay({ planet }: Props) {
  return (
    <div className="planet-display">
      <div className="planet-info-grid">
        <div className="planet-info-col">
          <h2>{planet.tech_level}</h2>
        </div>
        <div className="planet-info-col">
          <p>
            <strong>Population:</strong> {planet.population}
          </p>
          <p>
            <strong>Tags:</strong> {planet.tags.join(", ")}
          </p>
        </div>
        <div className="planet-info-col">
          <p>
            <strong>Atmosphere:</strong> {planet.atmosphere}
          </p>
          <p>
            <strong>Biosphere:</strong> {planet.biosphere}
          </p>
          <p>
            <strong>Temperature:</strong> {planet.temperature}
          </p>
        </div>
      </div>

      {planet.population === "Failed colony" && (
        <div className="warning-banner">
          Little to no trade infrastructure, possible salvage opportunity.
        </div>
      )}

      {planet.trade_profile && (
        <TradeProfileDisplay profile={planet.trade_profile} />
      )}
    </div>
  );
}
