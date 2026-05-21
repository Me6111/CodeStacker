import React, { RefObject, Suspense } from "react";
import { useParams } from "react-router-dom";
import Slider from "./../../../../../components/Sliders/Slider/Slider";
import RouterContainer from "./../../../../../components/RouterContainer/RouterContainer";
import ResponsiveContainer, { ResponsiveStyle } from "./../../../../../components/ResponsiveContainer/ResponsiveContainer";
import Nav from "../../../Nav/Nav";
import Catalogue from "./Catalogue/Catalogue";
import MainPage from "./MainPage";
import PreviewComponent from "../../../../../components/Code/PreviewComponent/PreviewComponent";

interface ComponentsProps {
  sliderPadRef: RefObject<HTMLDivElement>;
}

const modules = import.meta.glob(
  "../../../../../components/**/*.{tsx,jsx}"
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

const resolveImportPath = (name: string): string | null => {
  const override = fileNameOverrides[name];
  if (override) {
    const key = Object.keys(modules).find(k => k.replace(/\\/g, '/').endsWith(`/${override}.tsx`));
    if (key) return key;
  }
  const nested = Object.keys(modules).find(k => k.replace(/\\/g, '/').endsWith(`/${name}/${name}.tsx`));
  if (nested) return nested;
  const flat = Object.keys(modules).find(k => k.replace(/\\/g, '/').endsWith(`/${name}.tsx`));
  return flat ?? null;
};

const Fallback = () => (
  <div style={{ width: "100%", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "white", backgroundColor: "#002159" }}>
    Loading...
  </div>
);

function LazyRoute({ name }: { name: string }) {
  const importPath = resolveImportPath(name);

  if (!importPath || !modules[importPath]) {
    return <div style={{ color: "white" }}>Component not found: {name}</div>;
  }

  const Component = React.lazy(modules[importPath] as any);

  return (
    <Suspense fallback={<Fallback />}>
      <PreviewComponent element={<Component />} />
    </Suspense>
  );
}

function DynamicRoute() {
  const { name } = useParams<{ category: string; name: string }>();
  if (!name) return null;
  return <LazyRoute key={name} name={name} />;
}

const routes = [
  { index: true, element: <MainPage /> },
  { path: ":category/:name", element: <DynamicRoute /> },
];

const contentStyles: ResponsiveStyle[] = [
  {
    Reference: "Screen",
    MinSize: { width: "phone" },
    Style: { paddingTop: "100px", paddingLeft: "0px" },
  },
  {
    Reference: "Screen",
    MinSize: { width: "desktop" },
    Style: { paddingTop: "100px", paddingLeft: "200px" },
  },
];

const navFieldStyles: ResponsiveStyle[] = [
  {
    Reference: "Screen",
    MinSize: { width: "phone" },
    Style: { width: "0px", flexGrow: 1, flexShrink: 1, flexBasis: 0, minHeight: 0, backgroundColor: "white", pointerEvents: "auto" },
  },
  {
    Reference: "Screen",
    MinSize: { width: "desktop" },
    Style: { width: "200px", flexGrow: 1, flexShrink: 1, flexBasis: 0, minHeight: 0, backgroundColor: "white", pointerEvents: "auto" },
  },
];

export default function Components({ sliderPadRef }: ComponentsProps) {
  return (
    <Slider
      ContentToScroll={
        <ResponsiveContainer className="ComponentsContent" ResponsiveStyles={contentStyles}>
          <RouterContainer routes={routes} />
        </ResponsiveContainer>
      }
      SliderPad_Content={
        <div ref={sliderPadRef} style={{ width: "100%", height: "100%", pointerEvents: "none", display: "flex", flexDirection: "column" }}>
          <div style={{ pointerEvents: "auto", flexShrink: 0 }}>
            <Nav />
          </div>
          <ResponsiveContainer className="ContentNavField" ResponsiveStyles={navFieldStyles}>
            <Catalogue />
          </ResponsiveContainer>
        </div>
      }
      orientation="vertical"
    />
  );
}