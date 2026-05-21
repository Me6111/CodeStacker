import React, { useState } from "react";
import Dropdown, { DropdownItem } from "../../../components/Dropdown/Dropdown/Dropdown";
import Arrow from "../../../components/Icons/Arrow/Arrow";

const OptionWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 4,
    }}
  >
    {children}
  </div>
);

const CustomOption: React.FC<{
  label: string;
  isDropdown?: boolean;
  isOpen?: boolean;
}> = ({ label, isDropdown = false, isOpen }) => {
  const [hovered, setHovered] = useState(false);
  const arrowWidth = 12;
  const rotate = isDropdown ? (isOpen ? "bottom" : hovered ? "bottom" : "right") : undefined;

  return (
    <OptionWrapper>
      <div
        className=""
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex",
          alignItems: "center",
          height: 36,
          padding: "0 12px",
          backgroundColor: hovered ? "#eef2f7" : "#eef2f7",
          color: "#1f2937",
          cursor: "pointer",
          userSelect: "none",
          borderRadius: 6,
          boxSizing: "border-box",
          fontSize: 14,
          transition: "background-color 0.15s ease",
          gap: 8,
        }}
      >
        {isDropdown && (
          <div style={{ width: arrowWidth, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Arrow
              width={12}
              height={8}
              notch={0}
              rotate={rotate}
              fillColor="#6b7280"
              strokeColor="#6b7280"
              strokeWidth={0.25}
              transition={0.2}
            />
          </div>
        )}
        <span>{label}</span>
      </div>
    </OptionWrapper>
  );
};

const createDropdownItem = (label: string, childrenLabels: string[]): DropdownItem => ({
  label,
  children: childrenLabels.map((childLabel) => ({ label: childLabel })),
});

const rawData: DropdownItem[] = [
  {
    label: "InteractiveControls",
    children: [
      createDropdownItem("Buttons", ["primaryButton", "secondaryButton", "ghostButton", "iconButton", "fabButton"]),
      createDropdownItem("Links", ["textLink", "navigationLink", "externalLink", "anchorLink"]),
    ],
  },
  {
    label: "Inputs",
    children: [
      createDropdownItem("TextInputs", ["textField", "passwordField", "emailField", "searchField", "textarea"]),
      createDropdownItem("Selectors", ["dropdown", "combobox", "selectList", "datePicker", "timePicker"]),
      createDropdownItem("UploadInputs", ["fileUpload", "imageUpload", "dragDropZone"]),
    ],
  },
  {
    label: "DisplayElements",
    children: [
      createDropdownItem("Text", ["heading", "subheading", "paragraph", "label", "caption"]),
      createDropdownItem("Media", ["image", "video", "audio", "icon", "svg"]),
      createDropdownItem("StatusIndicators", ["badge", "tag", "statusDot", "progressBar"]),
    ],
  },
];

const enhanceItems = (items: DropdownItem[]): DropdownItem[] =>
  items.map((item) => ({
    ...item,
    children: item.children ? enhanceItems(item.children) : undefined,
  }));

const renderDropdownItem = (item: DropdownItem, key: string) => {
  const isDropdown = !!item.children?.length;
  return (
    <Dropdown
      key={key}
      triggerItem={{
        ...item,
        element: <CustomOption label={item.label} isDropdown={isDropdown} />,
      }}
      optionsListPosition="inside"
      OpenMenu={["click"]}
      CloseMenu={["click_option_again"]}
      DropdownOption={({ label, isOpen }) => <CustomOption label={label} isDropdown={isDropdown} isOpen={isOpen} />}
      Indentation="left, 12px"
    />
  );
};

const Dropdown_ComponentsCatalogue: React.FC = () => {
  const data = enhanceItems(rawData);

  return (
    <OptionWrapper>
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: 16,
          borderRadius: 10,
          width: 320,
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {data.map((item, idx) => renderDropdownItem(item, String(idx)))}
      </div>
    </OptionWrapper>
  );
};

export default Dropdown_ComponentsCatalogue;
