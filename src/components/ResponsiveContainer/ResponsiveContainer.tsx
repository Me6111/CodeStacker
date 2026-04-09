import React, { useState, useEffect, useRef, ReactNode } from "react";

type BreakpointPreset = "desktop" | "phone";

type SizeValue = number | BreakpointPreset;

interface SizeConstraint {
  width?: SizeValue;
  height?: SizeValue;
}

export interface ResponsiveStyle {
  Reference: "Screen" | "Container";
  MinSize: SizeConstraint;
  Style: React.CSSProperties;
}

interface ResponsiveContainerProps {
  ResponsiveStyles: ResponsiveStyle[];
  children?: ReactNode;
  className?: string;
  baseStyle?: React.CSSProperties;
}

const PRESETS: Record<BreakpointPreset, number> = {
  desktop: 768,
  phone: 0,
};

function resolveSize(val: SizeValue): number {
  if (typeof val === "number") return val;
  return PRESETS[val];
}

function matchesMinSize(size: SizeConstraint, w: number, h: number): boolean {
  const minW = size.width !== undefined ? resolveSize(size.width) : 0;
  const minH = size.height !== undefined ? resolveSize(size.height) : 0;
  return w >= minW && h >= minH;
}

export default function ResponsiveContainer({
  ResponsiveStyles,
  children,
  className,
  baseStyle = {},
}: ResponsiveContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [screenSize, setScreenSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const handler = () => setScreenSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setContainerSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setContainerSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const computedStyle = ResponsiveStyles.reduce<React.CSSProperties>((acc, entry) => {
    const { w, h } =
      entry.Reference === "Screen"
        ? screenSize
        : containerSize;

    if (matchesMinSize(entry.MinSize, w, h)) {
      return { ...acc, ...entry.Style };
    }
    return acc;
  }, baseStyle);

  return (
    <div ref={containerRef} className={className} style={computedStyle}>
      {children}
    </div>
  );
}