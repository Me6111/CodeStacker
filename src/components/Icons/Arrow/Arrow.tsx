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

export const arrowPropKeys: (keyof Props)[] = [
  "width", "height", "notch", "direction", "directionDegrees", "strokeWidth", "strokeColor", "fillColor", "transition"
];

export const arrowPropOptions: Partial<Record<keyof Props, any[]>> = {
  direction: ["top", "bottom", "left", "right"],
};

export const arrowDefaultProps: Props = {
  width: 60,
  height: 40,
  notch: 0,
  strokeWidth: 1.5,
  strokeColor: "white",
  fillColor: "none",
  transition: 0.25,
};

export const arrowNumberProps: (keyof Props)[] = [
  "width", "height", "notch", "directionDegrees", "strokeWidth", "transition",
];

const directionToDegrees = (dir: Dir) => {
  switch (dir) {
    case "right": return 90;
    case "bottom": return 180;
    case "left": return -90;
    default: return 0;
  }
};

const Arrow: React.FC<Props> = ({
  width = 60,
  height = 40,
  notch = 0,
  direction,
  directionDegrees,
  strokeWidth = 1.5,
  strokeColor = "white",
  fillColor = "none",
  transition = 0.25,
}) => {
  const rotateDeg =
    typeof directionDegrees === "number"
      ? directionDegrees
      : direction
      ? directionToDegrees(direction)
      : 0;

  const cx = width / 2;
  const cy = height / 2;

  const polygonPoints = [
    `${cx},${cy - height / 2}`,
    `${cx - width / 2},${cy + height / 2}`,
    `${cx},${cy + height / 2 - notch}`,
    `${cx + width / 2},${cy + height / 2}`,
  ].join(" ");

  return (
    <div className="arrow" style={{ width, height, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block", transform: `rotate(${rotateDeg}deg)`, transformOrigin: "center center", transition: `all ${transition}s ease` }}
      >
        <polygon points={polygonPoints} style={{ fill: fillColor, stroke: strokeColor, strokeWidth }} />
      </svg>
    </div>
  );
};

export default Arrow;