import { useState } from 'react';
import { Point } from '../types';

interface DragState {
  type: 'point' | 'line' | 'polygon';
  polygonId: string;
  pointIndex?: number;
  lineIndex?: number;
  startPos?: Point;
  initialPoints: Point[];
}

export const useDrag = () => {
  const [dragging, setDragging] = useState<DragState | null>(null);

  return { dragging, setDragging };
};