import { Polygon } from './Polygon';

export interface SVGObject {
  id: string;
  name: string;
  width: number;
  height: number;
  polygons: Polygon[];
  history: Polygon[][];
  historyIndex: number;
}
