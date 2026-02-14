import { useState, useEffect, useMemo } from "react";
import type { TradeProfile, TradeGood, StandardCommodity } from "../types";
import { DEFAULT_TROUBLES } from "../data/constants";
import { TradeProfileDisplay } from "./TradeProfileDisplay";

type TagMap = Record<string, { supply: string[]; demand: string[] }>;

interface Props {
  tags: string[];
  standardCommodities: StandardCommodity[];
  onApply: (profile: TradeProfile) => void;
}

export function TagGenerator({ tags, standardCommodities, onApply }: Props) {
  const [tagMap, setTagMap] = useState<TagMap>({});

  useEffect(() => {
    fetch("/data/tags.json")
      .then((r) => r.json())
      .then(setTagMap);
  }, []);

  const { modifiers, matchedGoods } = useMemo(() => {
    const supplyCounts: Record<string, number> = {};
    const demandCounts: Record<string, number> = {};

    for (const tag of tags) {
      const entry = tagMap[tag];
      if (!entry) continue;
      for (const s of entry.supply) {
        if (s) supplyCounts[s] = (supplyCounts[s] || 0) + 1;
      }
      for (const d of entry.demand) {
        if (d) demandCounts[d] = (demandCounts[d] || 0) + 1;
      }
    }

    // Build modifiers: supply types get negative values, demand types get positive
    const mods: Record<string, number> = {};

    // Sort by frequency, take top supply types
    const supplyEntries = Object.entries(supplyCounts).sort(
      (a, b) => b[1] - a[1]
    );
    const demandEntries = Object.entries(demandCounts).sort(
      (a, b) => b[1] - a[1]
    );

    // Assign supply modifiers (-2 for most common, -1 for next)
    if (supplyEntries.length >= 1) mods[supplyEntries[0][0]] = -2;
    if (supplyEntries.length >= 2) mods[supplyEntries[1][0]] = -1;

    // Assign demand modifiers (+2 for most common, +1 for next)
    // Skip types already assigned as supply
    let demandAssigned = 0;
    for (const [type, _count] of demandEntries) {
      if (type in mods) continue;
      if (demandAssigned === 0) {
        mods[type] = 2;
        demandAssigned++;
      } else if (demandAssigned === 1) {
        mods[type] = 1;
        demandAssigned++;
        break;
      }
    }

    // Select commodities matching any of the modifier types
    const relevantTypes = new Set([
      ...Object.keys(supplyCounts),
      ...Object.keys(demandCounts),
    ]);

    const goods = standardCommodities.filter((c) => {
      const types = c.types.split(", ");
      return types.some((t) => relevantTypes.has(t));
    });

    // Take up to 10 goods
    const selected = goods.slice(0, 10);

    // If less than 10, fill with remaining commodities
    if (selected.length < 10) {
      for (const c of standardCommodities) {
        if (selected.length >= 10) break;
        if (!selected.includes(c)) selected.push(c);
      }
    }

    return { modifiers: mods, matchedGoods: selected };
  }, [tags, tagMap, standardCommodities]);

  const tradeGoods: TradeGood[] = matchedGoods.map((c) => ({
    trade_good: c.cargo,
    types: c.types.split(", "),
    cost: c.cost_per_unit,
  }));

  const profile: TradeProfile = {
    friction: 2,
    modifiers,
    trade_goods: tradeGoods,
    trouble_chance: "2 in 10",
    troubles: [...DEFAULT_TROUBLES],
  };

  const hasModifiers = Object.keys(modifiers).length > 0;

  return (
    <div className="tag-generator">
      <div className="tag-analysis">
        <h4>Planet Tags</h4>
        <div className="planet-tags">
          {tags.map((tag) => {
            const entry = tagMap[tag];
            const hasData = entry && (entry.supply.some(s => s) || entry.demand.some(d => d));
            return (
              <span
                key={tag}
                className={`tag-chip ${hasData ? "tag-chip-active" : ""}`}
              >
                {tag}
              </span>
            );
          })}
        </div>

        {hasModifiers ? (
          <>
            <div className="tag-modifier-summary">
              <h4>Generated Modifiers</h4>
              <div className="modifier-pills">
                {Object.entries(modifiers)
                  .sort((a, b) => a[1] - b[1])
                  .map(([type, val]) => (
                    <span
                      key={type}
                      className={`modifier-pill ${val < 0 ? "modifier-supply" : "modifier-demand"}`}
                    >
                      {type} {val > 0 ? "+" : ""}
                      {val}
                    </span>
                  ))}
              </div>
            </div>

            <TradeProfileDisplay profile={profile} />

            <button
              className="btn btn-primary"
              style={{ marginTop: "0.75rem" }}
              onClick={() => onApply(profile)}
            >
              Apply Tag-Based Profile
            </button>
          </>
        ) : (
          <p className="hint" style={{ marginTop: "0.5rem" }}>
            These tags don't have supply/demand mappings. Try using a template or
            manual profile instead.
          </p>
        )}
      </div>
    </div>
  );
}
