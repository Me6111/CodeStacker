import { Point } from './Point';

export interface Polygon {
  id: string;
  name: string;
  points: Point[];
  originalPoints?: Point[];          // full-resolution baseline for whole-polygon Detail
  fragmentOriginalPoints?: Point[];  // baseline for per-line Detail — snapshot of poly.points at first slider use
  closed: boolean;
  history: Point[][];
  historyIndex: number;
}
