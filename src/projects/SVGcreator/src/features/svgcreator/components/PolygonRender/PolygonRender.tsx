import React from 'react';
import { Polygon } from '../../types';
import { DIMENSIONS, COLORS } from '../../constants';
import { LineRunHover } from '../../context/SelectionContext';

interface PolygonRendererProps {
  polygons: Polygon[];
  currentPolygon: Polygon | null;
  selection: any;
  hover: any;
  selectedElements: { polygonId: string; points: number[]; lines: number[] }[];
  lineRunHover?: LineRunHover | null;
}

export const PolygonRenderer: React.FC<PolygonRendererProps> = ({
  polygons,
  currentPolygon,
  selection,
  hover,
  selectedElements,
  lineRunHover,
}) => {
  const allPolygons = currentPolygon ? [...polygons, currentPolygon] : polygons;

  // SVG-level selection (level===null) means all polygons are in active scope
  const isSVGLevel = selection.level === null;

  const isCapturedPoint = (polygonId: string, idx: number): boolean =>
    selectedElements.some(s => s.polygonId === polygonId && s.points.includes(idx));

  const isCapturedLine = (polygonId: string, idx: number): boolean =>
    selectedElements.some(s => s.polygonId === polygonId && s.lines.includes(idx));

  return (
    <>
      {allPolygons.map((poly) => {
        const isCurrent = poly === currentPolygon;
        const isSelected = isSVGLevel || selection.polygonId === poly.id;
        const isHovered = hover.polygonId === poly.id && !hover.elementType;
const hasAnySelection = isSelected || isHovered;
        const hasSelectedElements = selectedElements.some((s) => s.polygonId === poly.id);

        return (
          <g key={poly.id}>
            {poly.closed && (
              <polygon
                points={poly.points.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={
                  isCurrent ? COLORS.DRAWING
                  : isHovered ? COLORS.HOVERED
                  : isSelected ? COLORS.SELECTED
                  : COLORS.NORMAL
                }
                strokeWidth={
                  isHovered ? DIMENSIONS.STROKE_WIDTH_HOVERED
                  : isSelected ? DIMENSIONS.STROKE_WIDTH_SELECTED
                  : DIMENSIONS.STROKE_WIDTH_NORMAL
                }
              />
            )}
            {!poly.closed && (
              <polyline
                points={poly.points.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={COLORS.DRAWING}
                strokeWidth={DIMENSIONS.STROKE_WIDTH_NORMAL}
              />
            )}

            {/* ObjectMap direct line selection — amber */}
            {poly.closed && selection.polygonId === poly.id && selection.elementType === 'line' && selection.elementIndex !== null && (
              <line
                x1={poly.points[selection.elementIndex].x}
                y1={poly.points[selection.elementIndex].y}
                x2={poly.points[(selection.elementIndex + 1) % poly.points.length].x}
                y2={poly.points[(selection.elementIndex + 1) % poly.points.length].y}
                stroke={COLORS.LINE_OVERLAY_SELECTED}
                strokeWidth={DIMENSIONS.LINE_OVERLAY_WIDTH}
                style={{ pointerEvents: 'none' }}
              />
            )}

            {/* Polygon-level hover line overlays */}
            {poly.closed && isHovered &&
              poly.points.map((_, lineIdx) => {
                const nextIdx = (lineIdx + 1) % poly.points.length;
                return (
                  <line
                    key={`hov-poly-line-${lineIdx}`}
                    x1={poly.points[lineIdx].x}
                    y1={poly.points[lineIdx].y}
                    x2={poly.points[nextIdx].x}
                    y2={poly.points[nextIdx].y}
                    stroke={COLORS.LINE_OVERLAY_HOVERED}
                    strokeWidth={DIMENSIONS.LINE_OVERLAY_WIDTH}
                    style={{ pointerEvents: 'none' }}
                  />
                );
              })}

            {/* Selection-shape captured line overlays — emerald */}
            {poly.closed &&
              poly.points.map((_, lineIdx) => {
                if (isCapturedLine(poly.id, lineIdx)) {
                  const nextIdx = (lineIdx + 1) % poly.points.length;
                  return (
                    <line
                      key={`cap-line-${lineIdx}`}
                      x1={poly.points[lineIdx].x}
                      y1={poly.points[lineIdx].y}
                      x2={poly.points[nextIdx].x}
                      y2={poly.points[nextIdx].y}
                      stroke={COLORS.LINE_OVERLAY_CAPTURED}
                      strokeWidth={DIMENSIONS.LINE_OVERLAY_WIDTH}
                      style={{ pointerEvents: 'none' }}
                    />
                  );
                }
                return null;
              })}

            {/* Line-run sidebar hover overlays — blue */}
            {poly.closed && lineRunHover?.polygonId === poly.id &&
              lineRunHover.edgeIndices.map((lineIdx) => {
                if (lineIdx < 0 || lineIdx >= poly.points.length) return null;
                const nextIdx = (lineIdx + 1) % poly.points.length;
                return (
                  <line
                    key={`lrh-${lineIdx}`}
                    x1={poly.points[lineIdx].x}
                    y1={poly.points[lineIdx].y}
                    x2={poly.points[nextIdx].x}
                    y2={poly.points[nextIdx].y}
                    stroke={COLORS.LINE_OVERLAY_HOVERED}
                    strokeWidth={DIMENSIONS.LINE_OVERLAY_WIDTH + 1}
                    style={{ pointerEvents: 'none' }}
                  />
                );
              })}

            {/* Hover line overlay — always on top of all other line overlays */}
            {hover.polygonId === poly.id && hover.elementType === 'line' && hover.elementIndex !== null && hover.elementIndex < poly.points.length && (
              <line
                x1={poly.points[hover.elementIndex].x}
                y1={poly.points[hover.elementIndex].y}
                x2={poly.points[(hover.elementIndex + 1) % poly.points.length].x}
                y2={poly.points[(hover.elementIndex + 1) % poly.points.length].y}
                stroke={COLORS.LINE_OVERLAY_HOVERED}
                strokeWidth={DIMENSIONS.LINE_OVERLAY_WIDTH}
                style={{ pointerEvents: 'none' }}
              />
            )}

            {/* Points */}
            {(hasAnySelection || isCurrent || hasSelectedElements || lineRunHover?.polygonId === poly.id) &&
              poly.points.map((point, idx) => {
                const isDirectSel =
                  selection.elementType === 'point' && selection.elementIndex === idx && selection.polygonId === poly.id;
                const isCapt = isCapturedPoint(poly.id, idx);
                const isPointHovered = hover.elementType === 'point' && hover.elementIndex === idx && hover.polygonId === poly.id;
                const N = poly.points.length;
                const isLineRunHoverPt = lineRunHover?.polygonId === poly.id &&
                  lineRunHover.edgeIndices.some(ei => ei === idx || (ei + 1) % N === idx);

                const r = (isDirectSel || isCapt || isPointHovered || isHovered || isLineRunHoverPt)
                  ? DIMENSIONS.POINT_RADIUS_SELECTED
                  : DIMENSIONS.POINT_RADIUS_NORMAL;

                const fill = isLineRunHoverPt ? COLORS.POINT_HOVERED
                  : isPointHovered ? COLORS.POINT_HOVERED
                  : isHovered      ? COLORS.POINT_HOVERED
                  : isDirectSel    ? COLORS.POINT_SELECTED
                  : isCapt         ? COLORS.POINT_CAPTURED
                  : COLORS.POINT_NORMAL;

                return (
                  <circle
                    key={idx}
                    cx={point.x}
                    cy={point.y}
                    r={r}
                    fill={fill}
                    stroke={COLORS.POINT_BOARD_STROKE}
                    strokeWidth={DIMENSIONS.POINT_STROKE_WIDTH}
                  />
                );
              })}

            {isCurrent && poly.points.length > 0 && (
              <circle
                cx={poly.points[0].x}
                cy={poly.points[0].y}
                r={DIMENSIONS.POINT_RADIUS_FIRST}
                fill="#ffffff"
                stroke="#000000"
                strokeWidth={DIMENSIONS.POINT_STROKE_WIDTH}
              />
            )}
          </g>
        );
      })}
    </>
  );
};
