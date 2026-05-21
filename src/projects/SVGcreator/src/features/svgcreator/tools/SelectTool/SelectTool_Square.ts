import { BaseTool, ToolContext, ToolUpdate } from '../BaseTool';
import { Point } from '../../types';

interface RectShape { topLeft: Point; bottomRight: Point; }
interface PolyShape { points: Point[]; }
type SelectionShape = RectShape | PolyShape;

function isPolyShape(s: SelectionShape): s is PolyShape {
  return 'points' in s;
}

export class SelectTool_Square implements BaseTool {
  private activeShape: SelectionShape | null = null;
  private drawingShape: RectShape | null = null;

  clearSelection(): void {
    this.activeShape = null;
    this.drawingShape = null;
  }

  loadShape(shape: any): void {
    this.activeShape = shape;
  }

  private isPointInRectangle(point: Point, shape: RectShape): boolean {
    const minX = Math.min(shape.topLeft.x, shape.bottomRight.x);
    const maxX = Math.max(shape.topLeft.x, shape.bottomRight.x);
    const minY = Math.min(shape.topLeft.y, shape.bottomRight.y);
    const maxY = Math.max(shape.topLeft.y, shape.bottomRight.y);
    return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
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
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
  }

  private isInside(point: Point): boolean {
    if (!this.activeShape) return false;
    if (isPolyShape(this.activeShape)) return this.isPointInPolygon(point, this.activeShape.points);
    return this.isPointInRectangle(point, this.activeShape);
  }

  private getSelectedElements(context: ToolContext): { polygonId: string; points: number[]; lines: number[] }[] {
    if (!this.activeShape) return [];
    const { svgObject, selectPoints, selectLines } = context;
    const results: { polygonId: string; points: number[]; lines: number[] }[] = [];

    for (const poly of svgObject.polygons) {
      const selectedPoints: number[] = [];
      const selectedLines: number[] = [];

      if (selectPoints) {
        for (let i = 0; i < poly.points.length; i++) {
          if (this.isInside(poly.points[i])) selectedPoints.push(i);
        }
      }

      if (selectLines) {
        for (let i = 0; i < poly.points.length; i++) {
          const nextIdx = (i + 1) % poly.points.length;
          if (this.isInside(poly.points[i]) && this.isInside(poly.points[nextIdx])) selectedLines.push(i);
        }
      }

      if (selectedPoints.length > 0 || selectedLines.length > 0) {
        results.push({ polygonId: poly.id, points: selectedPoints, lines: selectedLines });
      }
    }
    return results;
  }

