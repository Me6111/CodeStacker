import React, { useState, useRef, useCallback } from "react";

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
  highlighted?: boolean;
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
  searchable?: boolean;
  searchPlaceholder?: string;
}

export interface Props {
  optionsListPosition?: OptionsListPosition;
  Indentation?: string;
  AllowMultipleMenusOpened?: boolean;
  RememberOpenedMenus?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
}

export const dropdownPropKeys: (keyof Props)[] = ["optionsListPosition", "Indentation", "AllowMultipleMenusOpened", "RememberOpenedMenus", "searchable", "searchPlaceholder"];
export const dropdownDefaultProps: Props = { optionsListPosition: "inside", Indentation: "", AllowMultipleMenusOpened: false, RememberOpenedMenus: false, searchable: false, searchPlaceholder: "Search..." };
export const dropdownPropOptions: Partial<Record<keyof Props, any[]>> = { optionsListPosition: ["top", "bottom", "left", "right", "inside"] };

const defaultTriggerItem: DropdownItem = { label: "Menu", children: [{ label: "Item 1", onClick: () => {} }, { label: "Item 2", onClick: () => {} }, { label: "Item 3", onClick: () => {} }] };

const parseIndent = (value?: string) => { if (!value) return 0; const [, a] = value.split(",").map(v => v.trim()); return parseInt(a || "0", 10); };

const findItem = (it: DropdownItem, p: string): DropdownItem | null => {
  if (p === "0") return it;
  const segs = p.split(".");
  let cur = it;
  for (let i = 1; i < segs.length; i++) { if (!cur.children) return null; cur = cur.children[parseInt(segs[i])]; if (!cur) return null; }
  return cur;
};

const getVisiblePaths = (it: DropdownItem, path: string, openSet: Set<string>, query?: string): string[] => {
  const children = query ? it.children?.filter(c => c.label.toLowerCase().includes(query.toLowerCase())) : it.children;
  if (!children) return [];
  if (path !== "0" && !openSet.has(path)) return [];
  return children.flatMap((child, i) => { const cp = `${path}.${i}`; return [cp, ...getVisiblePaths(child, cp, openSet, query)]; });
};

const DefaultOptionItem: React.FC<OptionItemProps> = ({ label, onClick, active, hasChildren, highlighted }) => (
  <div onClick={onClick} style={{ width: "100%", padding: "10px 14px", boxSizing: "border-box", backgroundColor: highlighted ? "#444" : hasChildren && active ? "#2a2a2a" : "#1f1f1f", color: "#f5f5f5", cursor: "pointer", borderBottom: "1px solid #333", fontSize: 14, userSelect: "none", transition: "background-color 0.2s" }}
    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#444")}
    onMouseLeave={e => (e.currentTarget.style.backgroundColor = highlighted ? "#444" : hasChildren && active ? "#2a2a2a" : "#1f1f1f")}
  >{label}</div>
);

const Wrapper: React.FC<{ children: React.ReactNode; position?: OptionsListPosition; indent: number }> = ({ children, position = "inside", indent }) => (
  <div style={{ marginLeft: indent, ...(position === "inside" ? { display: "flex", flexDirection: "column", width: "100%" } : { position: "absolute", top: position === "bottom" ? "100%" : undefined, bottom: position === "top" ? "100%" : undefined, left: position === "right" ? "100%" : 0, right: position === "left" ? "100%" : undefined, zIndex: 1000, display: "flex", flexDirection: "column", width: "100%" }) }}>{children}</div>
);

interface NodeProps {
  item: DropdownItem; config: DropdownProps; path: string;
  openSet: React.MutableRefObject<Set<string>>;
  searchQuery?: string; onSearchChange?: (v: string) => void;
  forceOpen?: boolean; onToggle?: (v: boolean) => void;
  onLeafClick?: () => void; isRoot?: boolean;
  highlightedPath: string | null; setHighlightedPath: (p: string | null) => void;
  containerRef?: React.RefObject<HTMLDivElement>; forceUpdate: () => void;
}

