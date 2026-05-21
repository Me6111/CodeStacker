import React, { useState, useRef, useEffect } from 'react';
import { Polygon } from '../../types';
import { useSelectionContext } from '../../context/SelectionContext';
import { useUIContext } from '../../context/UIContext';
import { useSVGContext } from '../../context/SVGContext';
import { useToolContext } from '../../context/ToolContext';
import PointsList from './PointsList';
import LinesList from './LinesList';
import TrashIcon from '../Icons/TrashIcon';

interface PolygonItemProps { polygon: Polygon; index: number; }

const PolygonItem: React.FC<PolygonItemProps> = ({ polygon }) => {
  const { selection, setSelection, setHover, lineRunHover } = useSelectionContext();
  const { expandedPolygons, togglePolygon, polygonViews, setPolygonView } = useUIContext();
  const { updatePolygonName, deletePolygon } = useSVGContext();
  const { setPendingSelectAll } = useToolContext();
  const [editing, setEditing] = useState(false);
  const [tempName, setTempName] = useState('');
  const [rowHovered, setRowHovered] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  // Sync rowHovered with the real CSS :hover state after every render.
  // When another row is deleted and this row shifts into its place, the browser
  // doesn't fire mouseenter — but element.matches(':hover') is always accurate.
  useEffect(() => {
    if (!rowRef.current) return;
    const isOver = rowRef.current.matches(':hover');
    if (isOver && !rowHovered) setRowHovered(true);
    else if (!isOver && rowHovered) setRowHovered(false);
  });

  const isExpanded = expandedPolygons[polygon.id];
  const view = polygonViews[polygon.id] || 'points';

  const isSelected = selection.polygonId === polygon.id && !selection.elementType;
  const isLineRunHovered = lineRunHover?.polygonId === polygon.id;

  const selectPolygon = () => {
    setSelection({ level: 'polygon', polygonId: polygon.id, elementType: null, elementIndex: null });
    setPendingSelectAll(polygon.id);
  };

  const startEdit = (e: React.MouseEvent) => { e.stopPropagation(); setTempName(polygon.name); setEditing(true); };
  const saveEdit = () => { if (tempName.trim()) updatePolygonName(polygon.id, tempName.trim()); setEditing(false); };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEdit();
    else if (e.key === 'Escape') setEditing(false);
  };

  const bg = isSelected                  ? 'rgba(74,222,128,0.22)'
    : (rowHovered || isLineRunHovered)   ? 'rgba(74,222,128,0.12)'
    : 'transparent';
  const borderColor = isSelected               ? '#4ade80'
    : (rowHovered || isLineRunHovered)         ? '#86efac'
    : 'transparent';

  return (
    <div>
      <div
        ref={rowRef}
        onClick={selectPolygon}
        onMouseEnter={() => { setHover({ polygonId: polygon.id, elementType: null, elementIndex: null }); setRowHovered(true); }}
        onMouseLeave={() => { setHover({ polygonId: null, elementType: null, elementIndex: null }); setRowHovered(false); }}
        style={{
          padding: '8px 16px 8px 28px',
          background: bg,
          borderLeft: `3px solid ${borderColor}`,
          cursor: 'pointer', fontSize: 13, color: '#ffffff',
          display: 'flex', alignItems: 'center', gap: 7,
          transition: 'all 0.12s', fontWeight: isSelected ? 700 : 400,
        }}
      >
        <span
          onClick={(e) => { e.stopPropagation(); togglePolygon(polygon.id); }}
          style={{ cursor: 'pointer', userSelect: 'none', fontSize: 9, opacity: 0.45, width: 10, flexShrink: 0 }}
        >{isExpanded ? '▼' : '▶'}</span>
        <span style={{ opacity: 0.55 }}>▱</span>
        {editing ? (
          <input type="text" value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={saveEdit} onKeyDown={handleKeyDown} autoFocus
            onClick={(e) => e.stopPropagation()}
            style={{
              flex: 1, padding: '2px 6px', fontSize: 12,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: 4, outline: 'none', color: '#fff',
            }}
          />
        ) : (
          <>
            <span style={{ flex: 1 }}>{polygon.name}</span>
            <span onClick={startEdit}
              style={{ fontSize: 12, cursor: 'pointer', opacity: rowHovered ? 0.6 : 0, transition: 'opacity 0.15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = rowHovered ? '0.6' : '0')}
            >✎</span>
            <span
              onClick={(e) => { e.stopPropagation(); deletePolygon(polygon.id); }}
              title="Delete polygon"
              style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', opacity: rowHovered ? 1 : 0, transition: 'opacity 0.15s' }}
            ><TrashIcon /></span>
            <span style={{
              fontSize: 10, padding: '1px 6px', borderRadius: 10,
              background: 'rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.45)',
            }}>{polygon.points.length}</span>
          </>
        )}
      </div>

      {isExpanded && (
        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.07)', marginLeft: 28, background: '#000000' }}>
          <div style={{ display: 'flex', gap: 4, padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {(['points', 'lines'] as const).map((v) => (
              <button key={v} onClick={() => setPolygonView(polygon.id, v)} style={{
                flex: 1, padding: '4px 0',
                background: view === v ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: view === v ? '#ffffff' : 'rgba(255,255,255,0.4)',
                border: `1px solid ${view === v ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 4, fontSize: 11, cursor: 'pointer',
                fontWeight: view === v ? 700 : 400,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                transition: 'all 0.12s',
              }}>{v}</button>
            ))}
          </div>
          {view === 'points' && <PointsList polygon={polygon} />}
          {view === 'lines' && <LinesList polygon={polygon} />}
        </div>
      )}
    </div>
  );
};

export default PolygonItem;
