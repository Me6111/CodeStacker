import { BaseTool, ToolContext, ToolUpdate } from './BaseTool';
import { Point } from '../types';
import { projectOnLine } from '../utils';

export class SplitTool implements BaseTool {
  onMouseDown(point: Point, context: ToolContext): ToolUpdate {
    const { selection, svgObject } = context;

    if (selection.level === 'line' && selection.polygonId && selection.elementIndex !== null) {
      const poly = svgObject.polygons.find((p) => p.id === selection.polygonId);
      if (poly) {
        const i = selection.elementIndex;
        const nextIdx = (i + 1) % poly.points.length;
        const a = poly.points[i];
        const b = poly.points[nextIdx];
        const { projection } = projectOnLine(point, a, b);

        const newPoints = [...poly.points];
        newPoints.splice(nextIdx, 0, projection);

        return { saveToPolygonHistory: { polygonId: poly.id, points: newPoints } };
      }
    }

    return {};
  }

  onMouseMove(point: Point, context: ToolContext): ToolUpdate {
    return {};
  }

  onMouseUp(point: Point, context: ToolContext): ToolUpdate {
    return {};
  }
}