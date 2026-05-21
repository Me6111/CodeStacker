import React, { useState, useRef, useEffect } from 'react';
import { useToolContext } from '../../context/ToolContext';
import { useSelectionContext } from '../../context/SelectionContext';
import { useSVGContext } from '../../context/SVGContext';
import { useCalqueContext } from '../../context/CalqueContext';
import { usePolygonHistory } from '../../hooks';
import { DrawMode, SelectMode } from '../../types';
import { CalquePanel } from './CalquePanel';
import { TemplatesPanel } from './TemplatesPanel';

const DrawIcon: React.FC = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <path d="M11 2L14 5L5 14L1 15L2 11L11 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round"/>
    <line x1="9" y1="4" x2="12" y2="7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

const SelectIcon: React.FC = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1.4" strokeDasharray="3 2"/>
  </svg>
);

const CalqueIcon: React.FC = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="1.5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.3" opacity="0.38"/>
    <rect x="3.5" y="4" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.3" opacity="0.65"/>
    <rect x="6" y="6.5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.3"/>
  </svg>
);

const TemplatesIcon: React.FC = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
    <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
    <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
    <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
  </svg>
);

const Toolbar: React.FC = () => {
  const {
    tool, setTool, selectMode, setSelectMode, drawMode, setDrawMode,
    setPendingSelectAll, toolArmed, setToolArmed,
  } = useToolContext();
  const { selection } = useSelectionContext();
  const { undoSVG, redoSVG, canUndoSVG, canRedoSVG } = useSVGContext();
  const { undoPolygon, redoPolygon, canUndoPolygon, canRedoPolygon } = usePolygonHistory();
  const [showSelectDropdown, setShowSelectDropdown] = useState(false);
  const [showDrawDropdown, setShowDrawDropdown] = useState(false);
  const [showCalquePanel, setShowCalquePanel] = useState(false);
  const [showTemplatesPanel, setShowTemplatesPanel] = useState(false);
  const templatesPanelRef = useRef<HTMLDivElement>(null);
  const { imageUrl, gridVisible, snapEnabled } = useCalqueContext();

  useEffect(() => {
    if (!showTemplatesPanel) return;
    const handler = (e: MouseEvent) => {
      if (templatesPanelRef.current && !templatesPanelRef.current.contains(e.target as Node))
        setShowTemplatesPanel(false);
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [showTemplatesPanel]);
  const calqueActive = !!(imageUrl || gridVisible || snapEnabled);

  const atPolygonLevel = selection.level === 'polygon' || selection.level === 'line' || selection.level === 'point';
  const undo = atPolygonLevel ? undoPolygon : undoSVG;
  const redo = atPolygonLevel ? redoPolygon : redoSVG;
  const canUndo = atPolygonLevel ? canUndoPolygon : canUndoSVG;
  const canRedo = atPolygonLevel ? canRedoPolygon : canRedoSVG;

  const activateDraw = (mode: DrawMode) => {
    setDrawMode(mode);
    setTool('draw');
    setToolArmed(true);
    setShowDrawDropdown(false);
  };

  const activateSelect = (mode: SelectMode) => {
    setSelectMode(mode);
    setTool('select');
    if (mode === 'all') {
      setPendingSelectAll(atPolygonLevel ? (selection.polygonId ?? 'svg') : 'svg');
      setToolArmed(false);
    } else {
      setToolArmed(true);
    }
    setShowSelectDropdown(false);
  };

  const btn = (active: boolean, disabled = false): React.CSSProperties => ({
    padding: '7px 12px',
    background: active ? '#ffffff' : disabled ? 'transparent' : 'rgba(255,255,255,0.07)',
    color: disabled ? 'rgba(255,255,255,0.2)' : active ? '#000000' : '#ffffff',
    border: `1px solid ${active ? '#ffffff' : disabled ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.14)'}`,
    borderRadius: 5,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 13,
    fontWeight: active ? 700 : 500,
    letterSpacing: '0.01em',
    transition: 'all 0.12s',
    whiteSpace: 'nowrap' as const,
  });

  const iconBtn = (active: boolean): React.CSSProperties => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '5px 10px 4px',
    minWidth: 44,
    background: active ? '#ffffff' : 'rgba(255,255,255,0.07)',
    color: active ? '#000000' : '#ffffff',
    border: `1px solid ${active ? '#ffffff' : 'rgba(255,255,255,0.14)'}`,
    borderRadius: 5,
    cursor: 'pointer',
    gap: 3,
    transition: 'all 0.12s',
    whiteSpace: 'nowrap' as const,
  });

  const iconLabel = (active: boolean): React.CSSProperties => ({
    fontSize: 8,
    fontWeight: 400,
    letterSpacing: '0.07em',
    textTransform: 'uppercase' as const,
    opacity: active ? 0.9 : 0.45,
    lineHeight: 1,
  });

  const dropdownShell: React.CSSProperties = {
    position: 'absolute', top: '100%', left: 0, paddingTop: 4, zIndex: 1000, minWidth: 170,
  };
  const dropdownStyle: React.CSSProperties = {
    background: 'rgba(8,8,8,0.95)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: 7,
    boxShadow: '0 16px 48px rgba(0,0,0,0.85)',
    overflow: 'hidden',
  };

  const drawOptions: { mode: DrawMode; label: string }[] = [
    { mode: 'polygon', label: 'Polygon' }, { mode: 'square', label: 'Square' },
    { mode: 'circle', label: 'Circle' }, { mode: 'freeform', label: 'Free-form' },
  ];
  const selectOptions: { mode: SelectMode; label: string }[] = [
    { mode: 'polygon', label: 'Polygon' }, { mode: 'rectangle', label: 'Square' },
    { mode: 'circle', label: 'Circle' }, { mode: 'freeform', label: 'Free-form' },
    { mode: 'all', label: 'Select All' },
  ];

  const renderOptions = (
    options: { mode: DrawMode | SelectMode; label: string }[],
    onSelect: (mode: any) => void,
    activeMode: string
  ) => options.map(({ mode, label }, i) => (
    <div key={mode} style={{ borderBottom: i < options.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
      <div
        style={{
          padding: '10px 16px', cursor: 'pointer', fontSize: 13,
          color: mode === activeMode ? '#ffffff' : 'rgba(255,255,255,0.65)',
          background: mode === activeMode ? 'rgba(255,255,255,0.1)' : 'transparent',
          fontWeight: mode === activeMode ? 700 : 400,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          transition: 'background 0.1s',
        }}
        onClick={() => onSelect(mode)}
        onMouseEnter={(e) => { if (mode !== activeMode) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.06)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = mode === activeMode ? 'rgba(255,255,255,0.1)' : 'transparent'; }}
      >
        {label}
        {mode === activeMode && <span style={{ fontSize: 11, color: '#ffffff' }}>✓</span>}
      </div>
    </div>
  ));

  const divider = <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.12)', margin: '0 4px', flexShrink: 0 }} />;
  const drawActive = tool === 'draw' && toolArmed;
  const selectActive = tool === 'select' && toolArmed;

  return (
    <div style={{
      padding: '8px 16px',
      background: 'rgba(255,255,255,0.05)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      display: 'flex', alignItems: 'center', gap: 6,
      position: 'relative', zIndex: 1000,
    }}>
      <button onClick={undo} disabled={!canUndo} style={btn(false, !canUndo)} title="Undo">↩</button>
      <button onClick={redo} disabled={!canRedo} style={btn(false, !canRedo)} title="Redo">↪</button>

      {divider}

      {/* Draw */}
      <div style={{ position: 'relative' }}
        onMouseEnter={() => setShowDrawDropdown(true)}
        onMouseLeave={() => setShowDrawDropdown(false)}
      >
        <button onClick={() => activateDraw(drawMode)} style={iconBtn(drawActive)}>
          <DrawIcon />
          <span style={iconLabel(drawActive)}>
            Draw <span style={{ fontSize: 7, opacity: 0.6 }}>▾</span>
          </span>
        </button>
        {showDrawDropdown && (
          <div style={dropdownShell}><div style={dropdownStyle}>{renderOptions(drawOptions, activateDraw, drawMode)}</div></div>
        )}
      </div>

      {/* Select */}
      <div style={{ position: 'relative' }}
        onMouseEnter={() => setShowSelectDropdown(true)}
        onMouseLeave={() => setShowSelectDropdown(false)}
      >
        <button onClick={() => activateSelect(selectMode)} style={iconBtn(selectActive)}>
          <SelectIcon />
          <span style={iconLabel(selectActive)}>
            Select <span style={{ fontSize: 7, opacity: 0.6 }}>▾</span>
          </span>
        </button>
        {showSelectDropdown && (
          <div style={dropdownShell}><div style={dropdownStyle}>{renderOptions(selectOptions, activateSelect, selectMode)}</div></div>
        )}
      </div>

      {divider}

      {/* Calque */}
      <div style={{ position: 'relative' }}
        onMouseEnter={() => setShowCalquePanel(true)}
        onMouseLeave={() => setShowCalquePanel(false)}
      >
        <button style={iconBtn(calqueActive)}>
          <CalqueIcon />
          <span style={iconLabel(calqueActive)}>
            Calque <span style={{ fontSize: 7, opacity: 0.6 }}>▾</span>
          </span>
        </button>
        {showCalquePanel && (
          <div style={{ ...dropdownShell, minWidth: 240 }}>
            <div style={dropdownStyle}>
              <CalquePanel />
            </div>
          </div>
        )}
      </div>

      {divider}

      {/* Templates */}
      <div ref={templatesPanelRef} style={{ position: 'relative' }}>
        <button style={iconBtn(showTemplatesPanel)}
          onClick={() => setShowTemplatesPanel(v => !v)}>
          <TemplatesIcon />
          <span style={iconLabel(showTemplatesPanel)}>
            Templates <span style={{ fontSize: 7, opacity: 0.6 }}>▾</span>
          </span>
        </button>
        {showTemplatesPanel && (
          <div style={{ ...dropdownShell, minWidth: 260 }}>
            <div style={dropdownStyle}>
              <TemplatesPanel onClose={() => setShowTemplatesPanel(false)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Toolbar;
