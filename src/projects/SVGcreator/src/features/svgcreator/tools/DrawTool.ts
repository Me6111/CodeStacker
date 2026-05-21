import { BaseTool, ToolContext, ToolUpdate } from './BaseTool';
import { Point, Polygon } from '../types';
import { dist, generateId } from '../utils';
import { THRESHOLDS } from '../constants';

export class DrawTool implements BaseTool {
  onMouseDown(point: Point, context: ToolContext): ToolUpdate {
    if (!context.currentPolygon) {
      const newPoly: Polygon = {
        id: generateId(),
        name: `${context.svgObject.polygons.length + 1}`,
        points: [point],
        closed: false,
        history: [[point]],
        historyIndex: 0,
      };
      return { currentPolygon: newPoly };
    } else {
      if (
        dist(context.currentPolygon.points[0], point) < THRESHOLDS.CLOSE_POLYGON &&
        context.currentPolygon.points.length >= 3
      ) {
        const closedPoly = { ...context.currentPolygon, closed: true };
        const newPolygons = [...context.svgObject.polygons, closedPoly];
        return {
          svgObject: { ...context.svgObject, polygons: newPolygons },
          currentPolygon: null,
          saveToSVGHistory: true,
        };
      } else {
        const newPoints = [...context.currentPolygon.points, point];
        const newHistory = [...context.currentPolygon.history, newPoints];
        const updated = {
          ...context.currentPolygon,
          points: newPoints,
          history: newHistory,
          historyIndex: newHistory.length - 1,
        };
        return { currentPolygon: updated };
      }
    }
  }

  onMouseMove(point: Point, context: ToolContext): ToolUpdate {
    return {};
  }

  onMouseUp(point: Point, context: ToolContext): ToolUpdate {
    return {};
  }
}