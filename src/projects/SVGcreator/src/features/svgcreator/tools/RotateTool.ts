import { BaseTool, ToolContext, ToolUpdate } from './BaseTool';
import { Point, Polygon } from '../types';
import { getCenter, rotatePoint, deepClone } from '../utils';

interface RotateState {
  polygonId: string;
  center: Point;
  startAngle: number;
  initialPolygons: Polygon[];
}

export class RotateTool implements BaseTool {
  private rotating: RotateState | null = null;

  onMouseDown(point: Point, context: ToolContext): ToolUpdate {
    const { selection, svgObject } = context;

    if (selection.level === 'polygon' && selection.polygonId) {
      const poly = svgObject.polygons.find((p) => p.id === selection.polygonId);
      if (poly) {
        const center = getCenter(poly.points);
        const angle = Math.atan2(point.y - center.y, point.x - center.x);
        this.rotating = {
          polygonId: selection.polygonId,
          center,
          startAngle: angle,
          initialPolygons: deepClone(svgObject.polygons),
        };
      }
    }

    return {};
  }

  onMouseMove(point: Point, context: ToolContext): ToolUpdate {
    if (!this.rotating) return {};

    const angle = Math.atan2(point.y - this.rotating.center.y, point.x - this.rotating.center.x);
    const deltaAngle = angle - this.rotating.startAngle;

    const newPolygons = context.svgObject.polygons.map((poly) => {
      if (poly.id !== this.rotating!.polygonId) return poly;
      const originalPoly = this.rotating!.initialPolygons.find((p) => p.id === poly.id);
      if (!originalPoly) return poly;
      const newPoints = originalPoly.points.map((pt) => rotatePoint(pt, this.rotating!.center, deltaAngle));
      return { ...poly, points: newPoints };
    });

    return { svgObject: { ...context.svgObject, polygons: newPolygons } };
  }

  onMouseUp(point: Point, context: ToolContext): ToolUpdate {
    if (this.rotating) {
      this.rotating = null;
      return { saveToSVGHistory: true };
    }
    return {};
  }
}