import React from "react";

const CodeBit: React.FC<{ text: string; color?: string }> = ({ text, color = "#fff" }) => {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 6px",
        borderRadius: "4px",
        backgroundColor: color,
        color: "#000",
        fontSize: "13px",
        fontFamily: "monospace",
        lineHeight: 1.4,
        whiteSpace: "nowrap"
      }}
    >
      {text}
    </span>
  );
};

export default CodeBit;
