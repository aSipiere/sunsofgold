import { useState } from "react";
import type { TradeProfile, TradeProfileCollection, StandardCommodity } from "../types";
import { TemplateGenerator } from "./TemplateGenerator";
import { ManualGenerator } from "./ManualGenerator";

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
        {isOpen ? "Hide Generator" : "Generate Trade Profile"}
      </button>

      {isOpen && (
        <div className="generator-content">
          <div className="method-toggle">
            <button
              className={`toggle-btn ${method === "template" ? "active" : ""}`}
              onClick={() => setMethod("template")}
            >
              Template
            </button>
            <button
              className={`toggle-btn ${method === "manual" ? "active" : ""}`}
              onClick={() => setMethod("manual")}
            >
              Manual
            </button>
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
