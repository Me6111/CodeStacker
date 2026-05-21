import { BaseTool, ToolContext, ToolUpdate } from './BaseTool';
import { Point, Polygon } from '../types';
import { generateId, rdpSimplify, accuracyToEpsilon } from '../utils';

export class DrawTool_FreeForm implements BaseTool {
  private isDrawing = false;

  onMouseDown(point: Point, context: ToolContext): ToolUpdate {
    this.isDrawing = true;
    const poly: Polygon = {
      id: generateId(),
      name: `${context.svgObject.polygons.length + 1}`,
      points: [point],
      closed: false,
      history: [[point]],
      historyIndex: 0,
    };
    return { currentPolygon: poly };
  }

  onMouseMove(point: Point, context: ToolContext): ToolUpdate {
    if (!this.isDrawing || !context.currentPolygon) return {};
    return {
      currentPolygon: {
        ...context.currentPolygon,
        points: [...context.currentPolygon.points, point],
      },
    };
  }

  onMouseUp(point: Point, context: ToolContext): ToolUpdate {
    this.isDrawing = false;
    if (!context.currentPolygon || context.currentPolygon.points.length < 2) {
      return { currentPolygon: null };
    }
    const rawPoints = context.currentPolygon.points;
    const epsilon = accuracyToEpsilon(context.freeformAccuracy ?? 100);
    const simplified = epsilon > 0 ? rdpSimplify(rawPoints, epsilon) : rawPoints;
    const finalized: Polygon = {
      ...context.currentPolygon,
      points: simplified,
      originalPoints: rawPoints,
      closed: true,
    };
    return {
      svgObject: { ...context.svgObject, polygons: [...context.svgObject.polygons, finalized] },
      currentPolygon: null,
      saveToSVGHistory: true,
    };
  }
}
