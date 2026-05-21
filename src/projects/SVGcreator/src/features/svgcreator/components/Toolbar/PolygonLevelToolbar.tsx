import React from 'react';
import { usePolygonHistory } from '../../hooks';
import { useToolContext } from '../../context/ToolContext';

const PolygonLevelToolbar: React.FC = () => {
  const { undoPolygon, redoPolygon, canUndoPolygon, canRedoPolygon } = usePolygonHistory();
  const { tool, setTool, selectMode, setSelectMode, selectPoints, setSelectPoints, selectLines, setSelectLines } = useToolContext();

  return (
    <>
      <button
        onClick={undoPolygon}
        disabled={!canUndoPolygon}
        style={{
          padding: '6px 12px',
          background: !canUndoPolygon ? '#e0e0e0' : '#0078d4',
          color: !canUndoPolygon ? '#999' : 'white',
          border: 'none',
          borderRadius: 3,
          cursor: !canUndoPolygon ? 'not-allowed' : 'pointer',
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        ← Undo
      </button>
      <button
        onClick={redoPolygon}
        disabled={!canRedoPolygon}
        style={{
          padding: '6px 12px',
          background: !canRedoPolygon ? '#e0e0e0' : '#0078d4',
          color: !canRedoPolygon ? '#999' : 'white',
          border: 'none',
          borderRadius: 3,
          cursor: !canRedoPolygon ? 'not-allowed' : 'pointer',
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        Redo →
      </button>
      <div style={{ width: 1, height: 24, background: '#ddd', margin: '0 4px' }}></div>
      <button
        onClick={() => {
          setTool('select');
          setSelectMode('point');
        }}
        style={{
          padding: '6px 16px',
          background: '#f0f0f0',
          color: '#333',
          border: '1px solid #d0d0d0',
          borderRadius: 3,
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        Select
      </button>
      {tool === 'select' && (
        <>
          <select
            value={selectMode}
            onChange={(e) => setSelectMode(e.target.value as any)}
            style={{ padding: '6px 10px', border: '1px solid #d0d0d0', borderRadius: 3, fontSize: 13, background: 'white' }}
          >
            <option value="point">Point</option>
            <option value="line">Line</option>
            <option value="rectangle">Rectangle</option>
            <option value="freeform">Free-form</option>
            <option value="all">All</option>
          </select>
          {(selectMode === 'rectangle' || selectMode === 'freeform') && (
            <span style={{ display: 'flex', gap: 12, marginLeft: 8, fontSize: 13 }}>
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
      <button
        onClick={() => setTool('move')}
        style={{
          padding: '6px 16px',
          background: tool === 'move' ? '#107c10' : '#f0f0f0',
          color: tool === 'move' ? 'white' : '#333',
          border: '1px solid #d0d0d0',
          borderRadius: 3,
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        Move
      </button>
      <button
        onClick={() => setTool('rotate')}
        style={{
          padding: '6px 16px',
          background: tool === 'rotate' ? '#107c10' : '#f0f0f0',
          color: tool === 'rotate' ? 'white' : '#333',
          border: '1px solid #d0d0d0',
          borderRadius: 3,
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        Rotate
      </button>
    </>
  );
};

export default PolygonLevelToolbar;