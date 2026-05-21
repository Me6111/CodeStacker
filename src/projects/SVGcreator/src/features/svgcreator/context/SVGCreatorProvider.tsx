import React, { ReactNode } from 'react';
import { SVGContextProvider } from './SVGContext';
import { SelectionContextProvider } from './SelectionContext';
import { ToolContextProvider } from './ToolContext';
import { UIContextProvider } from './UIContext';
import { CalqueContextProvider } from './CalqueContext';

export const SVGcreatorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <SVGContextProvider>
      <SelectionContextProvider>
        <ToolContextProvider>
          <UIContextProvider>
            <CalqueContextProvider>{children}</CalqueContextProvider>
          </UIContextProvider>
        </ToolContextProvider>
      </SelectionContextProvider>
    </SVGContextProvider>
  );
};