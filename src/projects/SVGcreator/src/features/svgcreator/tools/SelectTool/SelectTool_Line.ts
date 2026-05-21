import { BaseTool, ToolContext, ToolUpdate } from '../BaseTool';
import { Point } from '../../types';
import { projectOnLine } from '../../utils';
import { THRESHOLDS } from '../../constants';

export class SelectTool_Line implements BaseTool {
  onMouseDown(point: Point, context: ToolContext): ToolUpdate {
    const { svgObject, selection } = context;

    if (selection.level === 'polygon' && selection.polygonId) {
      const poly = svgObject.polygons.find((p) => p.id === selection.polygonId);
      if (poly) {
        for (let i = 0; i < poly.points.length; i++) {
          const nextIdx = (i + 1) % poly.points.length;
          const a = poly.points[i];
          const b = poly.points[nextIdx];
          const { distance } = projectOnLine(point, a, b);
          if (distance < THRESHOLDS.LINE_SELECT) {
            return { selection: { ...selection, level: 'line', elementType: 'line', elementIndex: i } };
          }
        }
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