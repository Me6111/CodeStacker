import React, { RefObject, Suspense } from "react";
import { useParams } from "react-router-dom";
import Slider from "./../../../../../components/Sliders/Slider/Slider";
import RouterContainer from "./../../../../../components/RouterContainer/RouterContainer";
import ResponsiveContainer, { ResponsiveStyle } from "./../../../../../components/ResponsiveContainer/ResponsiveContainer";
import Nav from "../../../Nav/Nav";
import Catalogue, { cataloguePathType } from "./Catalogue";
import MainPage from "./MainPage";
import PreviewComponent from "./PreviewComponent";

interface ComponentsProps {
  sliderPadRef: RefObject<HTMLDivElement>;
}

const modules = import.meta.glob(
  "../../../../../components/**/*.{tsx,jsx}"
);

const Fallback = () => (
  <div style={{ width: "100%", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "white", backgroundColor: "#002159" }}>
    Loading...
  </div>
);

function LazyRoute({ category, name }: { category: string; name: string }) {
  const isFlat = cataloguePathType[category] === "flat";

  const path = isFlat
    ? `../../../../../components/${category}/${name}.tsx`
    : `../../../../../components/${category}/${name}/${name}.tsx`;

  const importer = modules[path];

  if (!importer) {
    return <div style={{ color: "white" }}>Component not found</div>;
  }

  const Component = React.lazy(importer as any);

  return (
    <Suspense fallback={<Fallback />}>
      <PreviewComponent element={<Component />} />
    </Suspense>
  );
}

function DynamicRoute() {
  const { category, name } = useParams<{ category: string; name: string }>();
  if (!category || !name) return null;
  return <LazyRoute key={`${category}/${name}`} category={category} name={name} />;
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
    Style: { width: "0px", height: "100%", overflow: "hidden", backgroundColor: "white", pointerEvents: "auto" },
  },
  {
    Reference: "Screen",
    MinSize: { width: "desktop" },
    Style: { width: "200px", height: "100%", overflow: "hidden", backgroundColor: "white", pointerEvents: "auto" },
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
        <div ref={sliderPadRef} style={{ width: "100%", height: "100%", pointerEvents: "none" }}>
          <div style={{ pointerEvents: "auto" }}>
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