const Node: React.FC<NodeProps> = ({ item, config, path, openSet, searchQuery, onSearchChange, forceOpen, onToggle, onLeafClick, isRoot, highlightedPath, setHighlightedPath, containerRef, forceUpdate }) => {
  const { optionsListPosition, Indentation, AllowMultipleMenusOpened = false, RememberOpenedMenus = false, OpenMenu, CloseMenu, OptionItem, searchable, searchPlaceholder } = config;
  const indent = parseIndent(item.Indentation ?? Indentation);
  const position = item.optionsListPosition ?? optionsListPosition;
  const hasChildren = !!item.children?.length;
  const filteredChildren = searchQuery ? item.children?.filter(c => c.label.toLowerCase().includes(searchQuery.toLowerCase())) : item.children;
  const isOpen = forceOpen !== undefined ? forceOpen : openSet.current.has(path);

  const setOpen = (value: boolean) => {
    onToggle?.(value);
    if (value) openSet.current.add(path);
    else { openSet.current.delete(path); if (!RememberOpenedMenus) openSet.current.forEach(k => { if (k.startsWith(path + ".")) openSet.current.delete(k); }); }
    forceUpdate();
  };

  const toggleClick = () => {
    if (item.onClick) { item.onClick(); onLeafClick?.(); return; }
    if (!hasChildren) return;
    if (isOpen && CloseMenu?.includes("click_option_again")) setOpen(false);
    else if (!isOpen && OpenMenu?.includes("click")) setOpen(true);
  };

  const showSearch = isRoot && searchable && isOpen;

  const trigger = showSearch ? (
    <input autoFocus type="text" value={searchQuery ?? ""} placeholder={searchPlaceholder ?? "Search..."} onChange={e => onSearchChange?.(e.target.value)}
      onBlur={e => { const rt = e.relatedTarget as Node | null; if (containerRef?.current && rt && containerRef.current.contains(rt)) return; onToggle?.(false); onSearchChange?.(""); setHighlightedPath(null); }}
      style={{ width: "100%", padding: "10px 14px", boxSizing: "border-box", backgroundColor: "#1f1f1f", color: "#f5f5f5", border: "none", borderBottom: "1px solid #333", fontSize: 14, outline: "none" }}
    />
  ) : (
    item.element ?? (OptionItem ?? DefaultOptionItem)({ label: item.label, onClick: toggleClick, active: isOpen, hasChildren, highlighted: highlightedPath === path })
  );

  return (
    <div style={{ position: "relative", width: "100%" }}
      onMouseEnter={() => { if (hasChildren && OpenMenu?.includes("hover")) setOpen(true); }}
      onMouseLeave={() => { if (hasChildren && CloseMenu?.includes("mouse_leave")) setOpen(false); }}
    >
      <div onClick={showSearch ? undefined : toggleClick}>{trigger}</div>
      {isOpen && !!filteredChildren?.length && (
        <Wrapper position={position} indent={indent}>
          {filteredChildren.map((child, i) => {
            const cp = `${path}.${i}`;
            if (!AllowMultipleMenusOpened) openSet.current.forEach(k => { if (k.startsWith(path + ".") && k !== cp) openSet.current.delete(k); });
            return <Node key={cp} item={child} config={config} path={cp} openSet={openSet} searchQuery={searchQuery} onLeafClick={onLeafClick} highlightedPath={highlightedPath} setHighlightedPath={setHighlightedPath} containerRef={containerRef} forceUpdate={forceUpdate} />;
          })}
        </Wrapper>
      )}
    </div>
  );
};

const Dropdown: React.FC<DropdownProps> = (config) => {
  const openSet = useRef<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedPath, setHighlightedPath] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const forceUpdate = useCallback(() => setTick(t => t + 1), []);
  const item = config.triggerItem ?? defaultTriggerItem;
  const { searchable } = config;
  const isAnyOpen = searchable ? isOpen : openSet.current.size > 0;

  const closeAndChildren = useCallback((p: string) => { openSet.current.delete(p); openSet.current.forEach(k => { if (k.startsWith(p + ".")) openSet.current.delete(k); }); }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const visible = getVisiblePaths(item, "0", openSet.current, searchable ? searchQuery : undefined);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isAnyOpen && searchable) { setIsOpen(true); return; }
      if (!visible.length) return;
      setHighlightedPath(highlightedPath === null ? visible[0] : visible[(visible.indexOf(highlightedPath) + 1) % visible.length]);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!visible.length) return;
      setHighlightedPath(highlightedPath === null ? visible[visible.length - 1] : visible[(visible.indexOf(highlightedPath) - 1 + visible.length) % visible.length]);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (!highlightedPath) return;
      if (findItem(item, highlightedPath)?.children?.length) { openSet.current.add(highlightedPath); setHighlightedPath(highlightedPath + ".0"); forceUpdate(); }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (!highlightedPath) return;
      if (openSet.current.has(highlightedPath)) { closeAndChildren(highlightedPath); forceUpdate(); }
      else { const parts = highlightedPath.split("."); if (parts.length <= 2) return; const parent = parts.slice(0, -1).join("."); closeAndChildren(parent); setHighlightedPath(parent); forceUpdate(); }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (!highlightedPath) return;
      const hItem = findItem(item, highlightedPath);
      if (hItem?.onClick) { hItem.onClick(); if (searchable) { setIsOpen(false); setSearchQuery(""); setHighlightedPath(null); } }
      else if (hItem?.children?.length) { if (openSet.current.has(highlightedPath)) closeAndChildren(highlightedPath); else openSet.current.add(highlightedPath); forceUpdate(); }
    } else if (e.key === "Escape") {
      if (searchable) { setIsOpen(false); setSearchQuery(""); setHighlightedPath(null); }
    }
  }, [isAnyOpen, highlightedPath, searchQuery, searchable, item, forceUpdate, closeAndChildren]);

  return (
    <div ref={containerRef} onKeyDown={handleKeyDown} tabIndex={0} style={{ outline: "none", width: "100%" }}>
      <Node item={item} config={config} path="0" openSet={openSet}
        searchQuery={searchable ? searchQuery : undefined} onSearchChange={searchable ? setSearchQuery : undefined}
        forceOpen={searchable ? isOpen : undefined} onToggle={searchable ? setIsOpen : undefined}
        onLeafClick={() => { if (searchable) { setIsOpen(false); setSearchQuery(""); setHighlightedPath(null); } }}
        isRoot highlightedPath={highlightedPath} setHighlightedPath={setHighlightedPath}
        containerRef={containerRef} forceUpdate={forceUpdate}
      />
    </div>
  );
};

export default Dropdown;