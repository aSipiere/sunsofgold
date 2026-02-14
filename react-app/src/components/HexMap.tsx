import { useMemo, useState, useRef, useCallback, type ReactNode } from "react";
import type { Gazeteer, SectorInfo, System } from "../types";

interface Props {
  gazeteer: Gazeteer;
  sectorInfo: SectorInfo;
  selectedSystemId: string | null;
  onSelectSystem: (systemId: string) => void;
}

const HEX_SIZE = 38;
const SQRT3 = Math.sqrt(3);
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 4;
const ZOOM_SENSITIVITY = 0.001;

function hexToPixel(col: number, row: number) {
  const x = col * HEX_SIZE * 1.5;
  const y = row * HEX_SIZE * SQRT3 + (col % 2 === 1 ? (HEX_SIZE * SQRT3) / 2 : 0);
  return { x, y };
}

function hexPoints(cx: number, cy: number, size: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
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
  const svgRef = useRef<SVGSVGElement>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const didPan = useRef(false);

  const systemsByCoord = useMemo(() => {
    const map = new Map<string, { id: string; system: System }>();
    for (const [id, system] of Object.entries(gazeteer)) {
      map.set(`${system.x},${system.y}`, { id, system });
    }
    return map;
  }, [gazeteer]);

  const { columns, rows } = sectorInfo;
  const padding = HEX_SIZE + 10;

  const lastCol = columns - 1;
  const lastRow = rows - 1;
  const bottomRight = hexToPixel(lastCol, lastRow);
  const contentWidth = bottomRight.x + HEX_SIZE + padding * 2;
  const contentHeight =
    bottomRight.y + HEX_SIZE * SQRT3 / 2 + (lastCol % 2 === 1 ? HEX_SIZE * SQRT3 / 2 : 0) + padding * 2;

  const [viewBox, setViewBox] = useState({
    x: 0,
    y: 0,
    w: contentWidth,
    h: contentHeight,
  });

  // Convert screen coordinates to SVG coordinates
  const screenToSvg = useCallback(
    (screenX: number, screenY: number) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      const scaleX = viewBox.w / rect.width;
      const scaleY = viewBox.h / rect.height;
      return {
        x: viewBox.x + (screenX - rect.left) * scaleX,
        y: viewBox.y + (screenY - rect.top) * scaleY,
      };
    },
    [viewBox]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const zoomFactor = 1 + e.deltaY * ZOOM_SENSITIVITY;

      setViewBox((prev) => {
        const newW = Math.max(contentWidth * MIN_ZOOM, Math.min(contentWidth * MAX_ZOOM, prev.w * zoomFactor));
        const newH = Math.max(contentHeight * MIN_ZOOM, Math.min(contentHeight * MAX_ZOOM, prev.h * zoomFactor));

        // Zoom toward cursor position
        const svgPoint = screenToSvg(e.clientX, e.clientY);
        const ratioX = (svgPoint.x - prev.x) / prev.w;
        const ratioY = (svgPoint.y - prev.y) / prev.h;

        return {
          x: svgPoint.x - ratioX * newW,
          y: svgPoint.y - ratioY * newH,
          w: newW,
          h: newH,
        };
      });
    },
    [contentWidth, contentHeight, screenToSvg]
  );

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    isPanning.current = true;
    didPan.current = false;
    panStart.current = { x: e.clientX, y: e.clientY };
    (e.target as Element).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanning.current) return;
      const svg = svgRef.current;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const dx = (e.clientX - panStart.current.x) * (viewBox.w / rect.width);
      const dy = (e.clientY - panStart.current.y) * (viewBox.h / rect.height);

      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        didPan.current = true;
      }

      panStart.current = { x: e.clientX, y: e.clientY };

      setViewBox((prev) => ({
        ...prev,
        x: prev.x - dx,
        y: prev.y - dy,
      }));
    },
    [viewBox.w, viewBox.h]
  );

  const handlePointerUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const handleSystemClick = useCallback(
    (systemId: string) => {
      // Don't select if the user was panning
      if (didPan.current) return;
      onSelectSystem(systemId);
    },
    [onSelectSystem]
  );

  const handleResetView = useCallback(() => {
    setViewBox({ x: 0, y: 0, w: contentWidth, h: contentHeight });
  }, [contentWidth, contentHeight]);

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
          onClick={() => entry && handleSystemClick(entry.id)}
          style={{ cursor: hasSystem ? "pointer" : "default" }}
        >
          <polygon
            points={hexPoints(cx, cy, HEX_SIZE - 1)}
            className={`hex-cell ${hasSystem ? "hex-occupied" : ""} ${isSelected ? "hex-selected" : ""}`}
          />
          <text
            x={cx}
            y={cy + HEX_SIZE * 0.38}
            className="hex-coord"
            textAnchor="middle"
          >
            {hexLabel}
          </text>
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

  const isZoomed =
    viewBox.x !== 0 ||
    viewBox.y !== 0 ||
    Math.abs(viewBox.w - contentWidth) > 1 ||
    Math.abs(viewBox.h - contentHeight) > 1;

  return (
    <div className="hex-map-container">
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        className="hex-map-svg"
        preserveAspectRatio="xMidYMid meet"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {hexes}
      </svg>
      {isZoomed && (
        <button className="map-reset-btn" onClick={handleResetView}>
          Reset View
        </button>
      )}
    </div>
  );
}
