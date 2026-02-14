import { useState } from "react";
import type { TradeProfile, TradeProfileCollection } from "../types";
import { TemplateGenerator } from "./TemplateGenerator";
import { ManualGenerator } from "./ManualGenerator";

interface StandardCommodity {
  cargo: string;
  cost_per_unit: number;
  min_tech_level: number;
  types: string;
}

interface Props {
  templates: TradeProfileCollection;
  standardCommodities: StandardCommodity[];
  onApply: (profile: TradeProfile) => void;
}

export function TradeProfileGenerator({
  templates,
  standardCommodities,
  onApply,
}: Props) {
  const [method, setMethod] = useState<"template" | "manual">("template");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="trade-profile-generator">
      <button
        className="btn btn-secondary expander-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? "Hide" : "Generate Trade Profile"}
      </button>

      {isOpen && (
        <div className="generator-content">
          <div className="form-group">
            <label>Method:</label>
            <select
              value={method}
              onChange={(e) =>
                setMethod(e.target.value as "template" | "manual")
              }
            >
              <option value="template">Template</option>
              <option value="manual">Manual</option>
            </select>
          </div>

          {method === "template" ? (
            <TemplateGenerator templates={templates} onApply={onApply} />
          ) : (
            <ManualGenerator
              standardCommodities={standardCommodities}
              onApply={onApply}
            />
          )}
        </div>
      )}
    </div>
  );
}
