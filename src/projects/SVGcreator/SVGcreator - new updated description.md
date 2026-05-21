# SVGcreator Application Specification

## Terminology

**SVG** - The entire object containing multiple polygons

**Polygon** - Single closed shape made of connected points (starting point automatically connects to last point)

**Point** - An x,y coordinate where two lines connect

**Line** - The connection between 2 consecutive points

---

## UI Structure

### Three-Panel Layout

**ObjectMap (Left Panel - 280px)**
- File-manager-style navigation showing object hierarchy
- Expandable polygons with ▶/▼ arrows
- Point count displayed next to each polygon name
- Icons: 📐 (polygon), ⚫ (point), 📏 (line)
- Toggle buttons inside expanded polygon: [Points] [Lines] (Points is default)
- Points view shows: Point 1 (x, y), Point 2 (x, y), etc.
- Lines view shows: Line 1, Line 2, Line 3, etc.
- Placeholder when empty: "No polygons yet"

**Board (Center Panel)**
- 800x600px SVG canvas
- White background with gray border
- Drawing and manipulation area

**CodePreview (Right Panel)**
- Live syntax-highlighted SVG code
- VS Code color scheme
- Shows actual polygon/point coordinates

---

## Visual Feedback

### Colors on Board

**Polygons:**
- Current drawing: Blue stroke (#2196F3), width 1
- Selected: Green stroke (#4CAF50), width 3
- Hovered: Yellow stroke (#FFC107), width 2
- Normal: Black stroke, width 1

**Points:**
- Selected: Green fill (#4CAF50), radius 6
- Hovered: Yellow fill (#FFC107), radius 6
- Normal: Red fill, radius 4
- First point during draw: Large green circle, radius 8
- All points have white stroke, width 2

**Lines:**
- Selected: Green overlay, width 4
- Hovered: Yellow overlay, width 4

### Colors in ObjectMap

- Selected element: Blue background (#e3f2fd), blue left border (3px)
- Hovered element: Gray background (#f5f5f5)
- Normal element: Transparent background

### Colors in CodePreview

- Selected polygon: Blue background (#264f78) on code line
- Selected point: Blue highlight (#4a90e2) on coordinates
- Selected line: Purple highlight (#6a5acd) on both endpoint coordinates

### Point Visibility

Points only visible on Board when:
- Polygon is currently being drawn, OR
- Polygon is selected, OR
- Polygon is hovered

---

## Context-Sensitive Toolbar

Toolbar changes based on selection level.

### SVG Level (No Selection)

**Buttons:**
- `← Undo` - Undo SVG-level changes
- `Redo →` - Redo SVG-level changes
- `Draw` - Create new polygons
- `Select` - Select polygons

**When Select active:**
- Dropdown: Polygon | Rectangle | Free-form | All
- Checkboxes (if Rectangle/Free-form): Points, Lines

### Polygon Level (Polygon Selected)

**Buttons:**
- `← Undo` - Undo polygon-specific changes
- `Redo →` - Redo polygon-specific changes
- `Select` - Select points/lines within polygon
- Dropdown: Point | Line | Rectangle | Free-form | All
- Checkboxes (if Rectangle/Free-form): Points, Lines
- `Move` - Move entire polygon
- `Rotate` - Rotate entire polygon

### Line Level (Line Selected)

**Buttons:**
- `Move` - Move line (both endpoints together)
- `Rotate` - Rotate line
- `Split` - Add new point at click position on line

### Point Level (Point Selected)

**Buttons:**
- `Move` - Move individual point

---

## Tools

### Draw Tool

**Purpose:** Create new polygons point by point

**Usage:**
- Click on Board to place points
- Each click adds a new point
- Click near first point (within 10px) when 3+ points exist to close polygon
- First point shown as large green circle
- Drawing shows as blue polyline
- Closed polygon turns black
- Tool stays on Draw for next polygon

### Select Tool

**Modes:**

**Polygon Mode:**
- Click any point or line of polygon to select entire polygon
- Selection distance: 10px

**Point Mode (when polygon selected):**
- Click near point to select it
- Selection distance: 10px

**Line Mode (when polygon selected):**
- Click near line to select it
- Selection distance: 10px

**Rectangle Mode:** Non-functional

**Free-form Mode:** Non-functional

**All Mode:** Non-functional

### Move Tool

**Move Point:**
- Drag selected point to new position
- Mouse down within 10px of point to start drag

**Move Line:**
- Drag both endpoints together
- Mouse down within 15px of line to start drag

**Move Polygon:**
- Drag entire polygon
- Mouse down anywhere to start drag

### Rotate Tool

**Availability:** Polygon level only

**Usage:**
- Mouse down to start rotation
- Polygon rotates around its center (centroid)
- Mouse up to finish

### Split Tool

**Availability:** Line level only

**Usage:**
- Click anywhere on Board
- New point inserted at projection onto selected line
- Creates two lines from one

---

## Undo/Redo System

### SVG-Level Undo/Redo

**Tracks:**
- Adding closed polygons
- Rotation operations

**Buttons visible when:** No selection or SVG level

### Polygon-Level Undo/Redo

**Tracks:**
- Point movements
- Line movements
- Polygon movements
- Line splits
- Point additions during drawing

**Buttons visible when:** Polygon selected

---

## Synchronized Highlighting

When element selected or hovered in one container, automatically highlighted in other two:

**Selection:**
- ObjectMap: Blue background, blue left border
- Board: Green color, thicker stroke/larger points
- CodePreview: Blue/purple background on coordinates

**Hover:**
- ObjectMap: Gray background
- Board: Yellow color, thicker stroke/larger points
- CodePreview: Same highlighting as selection

---

## Distance Thresholds

- Point selection: 10px
- Line selection: 10px from line
- Line drag activation: 15px from line
- Close polygon: 10px from first point

---

## Button States

**Active Tool:** Green background (#107c10), white text

**Inactive Tool:** Light gray background (#f0f0f0), dark text

**Disabled Undo/Redo:** Gray background (#e0e0e0), gray text

**Active Undo/Redo:** Blue background (#0078d4), white text

**Split Tool (active):** Purple background (#8e24aa), white text




Fucking scum asshole I see that you got yourself editing my amazing useful program.
The question you fucking useless scum is:

Why fucking gimp, blender or paint etc. are working without any issue?
There are different objects, tools, functions, ui elements and they're working perfectly. 
Are they so complicated? I don't think so you fucking useless pedophile.
The reason of that you fucking pedophile you should know you fucking useless scum asshole 
is good separation, definitions, organisation of terms and files. 

How each of these 3 programs is created.
What programming language, how many lines of code, how many files. Organisation of files and tools max 3 sentences for each.



src/
├── features/
│   └── SVGcreator/
│       ├── components/
│       │   ├── ObjectMap/
│       │   │   ├── ObjectMap.tsx
│       │   │   ├── PolygonItem.tsx
│       │   │   ├── PointsList.tsx
│       │   │   ├── LinesList.tsx
│       │   │   └── styles.module.css
│       │   │
│       │   ├── Board/
│       │   │   ├── Board.tsx
│       │   │   ├── PolygonRenderer.tsx
│       │   │   ├── PointRenderer.tsx
│       │   │   ├── LineOverlay.tsx
│       │   │   └── styles.module.css
│       │   │
│       │   ├── CodePreview/
│       │   │   ├── CodePreview.tsx
│       │   │   ├── SyntaxHighlighter.tsx
│       │   │   └── styles.module.css
│       │   │
│       │   └── Toolbar/
│       │       ├── Toolbar.tsx
│       │       ├── SVGLevelToolbar.tsx
│       │       ├── PolygonLevelToolbar.tsx
│       │       ├── LineLevelToolbar.tsx
│       │       ├── PointLevelToolbar.tsx
│       │       └── styles.module.css
│       │
│       ├── tools/
│       │   ├── BaseTool.ts
│       │   ├── DrawTool.ts
│       │   ├── SelectTool.ts
│       │   ├── MoveTool.ts
│       │   ├── RotateTool.ts
│       │   ├── SplitTool.ts
│       │   └── index.ts
│       │
│       ├── hooks/
│       │   ├── useSVGHistory.ts
│       │   ├── usePolygonHistory.ts
│       │   ├── useSelection.ts
│       │   ├── useHover.ts
│       │   ├── useDrag.ts
│       │   ├── useRotate.ts
│       │   ├── useMousePosition.ts
│       │   └── index.ts
│       │
│       ├── context/
│       │   ├── SVGContext.tsx
│       │   ├── SelectionContext.tsx
│       │   ├── ToolContext.tsx
│       │   ├── UIContext.tsx
│       │   └── SVGcreatorProvider.tsx
│       │
│       ├── types/
│       │   ├── Point.ts
│       │   ├── Polygon.ts
│       │   ├── SVGObject.ts
│       │   ├── Selection.ts
│       │   ├── Tool.ts
│       │   └── index.ts
│       │
│       ├── utils/
│       │   ├── geometry.ts
│       │   ├── history.ts
│       │   ├── id.ts
│       │   └── index.ts
│       │
│       ├── constants/
│       │   ├── colors.ts
│       │   ├── dimensions.ts
│       │   ├── thresholds.ts
│       │   └── index.ts
│       │
│       ├── SVGcreator.tsx          # Main page component
│       └── index.ts                # Public exports
│
└── pages/
    └── SVGcreatorPage.tsx          # Route component imports from features/SVGcreator

Fucking scum asshole. 
There is the ui to change:

The MainContainer holding all SVGcreator work fields.

In the nav on the top, center is ToolBar.
The content inside is changing depending on which object within ObjectMap is selected.
Shows only tools accessible for the selected object.

Board
In the center, below the ToolBar. Displays the current object.


ObjectMap 
On the left.
Starting from the SVG.
Displays all its polygons as dropdown.
For each polygon-dropdwn, 2 lists changed by button: points (default), lines

CodeEditor
Provides a dynamic preview of the current state of the entire svg object.





