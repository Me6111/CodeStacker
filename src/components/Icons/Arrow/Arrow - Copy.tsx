import React from "react";

export type Dir = "top" | "bottom" | "left" | "right";

export interface Props {
  width?: number;
  height?: number;
  notch?: number;
  direction?: Dir;
  directionDegrees?: number;
  strokeWidth?: number;
  strokeColor?: string;
  fillColor?: string;
  transition?: number;
}

export const arrowPropOptions = {
  direction: ["top", "bottom", "left", "right"] as Dir[],
};

const directionToDegrees = (dir: Dir) => {
  switch (dir) {
    case "right": return 90;
    case "bottom": return 180;
    case "left": return -90;
    default: return 0;
  }
};

const Arrow: React.FC<Props> = ({
  width,
  height,
  notch,
  direction,
  directionDegrees,
  strokeWidth,
  strokeColor,
  fillColor,
  transition,
}) => {
  const w = width ?? 12;
  const h = height ?? 8;
  const n = notch ?? 0;
  const sw = strokeWidth ?? 0.25;
  const sc = strokeColor ?? "black";
  const fc = fillColor ?? "none";
  const tr = transition ?? 0.25;

  const rotateDeg = typeof directionDegrees === "number" ? directionDegrees : direction ? directionToDegrees(direction) : 0;
  const cx = w / 2;
  const cy = h / 2;

  const polygonPoints = [
    `${cx},${cy - h / 2}`,
    `${cx - w / 2},${cy + h / 2}`,
    `${cx},${cy + h / 2 - n}`,
    `${cx + w / 2},${cy + h / 2}`,
  ].join(" ");

  return (
    <div className="arrow" style={{ width: w, height: h, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block", transform: `rotate(${rotateDeg}deg)`, transformOrigin: "center", transition: `all ${tr}s ease` }}
      >
        <polygon points={polygonPoints} style={{ fill: fc, stroke: sc, strokeWidth: sw }} />
      </svg>
    </div>
  );
};

export default Arrow;