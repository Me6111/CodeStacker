import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";

interface RouteItem {
  path?: string;
  index?: boolean;
  element: React.ReactNode;
}

interface RouterContainerProps {
  routes: RouteItem[];
}

export default function RouterContainer({ routes }: RouterContainerProps) {
  return (
    <div className="RouterContainer">
      <Routes>
        {routes.map((route, i) =>
          route.index ? (
            <Route key={i} index element={route.element} />
          ) : (
            <Route key={i} path={route.path} element={route.element} />
          )
        )}
      </Routes>
    </div>
  );
}