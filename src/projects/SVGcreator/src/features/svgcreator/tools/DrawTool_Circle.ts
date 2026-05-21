import { BaseTool, ToolContext, ToolUpdate } from './BaseTool';
import { Point, Polygon } from '../types';
import { generateId } from '../utils';

function circlePoints(center: Point, radius: number, n = 32): Point[] {
  return Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * Math.PI * 2;
    return { x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) };
  });
}

export class DrawTool_Circle implements BaseTool {
  private center: Point | null = null;

  onMouseDown(point: Point, context: ToolContext): ToolUpdate {
    this.center = point;
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
    if (!this.center || !context.currentPolygon) return {};
    const dx = point.x - this.center.x;
    const dy = point.y - this.center.y;
    const radius = Math.sqrt(dx * dx + dy * dy);
    return {
      currentPolygon: {
        ...context.currentPolygon,
        points: circlePoints(this.center, radius),
      },
    };
  }

  onMouseUp(point: Point, context: ToolContext): ToolUpdate {
    if (!this.center || !context.currentPolygon) return {};
    const center = this.center;
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    const radius = Math.sqrt(dx * dx + dy * dy);
    this.center = null;

    if (radius < 3) return { currentPolygon: null };

    const closedPoly: Polygon = {
      ...context.currentPolygon,
      points: circlePoints(center, radius),
      closed: true,
    };
    return {
      svgObject: { ...context.svgObject, polygons: [...context.svgObject.polygons, closedPoly] },
      currentPolygon: null,
      saveToSVGHistory: true,
    };
  }
}
