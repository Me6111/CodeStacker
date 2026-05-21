import React from 'react';
import { Polygon } from '../../types';
import { useSelectionContext } from '../../context/SelectionContext';
import { useToolContext } from '../../context/ToolContext';
import { useSVGContext } from '../../context/SVGContext';
import TrashIcon from '../Icons/TrashIcon';

const LinesList: React.FC<{ polygon: Polygon }> = ({ polygon }) => {
  const { selection, setSelection, hover, setHover, lineRunHover } = useSelectionContext();
  const { confirmedSelectionElements } = useToolContext();
  const { deletePointFromPolygon } = useSVGContext();

  return (
    <div style={{ maxHeight: 200, overflowY: 'auto', overflowX: 'hidden' }}>
      {polygon.points.map((_, lineIdx) => {
        const isSel = selection.elementType === 'line' && selection.elementIndex === lineIdx && selection.polygonId === polygon.id;
        const isHov = hover.elementType === 'line' && hover.elementIndex === lineIdx && hover.polygonId === polygon.id;
        const isPolyHov = hover.polygonId === polygon.id && !hover.elementType;
        const isCapt = confirmedSelectionElements?.some(
          s => s.polygonId === polygon.id && s.lines.includes(lineIdx)
        ) ?? false;
        const isLineRunHov = lineRunHover?.polygonId === polygon.id &&
          lineRunHover.edgeIndices.includes(lineIdx);

        const bg = isSel       ? 'rgba(21,128,61,0.28)'
          : isHov              ? 'rgba(34,197,94,0.18)'
          : isLineRunHov       ? 'rgba(34,197,94,0.12)'
          : isPolyHov          ? 'rgba(34,197,94,0.12)'
          : isCapt             ? 'rgba(74,222,128,0.18)'
          : 'transparent';
        const border = isSel   ? '2px solid #15803d'
          : isHov              ? '2px solid #22c55e'
          : isLineRunHov       ? '2px solid #22c55e'
          : isPolyHov          ? '2px solid #22c55e'
          : isCapt             ? '2px solid #4ade80'
          : '2px solid transparent';

        return (
          <div key={lineIdx}
            onClick={() => setSelection({ level: 'line', polygonId: polygon.id, elementType: 'line', elementIndex: lineIdx })}
            onMouseEnter={() => setHover({ polygonId: polygon.id, elementType: 'line', elementIndex: lineIdx })}
            onMouseLeave={() => setHover({ polygonId: null, elementType: null, elementIndex: null })}
            style={{
              padding: '6px 12px', background: bg, borderLeft: border,
              cursor: 'pointer', fontSize: 12, color: '#ffffff',
              display: 'flex', alignItems: 'center', gap: 7,
              transition: 'all 0.1s', fontWeight: isSel ? 600 : 400,
            }}
          >
            <span style={{
              opacity: isSel ? 1 : isCapt ? 0.85 : 0.4,
              letterSpacing: '-1px', fontSize: 12,
              color: isCapt && !isSel ? '#166534' : 'inherit',
            }}>—</span>
            <span>{`Line ${lineIdx + 1}`}</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.38 }}>
              {lineIdx + 1} → {(lineIdx + 1) % polygon.points.length + 1}
            </span>
            <span
              onClick={(e) => { e.stopPropagation(); deletePointFromPolygon(polygon.id, lineIdx); }}
              title="Delete line"
              style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', opacity: isHov ? 1 : 0, transition: 'opacity 0.15s' }}
            ><TrashIcon /></span>
          </div>
        );
      })}
    </div>
  );
};

export default LinesList;
