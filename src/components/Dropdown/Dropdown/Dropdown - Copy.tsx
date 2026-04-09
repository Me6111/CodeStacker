import React, { useState, useRef } from "react";

export type OptionsListPosition = "top" | "bottom" | "left" | "right" | "inside";
export type OpenMenuMode = "click" | "hover";
export type CloseMenuMode = "click_option_again" | "click_outside" | "mouse_leave";

export interface DropdownItem {
  label: string;
  children?: DropdownItem[];
  optionsListPosition?: OptionsListPosition;
  Indentation?: string;
  element?: React.ReactNode;
  onClick?: () => void;
}

export interface OptionItemProps {
  label: string;
  onClick?: () => void;
  active?: boolean;
  hasChildren?: boolean;
}

export interface DropdownProps {
  triggerItem?: DropdownItem;
  optionsListPosition?: OptionsListPosition;
  Indentation?: string;
  AllowMultipleMenusOpened?: boolean;
  RememberOpenedMenus?: boolean;
  OpenMenu?: OpenMenuMode[];
  CloseMenu?: CloseMenuMode[];
  OptionItem?: (p: OptionItemProps) => React.ReactNode;
}

const defaultTriggerItem: DropdownItem = {
  label: "Menu",
  children: [
    { label: "Item 1", onClick: () => {} },
    { label: "Item 2", onClick: () => {} },
    { label: "Item 3", onClick: () => {} },
  ],
};

const DefaultOptionItem: React.FC<OptionItemProps> = ({
  label,
  onClick,
  active,
  hasChildren
}) => (
  <div
    onClick={onClick}
    style={{
      width: "100%",
      padding: "10px 14px",
      boxSizing: "border-box",
      backgroundColor: hasChildren && active ? "#2a2a2a" : "#1f1f1f",
      color: "#f5f5f5",
      cursor: "pointer",
      borderBottom: "1px solid #333",
      fontSize: 14,
      userSelect: "none",
      transition: "background-color 0.2s"
    }}
    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#333")}
    onMouseLeave={e =>
      (e.currentTarget.style.backgroundColor =
        hasChildren && active ? "#2a2a2a" : "#1f1f1f")
    }
  >
    {label}
  </div>
);

const parseIndent = (value?: string) => {
  if (!value) return 0;
  const [, amount] = value.split(",").map(v => v.trim());
  return parseInt(amount || "0", 10);
};

const Wrapper: React.FC<{
  children: React.ReactNode;
  position?: OptionsListPosition;
  indent: number;
}> = ({ children, position = "inside", indent }) => {
  const base: React.CSSProperties =
    position === "inside"
      ? { display: "flex", flexDirection: "column", width: "100%" }
      : {
          position: "absolute",
          top: position === "bottom" ? "100%" : undefined,
          bottom: position === "top" ? "100%" : undefined,
          left: position === "right" ? "100%" : 0,
          right: position === "left" ? "100%" : undefined,
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          width: "100%"
        };
  return <div style={{ ...base, marginLeft: indent }}>{children}</div>;
};

interface NodeConfig {
  item: DropdownItem;
  config: DropdownProps;
  path: string;
  openMap: React.MutableRefObject<Record<string, boolean>>;
}

const Node: React.FC<NodeConfig> = ({ item, config, path, openMap }) => {
  const {
    optionsListPosition,
    Indentation,
    AllowMultipleMenusOpened = true,
    RememberOpenedMenus = false,
    OpenMenu,
    CloseMenu,
    OptionItem
  } = config;

  const indent = parseIndent(item.Indentation ?? Indentation);
  const position = item.optionsListPosition ?? optionsListPosition;
  const hasChildren = !!item.children?.length;

  const [open, setOpen] = useState(openMap.current[path] ?? false);

  const canClickOpen = OpenMenu?.includes("click");
  const canHoverOpen = OpenMenu?.includes("hover");
  const canClickClose = CloseMenu?.includes("click_option_again");
  const canMouseLeave = CloseMenu?.includes("mouse_leave");

  const clearChildren = () => {
    Object.keys(openMap.current).forEach(k => {
      if (k.startsWith(path + ".")) delete openMap.current[k];
    });
  };

  const setAndPersist = (value: boolean) => {
    setOpen(value);
    if (RememberOpenedMenus) openMap.current[path] = value;
    else delete openMap.current[path];
    if (!value && !RememberOpenedMenus) clearChildren();
  };

  const toggleClick = () => {
    if (item.onClick) {
      item.onClick();
      return;
    }
    if (!hasChildren) return;
    if (open && canClickClose) setAndPersist(false);
    else if (!open && canClickOpen) setAndPersist(true);
  };

  const onEnter = () => {
    if (hasChildren && canHoverOpen) setAndPersist(true);
  };

  const onLeave = () => {
    if (hasChildren && canMouseLeave) setAndPersist(false);
  };

  const renderOption =
    item.element ??
    (OptionItem ?? DefaultOptionItem)({
      label: item.label,
      onClick: toggleClick,
      active: open,
      hasChildren
    });

  return (
    <div style={{ position: "relative", width: "100%" }} onMouseEnter={onEnter} onMouseLeave={onLeave}>
      {renderOption}
      {open && hasChildren && (
        <Wrapper position={position} indent={indent}>
          {item.children!.map((child, i) => {
            const childPath = `${path}.${i}`;
            if (!AllowMultipleMenusOpened) {
              Object.keys(openMap.current).forEach(k => {
                if (k.startsWith(path + ".") && k !== childPath)
                  openMap.current[k] = false;
              });
            }
            return (
              <Node
                key={childPath}
                item={child}
                config={config}
                path={childPath}
                openMap={openMap}
              />
            );
          })}
        </Wrapper>
      )}
    </div>
  );
};

const Dropdown: React.FC<DropdownProps> = (config) => {
  const openMap = useRef<Record<string, boolean>>({});
  const item = config.triggerItem ?? defaultTriggerItem;
  return (
    <Node
      item={item}
      config={config}
      path="0"
      openMap={openMap}
    />
  );
};

export default Dropdown;