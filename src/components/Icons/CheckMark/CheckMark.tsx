import React from "react";

export interface Props {
  size?: number;
  strokeColor?: string;
  strokeWidth?: number;
}

export const checkmarkPropKeys: (keyof Props)[] = ["size", "strokeColor", "strokeWidth"];

export const checkmarkDefaultProps: Props = {
  size: 60,
  strokeColor: "white",
  strokeWidth: 2,
};

export const checkmarkNumberProps: (keyof Props)[] = ["size", "strokeWidth"];

const CheckMark: React.FC<Props> = ({
  size = 60,
  strokeColor = "white",
  strokeWidth = 2,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: "block",
        strokeLinecap: "round",
        strokeLinejoin: "round",
      }}
    >
      <polyline
        points="20 6 9 17 4 12"
        style={{
          stroke: strokeColor,
          strokeWidth,
          fill: "none",
          transform: "scale(0.5, 0.7)",
          transformBox: "fill-box",
          transformOrigin: "right",
        }}
      />
    </svg>
  );
};

export default CheckMark;