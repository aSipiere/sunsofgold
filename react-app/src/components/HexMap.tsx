import { useMemo, type ReactNode } from "react";
import type { Gazeteer, SectorInfo, System } from "../types";

interface Props {
  gazeteer: Gazeteer;
  sectorInfo: SectorInfo;
  selectedSystemId: string | null;
  onSelectSystem: (systemId: string) => void;
}

const HEX_SIZE = 38;
const SQRT3 = Math.sqrt(3);

function hexToPixel(col: number, row: number) {
  // Odd-q vertical layout (matching SWN)
  const x = col * HEX_SIZE * 1.5;
  const y = row * HEX_SIZE * SQRT3 + (col % 2 === 1 ? (HEX_SIZE * SQRT3) / 2 : 0);
  return { x, y };
}

function hexPoints(cx: number, cy: number, size: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    points.push(
      `${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`
    );
  }
  return points.join(" ");
}

export function HexMap({
  gazeteer,
  sectorInfo,
  selectedSystemId,
  onSelectSystem,
}: Props) {
  const systemsByCoord = useMemo(() => {
    const map = new Map<string, { id: string; system: System }>();
    for (const [id, system] of Object.entries(gazeteer)) {
      map.set(`${system.x},${system.y}`, { id, system });
    }
    return map;
  }, [gazeteer]);

  const { columns, rows } = sectorInfo;
  const padding = HEX_SIZE + 10;

  // Calculate SVG dimensions
  const lastCol = columns - 1;
  const lastRow = rows - 1;
  const bottomRight = hexToPixel(lastCol, lastRow);
  const svgWidth = bottomRight.x + HEX_SIZE + padding * 2;
  const svgHeight =
    bottomRight.y + HEX_SIZE * SQRT3 / 2 + (lastCol % 2 === 1 ? HEX_SIZE * SQRT3 / 2 : 0) + padding * 2;

  const hexes: ReactNode[] = [];

  for (let col = 0; col < columns; col++) {
    for (let row = 0; row < rows; row++) {
      const { x, y } = hexToPixel(col, row);
      const cx = x + padding;
      const cy = y + padding;
      const coordKey = `${col + 1},${row + 1}`;
      const entry = systemsByCoord.get(coordKey);
      const isSelected = entry?.id === selectedSystemId;
      const hasSystem = !!entry;
      const hexLabel = `${String(col).padStart(2, "0")}${String(row).padStart(2, "0")}`;

      hexes.push(
        <g
          key={`${col}-${row}`}
          onClick={() => entry && onSelectSystem(entry.id)}
          style={{ cursor: hasSystem ? "pointer" : "default" }}
        >
          <polygon
            points={hexPoints(cx, cy, HEX_SIZE - 1)}
            className={`hex-cell ${hasSystem ? "hex-occupied" : ""} ${isSelected ? "hex-selected" : ""}`}
          />
          {/* Hex coordinate label */}
          <text
            x={cx}
            y={cy + HEX_SIZE * 0.38}
            className="hex-coord"
            textAnchor="middle"
          >
            {hexLabel}
          </text>
          {/* System marker and name */}
          {entry && (
            <>
              <circle
                cx={cx}
                cy={cy - 6}
                r={5}
                className={`system-dot ${isSelected ? "system-dot-selected" : ""}`}
              />
              <text
                x={cx}
                y={cy + 8}
                className="system-name"
                textAnchor="middle"
              >
                {entry.system.name}
              </text>
              <text
                x={cx + 9}
                y={cy - 3}
                className="planet-count"
                textAnchor="start"
              >
                {entry.system.children.length}
              </text>
            </>
          )}
        </g>
      );
    }
  }

  return (
    <div className="hex-map-container">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="hex-map-svg"
        preserveAspectRatio="xMidYMid meet"
      >
        {hexes}
      </svg>
    </div>
  );
}
