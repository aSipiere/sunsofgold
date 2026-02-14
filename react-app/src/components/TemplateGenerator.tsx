import { useState } from "react";
import type { TradeProfile, TradeProfileCollection } from "../types";
import { TradeProfileDisplay } from "./TradeProfileDisplay";

interface Props {
  templates: TradeProfileCollection;
  onApply: (profile: TradeProfile) => void;
}

export function TemplateGenerator({ templates, onApply }: Props) {
  const templateNames = Object.keys(templates);
  const [selected, setSelected] = useState(templateNames[0]);

  const profile = templates[selected];

  return (
    <div className="template-generator">
      <div className="form-group">
        <label>Choose a trade template:</label>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {templateNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {profile && <TradeProfileDisplay profile={profile} />}

      <button
        className="btn btn-primary"
        onClick={() => onApply(profile)}
      >
        Add Template to Planet
      </button>
    </div>
  );
}
