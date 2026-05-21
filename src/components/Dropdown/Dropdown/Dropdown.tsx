import React, { useState, useRef, useCallback } from "react";
import ToggleField from "../../ToggleField/ToggleField";
import InputField from "../../Inputs/InputField";

export type OptionsListPosition = "top" | "bottom" | "left" | "right" | "inside";
export type OpenMenuMode = "click" | "hover";
export type CloseMenuMode = "click_toggle" | "hover_toggle" | "mouse_leave" | "click_option" | "hover_option";

export interface DropdownItem {
  label: string;
  children?: DropdownItem[];
  optionsListPosition?: OptionsListPosition;
  Indentation?: string | number;
  element?: React.ReactNode;
  onClick?: () => void;
}

export interface OptionItemProps {
  label: string;
  onClick?: () => void;
  active?: boolean;
  hasChildren?: boolean;
  highlighted?: boolean;
  onHover?: () => void;
  onLeave?: () => void;
}

export interface DropdownProps {
  triggerItem?: DropdownItem;
  optionsListPosition?: OptionsListPosition;
  Indentation?: string | number;
  AllowMultipleMenusOpened?: boolean;
  RememberOpenedMenus?: boolean;
  OpenMenu?: OpenMenuMode[];
  CloseMenu?: CloseMenuMode[];
  OptionItem?: (p: OptionItemProps) => React.ReactNode;
  searchable?: boolean;
  searchPlaceholder?: string;
  dynamicPlaceholder?: boolean;
  showSelectedValue?: boolean;
}

export interface Props {
  optionsListPosition?: OptionsListPosition;
  Indentation?: string | number;
  AllowMultipleMenusOpened?: boolean;
  RememberOpenedMenus?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  dynamicPlaceholder?: boolean;
  showSelectedValue?: boolean;
  OpenMenu?: OpenMenuMode[];
  CloseMenu?: CloseMenuMode[];
}

export const dropdownPropKeys: (keyof Props)[] = [
  "optionsListPosition",
  "Indentation",
  "AllowMultipleMenusOpened",
  "RememberOpenedMenus",
  "searchable",
  "searchPlaceholder",
  "dynamicPlaceholder",
  "showSelectedValue",
  "OpenMenu",
  "CloseMenu"
];

export const dropdownDefaultProps: Props = {
  optionsListPosition: "bottom",
  Indentation: 15,
  AllowMultipleMenusOpened: false,
  RememberOpenedMenus: true,
  searchable: false,
  searchPlaceholder: "Search...",
  dynamicPlaceholder: false,
  showSelectedValue: false,
  OpenMenu: ["click"],
  CloseMenu: ["click_toggle"]
};

export const dropdownPropOptions: Partial<Record<keyof Props, any[]>> = {
  optionsListPosition: ["top", "bottom", "left", "right", "inside"],
  OpenMenu: [["click"], ["hover"], ["click", "hover"]],
  CloseMenu: [
    ["click_toggle"],
    ["hover_toggle"],
    ["mouse_leave"],
    ["click_option"],
    ["hover_option"],
    ["click_toggle", "click_option"]
  ]
};

const generateNestedItems = (
  prefix: string,
  currentDepth: number,
  maxDepth: number
): DropdownItem[] => {
  if (currentDepth > maxDepth) {
    return [];
  }

  return [0, 1, 2].map((i) => {
    const label = `${prefix}${i}`;
    const children = generateNestedItems(label, currentDepth + 1, maxDepth);

    return {
      label,
      children: children.length > 0 ? children : undefined,
      onClick:
        children.length === 0
          ? () => console.log(`Clicked: ${label}`)
          : undefined
    };
  });
};

const defaultTriggerItem: DropdownItem = {
  label: "0",
  children: generateNestedItems("0", 1, 4)
};

const parseIndent = (value?: string | number) => {
  if (!value) return 0;
  if (typeof value === "number") return value;
  const parts = String(value)
    .split(",")
    .map((v) => v.trim());
  return parseInt(parts[parts.length - 1] || "0", 10);
};

const DefaultOptionItem: React.FC<OptionItemProps> = ({
  label,
  onClick,
  active,
  hasChildren,
  highlighted,
  onHover,
  onLeave
}) => (
  <div
    onClick={onClick}
    onMouseEnter={onHover}
    onMouseLeave={onLeave}
    style={{
      width: "100%",
      padding: "10px 14px",
      boxSizing: "border-box",
      backgroundColor: highlighted
        ? "#444"
        : hasChildren && active
        ? "#2a2a2a"
        : "#1f1f1f",
      color: "#f5f5f5",
      cursor: "pointer",
      borderBottom: "1px solid #333",
      fontSize: 14,
      userSelect: "none",
      transition: "background-color 0.2s",
      display: "flex",
      alignItems: "center",
      gap: "8px"
    }}
  >
    {hasChildren && <span style={{ opacity: 0.6 }}>{active ? "▼" : "▶"}</span>}
    {label}
  </div>
);

