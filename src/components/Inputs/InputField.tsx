import React, { useState } from "react";
import Dropdown, { DropdownItem } from "../Dropdown/Dropdown/Dropdown";
import Adjuster_Number from "./../ValueAdjusters/Adjuster_Number";
import Adjuster_Color from "./../ValueAdjusters/Adjuster_Color";
import Adjuster_Code from "./../ValueAdjusters/Adjuster_Code";

export type FieldType = "string" | "number" | "color" | "boolean" | "enum" | "multiline" | "code";

export interface Props {
  type?: FieldType;
  value?: any;
  placeholder?: string;
}

export const inputfieldPropKeys: (keyof Props)[] = ["type", "value", "placeholder"];

export const inputfieldDefaultProps: Props = {
  type: "string",
  value: "",
  placeholder: "Enter value...",
};

export const inputfieldPropOptions: Partial<Record<keyof Props, any[]>> = {};

export type InputFieldSpec = Props & {
  setter?: (v: any) => void;
  options?: any[];
  min?: number;
  max?: number;
  step?: number;
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

const serializeValue = (value: any): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const deserializeValue = (raw: string, originalValue: any): any => {
  if (typeof originalValue === "object" && originalValue !== null) {
    try { return JSON.parse(raw); } catch { return raw; }
  }
  return raw === "" ? undefined : raw;
};

const InputField: React.FC<InputFieldSpec> = (props) => {
  const { value, setter, placeholder, min, max, step = 1, options } = props;
  const type = props.type ?? "string";
  const [filter, setFilter] = useState("");

  if (type === "number") {
    return <Adjuster_Number value={value} setter={setter ?? (() => {})} min={min} max={max} step={step} />;
  }

  if (type === "color") {
    return <Adjuster_Color value={value} setter={setter ?? (() => {})} />;
  }

  if (type === "code") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "6px", width: "100%", minWidth: 0 }}>
        <input
          type="text"
          readOnly
          value={serializeValue(value)}
          placeholder={placeholder ?? "code..."}
          style={{
            ...baseInputStyle,
            color: "#888",
            cursor: "default",
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            fontSize: "12px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        />
        <Adjuster_Code value={serializeValue(value)} setter={setter ?? (() => {})} />
      </div>
    );
  }

  if (type === "boolean") {
    return (
      <div
        onClick={() => setter?.(!value)}
        style={{
          width: "40px",
          height: "22px",
          borderRadius: "11px",
          backgroundColor: value ? "#4caf50" : "#333",
          position: "relative",
          cursor: "pointer",
          transition: "background-color 0.2s",
          flexShrink: 0,
        }}
      >
        <div style={{
          position: "absolute",
          top: "3px",
          left: value ? "21px" : "3px",
          width: "16px",
          height: "16px",
          borderRadius: "50%",
          backgroundColor: "#fff",
          transition: "left 0.2s",
        }} />
      </div>
    );
  }

  if (type === "enum" && options) {
    const filtered = options.filter(opt =>
      String(opt).toLowerCase().includes(filter.toLowerCase())
    );

    const triggerItem: DropdownItem = {
      label: "",
      element: (
        <input
          type="text"
          value={filter || value || ""}
          placeholder={placeholder ?? "Select or type..."}
          onChange={(e) => {
            setFilter(e.target.value);
            setter?.(e.target.value);
          }}
          style={baseInputStyle}
        />
      ),
      children: filtered.map((opt) => ({
        label: String(opt),
        onClick: () => {
          setter?.(opt);
          setFilter("");
        },
      })),
    };

    return (
      <Dropdown
        triggerItem={triggerItem}
        optionsListPosition="inside"
        OpenMenu={["click"]}
        CloseMenu={["click_option"]}
        AllowMultipleMenusOpened={false}
        RememberOpenedMenus={false}
      />
    );
  }

  if (type === "multiline") {
    return (
      <textarea
        value={serializeValue(value)}
        placeholder={placeholder}
        onChange={(e) => setter?.(deserializeValue(e.target.value, value))}
        style={{ ...baseInputStyle, resize: "vertical", minHeight: "80px" }}
      />
    );
  }

  return (
    <input
      type="text"
      value={serializeValue(value)}
      placeholder={placeholder}
      onChange={(e) => setter?.(deserializeValue(e.target.value, value))}
      style={baseInputStyle}
    />
  );
};

export default InputField;