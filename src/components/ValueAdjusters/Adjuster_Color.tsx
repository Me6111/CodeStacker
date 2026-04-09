import React, { useState, useEffect } from "react";

export interface Props {
  value?: string;
}

export const adjuster_colorPropKeys: (keyof Props)[] = ["value"];

export const adjuster_colorDefaultProps: Props = {
  value: "#ffffff",
};

const baseInputStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  padding: "6px 8px",
  borderRadius: "4px",
  border: "1px solid #333",
  backgroundColor: "#111",
  color: "#fff",
  fontSize: "14px",
  boxSizing: "border-box",
};

const colorNameToHex = (color: any): string => {
  if (color === null || color === undefined) return "#000000";
  const str = String(color);
  if (!str) return "#000000";
  if (str.startsWith("#")) return str;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "#000000";
    ctx.fillStyle = str;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return "#" + [d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, "0")).join("");
  } catch {
    return "#000000";
  }
};

const Adjuster_Color: React.FC<Props & { setter?: (v: string) => void }> = ({ value = "#ffffff", setter }) => {
  const [colorText, setColorText] = useState<string>(String(value ?? ""));
  const [hexValue, setHexValue] = useState<string>(() => colorNameToHex(value));

  useEffect(() => {
    setColorText(String(value ?? ""));
    setHexValue(colorNameToHex(value));
  }, [value]);

  const update = (v: string) => {
    setter?.(v);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", width: "100%", maxWidth: "300px" }}>
      <input
        type="color"
        value={hexValue}
        onChange={(e) => {
          setHexValue(e.target.value);
          setColorText(e.target.value);
          update(e.target.value);
        }}
        style={{ flexShrink: 0, width: "40px", height: "40px", padding: "2px", border: "1px solid #333", borderRadius: "4px", backgroundColor: "transparent", cursor: "pointer" }}
      />
      <input
        type="text"
        value={colorText}
        onChange={(e) => {
          setColorText(e.target.value);
          setHexValue(colorNameToHex(e.target.value));
          update(e.target.value);
        }}
        style={baseInputStyle}
      />
      <div style={{ flexShrink: 0, width: "28px", height: "28px", borderRadius: "4px", backgroundColor: colorNameToHex(colorText), border: "1px solid #333" }} />
    </div>
  );
};

export default Adjuster_Color;