interface NodeProps {
  item: DropdownItem;
  config: DropdownProps;
  path: string;
  openSet: React.MutableRefObject<Set<string>>;
  searchQuery?: string;
  onSearchChange?: (v: string) => void;
  selectedValue?: string;
  onSelectedValueChange?: (v: string) => void;
  hoverPlaceholder?: string;
  onHoverPlaceholderChange?: (v: string) => void;
  forceOpen?: boolean;
  onToggle?: (v: boolean) => void;
  onLeafClick?: () => void;
  isRoot?: boolean;
  forceUpdate: () => void;
}

const Node: React.FC<NodeProps> = ({
  item,
  config,
  path,
  openSet,
  searchQuery,
  onSearchChange,
  selectedValue,
  onSelectedValueChange,
  hoverPlaceholder,
  onHoverPlaceholderChange,
  forceOpen,
  onToggle,
  onLeafClick,
  isRoot,
  forceUpdate
}) => {
  const {
    Indentation,
    AllowMultipleMenusOpened = false,
    RememberOpenedMenus = true,
    OpenMenu = ["click"],
    CloseMenu = ["click_toggle"],
    OptionItem,
    searchable,
    searchPlaceholder,
    dynamicPlaceholder,
    showSelectedValue
  } = config;

  const optionsListPosition = item.optionsListPosition ?? config.optionsListPosition ?? "bottom";
  const indent = parseIndent(item.Indentation ?? Indentation);
  const hasChildren = !!item.children?.length;

  const filterItems = (items: DropdownItem[], query: string): DropdownItem[] => {
    if (!query) return items;
    
    return items
      .map((child) => {
        const matchesLabel = child.label.toLowerCase().includes(query.toLowerCase());
        const filteredChildren = child.children
          ? filterItems(child.children, query)
          : [];
        
        if (matchesLabel || filteredChildren.length > 0) {
          return {
            ...child,
            children: filteredChildren.length > 0 ? filteredChildren : child.children
          };
        }
        return null;
      })
      .filter((item): item is DropdownItem => item !== null);
  };

  const filteredChildren = searchQuery && item.children
    ? filterItems(item.children, searchQuery)
    : item.children;

  const isOpen = forceOpen !== undefined ? forceOpen : openSet.current.has(path);

  const setOpen = (value: boolean) => {
    onToggle?.(value);
    if (value) {
      openSet.current.add(path);
      if (!AllowMultipleMenusOpened) {
        const parentPath = path.substring(0, path.lastIndexOf("."));
        openSet.current.forEach((k) => {
          if (k !== path && k.startsWith(parentPath + ".") && k.split(".").length === path.split(".").length) {
            openSet.current.delete(k);
          }
        });
      }
    } else {
      openSet.current.delete(path);
      if (!RememberOpenedMenus) {
        openSet.current.forEach((k) => {
          if (k.startsWith(path + ".")) openSet.current.delete(k);
        });
      }
    }
    forceUpdate();
  };

  const handleOptionClick = (childItem: DropdownItem) => {
    if (childItem.onClick) {
      childItem.onClick();
      if (showSelectedValue && onSelectedValueChange) {
        onSelectedValueChange(childItem.label);
      }
      if (CloseMenu?.includes("click_option")) {
        onLeafClick?.();
      }
    }
  };

  const handleOptionHover = (childLabel: string) => {
    if (dynamicPlaceholder && onHoverPlaceholderChange) {
      onHoverPlaceholderChange(childLabel);
    }
  };

  const handleOptionLeave = () => {
    if (dynamicPlaceholder && onHoverPlaceholderChange) {
      onHoverPlaceholderChange("");
    }
  };

  const handleMouseLeave = () => {
    if (CloseMenu?.includes("mouse_leave") && isOpen) {
      setOpen(false);
    }
  };

  const showSearch = isRoot && searchable;
  const displayPlaceholder = hoverPlaceholder || (showSelectedValue && selectedValue) || searchPlaceholder || "Search...";

  if (!hasChildren) {
    const triggerElement =
      item.element ??
      (OptionItem ?? DefaultOptionItem)({
        label: item.label,
        onClick: () => handleOptionClick(item),
        active: false,
        hasChildren: false,
        highlighted: false,
        onHover: () => handleOptionHover(item.label),
        onLeave: handleOptionLeave
      });

    return <div style={{ width: "100%" }}>{triggerElement}</div>;
  }

  const toggleElement = showSearch ? (
    <InputField
      type="string"
      value={searchQuery ?? ""}
      placeholder={displayPlaceholder}
      setter={(v) => onSearchChange?.(v)}
    />
  ) : (
    item.element ??
    (OptionItem ?? DefaultOptionItem)({
      label: item.label,
      onClick: () => {},
      active: isOpen,
      hasChildren: true,
      highlighted: false
    })
  );

  const isInsideMode = optionsListPosition === "inside";

  const getPositionStyles = (): React.CSSProperties => {
    if (isInsideMode) {
      return {};
    }

    switch (optionsListPosition) {
      case "bottom":
        return {
          position: "absolute",
          top: "100%",
          left: 0,
          zIndex: 1000,
          backgroundColor: "#1a1a1a"
        };
      case "top":
        return {
          position: "absolute",
          bottom: "100%",
          left: 0,
          zIndex: 1000,
          backgroundColor: "#1a1a1a"
        };
      case "left":
        return {
          position: "absolute",
          top: 0,
          right: "100%",
          zIndex: 1000,
          backgroundColor: "#1a1a1a"
        };
      case "right":
        return {
          position: "absolute",
          top: 0,
          left: "100%",
          zIndex: 1000,
          backgroundColor: "#1a1a1a"
        };
      default:
        return {
          position: "absolute",
          top: "100%",
          left: 0,
          zIndex: 1000,
          backgroundColor: "#1a1a1a"
        };
    }
  };

  const fieldContent = filteredChildren && filteredChildren.length > 0 ? (
    <div 
      style={{ 
        width: "100%",
        marginLeft: isInsideMode ? indent : 0,
        ...getPositionStyles()
      }}
      onMouseLeave={handleMouseLeave}
    >
      {filteredChildren.map((child, i) => {
        const cp = `${path}.${i}`;
        return (
          <Node
            key={cp}
            item={child}
            config={config}
            path={cp}
            openSet={openSet}
            searchQuery={searchQuery}
            selectedValue={selectedValue}
            onSelectedValueChange={onSelectedValueChange}
            hoverPlaceholder={hoverPlaceholder}
            onHoverPlaceholderChange={onHoverPlaceholderChange}
            onLeafClick={onLeafClick}
            forceUpdate={forceUpdate}
          />
        );
      })}
    </div>
  ) : null;

  const trigger = OpenMenu?.includes("click") ? "click" : OpenMenu?.includes("hover") ? "hover" : "click";

  if (showSearch) {
    return (
      <div style={{ width: "100%", position: isInsideMode ? "static" : "relative" }}>
        {toggleElement}
        {isOpen && fieldContent}
      </div>
    );
  }

  return (
    <div style={{ width: "100%", position: isInsideMode ? "static" : "relative" }}>
      <ToggleField
        ToggleElement={toggleElement}
        FieldContent={fieldContent}
        trigger={trigger}
        isOpen={isOpen}
        onOpen={() => setOpen(true)}
        onClose={() => {
          if (CloseMenu?.includes("click_toggle") || CloseMenu?.includes("hover_toggle")) {
            setOpen(false);
          }
        }}
        closeOnBlur={false}
        buttonStyle={{
          width: "100%",
          padding: 0
        }}
        containerStyle={{
          width: "100%"
        }}
      />
    </div>
  );
};

