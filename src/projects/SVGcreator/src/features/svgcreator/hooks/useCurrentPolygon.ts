import { useState } from 'react';
import { Polygon } from '../types';

export const useCurrentPolygon = () => {
  const [currentPolygon, setCurrentPolygon] = useState<Polygon | null>(null);

  return { currentPolygon, setCurrentPolygon };
};