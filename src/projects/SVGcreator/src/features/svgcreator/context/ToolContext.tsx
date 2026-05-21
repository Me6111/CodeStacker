import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ToolType, SelectMode, DrawMode } from '../types';

export type SubSelectMode = 'none' | 'movePoint' | 'moveLine';

export interface SelectedElements {
  polygonId: string;
  points: number[];
  lines: number[];
}

interface ToolContextType {
  tool: ToolType;
  setTool: React.Dispatch<React.SetStateAction<ToolType>>;
  selectMode: SelectMode;
  setSelectMode: React.Dispatch<React.SetStateAction<SelectMode>>;
  drawMode: DrawMode;
  setDrawMode: React.Dispatch<React.SetStateAction<DrawMode>>;
  confirmedSelectionElements: SelectedElements[] | null;
  setConfirmedSelectionElements: React.Dispatch<React.SetStateAction<SelectedElements[] | null>>;
  pendingSelectAll: string | 'svg' | null;
  setPendingSelectAll: React.Dispatch<React.SetStateAction<string | 'svg' | null>>;
  toolArmed: boolean;
  setToolArmed: React.Dispatch<React.SetStateAction<boolean>>;
  subSelectMode: SubSelectMode;
  setSubSelectMode: React.Dispatch<React.SetStateAction<SubSelectMode>>;
}

const ToolContext = createContext<ToolContextType | undefined>(undefined);

export const ToolContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tool, setTool] = useState<ToolType>('draw');
  const [selectMode, setSelectMode] = useState<SelectMode>('polygon');
  const [drawMode, setDrawMode] = useState<DrawMode>('polygon');
  const [confirmedSelectionElements, setConfirmedSelectionElements] = useState<SelectedElements[] | null>(null);
  const [pendingSelectAll, setPendingSelectAll] = useState<string | 'svg' | null>(null);
  const [toolArmed, setToolArmed] = useState(true);
  const [subSelectMode, setSubSelectMode] = useState<SubSelectMode>('none');

  return (
    <ToolContext.Provider
      value={{
        tool,
        setTool,
        selectMode,
        setSelectMode,
        drawMode,
        setDrawMode,
        confirmedSelectionElements,
        setConfirmedSelectionElements,
        pendingSelectAll,
        setPendingSelectAll,
        toolArmed,
        setToolArmed,
        subSelectMode,
        setSubSelectMode,
      }}
    >
      {children}
    </ToolContext.Provider>
  );
};

export const useToolContext = () => {
  const context = useContext(ToolContext);
  if (!context) {
    throw new Error('useToolContext must be used within ToolContextProvider');
  }
  return context;
};
