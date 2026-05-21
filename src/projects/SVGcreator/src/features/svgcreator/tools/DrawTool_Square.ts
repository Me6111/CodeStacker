import { BaseTool, ToolContext, ToolUpdate } from './BaseTool';
import { Point, Polygon } from '../types';
import { generateId } from '../utils';

export class DrawTool_Square implements BaseTool {
  private startPoint: Point | null = null;

  onMouseDown(point: Point, context: ToolContext): ToolUpdate {
    this.startPoint = point;
    const poly: Polygon = {
      id: generateId(),
      name: `${context.svgObject.polygons.length + 1}`,
      points: [point, point, point, point],
      closed: false,
      history: [[point]],
      historyIndex: 0,
    };
    return { currentPolygon: poly };
  }

  onMouseMove(point: Point, context: ToolContext): ToolUpdate {
    if (!this.startPoint || !context.currentPolygon) return {};
    const { x: x0, y: y0 } = this.startPoint;
    const { x: x1, y: y1 } = point;
    return {
      currentPolygon: {
        ...context.currentPolygon,
        points: [
          { x: x0, y: y0 },
          { x: x1, y: y0 },
          { x: x1, y: y1 },
          { x: x0, y: y1 },
        ],
      },
    };
  }

  onMouseUp(point: Point, context: ToolContext): ToolUpdate {
    if (!this.startPoint || !context.currentPolygon) return {};
    const { x: x0, y: y0 } = this.startPoint;
    const { x: x1, y: y1 } = point;
    this.startPoint = null;

    if (Math.abs(x1 - x0) < 3 && Math.abs(y1 - y0) < 3) {
      return { currentPolygon: null };
    }

    const closedPoly: Polygon = {
      ...context.currentPolygon,
      points: [
        { x: x0, y: y0 },
        { x: x1, y: y0 },
        { x: x1, y: y1 },
        { x: x0, y: y1 },
      ],
      closed: true,
    };
    return {
      svgObject: { ...context.svgObject, polygons: [...context.svgObject.polygons, closedPoly] },
      currentPolygon: null,
      saveToSVGHistory: true,
    };
  }
}
