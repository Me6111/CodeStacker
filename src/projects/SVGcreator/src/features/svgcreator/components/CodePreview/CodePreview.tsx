import React from 'react';
import { useSVGContext } from '../../context/SVGContext';
import { useSelectionContext } from '../../context/SelectionContext';
import { useToolContext } from '../../context/ToolContext';

const C_PUNCT = 'rgba(255,255,255,0.35)';
const C_TAG   = 'rgba(255,255,255,0.85)';
const C_ATTR  = 'rgba(255,255,255,0.6)';
const C_VALUE = 'rgba(255,255,255,0.5)';
const C_COORD = 'rgba(255,255,255,0.78)';

// Polygon focused/clicked — green-100 near-white mint
const SEL_BG    = 'rgba(212,245,228,0.20)';
const SEL_BDR   = '#d4f5e4';
const SEL_COORD = 'rgba(212,245,228,0.80)';

// Polygon hovered in ObjectMap — green-300
const HOV_BG    = 'rgba(134,239,172,0.15)';
const HOV_BDR   = '#86efac';
const HOV_COORD = 'rgba(134,239,172,0.80)';

// Fragment within selection area — green-400
const CAP_BG    = 'rgba(74,222,128,0.18)';
const CAP_BDR   = '#4ade80';
const CAP_COORD = 'rgba(74,222,128,0.75)';

// Line-run sidebar hover — green-300 (same as polygon hover, no blue)
const LRH_BG    = 'rgba(134,239,172,0.12)';
const LRH_BDR   = '#86efac';
const LRH_COORD = 'rgba(134,239,172,0.75)';

// Hovered point or line — green-500
const ELEM_HOV_COORD = 'rgba(34,197,94,0.75)';
// Focused/selected point or line — green-700
const ELEM_SEL_COORD = 'rgba(21,128,61,0.85)';

