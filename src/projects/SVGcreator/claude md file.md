# SVGcreator Component Specification

## Overview
React component for drawing simple polygon shapes like MS Paint polygon tool. 1px stroke lines, no fill, click to add points, click first point to close.

## Complete Feature List

### Drawing Mode
- Click anywhere on canvas to add point to current polygon
- First click starts new polygon
- Subsequent clicks add points to current polygon
- Click within 10px of first point (when ≥3 points exist) closes polygon
- Current polygon shown in blue (#2196F3)
- Closed polygons shown in black
- Green circle (r=8) on first point when drawing (indicates close target)
- Cancel button appears when drawing (orange #ff9800)

### Move Points Mode
- Red circles (r=5, white stroke) on all points of all polygons
- Click and drag any point to move it
- Selected polygon shown in green (#4CAF50)
- Points can be dragged with 10px hit detection

### History
- Undo/Redo buttons (← →) in top right
- Arrow buttons: 24px font, bold
- Disabled state: #ccc background, not-allowed cursor
- Active state: #2196F3 background
- History saves on: close polygon, finish drag, clear all, tool switch

## Exact Layout Structure

```
Container (padding: 20, background: #f5f5f5, min-height: 100vh)
├── Header Row (flex, space-between, marginBottom: 20)
│   ├── H1: "SVG Creator" (fontSize: 32, margin: 0)
│   └── Undo/Redo buttons (flex, gap: 10)
│       ├── Undo: ← (12px 18px padding)
│       └── Redo: → (12px 18px padding)
├── Toolbar (background: #fff, padding: 15, marginBottom: 15, borderRadius: 8, shadow)
│   ├── Draw Polygon button
│   ├── Move Points button
│   ├── Cancel button (only when currentPolygon exists)
│   └── Clear All button (red #f44336)
├── Main Content Row (flex, gap: 20)
│   ├── SVG Canvas (flex: 0 0 auto)
│   │   └── SVG (800x600, border: 2px solid #333, white background, borderRadius: 4)
│   └── Code Preview Panel (flex: 1, minWidth: 0)
│       ├── H3: "Code Preview" (marginTop: 0, marginBottom: 10)
│       └── Pre (background: #1e1e1e, color: #d4d4d4, padding: 20, maxHeight: 600)
└── Status Text (marginTop: 15, fontSize: 14, color: #666, background: #fff, padding: 15)
```

## Button Styles

All buttons:
- padding: '10px 20px'
- margin: 5
- border: 'none'
- borderRadius: 4
- cursor: 'pointer'

Active tool button:
- background: '#4CAF50'
- color: 'white'
- fontWeight: 'bold'

Inactive tool button:
- background: '#ddd'
- color: 'black'
- fontWeight: 'normal'

## TypeScript Interfaces

```typescript
interface Point { x: number; y: number; }

interface Polygon {
  id: string;
  points: Point[];
  closed: boolean;
}

interface HistoryState {
  polygons: Polygon[];
  currentPolygon: Polygon | null;
  selectedId: string | null;
}
```

## State Variables

```typescript
const [tool, setTool] = useState<'draw' | 'move'>('draw');
const [polygons, setPolygons] = useState<Polygon[]>([]);
const [currentPolygon, setCurrentPolygon] = useState<Polygon | null>(null);
const [selectedId, setSelectedId] = useState<string | null>(null);
const [dragging, setDragging] = useState<{ polygonId: string; pointIndex: number } | null>(null);
const [history, setHistory] = useState<HistoryState[]>([{ polygons: [], currentPolygon: null, selectedId: null }]);
const [historyIndex, setHistoryIndex] = useState(0);
const svg = useRef<SVGSVGElement>(null);
```

## Helper Functions

### id()
Returns: `${Date.now()}_${Math.random()}`

### pos(e: React.MouseEvent)
- Get SVG bounding rect
- Return { x: e.clientX - r.left, y: e.clientY - r.top }

### dist(a: Point, b: Point)
Return: `Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2)`

### saveHistory(newPolygons, newCurrent, newSelected)
- Slice history at historyIndex + 1
- Push new state
- Update history and historyIndex

### undo()
- If historyIndex > 0, decrement index
- Apply state from history[newIndex]

### redo()
- If historyIndex < history.length - 1, increment index
- Apply state from history[newIndex]

### saveCurrentPolygon()
- If currentPolygon exists with points, add to polygons array
- Clear currentPolygon
- Save to history

### switchTool(newTool)
- Call saveCurrentPolygon()
- Set new tool

### cancelCurrent()
- Set currentPolygon to null

### clearAll()
- Reset all state
- Save to history

## Mouse Event Handlers

### down(e: React.MouseEvent)

**Draw Mode:**
- If no currentPolygon: create new polygon with first point
- If currentPolygon exists:
  - If click within 10px of first point AND ≥3 points: close polygon, add to polygons, save history
  - Else: add point to currentPolygon

**Move Mode:**
- Loop through all polygons
- Check if click within 10px of any point
- If yes: set dragging state, set selectedId

### move(e: React.MouseEvent)
- If not dragging: return
- Get current position
- Update point at dragging.pointIndex for dragging.polygonId

### up()
- If dragging: save history, clear dragging state

## SVG Rendering

For each polygon in allPolygons (polygons + currentPolygon if exists):

**Closed polygon:**
```xml
<polygon 
  points="x1,y1 x2,y2 x3,y3 ..." 
  fill="none" 
  stroke={isSelected ? '#4CAF50' : 'black'} 
  strokeWidth="1" 
/>
```

**Open polygon (current):**
```xml
<polyline 
  points="x1,y1 x2,y2 ..." 
  fill="none" 
  stroke={isCurrent ? '#2196F3' : 'black'} 
  strokeWidth="1" 
/>
```

**In Move mode:**
- Render red circle (r=5, white stroke-width=2) at each point

**If current polygon:**
- Render green circle (r=8, white stroke-width=2) at first point

## Code Preview Format

```xml
<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <polygon points="x,y x,y ..." fill="none" stroke="black" stroke-width="1" />
  <polyline points="x,y x,y ..." fill="none" stroke="black" stroke-width="1" />
</svg>
```

Points formatted as: `${p.x.toFixed(1)},${p.y.toFixed(1)}`

## Status Messages

- Draw mode, no polygon: "📏 Click to start polygon"
- Draw mode, <3 points: "📏 Click to add points"
- Draw mode, ≥3 points: "📏 Click green dot to close polygon"
- Move mode: "🖱️ Drag points to move"

## Interaction Details

1. **Starting polygon:** Click anywhere → creates polygon with 1 point
2. **Adding points:** Click again → adds point to current polygon
3. **Closing polygon:** Click first point (within 10px, requires ≥3 points) → closes polygon, moves to polygons array, clears currentPolygon
4. **Moving points:** Switch to Move mode → drag any red circle
5. **Selecting:** Click polygon → highlights in green
6. **Canceling:** Click Cancel button while drawing → discards currentPolygon
7. **Tool switching:** Automatically saves current polygon if exists

## SVG Event Handlers

- onMouseDown={down}
- onMouseMove={move}
- onMouseUp={up}
- onMouseLeave={up}

## Component Name

Export default function SVGcreator()

## Critical Implementation Notes

1. allPolygons = currentPolygon ? [...polygons, currentPolygon] : polygons
2. Polygon onClick must stopPropagation
3. Distance check for close: dist(currentPolygon.points[0], p) < 10
4. Distance check for point grab: dist(poly.points[i], p) < 10
5. First point close only works when points.length >= 3
6. Tool buttons show active state based on current tool
7. Cancel button only visible when currentPolygon exists
8. Undo/Redo buttons show disabled state correctly