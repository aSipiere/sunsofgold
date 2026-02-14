import { useState, useEffect } from "react";
import type {
  Gazeteer,
  TradeProfileCollection,
} from "./types";
import {
  buildSystemGazeteer,
  gazeteerFromDict,
  gazeteerToDict,
} from "./data/parser";
import { Sidebar } from "./components/Sidebar";
import { SystemView } from "./components/SystemView";
import "./App.css";

interface StandardCommodity {
  cargo: string;
  cost_per_unit: number;
  min_tech_level: number;
  types: string;
}

function App() {
  const [gazeteer, setGazeteer] = useState<Gazeteer | null>(null);
  const [templates, setTemplates] = useState<TradeProfileCollection>({});
  const [standardCommodities, setStandardCommodities] = useState<
    StandardCommodity[]
  >([]);

  useEffect(() => {
    Promise.all([
      fetch("/data/example_worlds.json").then((r) => r.json()),
      fetch("/data/standard_commodities.json").then((r) => r.json()),
    ]).then(([worlds, commodities]) => {
      setTemplates(worlds);
      setStandardCommodities(commodities);
    });
  }, []);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if ("gazeteer" in data) {
          setGazeteer(gazeteerFromDict(data));
        } else {
          setGazeteer(buildSystemGazeteer(data));
        }
      } catch (err) {
        console.error("Failed to parse file:", err);
        alert("Failed to parse the uploaded file. Please ensure it is valid JSON.");
      }
    };
    reader.readAsText(file);
  };

  const handleDownload = () => {
    if (!gazeteer) return;
    const blob = new Blob(
      [JSON.stringify({ gazeteer: gazeteerToDict(gazeteer) }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gazeteer.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-layout">
      <Sidebar
        gazeteer={gazeteer}
        onFileUpload={handleFileUpload}
        onDownload={handleDownload}
      />

      <div className="main-content">
        {gazeteer ? (
          <SystemView
            gazeteer={gazeteer}
            templates={templates}
            standardCommodities={standardCommodities}
            onUpdateGazeteer={setGazeteer}
          />
        ) : (
          <div className="empty-state">
            <h2>Welcome to Suns of Gold 2.0</h2>
            <p>
              Upload your Sectors Without Number JSON file using the sidebar to
              get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
