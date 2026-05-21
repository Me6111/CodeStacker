import { BaseTool, ToolContext, ToolUpdate } from '../BaseTool';
import { Point } from '../../types';
import { dist } from '../../utils';
import { THRESHOLDS } from '../../constants';

export class SelectTool_Point implements BaseTool {
  onMouseDown(point: Point, context: ToolContext): ToolUpdate {
    const { svgObject, selection } = context;

    if (selection.level === 'polygon' && selection.polygonId) {
      const poly = svgObject.polygons.find((p) => p.id === selection.polygonId);
      if (poly) {
        for (let i = 0; i < poly.points.length; i++) {
          if (dist(poly.points[i], point) < THRESHOLDS.POINT_SELECT) {
            return { selection: { ...selection, level: 'point', elementType: 'point', elementIndex: i } };
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