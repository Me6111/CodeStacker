import React from 'react';
import { Polygon } from '../../types';
import { useSelectionContext } from '../../context/SelectionContext';
import { useToolContext } from '../../context/ToolContext';
import { useSVGContext } from '../../context/SVGContext';
import TrashIcon from '../Icons/TrashIcon';

const PointsList: React.FC<{ polygon: Polygon }> = ({ polygon }) => {
  const { selection, setSelection, hover, setHover, lineRunHover } = useSelectionContext();
  const { confirmedSelectionElements } = useToolContext();
  const { deletePointFromPolygon } = useSVGContext();

  return (
    <div style={{ maxHeight: 200, overflowY: 'auto', overflowX: 'hidden' }}>
      {polygon.points.map((pt, ptIdx) => {
        const isSel = selection.elementType === 'point' && selection.elementIndex === ptIdx && selection.polygonId === polygon.id;
        const isHov = hover.elementType === 'point' && hover.elementIndex === ptIdx && hover.polygonId === polygon.id;
        const isPolyHov = hover.polygonId === polygon.id && !hover.elementType;
        const isCapt = confirmedSelectionElements?.some(
          s => s.polygonId === polygon.id && s.points.includes(ptIdx)
        ) ?? false;
        const N = polygon.points.length;
        const isLineRunHov = lineRunHover?.polygonId === polygon.id &&
          lineRunHover.edgeIndices.some(ei => ei === ptIdx || (ei + 1) % N === ptIdx);

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
          <div key={ptIdx}
            onClick={() => setSelection({ level: 'point', polygonId: polygon.id, elementType: 'point', elementIndex: ptIdx })}
            onMouseEnter={() => setHover({ polygonId: polygon.id, elementType: 'point', elementIndex: ptIdx })}
            onMouseLeave={() => setHover({ polygonId: null, elementType: null, elementIndex: null })}
            style={{
              padding: '6px 12px', background: bg, borderLeft: border,
              cursor: 'pointer', fontSize: 12, color: '#ffffff',
              display: 'flex', alignItems: 'center', gap: 7,
              transition: 'all 0.1s', fontWeight: isSel ? 600 : 400,
            }}
          >
            <span style={{
              fontSize: 7,
              opacity: isSel ? 1 : isCapt ? 0.85 : 0.4,
              color: isCapt && !isSel ? '#166534' : 'inherit',
            }}>●</span>
            <span>{`Point ${ptIdx + 1}`}</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.4, fontVariantNumeric: 'tabular-nums' }}>
              {pt.x.toFixed(0)}, {pt.y.toFixed(0)}
            </span>
            <span
              onClick={(e) => { e.stopPropagation(); deletePointFromPolygon(polygon.id, ptIdx); }}
              title="Delete point"
              style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', opacity: isHov ? 1 : 0, transition: 'opacity 0.15s' }}
            ><TrashIcon /></span>
          </div>
        );
      })}
    </div>
  );
};

export default PointsList;
