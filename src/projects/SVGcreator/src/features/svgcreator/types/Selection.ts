export type SelectionLevel = 'svg' | 'polygon' | 'line' | 'point' | null;

export interface SelectionState {
  level: SelectionLevel;
  polygonId: string | null;
  elementType: 'line' | 'point' | null;
  elementIndex: number | null;
}

export interface HoverState {
  polygonId: string | null;
  elementType: 'line' | 'point' | null;
  elementIndex: number | null;
}