const Dropdown: React.FC<DropdownProps> = (config) => {
  const openSet = useRef<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedValue, setSelectedValue] = useState("");
  const [hoverPlaceholder, setHoverPlaceholder] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [, setTick] = useState(0);
  const forceUpdate = useCallback(() => setTick((t) => t + 1), []);
  const item = config.triggerItem ?? defaultTriggerItem;
  const { searchable, CloseMenu = ["click_toggle"] } = config;

  return (
    <div style={{ 
      outline: "none", 
      width: "100%", 
      minWidth: "120px", 
      backgroundColor: "#1a1a1a", 
      borderRadius: "4px"
    }}>
      <Node
        item={item}
        config={config}
        path="0"
        openSet={openSet}
        searchQuery={searchable ? searchQuery : undefined}
        onSearchChange={searchable ? setSearchQuery : undefined}
        selectedValue={selectedValue}
        onSelectedValueChange={setSelectedValue}
        hoverPlaceholder={hoverPlaceholder}
        onHoverPlaceholderChange={setHoverPlaceholder}
        forceOpen={searchable ? isOpen : undefined}
        onToggle={searchable ? setIsOpen : undefined}
        onLeafClick={() => {
          if (CloseMenu.includes("click_option")) {
            openSet.current.clear();
            forceUpdate();
          }
          if (searchable) {
            setIsOpen(false);
            if (!config.showSelectedValue) {
              setSearchQuery("");
            }
          }
        }}
        isRoot
        forceUpdate={forceUpdate}
      />
    </div>
  );
};

export default Dropdown;