  rotateShape(angle: number, originalShape: any, context: ToolContext): { selectedElements: any[] } | null {
    let corners: Point[];
    if ('topLeft' in originalShape) {
      const minX = Math.min(originalShape.topLeft.x, originalShape.bottomRight.x);
      const maxX = Math.max(originalShape.topLeft.x, originalShape.bottomRight.x);
      const minY = Math.min(originalShape.topLeft.y, originalShape.bottomRight.y);
      const maxY = Math.max(originalShape.topLeft.y, originalShape.bottomRight.y);
      corners = [{ x: minX, y: minY }, { x: maxX, y: minY }, { x: maxX, y: maxY }, { x: minX, y: maxY }];
    } else {
      corners = originalShape.points;
    }

    const xs = corners.map((p: Point) => p.x);
    const ys = corners.map((p: Point) => p.y);
    const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;

    this.activeShape = {
      points: corners.map((p: Point) => {
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

  moveShape(delta: { dx: number; dy: number }, initialShape: any, context: ToolContext): { selectedElements: any[] } {
    if ('points' in initialShape) {
      this.activeShape = { points: initialShape.points.map((p: Point) => ({ x: p.x + delta.dx, y: p.y + delta.dy })) };
    } else {
      this.activeShape = {
        topLeft: { x: initialShape.topLeft.x + delta.dx, y: initialShape.topLeft.y + delta.dy },
        bottomRight: { x: initialShape.bottomRight.x + delta.dx, y: initialShape.bottomRight.y + delta.dy },
      };
    }
    return { selectedElements: this.getSelectedElements(context) };
  }

  updateCorner(cornerIndex: number, newPos: Point, context: ToolContext): { selectedElements: any[] } {
    if (!this.activeShape) return { selectedElements: [] };
    if (isPolyShape(this.activeShape) && cornerIndex < this.activeShape.points.length) {
      this.activeShape.points[cornerIndex] = newPos;
    } else if (!isPolyShape(this.activeShape)) {
      const keys = ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'];
      if (cornerIndex < keys.length) this.activeShape = this.updateRectHandle(keys[cornerIndex], newPos, this.activeShape);
    }
    return { selectedElements: this.getSelectedElements(context) };
  }

  updateLine(lineIndex: number, offset: { dx: number; dy: number }, initialPositions: any, context: ToolContext): { selectedElements: any[] } {
    if (!this.activeShape || !isPolyShape(this.activeShape) || !initialPositions) return { selectedElements: this.getSelectedElements(context) };
    const nextIdx = (lineIndex + 1) % this.activeShape.points.length;
    if (initialPositions[lineIndex] && initialPositions[nextIdx]) {
      this.activeShape.points[lineIndex] = { x: initialPositions[lineIndex].x + offset.dx, y: initialPositions[lineIndex].y + offset.dy };
      this.activeShape.points[nextIdx] = { x: initialPositions[nextIdx].x + offset.dx, y: initialPositions[nextIdx].y + offset.dy };
    }
    return { selectedElements: this.getSelectedElements(context) };
  }

  updateContainerCorner(corner: string, newPos: Point, oldBounds: any, context: ToolContext): { selectedElements: any[] } {
    if (!this.activeShape) return { selectedElements: [] };
    if (isPolyShape(this.activeShape)) {
      this.activeShape = { points: this.scalePoints(this.activeShape.points, corner, newPos) };
    } else {
      this.activeShape = this.updateRectHandle(corner, newPos, this.activeShape);
    }
    return { selectedElements: this.getSelectedElements(context) };
  }

  updateContainerEdge(edge: string, newPos: Point, oldBounds: any, context: ToolContext): { selectedElements: any[] } {
    if (!this.activeShape) return { selectedElements: [] };
    const handleMap: Record<string, string> = { top: 'topMid', bottom: 'bottomMid', left: 'leftMid', right: 'rightMid' };
    if (isPolyShape(this.activeShape)) {
      this.activeShape = { points: this.scalePoints(this.activeShape.points, edge, newPos) };
    } else {
      this.activeShape = this.updateRectHandle(handleMap[edge] ?? edge, newPos, this.activeShape);
    }
    return { selectedElements: this.getSelectedElements(context) };
  }

  private scalePoints(points: Point[], operation: string, newPos: Point): Point[] {
    const rect = this.getBoundingRect(points);
    const oldWidth = rect.maxX - rect.minX;
    const oldHeight = rect.maxY - rect.minY;
    let { minX: newMinX, maxX: newMaxX, minY: newMinY, maxY: newMaxY } = rect;

    switch (operation) {
      case 'topLeft':     newMinX = newPos.x; newMinY = newPos.y; break;
      case 'topRight':    newMaxX = newPos.x; newMinY = newPos.y; break;
      case 'bottomLeft':  newMinX = newPos.x; newMaxY = newPos.y; break;
      case 'bottomRight': newMaxX = newPos.x; newMaxY = newPos.y; break;
      case 'top':         newMinY = newPos.y; break;
      case 'bottom':      newMaxY = newPos.y; break;
      case 'left':        newMinX = newPos.x; break;
      case 'right':       newMaxX = newPos.x; break;
    }

    const newWidth = newMaxX - newMinX;
    const newHeight = newMaxY - newMinY;
    if (oldWidth === 0 || oldHeight === 0) return points;

    return points.map(p => ({
      x: newMinX + (p.x - rect.minX) * (newWidth / oldWidth),
      y: newMinY + (p.y - rect.minY) * (newHeight / oldHeight),
    }));
  }

  private updateRectHandle(handle: string, point: Point, shape: RectShape): RectShape {
    const minX = Math.min(shape.topLeft.x, shape.bottomRight.x);
    const maxX = Math.max(shape.topLeft.x, shape.bottomRight.x);
    const minY = Math.min(shape.topLeft.y, shape.bottomRight.y);
    const maxY = Math.max(shape.topLeft.y, shape.bottomRight.y);
    let newMinX = minX, newMaxX = maxX, newMinY = minY, newMaxY = maxY;

    if (handle === 'topLeft')     { newMinX = point.x; newMinY = point.y; }
    else if (handle === 'topRight')    { newMaxX = point.x; newMinY = point.y; }
    else if (handle === 'bottomLeft')  { newMinX = point.x; newMaxY = point.y; }
    else if (handle === 'bottomRight') { newMaxX = point.x; newMaxY = point.y; }
    else if (handle === 'topMid')      { newMinY = point.y; }
    else if (handle === 'bottomMid')   { newMaxY = point.y; }
    else if (handle === 'leftMid')     { newMinX = point.x; }
    else if (handle === 'rightMid')    { newMaxX = point.x; }

    return { topLeft: { x: newMinX, y: newMinY }, bottomRight: { x: newMaxX, y: newMaxY } };
  }

  onMouseDown(point: Point, context: ToolContext): ToolUpdate {
    if (this.activeShape) return {};
    this.drawingShape = { topLeft: point, bottomRight: point };
    return { internalState: { drawingShape: this.drawingShape } };
  }

  onMouseMove(point: Point, context: ToolContext): ToolUpdate {
    if (this.drawingShape) {
      this.drawingShape.bottomRight = point;
      return { internalState: { drawingShape: this.drawingShape } };
    }
    return {};
  }

  onMouseUp(point: Point, context: ToolContext): ToolUpdate {
    if (this.drawingShape) {
      this.activeShape = this.drawingShape;
      this.drawingShape = null;
      const selectedElements = this.getSelectedElements(context);
      return { internalState: { activeShape: this.activeShape, drawingShape: null, selectedElements } };
    }
    return {};
  }

  getVisualOverlay() {
    if (this.drawingShape) return { drawingShape: this.drawingShape, type: 'rectangle' };
    if (this.activeShape) {
      if (isPolyShape(this.activeShape)) return { activeShape: this.activeShape, type: 'freeform' };
      return { activeShape: this.activeShape, type: 'rectangle' };
    }
    return null;
  }
}
