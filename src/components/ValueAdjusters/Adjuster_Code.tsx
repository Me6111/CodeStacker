import React, { useState } from "react";
import ToggleField from "../ToggleField/ToggleField";
import CodeEditor from "../../projects/Stack/NodeJS/React/Components/CodeEditor";

interface Adjuster_CodeProps {
  value: string;
  setter: (v: any) => void;
  language?: string;
}

interface ParseError {
  message: string;
  line: number | null;
}

const prettyPrint = (raw: string): string => {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
};

const sanitizeJson = (raw: string): string =>
  raw.replace(/,(\s*[\]}])/g, "$1");

const extractErrorPosition = (msg: string): { line: number | null } => {
  const match = msg.match(/line (\d+)/i);
  return { line: match ? parseInt(match[1]) : null };
};

const Adjuster_Code: React.FC<Adjuster_CodeProps> = ({ value, setter, language = "json" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [parseError, setParseError] = useState<ParseError | null>(null);

  const handleOpen = () => {
    setDraft(prettyPrint(value));
    setParseError(null);
    setIsOpen(true);
  };

  const handleClose = () => {
    setParseError(null);
    setIsOpen(false);
  };

  const handleSave = () => {
    const sanitized = sanitizeJson(draft);
    try {
      const parsed = JSON.parse(sanitized);
      setter(parsed);
      setParseError(null);
      setIsOpen(false);
    } catch (e: any) {
      const msg = e.message ?? "Invalid JSON";
      const { line } = extractErrorPosition(msg);
      setParseError({ message: msg, line });
    }
  };

  const headerActions = (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <button
        onClick={handleSave}
        style={{
          padding: "3px 12px",
          backgroundColor: parseError ? "#3a1e1e" : "#1e3a1e",
          color: parseError ? "#f44336" : "#4caf50",
          border: `1px solid ${parseError ? "#5a2e2e" : "#2e5a2e"}`,
          borderRadius: "4px", cursor: "pointer",
          fontSize: "11px", fontFamily: "monospace", fontWeight: 600,
        }}
      >
        save
      </button>
      <button
        onClick={handleClose}
        style={{
          width: "24px", height: "24px", display: "flex",
          alignItems: "center", justifyContent: "center",
          backgroundColor: "transparent", border: "1px solid #333",
          borderRadius: "4px", cursor: "pointer", color: "#666",
          fontSize: "14px", lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );

  const panel = (
    <div style={{
      position: "fixed", top: "50%", left: "50%",
      transform: "translate(-50%, -50%)", zIndex: 9999,
      width: "min(640px, 92vw)",
      borderRadius: "8px", display: "flex", flexDirection: "column",
      boxShadow: "0 8px 40px rgba(0,0,0,0.7)", overflow: "hidden",
    }}>
      <CodeEditor
        value={draft}
        onChange={setDraft}
        language={language}
        height="320px"
        headerActions={headerActions}
        showCopy={false}
      />
      {parseError && (
        <div style={{
          padding: "6px 12px", background: "#1a0a0a",
          borderTop: "1px solid #3a1e1e", fontFamily: "monospace",
          fontSize: "11px", color: "#f44336",
          display: "flex", alignItems: "center", gap: "10px",
        }}>
          <span>{parseError.message}</span>
          {parseError.line && (
            <span style={{ color: "#f44336", opacity: 0.6, whiteSpace: "nowrap" }}>
              line {parseError.line}
            </span>
          )}
        </div>
      )}
      <div style={{
        padding: "5px 12px", borderTop: "1px solid #1a1a1a",
        background: "#0a0a0a", fontFamily: "monospace",
        fontSize: "10px", color: "#333", display: "flex", gap: "16px",
      }}>
        <span>⌘↵ save</span>
        <span>trailing commas auto-fixed</span>
      </div>
    </div>
  );

  const backdrop = isOpen ? (
    <div onClick={handleClose} style={{ position: "fixed", inset: 0, zIndex: 9998, backgroundColor: "rgba(0,0,0,0.5)" }} />
  ) : null;

  return (
    <>
      {backdrop}
      <ToggleField
        isOpen={isOpen}
        onOpen={handleOpen}
        onClose={handleClose}
        closeOnBlur={false}
        trigger="click"
        buttonStyle={{
          width: "28px", height: "28px", padding: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          backgroundColor: isOpen ? "#1e3a1e" : "#1a1a1a",
          border: `1px solid ${isOpen ? "#2e5a2e" : "#333"}`,
          borderRadius: "4px", cursor: "pointer",
          color: isOpen ? "#4caf50" : "#888",
          fontSize: "11px", fontFamily: "monospace", fontWeight: 700,
          flexShrink: 0, transition: "all 0.15s",
        }}
        FieldContent={panel}
      >
        {"</>"}
      </ToggleField>
    </>
  );
};

export default Adjuster_Code;