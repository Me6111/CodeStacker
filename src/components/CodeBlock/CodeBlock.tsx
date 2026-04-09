import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import CopyButton from "../Buttons/CopyButton/CopyButton";

interface CodeBlockProps {
  code?: string | unknown;
  language?: string;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  showCopy?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = "tsx",
  headerLeft,
  headerRight,
  showCopy = true,
  children,
  style,
}) => {
  const safeCode = typeof code === "string" ? code.trim() : "";

  return (
    <div
      className="CodeBlock"
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        border: "1px solid #333",
        borderRadius: "4px",
        background: "#1e1e1e",
        fontSize: "0.9rem",
        overflow: "hidden",
        maxHeight: "100%",
        ...style,
      }}
    >
      <div
        className="CodeBlock_Header"
        style={{
          flexShrink: 0,
          background: "#1e1e1e",
          color: "#ccc",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "6px 12px",
          fontFamily: "monospace",
          userSelect: "none",
          whiteSpace: "nowrap",
          borderBottom: "1px solid #333",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {headerLeft ?? (
            <span style={{ textTransform: "uppercase", fontWeight: 600, fontSize: "0.75rem" }}>
              {language}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {headerRight}
          {showCopy && !headerRight && <CopyButton textToCopy={safeCode} size={18} />}
        </div>
      </div>

      <div className="CodeBlock_Body" style={{ overflowY: "auto", width: "100%", flex: 1 }}>
        {children ?? (
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            showLineNumbers
            customStyle={{ margin: 0, padding: "1rem", background: "#1e1e1e", width: "100%" }}
            codeTagProps={{ style: { whiteSpace: "pre", display: "inline-block", minWidth: "100%" } }}
          >
            {safeCode}
          </SyntaxHighlighter>
        )}
      </div>
    </div>
  );
};

export default CodeBlock;