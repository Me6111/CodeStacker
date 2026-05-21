export interface TemplatePoly {
  name: string;
  points: { x: number; y: number }[];
}

export interface Template {
  id: string;
  name: string;
  polygons: TemplatePoly[];
}

// All shapes defined in 0–200 coordinate space
export const TEMPLATES: Template[] = [
  {
    id: 'arrow-right',
    name: 'Arrow',
    polygons: [{
      name: 'Arrow',
      points: [
        { x: 30, y: 72 }, { x: 120, y: 72 }, { x: 120, y: 38 },
        { x: 185, y: 100 }, { x: 120, y: 162 }, { x: 120, y: 128 }, { x: 30, y: 128 },
      ],
    }],
  },
  {
    id: 'star-5',
    name: 'Star',
    polygons: [{
      name: 'Star',
      points: [
        { x: 100, y: 22 }, { x: 118, y: 76 }, { x: 172, y: 76 },
        { x: 129, y: 110 }, { x: 145, y: 163 }, { x: 100, y: 130 },
        { x: 55,  y: 163 }, { x: 71,  y: 110 }, { x: 28,  y: 76 }, { x: 82, y: 76 },
      ],
    }],
  },
  {
    id: 'cross',
    name: 'Cross',
    polygons: [{
      name: 'Cross',
      points: [
        { x: 72, y: 22 }, { x: 128, y: 22 }, { x: 128, y: 72 },
        { x: 178, y: 72 }, { x: 178, y: 128 }, { x: 128, y: 128 },
        { x: 128, y: 178 }, { x: 72, y: 178 }, { x: 72, y: 128 },
        { x: 22, y: 128 }, { x: 22, y: 72 }, { x: 72, y: 72 },
      ],
    }],
  },
  {
    id: 'house',
    name: 'House',
    polygons: [{
      name: 'House',
      points: [
        { x: 100, y: 18 }, { x: 178, y: 82 }, { x: 162, y: 82 },
        { x: 162, y: 178 }, { x: 38, y: 178 }, { x: 38, y: 82 }, { x: 22, y: 82 },
      ],
    }],
  },
  {
    id: 'shield',
    name: 'Shield',
    polygons: [{
      name: 'Shield',
      points: [
        { x: 100, y: 18 }, { x: 178, y: 52 }, { x: 178, y: 118 },
        { x: 100, y: 182 }, { x: 22, y: 118 }, { x: 22, y: 52 },
      ],
    }],
  },
  {
    id: 'hexagon',
    name: 'Hexagon',
    polygons: [{
      name: 'Hexagon',
      points: [
        { x: 176, y: 100 }, { x: 138, y: 166 }, { x: 62, y: 166 },
        { x: 24, y: 100 }, { x: 62, y: 34 }, { x: 138, y: 34 },
      ],
    }],
  },
  {
    id: 'lightning',
    name: 'Lightning',
    polygons: [{
      name: 'Lightning',
      points: [
        { x: 126, y: 18 }, { x: 68, y: 108 }, { x: 106, y: 108 },
        { x: 74, y: 182 }, { x: 142, y: 82 }, { x: 104, y: 82 },
      ],
    }],
  },
  {
    id: 'crown',
    name: 'Crown',
    polygons: [{
      name: 'Crown',
      points: [
        { x: 18, y: 168 }, { x: 18, y: 56 }, { x: 52, y: 100 },
        { x: 82, y: 36 }, { x: 100, y: 88 }, { x: 118, y: 36 },
        { x: 148, y: 100 }, { x: 182, y: 56 }, { x: 182, y: 168 },
      ],
    }],
  },
];
