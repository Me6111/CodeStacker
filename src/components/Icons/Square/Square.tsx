import React from "react";

export interface Props {
  width?: number;
  height?: number;
  roundedCorner?: number;
  strokeWidth?: number;
  strokeColor?: string;
  fillColor?: string;
}

export const squarePropKeys: (keyof Props)[] = [
  "width", "height", "roundedCorner", "strokeWidth", "strokeColor", "fillColor"
];

export const squareDefaultProps: Props = {
  width: 40,
  height: 40,
  roundedCorner: 0,
  strokeWidth: 1.5,
  strokeColor: "white",
  fillColor: "black",
};

export const squareNumberProps: (keyof Props)[] = [
  "width", "height", "roundedCorner", "strokeWidth"
];

const Square: React.FC<Props & { x?: number; y?: number }> = ({
  width,
  height,
  roundedCorner = 0,
  strokeWidth = 1.5,
  strokeColor = "white",
  fillColor = "black",
  x = 0,
  y = 0,
}) => {
  const w = width ?? height ?? 40;
  const h = height ?? width ?? 40;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", overflow: "visible" }}
    >
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={roundedCorner}
        ry={roundedCorner}
        style={{ stroke: strokeColor, strokeWidth, fill: fillColor }}
      />
    </svg>
  );
};

export default Square;