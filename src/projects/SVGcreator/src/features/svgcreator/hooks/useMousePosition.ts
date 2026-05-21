import { useRef } from 'react';
import { Point } from '../types';

export const useMousePosition = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  const getMousePosition = (e: React.MouseEvent): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  return { svgRef, getMousePosition };
};