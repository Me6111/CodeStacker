import { BaseTool, ToolContext, ToolUpdate } from '../BaseTool';
import { Point } from '../../types';
import { dist, rdpSimplify, accuracyToEpsilon } from '../../utils';

interface SelectionShape {
  points: Point[];
}

export class SelectTool_FreeForm implements BaseTool {
  private activeShape: SelectionShape | null = null;
  private drawingShape: SelectionShape | null = null;
  private draggingCorner: number | null = null;
  private draggingShape: { startPos: Point; initialPoints: Point[] } | null = null;

  clearSelection(): void {
    this.activeShape = null;
    this.drawingShape = null;
    this.draggingCorner = null;
    this.draggingShape = null;
  }

  loadShape(shape: any): void {
    this.activeShape = shape;
  }

  rotateShape(angle: number, originalShape: SelectionShape, context: ToolContext): { selectedElements: any[] } | null {
    if (!originalShape || !originalShape.points || originalShape.points.length === 0) return null;
    const rect = this.getBoundingRect(originalShape.points);
    const centerX = (rect.minX + rect.maxX) / 2;
    const centerY = (rect.minY + rect.maxY) / 2;
    this.activeShape = {
      points: originalShape.points.map((p) => {
        const dx = p.x - centerX;
        const dy = p.y - centerY;
        return {
          x: centerX + dx * Math.cos(angle) - dy * Math.sin(angle),
          y: centerY + dx * Math.sin(angle) + dy * Math.cos(angle),
        };
      }),
    };
    return { selectedElements: this.getSelectedElements(context) };
  }

