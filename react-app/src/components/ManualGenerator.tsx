import { useState } from "react";
import type { TradeProfile, TradeGood, StandardCommodity } from "../types";
import { CARGO_TYPES, DEFAULT_TROUBLES } from "../data/constants";
import { TradeProfileDisplay } from "./TradeProfileDisplay";

interface Props {
  standardCommodities: StandardCommodity[];
  onApply: (profile: TradeProfile) => void;
}

export function ManualGenerator({ standardCommodities, onApply }: Props) {
  const [friction, setFriction] = useState(2);
  const [mod1Type, setMod1Type] = useState(CARGO_TYPES[0]);
  const [mod1Val, setMod1Val] = useState(-2);
  const [mod2Type, setMod2Type] = useState(CARGO_TYPES[1]);
  const [mod2Val, setMod2Val] = useState(-1);
  const [mod3Type, setMod3Type] = useState(CARGO_TYPES[2]);
  const [mod3Val, setMod3Val] = useState(1);
  const [mod4Type, setMod4Type] = useState(CARGO_TYPES[3]);
  const [mod4Val, setMod4Val] = useState(2);
  const [selectedGoods, setSelectedGoods] = useState<Set<number>>(new Set());
  const [customGoods, setCustomGoods] = useState<TradeGood[]>([]);
  const [newGoodName, setNewGoodName] = useState("");
  const [newGoodCost, setNewGoodCost] = useState(100);
  const [newGoodTypes, setNewGoodTypes] = useState(CARGO_TYPES[0]);
  const [troubleChance, setTroubleChance] = useState(2);
  const [troubles, setTroubles] = useState([...DEFAULT_TROUBLES]);

  const toggleGood = (index: number) => {
    setSelectedGoods((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const addCustomGood = () => {
    if (!newGoodName.trim()) return;
    setCustomGoods((prev) => [
      ...prev,
      { trade_good: newGoodName.trim(), types: [newGoodTypes], cost: newGoodCost },
    ]);
    setNewGoodName("");
    setNewGoodCost(100);
  };

  const removeCustomGood = (index: number) => {
    setCustomGoods((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTrouble = (index: number, value: string) => {
    setTroubles((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const modifiers: Record<string, number> = {
    [mod1Type]: mod1Val,
    [mod2Type]: mod2Val,
    [mod3Type]: mod3Val,
    [mod4Type]: mod4Val,
  };

  const tradeGoods: TradeGood[] = [
    ...standardCommodities
      .filter((_, i) => selectedGoods.has(i))
      .map((c) => ({
        trade_good: c.cargo,
        types: c.types.split(", "),
        cost: c.cost_per_unit,
      })),
    ...customGoods,
  ];

  const totalGoods = selectedGoods.size + customGoods.length;

  const profile: TradeProfile = {
    friction,
    modifiers,
    trade_goods: tradeGoods,
    trouble_chance: `${troubleChance} in 10`,
    troubles,
  };

  return (
    <div className="manual-generator">
      <section className="form-section">
        <h4>Set Base Friction</h4>
        <input
          type="number"
          min={1}
          max={5}
          value={friction}
          onChange={(e) => setFriction(Number(e.target.value))}
        />
      </section>

      <section className="form-section">
        <h4>Choose Modifiers</h4>
        <p className="hint">
          For most purposes use: -2, -1, +1, +2 (where -2 indicates high supply
          and +2 indicates high demand)
        </p>
        <div className="modifiers-grid">
          {[
            { type: mod1Type, setType: setMod1Type, val: mod1Val, setVal: setMod1Val, min: -4, max: -1 },
            { type: mod2Type, setType: setMod2Type, val: mod2Val, setVal: setMod2Val, min: -4, max: -1 },
            { type: mod3Type, setType: setMod3Type, val: mod3Val, setVal: setMod3Val, min: 1, max: 4 },
            { type: mod4Type, setType: setMod4Type, val: mod4Val, setVal: setMod4Val, min: 1, max: 4 },
          ].map((m, i) => (
            <div key={i} className="modifier-col">
              <select value={m.type} onChange={(e) => m.setType(e.target.value)}>
                {CARGO_TYPES.map((ct) => (
                  <option key={ct} value={ct}>
                    {ct}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={m.min}
                max={m.max}
                value={m.val}
                onChange={(e) => m.setVal(Number(e.target.value))}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="form-section">
        <h4>Choose Trade Goods</h4>
        {totalGoods !== 10 && (
          <p className="warning-text">
            The recommended number of trade goods is 10. (Currently:{" "}
            {totalGoods})
          </p>
        )}
        <table className="commodities-table">
          <thead>
            <tr>
              <th></th>
              <th>Cargo</th>
              <th>Cost/Unit</th>
              <th>Min TL</th>
              <th>Types</th>
            </tr>
          </thead>
          <tbody>
            {standardCommodities.map((c, i) => (
              <tr
                key={i}
                className={selectedGoods.has(i) ? "selected-row" : ""}
              >
                <td>
                  <input
                    type="checkbox"
                    checked={selectedGoods.has(i)}
                    onChange={() => toggleGood(i)}
                  />
                </td>
                <td>{c.cargo}</td>
                <td>${c.cost_per_unit.toLocaleString()}</td>
                <td>{c.min_tech_level}</td>
                <td>{c.types}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {customGoods.length > 0 && (
          <div className="custom-goods-list">
            <h4>Custom Trade Goods</h4>
            {customGoods.map((good, i) => (
              <div key={i} className="custom-good-row">
                <span className="custom-good-name">{good.trade_good}</span>
                <span className="custom-good-detail">
                  ${good.cost.toLocaleString()} &middot; {good.types.join(", ")}
                </span>
                <button
                  className="custom-good-remove"
                  onClick={() => removeCustomGood(i)}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="add-custom-good">
          <h4>Add Custom Trade Good</h4>
          <div className="custom-good-form">
            <input
              type="text"
              placeholder="Trade good name"
              value={newGoodName}
              onChange={(e) => setNewGoodName(e.target.value)}
            />
            <input
              type="number"
              min={1}
              placeholder="Cost"
              value={newGoodCost}
              onChange={(e) => setNewGoodCost(Number(e.target.value))}
            />
            <select
              value={newGoodTypes}
              onChange={(e) => setNewGoodTypes(e.target.value)}
            >
              {CARGO_TYPES.map((ct) => (
                <option key={ct} value={ct}>
                  {ct}
                </option>
              ))}
            </select>
            <button className="btn btn-secondary" onClick={addCustomGood}>
              Add
            </button>
          </div>
        </div>
      </section>

      <section className="form-section">
        <h4>Choose Trouble Chance</h4>
        <div className="trouble-chance-input">
          <input
            type="number"
            min={1}
            max={5}
            value={troubleChance}
            onChange={(e) => setTroubleChance(Number(e.target.value))}
          />
          <span>in 10</span>
        </div>
      </section>

      <section className="form-section">
        <h4>Edit Troubles</h4>
        <div className="troubles-editor">
          {troubles.map((trouble, i) => (
            <div key={i} className="trouble-row">
              <span className="trouble-num">{i + 1}.</span>
              <input
                type="text"
                value={trouble}
                onChange={(e) => updateTrouble(i, e.target.value)}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="form-section">
        <h4>Current Profile Preview</h4>
        <TradeProfileDisplay profile={profile} />
      </section>

      <button className="btn btn-primary" onClick={() => onApply(profile)}>
        Add Profile to Planet
      </button>
    </div>
  );
}
