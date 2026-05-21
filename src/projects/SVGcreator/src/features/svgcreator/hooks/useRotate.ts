import { useState } from 'react';
import { Point, Polygon } from '../types';

interface RotateState {
  polygonId: string;
  center: Point;
  startAngle: number;
  initialPolygons: Polygon[];
}

export const useRotate = () => {
  const [rotating, setRotating] = useState<RotateState | null>(null);

  return { rotating, setRotating };
};