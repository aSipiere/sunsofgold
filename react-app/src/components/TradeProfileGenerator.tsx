import { useState } from "react";
import type { TradeProfile, TradeProfileCollection, StandardCommodity } from "../types";
import { TemplateGenerator } from "./TemplateGenerator";
import { ManualGenerator } from "./ManualGenerator";
import { TagGenerator } from "./TagGenerator";

interface Props {
  templates: TradeProfileCollection;
  standardCommodities: StandardCommodity[];
  tags: string[];
  techLevel: string;
  onApply: (profile: TradeProfile) => void;
}

export function TradeProfileGenerator({
  templates,
  standardCommodities,
  tags,
  techLevel,
  onApply,
}: Props) {
  const [method, setMethod] = useState<"tags" | "template" | "manual">("tags");
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
              className={`toggle-btn ${method === "tags" ? "active" : ""}`}
              onClick={() => setMethod("tags")}
            >
              From Tags
            </button>
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

          {method === "tags" ? (
            <TagGenerator
              tags={tags}
              standardCommodities={standardCommodities}
              techLevel={techLevel}
              onApply={onApply}
            />
          ) : method === "template" ? (
            <TemplateGenerator templates={templates} onApply={onApply} />
          ) : (
            <ManualGenerator
              standardCommodities={standardCommodities}
              techLevel={techLevel}
              onApply={onApply}
            />
          )}
        </div>
      )}
    </div>
  );
}
