import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SelectionState, HoverState } from '../types';

export interface LineRunHover { polygonId: string; edgeIndices: number[] }

interface SelectionContextType {
  selection: SelectionState;
  setSelection: React.Dispatch<React.SetStateAction<SelectionState>>;
  hover: HoverState;
  setHover: React.Dispatch<React.SetStateAction<HoverState>>;
  lineRunHover: LineRunHover | null;
  setLineRunHover: React.Dispatch<React.SetStateAction<LineRunHover | null>>;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export const SelectionContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selection, setSelection] = useState<SelectionState>({
    level: null,
    polygonId: null,
    elementType: null,
    elementIndex: null,
  });

  const [hover, setHover] = useState<HoverState>({
    polygonId: null,
    elementType: null,
    elementIndex: null,
  });

  const [lineRunHover, setLineRunHover] = useState<LineRunHover | null>(null);

  return (
    <SelectionContext.Provider value={{ selection, setSelection, hover, setHover, lineRunHover, setLineRunHover }}>
      {children}
    </SelectionContext.Provider>
  );
};

export const useSelectionContext = () => {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelectionContext must be used within SelectionContextProvider');
  }
  return context;
};