import { BaseTool, ToolContext, ToolUpdate } from './BaseTool';
import { Point } from '../types';
import { dist, projectOnLine, deepClone } from '../utils';
import { THRESHOLDS } from '../constants';

interface DragState {
  type: 'point' | 'line' | 'polygon';
  polygonId: string;
  pointIndex?: number;
  lineIndex?: number;
  startPos?: Point;
  initialPoints: Point[];
  initialOriginalPoints?: Point[];
}

export class MoveTool implements BaseTool {
  private dragging: DragState | null = null;

  onMouseDown(point: Point, context: ToolContext): ToolUpdate {
    const { selection, svgObject } = context;

    if (selection.level === 'point' && selection.polygonId && selection.elementIndex !== null) {
      const poly = svgObject.polygons.find((p) => p.id === selection.polygonId);
      if (poly && dist(poly.points[selection.elementIndex], point) < THRESHOLDS.POINT_SELECT) {
        this.dragging = {
          type: 'point',
          polygonId: selection.polygonId,
          pointIndex: selection.elementIndex,
          initialPoints: deepClone(poly.points),
        };
      }
    }

    if (selection.level === 'line' && selection.polygonId && selection.elementIndex !== null) {
      const poly = svgObject.polygons.find((p) => p.id === selection.polygonId);
      if (poly) {
        const i = selection.elementIndex;
        const nextIdx = (i + 1) % poly.points.length;
        const a = poly.points[i];
        const b = poly.points[nextIdx];
        const { distance } = projectOnLine(point, a, b);
        if (distance < THRESHOLDS.LINE_DRAG) {
          this.dragging = {
            type: 'line',
            polygonId: selection.polygonId,
            lineIndex: i,
            startPos: point,
            initialPoints: deepClone(poly.points),
          };
        }
      }
    }

    if (selection.level === 'polygon' && selection.polygonId) {
      const poly = svgObject.polygons.find((p) => p.id === selection.polygonId);
      if (poly) {
        this.dragging = {
          type: 'polygon',
          polygonId: selection.polygonId,
          startPos: point,
          initialPoints: deepClone(poly.points),
          initialOriginalPoints: poly.originalPoints ? deepClone(poly.originalPoints) : undefined,
        };
      }
    }

    return {};
  }

  onMouseMove(point: Point, context: ToolContext): ToolUpdate {
    if (!this.dragging) return {};

    const { svgObject } = context;
    const newPolygons = svgObject.polygons.map((poly) => {
      if (poly.id !== this.dragging!.polygonId) return poly;

      if (this.dragging!.type === 'point') {
        const newPoints = [...poly.points];
        newPoints[this.dragging!.pointIndex!] = point;
        // Point-level edit: originalPoints indices no longer match, discard them
        return { ...poly, points: newPoints, originalPoints: undefined };
      }

      if (this.dragging!.type === 'line') {
        const dx = point.x - this.dragging!.startPos!.x;
        const dy = point.y - this.dragging!.startPos!.y;
        const newPoints = [...this.dragging!.initialPoints];
        const i = this.dragging!.lineIndex!;
        const nextIdx = (i + 1) % poly.points.length;
        newPoints[i] = { x: this.dragging!.initialPoints[i].x + dx, y: this.dragging!.initialPoints[i].y + dy };
        newPoints[nextIdx] = { x: this.dragging!.initialPoints[nextIdx].x + dx, y: this.dragging!.initialPoints[nextIdx].y + dy };
        // Line-level edit: originalPoints partially stale, discard them
        return { ...poly, points: newPoints, originalPoints: undefined };
      }

      if (this.dragging!.type === 'polygon') {
        const dx = point.x - this.dragging!.startPos!.x;
        const dy = point.y - this.dragging!.startPos!.y;
        const newPoints = this.dragging!.initialPoints.map((pt) => ({ x: pt.x + dx, y: pt.y + dy }));
        const newOriginalPoints = this.dragging!.initialOriginalPoints?.map((pt) => ({ x: pt.x + dx, y: pt.y + dy }));
        return { ...poly, points: newPoints, originalPoints: newOriginalPoints };
      }

      return poly;
    });

    return { svgObject: { ...svgObject, polygons: newPolygons } };
  }

  onMouseUp(point: Point, context: ToolContext): ToolUpdate {
    if (this.dragging) {
      const poly = context.svgObject.polygons.find((p) => p.id === this.dragging!.polygonId);
      const result: ToolUpdate = {};
      if (poly) {
        result.saveToPolygonHistory = { polygonId: this.dragging.polygonId, points: poly.points };
      }
      this.dragging = null;
      return result;
    }
    return {};
  }
}
