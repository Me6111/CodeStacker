import React from 'react';

interface Icon_XProps {
  size?: number;
  line1Thickness?: number;
  line2Thickness?: number;
  color?: string;
  line1Color?: string;
  line2Color?: string;
  rotation?: number;
  line1Rotation?: number;
  line2Rotation?: number;
  opacity?: number;
  strokeLinecap?: 'butt' | 'round' | 'square';
  className?: string;
  style?: React.CSSProperties;
}

const Icon_X: React.FC<Icon_XProps> = ({
  size = 24,
  line1Thickness = 2,
  line2Thickness = 2,
  color = '#ffffff',
  line1Color,
  line2Color,
  rotation = 0,
  line1Rotation = 0,
  line2Rotation = 0,
  opacity = 1,
  strokeLinecap = 'round',
  className = '',
  style,
}) => {
  const actualLine1Color = line1Color || color;
  const actualLine2Color = line2Color || color;

  return (
    <svg
      className={`Icon_X ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        transform: `rotate(${rotation}deg)`,
        opacity,
        ...style,
      }}
    >
      <line
        className="Icon_X_line-1"
        x1="4"
        y1="4"
        x2="20"
        y2="20"
        stroke={actualLine1Color}
        strokeWidth={line1Thickness}
        strokeLinecap={strokeLinecap}
        style={{
          transformOrigin: 'center',
          transform: `rotate(${line1Rotation}deg)`,
        }}
      />
      <line
        className="Icon_X_line-2"
        x1="20"
        y1="4"
        x2="4"
        y2="20"
        stroke={actualLine2Color}
        strokeWidth={line2Thickness}
        strokeLinecap={strokeLinecap}
        style={{
          transformOrigin: 'center',
          transform: `rotate(${line2Rotation}deg)`,
        }}
      />
    </svg>
  );
};

export const icon_xDefaultProps = {
  size: 24,
  line1Thickness: 2,
  line2Thickness: 2,
  color: '#ffffff',
  rotation: 0,
  line1Rotation: 0,
  line2Rotation: 0,
  opacity: 1,
  strokeLinecap: 'round' as const,
};

export const icon_xPropKeys = [
  'size',
  'line1Thickness',
  'line2Thickness',
  'color',
  'line1Color',
  'line2Color',
  'rotation',
  'line1Rotation',
  'line2Rotation',
  'opacity',
  'strokeLinecap',
];

export const icon_xPropOptions = {
  strokeLinecap: ['butt', 'round', 'square'],
};

export const icon_xNumberProps = [
  'size',
  'line1Thickness',
  'line2Thickness',
  'rotation',
  'line1Rotation',
  'line2Rotation',
  'opacity',
];

export const icon_xCodeProps: string[] = [];

export default Icon_X;