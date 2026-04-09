import React from "react";
import Square from "./../Square/Square";

export interface Props {
  width?: number;
  height?: number;
  roundedCorner?: number;
  strokeWidth?: number;
  fillColor?: string;
  strokeColor?: string;
  square1_Width?: number;
  square1_Height?: number;
  square1_RoundedCorner?: number;
  square1_StrokeWidth?: number;
  square1_FillColor?: string;
  square1_StrokeColor?: string;
  square2_Width?: number;
  square2_Height?: number;
  square2_RoundedCorner?: number;
  square2_StrokeWidth?: number;
  square2_FillColor?: string;
  square2_StrokeColor?: string;
  squaresDistance?: number;
  squarePosition?: number;
}

export const copyicon_squaresPropKeys: (keyof Props)[] = [
  "width", "height", "roundedCorner", "strokeWidth", "fillColor", "strokeColor",
  "square1_Width", "square1_Height", "square1_RoundedCorner", "square1_StrokeWidth", "square1_FillColor", "square1_StrokeColor",
  "square2_Width", "square2_Height", "square2_RoundedCorner", "square2_StrokeWidth", "square2_FillColor", "square2_StrokeColor",
  "squaresDistance", "squarePosition",
];

export const copyicon_squaresDefaultProps: Props = {
  width: 40,
  height: 40,
  roundedCorner: 4,
  strokeWidth: 1.5,
  fillColor: "black",
  strokeColor: "white",
  squaresDistance: 8,
  squarePosition: 45,
};

export const copyicon_squaresNumberProps: (keyof Props)[] = [
  "width", "height", "roundedCorner", "strokeWidth",
  "square1_Width", "square1_Height", "square1_RoundedCorner", "square1_StrokeWidth",
  "square2_Width", "square2_Height", "square2_RoundedCorner", "square2_StrokeWidth",
  "squaresDistance", "squarePosition",
];

const CopyIcon_Squares: React.FC<Props> = ({
  width = 40,
  height = 40,
  roundedCorner = 4,
  strokeWidth = 1.5,
  fillColor = "black",
  strokeColor = "white",
  square1_Width,
  square1_Height,
  square1_RoundedCorner,
  square1_StrokeWidth,
  square1_FillColor,
  square1_StrokeColor,
  square2_Width,
  square2_Height,
  square2_RoundedCorner,
  square2_StrokeWidth,
  square2_FillColor,
  square2_StrokeColor,
  squaresDistance = 8,
  squarePosition = 45,
}) => {
  const s1w = square1_Width ?? width;
  const s1h = square1_Height ?? height ?? s1w;
  const s1r = square1_RoundedCorner ?? roundedCorner;
  const s1sw = square1_StrokeWidth ?? strokeWidth;
  const s1fc = square1_FillColor ?? fillColor;
  const s1sc = square1_StrokeColor ?? strokeColor;

  const s2w = square2_Width ?? width;
  const s2h = square2_Height ?? height ?? s2w;
  const s2r = square2_RoundedCorner ?? roundedCorner;
  const s2sw = square2_StrokeWidth ?? strokeWidth;
  const s2fc = square2_FillColor ?? fillColor;
  const s2sc = square2_StrokeColor ?? strokeColor;

  const angleRad = (squarePosition * Math.PI) / 180;
  const dx = Math.sin(angleRad) * squaresDistance;
  const dy = -Math.cos(angleRad) * squaresDistance;
  const pad = Math.max(s1sw, s2sw);

  const frontX = dx < 0 ? -dx + pad : pad;
  const frontY = dy < 0 ? -dy + pad : pad;
  const backX = frontX + dx;
  const backY = frontY + dy;

  const svgW = Math.max(frontX + s1w, backX + s2w) + pad;
  const svgH = Math.max(frontY + s1h, backY + s2h) + pad;

  return (
    <svg
      width={svgW}
      height={svgH}
      viewBox={`0 0 ${svgW} ${svgH}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", overflow: "visible", strokeLinecap: "round", strokeLinejoin: "round" }}
    >
      <Square x={backX} y={backY} width={s2w} height={s2h} roundedCorner={s2r} strokeWidth={s2sw} strokeColor={s2sc} fillColor={s2fc} />
      <Square x={frontX} y={frontY} width={s1w} height={s1h} roundedCorner={s1r} strokeWidth={s1sw} strokeColor={s1sc} fillColor={s1fc} />
    </svg>
  );
};

export default CopyIcon_Squares;