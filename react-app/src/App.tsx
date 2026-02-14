import { useState, useEffect, useRef } from "react";
import type {
  Gazeteer,
  SectorInfo,
  TradeProfile,
  TradeProfileCollection,
  StandardCommodity,
} from "./types";
import {
  buildSystemGazeteer,
  extractSectorInfo,
  gazeteerFromDict,
  gazeteerToDict,
} from "./data/parser";
import { HexMap } from "./components/HexMap";
import { SystemDetailPanel } from "./components/SystemDetailPanel";
import "./App.css";

function App() {
  const [gazeteer, setGazeteer] = useState<Gazeteer | null>(null);
  const [sectorInfo, setSectorInfo] = useState<SectorInfo>({
    rows: 10,
    columns: 8,
    name: "Unknown Sector",
  });
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<TradeProfileCollection>({});
  const [standardCommodities, setStandardCommodities] = useState<
    StandardCommodity[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/data/example_worlds.json").then((r) => r.json()),
      fetch("/data/standard_commodities.json").then((r) => r.json()),
    ]).then(([worlds, commodities]) => {
      setTemplates(worlds);
      setStandardCommodities(commodities);
    });
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if ("gazeteer" in data) {
          const gaz = gazeteerFromDict(data);
          setGazeteer(gaz);
          let maxX = 8, maxY = 10;
          for (const sys of Object.values(gaz)) {
            if (sys.x > maxX) maxX = sys.x;
            if (sys.y > maxY) maxY = sys.y;
          }
          setSectorInfo({ name: "Loaded Sector", rows: maxY + 1, columns: maxX + 1 });
        } else {
          setSectorInfo(extractSectorInfo(data));
          setGazeteer(buildSystemGazeteer(data));
        }
        setSelectedSystemId(null);
      } catch (err) {
        console.error("Failed to parse file:", err);
        alert(
          "Failed to parse the uploaded file. Please ensure it is valid JSON."
        );
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

  const handleApplyProfile = (
    planetIndex: number,
    profile: TradeProfile
  ) => {
    if (!gazeteer || !selectedSystemId) return;
    const updated = structuredClone(gazeteer);
    updated[selectedSystemId].children[planetIndex].trade_profile = profile;
    setGazeteer(updated);
  };

  const selectedSystem =
    gazeteer && selectedSystemId ? gazeteer[selectedSystemId] : null;

  return (
    <div className="app">
      <header className="top-bar">
        <div className="top-bar-left">
          <h1 className="app-title">Suns of Gold</h1>
          {gazeteer && (
            <span className="sector-name">{sectorInfo.name}</span>
          )}
        </div>
        <div className="top-bar-actions">
          <button
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            {gazeteer ? "Load New File" : "Upload SWN File"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
          {gazeteer && (
            <button className="btn btn-primary" onClick={handleDownload}>
              Export Gazeteer
            </button>
          )}
        </div>
      </header>

      <div className="main-area">
        {gazeteer ? (
          <>
            <div
              className={`map-panel ${selectedSystem ? "map-panel-shrunk" : ""}`}
            >
              <HexMap
                gazeteer={gazeteer}
                sectorInfo={sectorInfo}
                selectedSystemId={selectedSystemId}
                onSelectSystem={setSelectedSystemId}
              />
            </div>

            {selectedSystem && selectedSystemId && (
              <SystemDetailPanel
                systemId={selectedSystemId}
                system={selectedSystem}
                templates={templates}
                standardCommodities={standardCommodities}
                onApplyProfile={handleApplyProfile}
                onClose={() => setSelectedSystemId(null)}
              />
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state-content">
              <div className="empty-state-icon">&#9733;</div>
              <h2>Suns of Gold Trade Generator</h2>
              <p>
                Generate trade profiles for your Sectors Without Number sector.
              </p>
              <p className="hint">
                Export your sector as JSON from{" "}
                <a
                  href="https://sectorswithoutnumber.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  sectorswithoutnumber.com
                </a>
                , then upload it here.
              </p>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => fileInputRef.current?.click()}
              >
                Upload SWN JSON File
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
