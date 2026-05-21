import { BaseTool, ToolContext, ToolUpdate } from '../BaseTool';
import { Point } from '../../types';

export class SelectTool_All implements BaseTool {
  private selectionActive: boolean = false;

  private getAllSelectedElements(context: ToolContext): { polygonId: string; points: number[]; lines: number[] }[] {
    const { svgObject, selectPoints, selectLines } = context;
    const results: { polygonId: string; points: number[]; lines: number[] }[] = [];

    for (const poly of svgObject.polygons) {
      const selectedPoints: number[] = [];
      const selectedLines: number[] = [];

      if (selectPoints) {
        for (let i = 0; i < poly.points.length; i++) {
          selectedPoints.push(i);
        }
      }

      if (selectLines) {
        for (let i = 0; i < poly.points.length; i++) {
          selectedLines.push(i);
        }
      }

      if (selectedPoints.length > 0 || selectedLines.length > 0) {
        results.push({ polygonId: poly.id, points: selectedPoints, lines: selectedLines });
      }
    }

    return results;
  }

  onMouseDown(point: Point, context: ToolContext): ToolUpdate {
    if (!this.selectionActive) {
      this.selectionActive = true;
      const selectedElements = this.getAllSelectedElements(context);
      return { internalState: { selectedElements, selectAll: true } };
    } else {
      this.selectionActive = false;
      return { internalState: { selectedElements: [], selectAll: false } };
    }
  }

  onMouseMove(point: Point, context: ToolContext): ToolUpdate {
    return {};
  }

  onMouseUp(point: Point, context: ToolContext): ToolUpdate {
    return {};
  }

  getVisualOverlay() {
    return null;
  }
}