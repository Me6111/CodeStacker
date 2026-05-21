import React from 'react';
import TrashIcon from '../Icons/TrashIcon';
import { SubSelectMode } from '../../context/ToolContext';

export interface LineRun {
  polygonId: string;
  polygonName: string;
  edgeCount: number;
  totalLength: number;
  edgeIndices: number[];
}

interface SelectionControlsProps {
  selectionId: string;
  position: { x: number; y: number };
  isConfirmed: boolean;
  subSelectMode: SubSelectMode;
  onDelete: (id: string) => void;
  onConfirm: (id: string) => void;
  onEdit: (id: string) => void;
  onToggleSubMode: (mode: SubSelectMode) => void;
  layout: 'horizontal' | 'vertical';
}

const PointIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="3.5" fill="currentColor" />
    <circle cx="3" cy="3" r="1.5" fill="currentColor" opacity="0.45" />
    <circle cx="13" cy="3" r="1.5" fill="currentColor" opacity="0.45" />
    <circle cx="3" cy="13" r="1.5" fill="currentColor" opacity="0.45" />
    <circle cx="13" cy="13" r="1.5" fill="currentColor" opacity="0.45" />
  </svg>
);

const LineIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <line x1="3" y1="13" x2="13" y2="3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="3" cy="13" r="2.2" fill="currentColor" />
    <circle cx="13" cy="3" r="2.2" fill="currentColor" />
  </svg>
);

export const SelectionControls: React.FC<SelectionControlsProps> = ({
  selectionId, position, isConfirmed, subSelectMode,
  onDelete, onConfirm, onEdit, onToggleSubMode, layout,
}) => {
  const size = 34;
  const gap = 4;
  // When confirmed: delete + edit + point + line = 4 buttons
  // When unconfirmed: delete + confirm = 2 buttons
  const count = isConfirmed ? 4 : 2;
  const total = size * count + gap * (count - 1);
  const width = layout === 'horizontal' ? total : size;
  const height = layout === 'horizontal' ? size : total;

  const base: React.CSSProperties = {
    width: size, height: size, padding: 0,
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 5, cursor: 'pointer', fontSize: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    fontWeight: 700, flexShrink: 0, transition: 'all 0.12s',
  };

  return (
    <foreignObject x={position.x} y={position.y} width={width} height={height} overflow="visible">
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        style={{ display: 'flex', flexDirection: layout === 'horizontal' ? 'row' : 'column', gap }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(selectionId); }}
          title="Delete selection"
          style={{ ...base, background: 'rgba(10,10,10,0.85)', color: '#ffffff' }}
        >
          <TrashIcon />
        </button>

        {!isConfirmed
          ? <button onClick={(e) => { e.stopPropagation(); onConfirm(selectionId); }} title="Confirm"
              style={{ ...base, background: 'rgba(10,10,10,0.85)', color: '#ffffff' }}>✓</button>
          : <button onClick={(e) => { e.stopPropagation(); onEdit(selectionId); }} title="Edit"
              style={{ ...base, background: '#ffffff', color: '#000000', borderColor: '#ffffff' }}>✎</button>
        }

        {isConfirmed && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleSubMode(subSelectMode === 'movePoint' ? 'none' : 'movePoint'); }}
              title="Move points"
              style={{
                ...base,
                background: subSelectMode === 'movePoint' ? '#ffffff' : 'rgba(10,10,10,0.85)',
                color: subSelectMode === 'movePoint' ? '#000000' : '#ffffff',
                borderColor: subSelectMode === 'movePoint' ? '#ffffff' : 'rgba(255,255,255,0.2)',
              }}
            >
              <PointIcon />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleSubMode(subSelectMode === 'moveLine' ? 'none' : 'moveLine'); }}
              title="Move lines"
              style={{
                ...base,
                background: subSelectMode === 'moveLine' ? '#ffffff' : 'rgba(10,10,10,0.85)',
                color: subSelectMode === 'moveLine' ? '#000000' : '#ffffff',
                borderColor: subSelectMode === 'moveLine' ? '#ffffff' : 'rgba(255,255,255,0.2)',
              }}
            >
              <LineIcon />
            </button>
          </>
        )}
      </div>
    </foreignObject>
  );
};
