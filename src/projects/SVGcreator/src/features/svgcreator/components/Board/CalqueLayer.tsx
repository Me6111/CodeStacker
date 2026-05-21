import React, { useRef } from 'react';
import { useCalqueContext, ImageTransform } from '../../context/CalqueContext';

interface CalqueLayerProps {
  width: number;
  height: number;
  onImageDragStart?: (e: React.MouseEvent, type: 'move' | 'tl' | 'tr' | 'bl' | 'br') => void;
  showHandles?: boolean;
}

export const CalqueLayer: React.FC<CalqueLayerProps> = ({ width, height, onImageDragStart, showHandles }) => {
  const { imageUrl, imageTransform, imageVisible, imageOpacity, gridSize, gridVisible, snapEnabled } = useCalqueContext();

  const gridLines: React.ReactNode[] = [];
  if (gridVisible && gridSize >= 2) {
    for (let x = 0; x <= width; x += gridSize) {
      gridLines.push(<line key={`v${x}`} x1={x} y1={0} x2={x} y2={height} stroke="rgba(255,255,255,0.18)" strokeWidth={0.6} />);
    }
    for (let y = 0; y <= height; y += gridSize) {
      gridLines.push(<line key={`h${y}`} x1={0} y1={y} x2={width} y2={y} stroke="rgba(255,255,255,0.18)" strokeWidth={0.6} />);
    }
    if (snapEnabled) {
      for (let x = 0; x <= width; x += gridSize) {
        for (let y = 0; y <= height; y += gridSize) {
          gridLines.push(<circle key={`p${x}-${y}`} cx={x} cy={y} r={1.8} fill="rgba(96,165,250,0.45)" />);
        }
      }
    }
  }

  const { x, y, width: iw, height: ih } = imageTransform;
  const HANDLE = 8;

  return (
    <g style={{ pointerEvents: 'none' }}>
      {imageUrl && imageVisible && (
        <image href={imageUrl} x={x} y={y} width={iw} height={ih}
          opacity={imageOpacity / 100} preserveAspectRatio="none" />
      )}

      {imageUrl && imageVisible && showHandles && (
        <g style={{ pointerEvents: 'auto' }}>
          {/* Move overlay */}
          <rect x={x} y={y} width={iw} height={ih}
            fill="transparent" stroke="rgba(96,165,250,0.4)" strokeWidth={1}
            strokeDasharray="4 3" cursor="move"
            onMouseDown={e => { e.stopPropagation(); onImageDragStart?.(e, 'move'); }}
          />
          {/* Corner handles */}
          {([['tl', x, y], ['tr', x + iw, y], ['bl', x, y + ih], ['br', x + iw, y + ih]] as const).map(([id, cx, cy]) => (
            <rect key={id}
              x={cx - HANDLE / 2} y={cy - HANDLE / 2} width={HANDLE} height={HANDLE}
              fill="#60a5fa" stroke="#000" strokeWidth={1} rx={1}
              cursor={id === 'tl' || id === 'br' ? 'nwse-resize' : 'nesw-resize'}
              onMouseDown={e => { e.stopPropagation(); onImageDragStart?.(e, id as any); }}
            />
          ))}
        </g>
      )}

      <g style={{ pointerEvents: 'none' }}>{gridLines}</g>
    </g>
  );
};
