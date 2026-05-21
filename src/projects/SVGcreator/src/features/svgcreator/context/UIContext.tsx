import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextType {
  expandedPolygons: { [key: string]: boolean };
  togglePolygon: (polygonId: string) => void;
  polygonViews: { [key: string]: 'lines' | 'points' };
  setPolygonView: (polygonId: string, view: 'lines' | 'points') => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [expandedPolygons, setExpandedPolygons] = useState<{ [key: string]: boolean }>({});
  const [polygonViews, setPolygonViews] = useState<{ [key: string]: 'lines' | 'points' }>({});

  const togglePolygon = (polygonId: string) => {
    setExpandedPolygons((prev) => ({ ...prev, [polygonId]: !prev[polygonId] }));
    if (!polygonViews[polygonId]) {
      setPolygonViews((prev) => ({ ...prev, [polygonId]: 'points' }));
    }
  };

  const setPolygonView = (polygonId: string, view: 'lines' | 'points') => {
    setPolygonViews((prev) => ({ ...prev, [polygonId]: view }));
  };

  return (
    <UIContext.Provider value={{ expandedPolygons, togglePolygon, polygonViews, setPolygonView }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUIContext = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUIContext must be used within UIContextProvider');
  }
  return context;
};