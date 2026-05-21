import React, { useState } from 'react';
import { Point } from '../../types';

interface SelectionShapeRendererProps {
  selectionId: string;
  type: 'rectangle' | 'polygon' | 'freeform';
  actualShape: Point[];
  isDrawing?: boolean;
  isEditable?: boolean;
  isInteractive?: boolean;
  isActive?: boolean;
  onCornerDragStart?: (selectionId: string, cornerIndex: number) => void;
  onLineDragStart?: (selectionId: string, lineIndex: number) => void;
  onContainerCornerDragStart?: (selectionId: string, corner: string) => void;
  onContainerEdgeDragStart?: (selectionId: string, edge: string) => void;
  onRotateHandleDragStart?: (selectionId: string) => void;
  onMoveDragStart?: (selectionId: string) => void;
}

const accent_ACTIVE   = '#60a5fa';
const accent_INACTIVE = 'rgba(96,165,250,0.55)';
const accent_DARK     = '#3b82f6';
const HANDLE_FILL     = '#ffffff';

const CORNER_R       = 4;
const CORNER_R_HOVER = 6;
const CONT_R         = 4.5;
const CONT_R_HOVER   = 6;

export const SelectionShapeRenderer: React.FC<SelectionShapeRendererProps> = ({
  selectionId, type, actualShape, isDrawing = false, isEditable = true, isInteractive = true, isActive = true,
  onCornerDragStart, onLineDragStart, onContainerCornerDragStart,
  onContainerEdgeDragStart, onRotateHandleDragStart, onMoveDragStart,
}) => {
  const [hoveredCorner, setHoveredCorner] = useState<number | null>(null);
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);
  const [hoveredContainerCorner, setHoveredContainerCorner] = useState<string | null>(null);
  const [hoveredContainerEdge, setHoveredContainerEdge] = useState<string | null>(null);
  const [hoveredInterior, setHoveredInterior] = useState(false);
  const [hoveredRotate, setHoveredRotate] = useState(false);

  if (actualShape.length === 0) return null;

  const accent      = isActive ? accent_ACTIVE : accent_INACTIVE;
  const handleStroke = isActive ? accent_ACTIVE : accent_INACTIVE;

  const xs = actualShape.map((p) => p.x);
  const ys = actualShape.map((p) => p.y);
  const rect = { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
  const midX = (rect.minX + rect.maxX) / 2;
  const midY = (rect.minY + rect.maxY) / 2;

  const containerCorners = [
    { key: 'topLeft',     x: rect.minX, y: rect.minY, cursor: 'nwse-resize' },
    { key: 'topRight',    x: rect.maxX, y: rect.minY, cursor: 'nesw-resize' },
    { key: 'bottomLeft',  x: rect.minX, y: rect.maxY, cursor: 'nesw-resize' },
    { key: 'bottomRight', x: rect.maxX, y: rect.maxY, cursor: 'nwse-resize' },
  ];
  const containerEdges = [
    { key: 'top',    x1: rect.minX, y1: rect.minY, x2: rect.maxX, y2: rect.minY, cursor: 'ns-resize' },
    { key: 'bottom', x1: rect.minX, y1: rect.maxY, x2: rect.maxX, y2: rect.maxY, cursor: 'ns-resize' },
    { key: 'left',   x1: rect.minX, y1: rect.minY, x2: rect.minX, y2: rect.maxY, cursor: 'ew-resize' },
    { key: 'right',  x1: rect.maxX, y1: rect.minY, x2: rect.maxX, y2: rect.maxY, cursor: 'ew-resize' },
  ];

  const noPtr = { pointerEvents: 'none' as const };
  // Handles/container blocked only when draw-mode or non-active-tab
  const blocked = isDrawing || !isInteractive;
  // Actual shape vertex/line handles disabled for confirmed shapes; container+move+rotate stay live
  const shapeHandlesBlocked = blocked || !isEditable;

  const renderActualShape = () => {
    const props = { fill: 'none', stroke: accent, strokeWidth: 1.5, strokeDasharray: '6,4', style: noPtr };
    if (type === 'rectangle' && actualShape.length >= 4)
      return <rect x={rect.minX} y={rect.minY} width={rect.maxX - rect.minX} height={rect.maxY - rect.minY} {...props} />;
    if ((type === 'polygon' || type === 'freeform') && actualShape.length >= 2)
      return <polygon points={actualShape.map((p) => `${p.x},${p.y}`).join(' ')} {...props} />;
    return null;
  };

  const renderInteriorHitArea = () => {
    if (blocked) return null;
    const shared = {
      fill: 'transparent', style: { cursor: 'move', pointerEvents: 'fill' as const },
      onMouseEnter: () => setHoveredInterior(true),
      onMouseLeave: () => setHoveredInterior(false),
      onMouseDown: (e: React.MouseEvent) => { e.stopPropagation(); onMoveDragStart?.(selectionId); },
    };
    if (type === 'rectangle' && actualShape.length >= 4)
      return <rect x={rect.minX} y={rect.minY} width={rect.maxX - rect.minX} height={rect.maxY - rect.minY} {...shared} />;
    if ((type === 'polygon' || type === 'freeform') && actualShape.length >= 3)
      return <polygon points={actualShape.map((p) => `${p.x},${p.y}`).join(' ')} {...shared} />;
    return null;
  };

  const renderActualShapeLines = () => {
    if (shapeHandlesBlocked || type === 'rectangle') return null;
    const N = actualShape.length;
    return actualShape.map((point, idx) => {
      const nextIdx = (idx + 1) % N;
      const isCornerAdj = hoveredCorner !== null && (idx === hoveredCorner || idx === (hoveredCorner - 1 + N) % N);
      const isHov = hoveredLine === idx || isCornerAdj || hoveredInterior;
      return (
        <g key={`line-${idx}`}>
          {isHov && <line x1={point.x} y1={point.y} x2={actualShape[nextIdx].x} y2={actualShape[nextIdx].y}
            stroke={accent} strokeWidth="4" opacity="0.5" style={noPtr} />}
          <line x1={point.x} y1={point.y} x2={actualShape[nextIdx].x} y2={actualShape[nextIdx].y}
            stroke="transparent" strokeWidth="12"
            onMouseEnter={() => setHoveredLine(idx)} onMouseLeave={() => setHoveredLine(null)}
            onMouseDown={(e) => { e.stopPropagation(); onLineDragStart?.(selectionId, idx); }}
            style={{ cursor: 'move', pointerEvents: 'stroke' }} />
        </g>
      );
    });
  };

  const renderActualShapeCorners = () => {
    if (shapeHandlesBlocked) return null;
    return actualShape.map((point, idx) => {
      const isHov = hoveredCorner === idx;
      return (
        <g key={`corner-${idx}`}>
          <circle cx={point.x} cy={point.y} r="10" fill="transparent"
            onMouseEnter={() => setHoveredCorner(idx)} onMouseLeave={() => setHoveredCorner(null)}
            onMouseDown={(e) => { e.stopPropagation(); onCornerDragStart?.(selectionId, idx); }}
            style={{ cursor: 'crosshair', pointerEvents: 'all' }} />
          <circle cx={point.x} cy={point.y} r={isHov ? CORNER_R_HOVER : CORNER_R}
            fill={isHov ? accent_DARK : HANDLE_FILL} stroke={handleStroke} strokeWidth="1.5" style={noPtr} />
        </g>
      );
    });
  };

  const renderContainer = () => {
    if (blocked) return null;
    return <rect x={rect.minX} y={rect.minY} width={rect.maxX - rect.minX} height={rect.maxY - rect.minY}
      fill="none" stroke={isActive ? 'rgba(96,165,250,0.4)' : 'rgba(96,165,250,0.12)'} strokeWidth="1" style={noPtr} />;
  };

  const renderContainerCorners = () => {
    if (blocked) return null;
    return containerCorners.map((corner) => {
      const isHov = hoveredContainerCorner === corner.key;
      return (
        <g key={corner.key}>
          <circle cx={corner.x} cy={corner.y} r="10" fill="transparent"
            onMouseEnter={() => setHoveredContainerCorner(corner.key)}
            onMouseLeave={() => setHoveredContainerCorner(null)}
            onMouseDown={(e) => { e.stopPropagation(); onContainerCornerDragStart?.(selectionId, corner.key); }}
            style={{ cursor: corner.cursor, pointerEvents: 'all' }} />
          <circle cx={corner.x} cy={corner.y} r={isHov ? CONT_R_HOVER : CONT_R}
            fill={isHov ? accent_DARK : HANDLE_FILL} stroke={handleStroke} strokeWidth="1.5" style={noPtr} />
        </g>
      );
    });
  };

  const cornerToEdges: Record<string, string[]> = {
    topLeft: ['top', 'left'], topRight: ['top', 'right'],
    bottomLeft: ['bottom', 'left'], bottomRight: ['bottom', 'right'],
  };

  const renderContainerEdges = () => {
    if (blocked) return null;
    return containerEdges.map((edge) => {
      const isCornerAdj = type === 'rectangle' && hoveredContainerCorner !== null &&
        cornerToEdges[hoveredContainerCorner]?.includes(edge.key);
      const isHov = hoveredContainerEdge === edge.key || isCornerAdj || (type === 'rectangle' && hoveredInterior);
      return (
        <g key={edge.key}>
          {isHov && <line x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2}
            stroke={accent} strokeWidth="3" opacity="0.6" style={noPtr} />}
          <line x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2}
            stroke="transparent" strokeWidth="12"
            onMouseEnter={() => setHoveredContainerEdge(edge.key)}
            onMouseLeave={() => setHoveredContainerEdge(null)}
            onMouseDown={(e) => { e.stopPropagation(); onContainerEdgeDragStart?.(selectionId, edge.key); }}
            style={{ cursor: edge.cursor, pointerEvents: 'stroke' }} />
        </g>
      );
    });
  };

  const renderRotateHandle = () => {
    if (blocked) return null;
    const r = hoveredRotate ? 10 : 8.5;
    return (
      <g>
        <circle cx={midX} cy={midY} r="14" fill="transparent"
          onMouseEnter={() => setHoveredRotate(true)} onMouseLeave={() => setHoveredRotate(false)}
          onMouseDown={(e) => { e.stopPropagation(); onRotateHandleDragStart?.(selectionId); }}
          style={{ cursor: 'grab', pointerEvents: 'all' }} />
        <circle cx={midX} cy={midY} r={r}
          fill={hoveredRotate ? accent_DARK : HANDLE_FILL} stroke={handleStroke} strokeWidth="1.5" style={noPtr} />
        <text x={midX} y={midY} textAnchor="middle" dominantBaseline="central"
          style={{ pointerEvents: 'none', fontSize: '10px', userSelect: 'none', fill: hoveredRotate ? '#ffffff' : accent, fontWeight: 'bold' }}>
          ↻
        </text>
      </g>
    );
  };

  return (
    <g>
      {renderContainer()}
      {renderActualShape()}
      {renderInteriorHitArea()}
      {renderActualShapeLines()}
      {renderContainerEdges()}
      {renderActualShapeCorners()}
      {renderContainerCorners()}
      {renderRotateHandle()}
    </g>
  );
};
