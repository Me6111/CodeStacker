import React from "react";
import CodeBit from "../CodeBit/CodeBit";
import InputField, { FieldType } from "../../Inputs/InputField";
import Dropdown, { DropdownItem } from "../../Dropdown/Dropdown/Dropdown";

export interface InputFieldConfig<T = any> {
  name: string;
  value: T;
  setter: (v: T) => void;
  options?: T[];
  isNumber?: boolean;
  isColor?: boolean;
  isCode?: boolean;
  isInherited?: boolean;
  toggleInherited?: () => void;
  inheritedValue?: T;
  min?: number;
  max?: number;
  step?: number;
}

const inferType = (field: InputFieldConfig): FieldType => {
  if (field.isCode) return "code";
  if (field.options && field.options.length > 0) return "enum";
  if (field.isColor) return "color";
  if (field.isNumber) return "number";
  if (typeof field.value === "boolean") return "boolean";
  const lower = field.name.toLowerCase();
  if (lower.includes("color")) return "color";
  if (typeof field.value === "number") return "number";
  return "string";
};

const typeOptions: FieldType[] = ["string", "number", "color", "boolean", "enum", "multiline", "code"];

const TypeDropdown: React.FC<{ value: FieldType; setter: (v: FieldType) => void }> = ({ value, setter }) => {
  const triggerItem: DropdownItem = {
    label: value ?? "select type",
    children: typeOptions.map((opt) => ({
      label: opt,
      onClick: () => setter(opt),
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
      searchable
      searchPlaceholder="Search type..."
    />
  );
};

const PropsEditor: React.FC<{ fields: InputFieldConfig[] }> = ({ fields }) => {
  return (
    <div
      className="PropsEditor"
      style={{
        width: "100%",
        maxWidth: "360px",
        padding: "20px 28px",
        borderRadius: "8px",
        backgroundColor: "#0a0a0a",
        border: "1px solid #222",
        boxSizing: "border-box",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        alignItems: "start",
        gap: "12px 16px",
      }}
    >
      {fields.map((field, idx) => {
        const type = inferType(field);
        const isTypeField = field.name === "type";
        return (
          <React.Fragment key={idx}>
            <div
              className="propseditor_label_value"
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "8px",
                minWidth: 0, 
                overflow: "hidden", 
                paddingTop: "10px" 
              }}
            >
              <CodeBit text={field.name} />
              {field.toggleInherited && (
                <button
                  onClick={field.toggleInherited}
                  style={{
                    padding: "2px 6px",
                    fontSize: "9px",
                    backgroundColor: field.isInherited ? "#333" : "#1e3a1e",
                    color: field.isInherited ? "#888" : "#4caf50",
                    border: field.isInherited ? "1px solid #444" : "1px solid #2e5a2e",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontFamily: "monospace",
                    fontWeight: 600,
                    userSelect: "none"
                  }}
                  title={field.isInherited ? "Using inherited value - click to override" : "Using custom value - click to inherit"}
                >
                  {field.isInherited ? "inherit" : "override"}
                </button>
              )}
            </div>
            <div
              className="propseditor_label_value"
              style={{ display: "flex", alignItems: "center", minWidth: 0, width: "100%" }}
            >
              {field.isInherited && field.inheritedValue !== undefined ? (
                <div style={{ 
                  padding: "6px 10px", 
                  color: "#666", 
                  fontSize: "12px", 
                  fontStyle: "italic",
                  fontFamily: "monospace",
                  backgroundColor: "#0f0f0f",
                  border: "1px solid #222",
                  borderRadius: "4px",
                  width: "100%",
                  boxSizing: "border-box"
                }}>
                  {String(field.inheritedValue)}
                </div>
              ) : isTypeField ? (
                <TypeDropdown value={field.value} setter={field.setter} />
              ) : (
                <InputField
                  type={type}
                  value={field.value}
                  setter={field.setter}
                  options={field.options}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                />
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default PropsEditor;
export type { InputFieldConfig as InputField };