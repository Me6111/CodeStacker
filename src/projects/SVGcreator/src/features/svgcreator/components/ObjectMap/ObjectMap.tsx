import React, { useState } from 'react';
import { useSVGContext } from '../../context/SVGContext';
import { useSelectionContext } from '../../context/SelectionContext';
import { useToolContext } from '../../context/ToolContext';
import PolygonItem from './PolygonItem';
import TrashIcon from '../Icons/TrashIcon';

const ObjectMap: React.FC = () => {
  const { svgObject, updateSVGName, clearSVG } = useSVGContext();
  const { selection, setSelection, setHover } = useSelectionContext();
  const { setPendingSelectAll } = useToolContext();
  const [editing, setEditing] = useState(false);
  const [tempName, setTempName] = useState('');
  const [rowHovered, setRowHovered] = useState(false);

  const selectSVG = () => {
    setSelection({ level: null, polygonId: null, elementType: null, elementIndex: null });
    setPendingSelectAll('svg');
  };

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTempName(svgObject.name);
    setEditing(true);
  };

  const saveEdit = () => {
    if (tempName.trim()) updateSVGName(tempName.trim());
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEdit();
    else if (e.key === 'Escape') setEditing(false);
  };

  const isSVGSelected = selection.level === null;

  return (
    <div style={{
      width: 240,
      display: 'flex',
      flexDirection: 'column',
      background: '#000000',
      borderRight: '1px solid rgba(255,255,255,0.14)',
    }}>
      <div style={{
        padding: '16px 16px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)',
      }}>
        Object Map
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        <div
          onClick={selectSVG}
          onMouseEnter={() => { setHover({ polygonId: null, elementType: null, elementIndex: null }); setRowHovered(true); }}
          onMouseLeave={() => { setHover({ polygonId: null, elementType: null, elementIndex: null }); setRowHovered(false); }}
          style={{
            padding: '9px 16px',
            background: isSVGSelected ? 'rgba(134,239,172,0.20)' : rowHovered ? 'rgba(20,83,45,0.32)' : 'transparent',
            borderLeft: isSVGSelected ? '3px solid #86efac' : rowHovered ? '3px solid #14532d' : '3px solid transparent',
            cursor: 'pointer', fontSize: 13, color: '#ffffff',
            display: 'flex', alignItems: 'center', gap: 8,
            transition: 'all 0.12s', fontWeight: isSVGSelected ? 700 : 400,
          }}
        >
          <span style={{ opacity: 0.6 }}>◈</span>
          {editing ? (
            <input
              type="text" value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={saveEdit} onKeyDown={handleKeyDown} autoFocus
              onClick={(e) => e.stopPropagation()}
              style={{
                flex: 1, padding: '2px 6px', fontSize: 13,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.4)',
                borderRadius: 4, outline: 'none', color: '#fff',
              }}
            />
          ) : (
            <>
              <span style={{ flex: 1 }}>{svgObject.name}</span>
              <span
                onClick={startEdit}
                style={{ fontSize: 12, cursor: 'pointer', opacity: rowHovered ? 0.6 : 0, transition: 'opacity 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = rowHovered ? '0.6' : '0')}
              >✎</span>
              <span
                onClick={(e) => { e.stopPropagation(); clearSVG(); }}
                title="Clear all polygons"
                style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', opacity: rowHovered ? 1 : 0, transition: 'opacity 0.15s' }}
              ><TrashIcon /></span>
              <span style={{
                fontSize: 10, padding: '1px 7px', borderRadius: 10,
                background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)',
              }}>{svgObject.polygons.length}</span>
            </>
          )}
        </div>

        {svgObject.polygons.map((poly, idx) => (
          <PolygonItem key={poly.id} polygon={poly} index={idx} />
        ))}

        {svgObject.polygons.length === 0 && (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.22)', fontSize: 12 }}>
            No polygons yet
          </div>
        )}
      </div>
    </div>
  );
};

export default ObjectMap;
