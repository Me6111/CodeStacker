import { Point } from '../types/Point';

export interface ToolContext {
  svgObject: any;
  selection: any;
  currentPolygon: any;
  selectMode: string;
  selectPoints: boolean;
  selectLines: boolean;
  freeformAccuracy?: number;
}

export interface ToolUpdate {
  svgObject?: any;
  selection?: any;
  currentPolygon?: any;
  saveToSVGHistory?: boolean;
  saveToPolygonHistory?: any;
  internalState?: any;
}

export interface BaseTool {
  onMouseDown(point: Point, context: ToolContext): ToolUpdate;
  onMouseMove(point: Point, context: ToolContext): ToolUpdate;
  onMouseUp(point: Point, context: ToolContext): ToolUpdate;
  getVisualOverlay?(): any;
  clearSelection?(): void;
  loadShape?(shape: any): void;
  rotateShape?(angle: number, originalShape: any, context: ToolContext): { selectedElements: any[] } | null;
  moveShape?(delta: { dx: number; dy: number }, initialShape: any, context: ToolContext): { selectedElements: any[] } | null;
  updateCorner?(cornerIndex: number, newPos: Point, context: ToolContext): { selectedElements: any[] };
  updateLine?(lineIndex: number, offset: { dx: number; dy: number }, initialPositions: any, context: ToolContext): { selectedElements: any[] };
  updateContainerCorner?(corner: string, newPos: Point, oldBounds: any, context: ToolContext): { selectedElements: any[] };
  updateContainerEdge?(edge: string, newPos: Point, oldBounds: any, context: ToolContext): { selectedElements: any[] };
}