const CodePreview: React.FC = () => {
  const { svgObject } = useSVGContext();
  const { selection, hover, setHover, lineRunHover } = useSelectionContext();
  const { confirmedSelectionElements } = useToolContext();

  const isSVGLevel = selection.level === null;
  const clearHover = () => setHover({ polygonId: null, elementType: null, elementIndex: null });

  return (
    <div style={{
      width: 300,
      display: 'flex',
      flexDirection: 'column',
      background: '#000000',
      borderLeft: '1px solid rgba(255,255,255,0.12)',
    }}>
      <div style={{
        padding: '16px 18px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)',
      }}>
        Code Preview
      </div>

      <div style={{
        flex: 1, overflowY: 'auto', padding: '14px',
        fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
        fontSize: 12, lineHeight: 1.75,
      }}>
        <div style={{ color: C_PUNCT }}>
          {'<'}
          <span style={{ color: C_TAG }}>svg</span>
          {' '}
          <span style={{ color: C_ATTR }}>width</span>
          <span style={{ color: C_PUNCT }}>{'="'}</span>
          <span style={{ color: C_VALUE }}>{svgObject.width}</span>
          <span style={{ color: C_PUNCT }}>{'"'}</span>
          {' '}
          <span style={{ color: C_ATTR }}>height</span>
          <span style={{ color: C_PUNCT }}>{'="'}</span>
          <span style={{ color: C_VALUE }}>{svgObject.height}</span>
          <span style={{ color: C_PUNCT }}>{'">'}</span>
        </div>

        {svgObject.polygons.map((poly) => {
          const isPolySelRow = isSVGLevel || (selection.polygonId === poly.id && !selection.elementType);
          const isPolyHovRow = hover.polygonId === poly.id && !hover.elementType;
          const hasCaptures = confirmedSelectionElements?.some(s => s.polygonId === poly.id) ?? false;
          const isLineRunHovRow = lineRunHover?.polygonId === poly.id;

          const rowBg  = isPolySelRow ? SEL_BG  : isPolyHovRow ? HOV_BG  : isLineRunHovRow ? LRH_BG  : hasCaptures ? CAP_BG  : 'transparent';
          const rowBdr = isPolySelRow ? SEL_BDR : isPolyHovRow ? HOV_BDR : isLineRunHovRow ? LRH_BDR : hasCaptures ? CAP_BDR : 'transparent';

          const pointsStr = poly.points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`);

          return (
            <div key={poly.id}
              onMouseEnter={() => setHover({ polygonId: poly.id, elementType: null, elementIndex: null })}
              onMouseLeave={clearHover}
              style={{
                background: rowBg,
                borderLeft: `2px solid ${rowBdr}`,
                paddingLeft: 6, marginLeft: -8, paddingRight: 4,
                borderRadius: 3, margin: '2px 0 2px -8px',
                transition: 'all 0.15s',
                cursor: 'default',
              }}>
              {'  '}
              <span style={{ color: C_PUNCT }}>{'<'}</span>
              <span style={{ color: C_TAG }}>polygon</span>
              {' '}
              <span style={{ color: C_ATTR }}>points</span>
              <span style={{ color: C_PUNCT }}>{'="'}</span>
              {pointsStr.map((pt, ptIdx) => {
                const isSel =
                  selection.polygonId === poly.id &&
                  selection.elementType === 'point' &&
                  selection.elementIndex === ptIdx;
                const isHov =
                  hover.polygonId === poly.id &&
                  hover.elementType === 'point' &&
                  hover.elementIndex === ptIdx;

                const lineIdx  = selection.elementIndex ?? -1;
                const hLineIdx = hover.elementIndex ?? -1;
                const isLineSel =
                  selection.polygonId === poly.id &&
                  selection.elementType === 'line' &&
                  (lineIdx === ptIdx || lineIdx === (ptIdx - 1 + poly.points.length) % poly.points.length);
                const isLineHov =
                  hover.polygonId === poly.id &&
                  hover.elementType === 'line' &&
                  (hLineIdx === ptIdx || hLineIdx === (ptIdx - 1 + poly.points.length) % poly.points.length);

                const isCapturedPt = confirmedSelectionElements?.some(
                  s => s.polygonId === poly.id && s.points.includes(ptIdx)
                ) ?? false;
                const isCapturedLn = confirmedSelectionElements?.some(
                  s => s.polygonId === poly.id && s.lines.includes(ptIdx)
                ) ?? false;
                const N = poly.points.length;
                const isLineRunHovPt = lineRunHover?.polygonId === poly.id &&
                  lineRunHover.edgeIndices.some(ei =>
                    ei === ptIdx || (ei + 1) % N === ptIdx
                  );

                // Captured fragments take priority over polygon-level row color so they
                // are always individually visible even when whole polygon is selected
                const bg = (isSel || isLineSel)             ? ELEM_SEL_COORD
                  : (isHov || isLineHov)                    ? ELEM_HOV_COORD
                  : isLineRunHovPt                          ? LRH_COORD
                  : (isCapturedPt || isCapturedLn)          ? CAP_COORD
                  : isPolyHovRow                            ? HOV_COORD
                  : 'transparent';

                const isBold = isSel || isLineSel || isHov || isLineHov
                  || isLineRunHovPt || isCapturedPt || isCapturedLn || isPolyHovRow;

                return (
                  <span key={ptIdx}>
                    <span
                      onMouseEnter={() => setHover({ polygonId: poly.id, elementType: 'point', elementIndex: ptIdx })}
                      onMouseLeave={() => setHover({ polygonId: poly.id, elementType: null, elementIndex: null })}
                      style={{
                        color: C_COORD,
                        background: bg,
                        borderRadius: 2, padding: '0 2px',
                        fontWeight: isBold ? 700 : 400,
                        cursor: 'default',
                      }}>{pt}</span>
                    {ptIdx < pointsStr.length - 1 && (
                      <span style={{ color: 'rgba(255,255,255,0.2)' }}> </span>
                    )}
                  </span>
                );
              })}
              <span style={{ color: C_PUNCT }}>{'" />'}</span>
              <span style={{
                marginLeft: 8, fontSize: 10,
                color: 'rgba(255,255,255,0.28)',
                fontStyle: 'italic', userSelect: 'none',
              }}>{poly.points.length} pts</span>
            </div>
          );
        })}

        <div style={{ color: C_PUNCT }}>
          {'</'}
          <span style={{ color: C_TAG }}>svg</span>
          {'>'}
        </div>

        {svgObject.polygons.length === 0 && (
          <div style={{ marginTop: 12, color: 'rgba(255,255,255,0.25)', fontSize: 12, fontStyle: 'italic' }}>
            No polygons yet
          </div>
        )}
      </div>
    </div>
  );
};

export default CodePreview;
