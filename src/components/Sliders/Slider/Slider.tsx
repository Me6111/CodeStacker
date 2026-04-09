import React, { ReactNode, useRef, useState, useEffect } from "react";

interface SliderProps {
  ContentToScroll: ReactNode;
  SliderPad_Content?: ReactNode;
  sliderPadStyle?: React.CSSProperties;
  orientation?: "vertical" | "horizontal";
}

export default function Slider({
  ContentToScroll,
  SliderPad_Content,
  sliderPadStyle = {},
  orientation = "vertical",
}: SliderProps) {
  const isVertical = orientation === "vertical";
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

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

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        overflowX: isVertical ? "hidden" : "auto",
        overflowY: isVertical ? "auto" : "hidden",
        display: isVertical ? "block" : "flex",
        position: "relative",
      }}
    >
      <div
        className="SliderPad"
        style={{
          position: "sticky",
          top: 0,
          left: 0,
          zIndex: 10,
          width: isVertical ? "100%" : 0,
          height: isVertical ? 0 : "100%",
          overflow: "visible",
          flexShrink: 0,
          pointerEvents: "none",
          ...sliderPadStyle,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: containerSize.w,
            height: containerSize.h,
            pointerEvents: "none",
          }}
        >
          {SliderPad_Content}
        </div>
      </div>

      <div
        className="ContentToScroll"
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        {ContentToScroll}
      </div>
    </div>
  );
}