import React from 'react';
import { useSVGContext } from '../../context/SVGContext';
import { useToolContext } from '../../context/ToolContext';
import { useSelectionContext } from '../../context/SelectionContext';

const btn = (active: boolean, disabled = false): React.CSSProperties => ({
  padding: '6px 12px',
  background: active ? '#ffffff' : disabled ? 'transparent' : 'rgba(255,255,255,0.07)',
  color: disabled ? 'rgba(255,255,255,0.2)' : active ? '#000000' : '#ffffff',
  border: `1px solid ${active ? '#ffffff' : disabled ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.14)'}`,
  borderRadius: 5,
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontSize: 13,
  fontWeight: active ? 700 : 500,
});

const SVGLevelToolbar: React.FC = () => {
  const { undoSVG, redoSVG, canUndoSVG, canRedoSVG } = useSVGContext();
  const { tool, setTool, selectMode, setSelectMode, selectPoints, setSelectPoints, selectLines, setSelectLines } = useToolContext();
  const { setSelection } = useSelectionContext();

  return (
    <>
      <button onClick={undoSVG} disabled={!canUndoSVG} style={btn(false, !canUndoSVG)}>↩ Undo</button>
      <button onClick={redoSVG} disabled={!canRedoSVG} style={btn(false, !canRedoSVG)}>↪ Redo</button>
      <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.12)', margin: '0 4px' }} />
      <button
        onClick={() => { setTool('draw'); setSelection({ level: null, polygonId: null, elementType: null, elementIndex: null }); }}
        style={btn(tool === 'draw')}
      >Draw</button>
      <button onClick={() => setTool('select')} style={btn(tool === 'select')}>Select</button>
      {tool === 'select' && (
        <>
          <select
            value={selectMode}
            onChange={(e) => setSelectMode(e.target.value as any)}
            style={{
              padding: '6px 10px',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 5, fontSize: 13,
              background: 'rgba(255,255,255,0.07)', color: '#ffffff',
            }}
          >
            <option value="polygon">Polygon</option>
            <option value="rectangle">Rectangle</option>
            <option value="freeform">Free-form</option>
            <option value="all">All</option>
          </select>
          {(selectMode === 'rectangle' || selectMode === 'freeform') && (
            <span style={{ display: 'flex', gap: 12, marginLeft: 8, fontSize: 13, color: '#ffffff' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <input type="checkbox" checked={selectPoints} onChange={(e) => setSelectPoints(e.target.checked)} /> Points
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <input type="checkbox" checked={selectLines} onChange={(e) => setSelectLines(e.target.checked)} /> Lines
              </label>
            </span>
          )}
        </>
      )}
    </>
  );
};

export default SVGLevelToolbar;
