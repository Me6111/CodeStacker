import React from "react";
import { useNavigate } from "react-router-dom";
import Dropdown, { DropdownItem } from "../../../../../../components/Dropdown/Dropdown/Dropdown";

type CatalogueNode = string | { [category: string]: CatalogueNode[] };

export type cataloguePathType = string;

export const Components: { [category: string]: CatalogueNode[] } = {
  Buttons:             ["Button", "CopyButton"],
  Code:                [
    "CodeBit",
    "CodeEditor",
    {
      ComponentPreview: ["ComponentPreview", "PreviewComponent", "PropsEditor"],
    },
  ],
  CheckBox:            ["CheckBox"],
  Dropdown:            ["Dropdown"],
  Breadcrumb:          ["Breadcrumb"],
  Icons:               [
    "CopyIcon_Squares",
    "HamburgerButton",
    "Logo",
    {
      "SVG Objects": ["SvgContainer", "Icon_X", "Square", "Arrow", "CheckMark"],
    },
  ],
  Inputs:              ["InputField"],
  Labels:              ["Label", "AriaLabel"],
  Nav:                 ["Nav"],
  ResponsiveContainer: ["ResponsiveContainer"],
  RouterContainer:     ["RouterContainer"],
  Sidebar:             ["Sidebar"],
  Sliders:             ["Slider"],
  Tables:              ["Table", "Table_0"],
  ToggleField:         ["ToggleField"],
  ValueAdjusters:      ["Adjuster_Code", "Adjuster_Color", "Adjuster_Number"],
};

const allFiles = import.meta.glob(
  "./../../../../../../components/**/*.tsx",
  { eager: false }
);

const fileNameOverrides: Record<string, string> = {
  InputField:       "Inputs/InputField",
  Slider:           "Sliders/Slider",
  Table:            "Tables/Table",
  Table_0:          "Tables/Table_0",
  HamburgerButton:  "Icons/HamburgerMenu/HamburgerButton",
  Logo:             "Icons/Hello/Logo",
  SvgContainer:     "Icons/SVG Objects/SvgContainer/SvgContainer",
  Icon_X:           "Icons/SVG Objects/X/Icon_X",
  Arrow:            "Icons/SVG Objects/Arrow/Arrow",
  CheckMark:        "Icons/SVG Objects/CheckMark/CheckMark",
  Square:           "Icons/SVG Objects/Square/Square",
  ToggleField:      "ToggleField/ToggleField",
};

export const resolveImportPath = (name: string): string | null => {
  const override = fileNameOverrides[name];
  if (override) {
    const key = Object.keys(allFiles).find(k => k.replace(/\\/g, '/').endsWith(`/${override}.tsx`));
    if (key) return key;
  }
  const nested = Object.keys(allFiles).find(k => k.replace(/\\/g, '/').endsWith(`/${name}/${name}.tsx`));
  if (nested) return nested;
  const flat = Object.keys(allFiles).find(k => k.replace(/\\/g, '/').endsWith(`/${name}.tsx`));
  return flat ?? null;
};

const buildDropdownItems = (
  nodes: CatalogueNode[],
  onNavigate: (name: string, category: string) => void,
  category: string
): DropdownItem[] =>
  nodes.map(node => {
    if (typeof node === "string") {
      return {
        label: node,
        onClick: () => onNavigate(node, category),
      };
    }
    const [cat, children] = Object.entries(node)[0];
    return {
      label: cat,
      children: buildDropdownItems(children, onNavigate, category),
      optionsListPosition: "inside" as const,
    };
  });

const Catalogue: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigate = (name: string, category: string) => {
    const importPath = resolveImportPath(name);
    if (!importPath) { console.warn(`No file found for component: ${name}`); return; }
    navigate(
      `/Stack/NodeJS/React/Components/${category}/${name}`,
      { state: { componentName: name, importPath } }
    );
  };

  return (
    <div
      className="Catalogue"
      style={{
        width:           "200px",
        height:          "100%",
        backgroundColor: "#0a0a0a",
        borderRight:     "1px solid #1a1a1a",
        display:         "flex",
        flexDirection:   "column",
        boxSizing:       "border-box",
        overflow:        "hidden",
      }}
    >
      <div style={{
        fontSize:      10,
        fontWeight:    600,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color:         "#333",
        padding:       "14px 12px 10px",
        borderBottom:  "1px solid #1a1a1a",
        flexShrink:    0,
      }}>
        Components
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", scrollbarWidth: "none" }}>
        {Object.entries(Components).map(([category, nodes]) => {
          const categoryItem: DropdownItem = {
            label: category,
            children: buildDropdownItems(nodes, handleNavigate, category),
            optionsListPosition: "inside" as const,
          };
          
          return (
            <div key={category} style={{ width: "200px", display: "flex" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Dropdown
                  triggerItem={categoryItem}
                  optionsListPosition="inside"
                  OpenMenu={["click"]}
                  CloseMenu={["click_toggle"]}
                  AllowMultipleMenusOpened={false}
                  Indentation={25}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Catalogue;