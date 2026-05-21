import { BaseTool, ToolContext, ToolUpdate } from '../BaseTool';
import { Point } from '../../types';

function circleToPolygon(center: Point, radius: number, n = 32): Point[] {
  return Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * Math.PI * 2;
    return { x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) };
  });
}

function isPointInPolygon(point: Point, polygon: Point[]): boolean {
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

export class SelectTool_Circle implements BaseTool {
  private center: Point | null = null;
  private radius = 0;
  private activePoints: Point[] | null = null;

  clearSelection(): void {
    this.center = null;
    this.radius = 0;
    this.activePoints = null;
  }

  loadShape(shape: any): void {
    if (shape?.points) {
      this.activePoints = shape.points;
      const cx = shape.points.reduce((s: number, p: Point) => s + p.x, 0) / shape.points.length;
      const cy = shape.points.reduce((s: number, p: Point) => s + p.y, 0) / shape.points.length;
      this.center = { x: cx, y: cy };
      this.radius = shape.points.reduce((s: number, p: Point) => {
        const dx = p.x - cx, dy = p.y - cy;
        return s + Math.sqrt(dx * dx + dy * dy);
      }, 0) / shape.points.length;
    }
  }

  private getSelectedElements(context: ToolContext): { polygonId: string; points: number[]; lines: number[] }[] {
    if (!this.activePoints) return [];
    const { svgObject, selectPoints, selectLines } = context;
    const results: { polygonId: string; points: number[]; lines: number[] }[] = [];

    for (const poly of svgObject.polygons) {
      const selPoints: number[] = [];
      const selLines: number[] = [];

      if (selectPoints) {
        for (let i = 0; i < poly.points.length; i++) {
          if (isPointInPolygon(poly.points[i], this.activePoints!)) selPoints.push(i);
        }
      }
      if (selectLines) {
        for (let i = 0; i < poly.points.length; i++) {
          const ni = (i + 1) % poly.points.length;
          if (isPointInPolygon(poly.points[i], this.activePoints!) && isPointInPolygon(poly.points[ni], this.activePoints!)) {
            selLines.push(i);
          }
        }
      }
      if (selPoints.length > 0 || selLines.length > 0) {
        results.push({ polygonId: poly.id, points: selPoints, lines: selLines });
      }
    }
    return results;
  }

  moveShape(delta: { dx: number; dy: number }, initialShape: any, context: ToolContext): { selectedElements: any[] } {
    if (!initialShape?.points) return { selectedElements: [] };
    this.activePoints = initialShape.points.map((p: Point) => ({ x: p.x + delta.dx, y: p.y + delta.dy }));
    if (this.center) this.center = { x: this.center.x + delta.dx, y: this.center.y + delta.dy };
    return { selectedElements: this.getSelectedElements(context) };
  }

  rotateShape(angle: number, originalShape: any, context: ToolContext): { selectedElements: any[] } | null {
    if (!originalShape?.points) return null;
    const pts = originalShape.points as Point[];
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    this.activePoints = pts.map((p) => {
      const dx = p.x - cx, dy = p.y - cy;
      return {
        x: cx + dx * Math.cos(angle) - dy * Math.sin(angle),
        y: cy + dx * Math.sin(angle) + dy * Math.cos(angle),
      };
    });
    return { selectedElements: this.getSelectedElements(context) };
  }

  updateCorner(cornerIndex: number, newPos: Point, context: ToolContext): { selectedElements: any[] } {
    if (!this.activePoints || !this.center) return { selectedElements: [] };
    const dx = newPos.x - this.center.x;
    const dy = newPos.y - this.center.y;
    this.radius = Math.sqrt(dx * dx + dy * dy);
    this.activePoints = circleToPolygon(this.center, this.radius);
    return { selectedElements: this.getSelectedElements(context) };
  }

  updateLine(lineIndex: number, offset: { dx: number; dy: number }, _initialPositions: any, context: ToolContext): { selectedElements: any[] } {
    if (!this.center) return { selectedElements: [] };
    this.center = { x: this.center.x + offset.dx, y: this.center.y + offset.dy };
    this.activePoints = circleToPolygon(this.center, this.radius);
    return { selectedElements: this.getSelectedElements(context) };
  }

  updateContainerCorner(corner: string, newPos: Point, _oldBounds: any, context: ToolContext): { selectedElements: any[] } {
    if (!this.activePoints) return { selectedElements: [] };
    const xs = this.activePoints.map((p) => p.x);
    const ys = this.activePoints.map((p) => p.y);
    const rect = { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
    let { minX, maxX, minY, maxY } = rect;
    if (corner === 'topLeft') { minX = newPos.x; minY = newPos.y; }
    else if (corner === 'topRight') { maxX = newPos.x; minY = newPos.y; }
    else if (corner === 'bottomLeft') { minX = newPos.x; maxY = newPos.y; }
    else if (corner === 'bottomRight') { maxX = newPos.x; maxY = newPos.y; }
    const scaleX = (maxX - minX) / (rect.maxX - rect.minX || 1);
    const scaleY = (maxY - minY) / (rect.maxY - rect.minY || 1);
    this.activePoints = this.activePoints.map((p) => ({
      x: minX + (p.x - rect.minX) * scaleX,
      y: minY + (p.y - rect.minY) * scaleY,
    }));
    return { selectedElements: this.getSelectedElements(context) };
  }

  updateContainerEdge(edge: string, newPos: Point, _oldBounds: any, context: ToolContext): { selectedElements: any[] } {
    if (!this.activePoints) return { selectedElements: [] };
    const xs = this.activePoints.map((p) => p.x);
    const ys = this.activePoints.map((p) => p.y);
    const rect = { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
    let { minX, maxX, minY, maxY } = rect;
    if (edge === 'top') minY = newPos.y;
    else if (edge === 'bottom') maxY = newPos.y;
    else if (edge === 'left') minX = newPos.x;
    else if (edge === 'right') maxX = newPos.x;
    const scaleX = (maxX - minX) / (rect.maxX - rect.minX || 1);
    const scaleY = (maxY - minY) / (rect.maxY - rect.minY || 1);
    this.activePoints = this.activePoints.map((p) => ({
      x: minX + (p.x - rect.minX) * scaleX,
      y: minY + (p.y - rect.minY) * scaleY,
    }));
    return { selectedElements: this.getSelectedElements(context) };
  }

  onMouseDown(point: Point, _context: ToolContext): ToolUpdate {
    if (this.activePoints) return {};
    this.center = point;
    this.radius = 0;
    return { internalState: { drawingShape: { center: point, radius: 0 } } };
  }

  onMouseMove(point: Point, _context: ToolContext): ToolUpdate {
    if (!this.center || this.activePoints) return {};
    const dx = point.x - this.center.x;
    const dy = point.y - this.center.y;
    this.radius = Math.sqrt(dx * dx + dy * dy);
    return { internalState: { drawingShape: { center: this.center, radius: this.radius } } };
  }

  onMouseUp(point: Point, context: ToolContext): ToolUpdate {
    if (!this.center) return {};
    const center = this.center;
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    const radius = Math.max(Math.sqrt(dx * dx + dy * dy), 3);
    this.radius = radius;
    this.activePoints = circleToPolygon(center, radius);
    this.center = null;
    const selectedElements = this.getSelectedElements(context);
    return { internalState: { activeShape: { points: this.activePoints }, drawingShape: null, selectedElements } };
  }

  getVisualOverlay() {
    if (this.activePoints) {
      return { activeShape: { points: this.activePoints }, type: 'freeform' };
    }
    if (this.center) {
      const r = Math.max(this.radius, 3);
      return { drawingShape: { points: circleToPolygon(this.center, r) }, type: 'freeform' };
    }
    return null;
  }
}
