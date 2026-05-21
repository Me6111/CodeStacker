import React from 'react';

interface MoveIndicatorProps {
  x: number;
  y: number;
  type: 'point' | 'line';
  angle?: number;
}

export const MoveIndicator: React.FC<MoveIndicatorProps> = ({ x, y, type, angle = 0 }) => {
  if (type === 'point') {
    return (
      <g transform={`translate(${x}, ${y})`}>
        <line x1="-8" y1="0" x2="8" y2="0" stroke="#0078d4" strokeWidth="1.5" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
        <line x1="0" y1="-8" x2="0" y2="8" stroke="#0078d4" strokeWidth="1.5" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
      </g>
    );
  } else {
    return (
      <g transform={`translate(${x}, ${y}) rotate(${angle})`}>
        <line x1="-8" y1="0" x2="8" y2="0" stroke="#0078d4" strokeWidth="1.5" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
      </g>
    );
  }
};

export const ArrowMarkerDefs: React.FC = () => (
  <defs>
    <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L6,3 z" fill="#0078d4" />
    </marker>
  </defs>
);