  private isPointInPolygon(point: Point, polygon: Point[]): boolean {
    if (polygon.length < 3) return false;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      const intersect = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  private getBoundingRect(points: Point[]) {
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
  }

  private getSelectedElements(context: ToolContext): { polygonId: string; points: number[]; lines: number[] }[] {
    if (!this.activeShape || this.activeShape.points.length < 3) return [];
    const { svgObject, selectPoints, selectLines } = context;
    const results: { polygonId: string; points: number[]; lines: number[] }[] = [];
    for (const poly of svgObject.polygons) {
      const selectedPoints: number[] = [];
      const selectedLines: number[] = [];
      if (selectPoints) {
        for (let i = 0; i < poly.points.length; i++) {
          if (this.isPointInPolygon(poly.points[i], this.activeShape!.points)) selectedPoints.push(i);
        }
      }
      if (selectLines) {
        for (let i = 0; i < poly.points.length; i++) {
          const ni = (i + 1) % poly.points.length;
          if (this.isPointInPolygon(poly.points[i], this.activeShape!.points) && this.isPointInPolygon(poly.points[ni], this.activeShape!.points)) {
            selectedLines.push(i);
          }
        }
      }
      if (selectedPoints.length > 0 || selectedLines.length > 0) {
        results.push({ polygonId: poly.id, points: selectedPoints, lines: selectedLines });
      }
    }
    return results;
  }

  moveShape(delta: { dx: number; dy: number }, initialShape: SelectionShape, context: ToolContext): { selectedElements: any[] } {
    this.activeShape = { points: initialShape.points.map((p: Point) => ({ x: p.x + delta.dx, y: p.y + delta.dy })) };
    return { selectedElements: this.getSelectedElements(context) };
  }

  updateCorner(cornerIndex: number, newPos: Point, context: ToolContext): { selectedElements: any[] } {
    if (this.activeShape && cornerIndex < this.activeShape.points.length) {
      this.activeShape.points[cornerIndex] = newPos;
    }
    return { selectedElements: this.getSelectedElements(context) };
  }

  updateLine(lineIndex: number, offset: { dx: number; dy: number }, initialPositions: { [key: number]: Point } | null, context: ToolContext): { selectedElements: any[] } {
    if (this.activeShape && lineIndex < this.activeShape.points.length && initialPositions) {
      const nextIdx = (lineIndex + 1) % this.activeShape.points.length;
      if (initialPositions[lineIndex] && initialPositions[nextIdx]) {
        this.activeShape.points[lineIndex] = { x: initialPositions[lineIndex].x + offset.dx, y: initialPositions[lineIndex].y + offset.dy };
        this.activeShape.points[nextIdx] = { x: initialPositions[nextIdx].x + offset.dx, y: initialPositions[nextIdx].y + offset.dy };
      }
    }
    return { selectedElements: this.getSelectedElements(context) };
  }

  updateContainerCorner(corner: string, newPos: Point, _oldBounds: any, context: ToolContext): { selectedElements: any[] } {
    if (!this.activeShape) return { selectedElements: [] };
    const oldRect = this.getBoundingRect(this.activeShape.points);
    let newMinX = oldRect.minX, newMaxX = oldRect.maxX, newMinY = oldRect.minY, newMaxY = oldRect.maxY;
    if (corner === 'topLeft') { newMinX = newPos.x; newMinY = newPos.y; }
    else if (corner === 'topRight') { newMaxX = newPos.x; newMinY = newPos.y; }
    else if (corner === 'bottomLeft') { newMinX = newPos.x; newMaxY = newPos.y; }
    else if (corner === 'bottomRight') { newMaxX = newPos.x; newMaxY = newPos.y; }
    const scaleX = (newMaxX - newMinX) / (oldRect.maxX - oldRect.minX || 1);
    const scaleY = (newMaxY - newMinY) / (oldRect.maxY - oldRect.minY || 1);
    this.activeShape.points = this.activeShape.points.map((p) => ({
      x: newMinX + (p.x - oldRect.minX) * scaleX,
      y: newMinY + (p.y - oldRect.minY) * scaleY,
    }));
    return { selectedElements: this.getSelectedElements(context) };
  }

  updateContainerEdge(edge: string, newPos: Point, _oldBounds: any, context: ToolContext): { selectedElements: any[] } {
    if (!this.activeShape) return { selectedElements: [] };
    const oldRect = this.getBoundingRect(this.activeShape.points);
    let newMinX = oldRect.minX, newMaxX = oldRect.maxX, newMinY = oldRect.minY, newMaxY = oldRect.maxY;
    if (edge === 'top') newMinY = newPos.y;
    else if (edge === 'bottom') newMaxY = newPos.y;
    else if (edge === 'left') newMinX = newPos.x;
    else if (edge === 'right') newMaxX = newPos.x;
    const scaleX = (newMaxX - newMinX) / (oldRect.maxX - oldRect.minX || 1);
    const scaleY = (newMaxY - newMinY) / (oldRect.maxY - oldRect.minY || 1);
    this.activeShape.points = this.activeShape.points.map((p) => ({
      x: newMinX + (p.x - oldRect.minX) * scaleX,
      y: newMinY + (p.y - oldRect.minY) * scaleY,
    }));
    return { selectedElements: this.getSelectedElements(context) };
  }

  onMouseDown(point: Point, _context: ToolContext): ToolUpdate {
    if (this.activeShape) {
      for (let i = 0; i < this.activeShape.points.length; i++) {
        if (dist(this.activeShape.points[i], point) < 10) {
          this.draggingCorner = i;
          return {};
        }
      }
      if (this.isPointInPolygon(point, this.activeShape.points)) {
        this.draggingShape = { startPos: point, initialPoints: [...this.activeShape.points] };
        return {};
      }
      return {};
    }
    this.drawingShape = { points: [point] };
    return { internalState: { drawingShape: this.drawingShape } };
  }

  onMouseMove(point: Point, context: ToolContext): ToolUpdate {
    if (this.draggingCorner !== null && this.activeShape) {
      this.activeShape.points[this.draggingCorner] = point;
      return { internalState: { activeShape: this.activeShape, selectedElements: this.getSelectedElements(context) } };
    }
    if (this.draggingShape && this.activeShape) {
      const dx = point.x - this.draggingShape.startPos.x;
      const dy = point.y - this.draggingShape.startPos.y;
      this.activeShape.points = this.draggingShape.initialPoints.map((p) => ({ x: p.x + dx, y: p.y + dy }));
      return { internalState: { activeShape: this.activeShape, selectedElements: this.getSelectedElements(context) } };
    }
    if (this.drawingShape) {
      this.drawingShape.points.push(point);
      return { internalState: { drawingShape: this.drawingShape } };
    }
    return {};
  }

  onMouseUp(point: Point, context: ToolContext): ToolUpdate {
    if (this.draggingCorner !== null) {
      this.draggingCorner = null;
      return { internalState: { activeShape: this.activeShape, selectedElements: this.getSelectedElements(context) } };
    }
    if (this.draggingShape) {
      this.draggingShape = null;
      return { internalState: { activeShape: this.activeShape, selectedElements: this.getSelectedElements(context) } };
    }
    if (this.drawingShape && this.drawingShape.points.length > 2) {
      const epsilon = accuracyToEpsilon(context.freeformAccuracy ?? 100);
      const simplified = epsilon > 0 ? rdpSimplify(this.drawingShape.points, epsilon) : this.drawingShape.points;
      this.activeShape = { points: simplified };
      this.drawingShape = null;
      return { internalState: { activeShape: this.activeShape, drawingShape: null, selectedElements: this.getSelectedElements(context) } };
    }
    return {};
  }

  getVisualOverlay() {
    if (this.drawingShape) return { drawingShape: this.drawingShape, type: 'freeform' };
    if (this.activeShape) return { activeShape: this.activeShape, type: 'freeform' };
    return null;
  }
}
