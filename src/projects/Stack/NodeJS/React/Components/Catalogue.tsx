import React from "react";
import { useNavigate } from "react-router-dom";
import Dropdown, { DropdownItem } from "../../../../../components/Dropdown/Dropdown/Dropdown";

export const catalogue: Record<string, string[]> = {
  Icons: ["Arrow", "CheckMark", "Square", "CopyIcon_Squares"],
  Sliders: ["Slider"],
  Inputs: ["InputField"],
  ValueAdjusters: ["Adjuster_Number", "Adjuster_Color"],
  Dropdown: ["Dropdown"],
  Tables: ["Table_0", "Table"]
};

export const cataloguePathType: Record<string, "flat" | "nested"> = {
  Icons: "nested",
  Sliders: "nested",
  Inputs: "flat",
  ValueAdjusters: "flat",
  Dropdown: "nested",
  Tables: "flat",
};

const Catalogue: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigate = (category: string, name: string) => {
    navigate(
      `/Stack/NodeJS/React/Components/${category}/${name}`,
      { state: { componentName: name } }
    );
  };

  const triggerItem: DropdownItem = {
    label: "Components",
    children: Object.entries(catalogue).map(([category, items]) => ({
      label: category,
      children: items.map((name) => ({
        label: name,
        onClick: () => handleNavigate(category, name),
      })),
    })),
  };

  return (
    <div className="Catalogue" style={{ width: "300px", height: "100%" }}>
      <Dropdown
        triggerItem={triggerItem}
        optionsListPosition="inside"
        Indentation="left, 25px"
        AllowMultipleMenusOpened={true}
        RememberOpenedMenus={true}
        OpenMenu={["click"]}
        CloseMenu={["click_option_again"]}
      />
    </div>
  );
};

export default Catalogue;