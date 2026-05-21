import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface ImageTransform { x: number; y: number; width: number; height: number; }

interface CalqueContextType {
  imageUrl: string | null;
  setImageUrl: (url: string | null) => void;
  imageTransform: ImageTransform;
  setImageTransform: React.Dispatch<React.SetStateAction<ImageTransform>>;
  imageVisible: boolean;
  setImageVisible: React.Dispatch<React.SetStateAction<boolean>>;
  imageOpacity: number;
  setImageOpacity: React.Dispatch<React.SetStateAction<number>>;
  gridSize: number;
  setGridSize: React.Dispatch<React.SetStateAction<number>>;
  gridVisible: boolean;
  setGridVisible: React.Dispatch<React.SetStateAction<boolean>>;
  snapEnabled: boolean;
  setSnapEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

const CalqueContext = createContext<CalqueContextType | undefined>(undefined);

export const CalqueContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [imageUrl, setImageUrlState] = useState<string | null>(null);
  const [imageTransform, setImageTransform] = useState<ImageTransform>({ x: 0, y: 0, width: 800, height: 600 });
  const [imageVisible, setImageVisible] = useState(true);
  const [imageOpacity, setImageOpacity] = useState(50);
  const [gridSize, setGridSize] = useState(50);
  const [gridVisible, setGridVisible] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(false);

  const setImageUrl = (url: string | null) => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrlState(url);
  };

  return (
    <CalqueContext.Provider value={{
      imageUrl, setImageUrl,
      imageTransform, setImageTransform,
      imageVisible, setImageVisible,
      imageOpacity, setImageOpacity,
      gridSize, setGridSize,
      gridVisible, setGridVisible,
      snapEnabled, setSnapEnabled,
    }}>
      {children}
    </CalqueContext.Provider>
  );
};

export const useCalqueContext = () => {
  const ctx = useContext(CalqueContext);
  if (!ctx) throw new Error('useCalqueContext must be used within CalqueContextProvider');
  return ctx;
};
