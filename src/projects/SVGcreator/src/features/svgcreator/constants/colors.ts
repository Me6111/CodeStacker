// 5-level green hierarchy (lightest → darkest)
//   POLY_FOCUS    #d4f5e4  ~19.8:1  polygon focused / clicked in ObjectMap
//   POLY_HOVER    #86efac  ~13.5:1  polygon hovered in ObjectMap
//   CAPTURED      #4ade80  ~11.2:1  fragment within selection area
//   ELEMENT_HOVER #22c55e   ~8.0:1  hovered point or line
//   ELEMENT_FOCUS #15803d   ~4.6:1  focused / selected point or line

export const POLY_FOCUS    = '#d4f5e4';
export const POLY_HOVER    = '#86efac';
export const CAPTURED      = '#4ade80';
export const ELEMENT_HOVER = '#22c55e';
export const ELEMENT_FOCUS = '#15803d';

export const POLY_FOCUS_BG    = 'rgba(212,245,228,0.20)';
export const POLY_HOVER_BG    = 'rgba(134,239,172,0.15)';
export const CAPTURED_BG      = 'rgba(74,222,128,0.18)';
export const ELEMENT_HOVER_BG = 'rgba(34,197,94,0.18)';
export const ELEMENT_FOCUS_BG = 'rgba(21,128,61,0.28)';

// Selection tool — blue (used only in SelectionShapeRenderer / SelectionTabs)
export const SEL_BLUE = '#60a5fa';

export const COLORS = {
  // ── Canvas strokes ───────────────────────────────────────────────
  NORMAL:   '#ffffff',
  DRAWING:  '#ffffff',
  SELECTED: POLY_FOCUS,
  HOVERED:  POLY_HOVER,

  // ── Canvas points ────────────────────────────────────────────────
  POINT_NORMAL:       '#ffffff',
  POINT_SELECTED:     ELEMENT_FOCUS,
  POINT_HOVERED:      ELEMENT_HOVER,
  POINT_CAPTURED:     CAPTURED,
  POINT_BOARD_STROKE: '#000000',

  // ── Canvas line overlays ─────────────────────────────────────────
  LINE_OVERLAY_SELECTED:  ELEMENT_FOCUS,
  LINE_OVERLAY_HOVERED:   ELEMENT_HOVER,
  LINE_OVERLAY_CAPTURED:  CAPTURED,

  // ── ObjectMap panel ──────────────────────────────────────────────
  OBJECTMAP_SELECTED_BG:     POLY_FOCUS_BG,
  OBJECTMAP_SELECTED_BORDER: POLY_FOCUS,
  OBJECTMAP_HOVERED_BG:      POLY_HOVER_BG,
  OBJECTMAP_HOVERED_BORDER:  POLY_HOVER,
  OBJECTMAP_CAPTURED_BG:     CAPTURED_BG,
  OBJECTMAP_CAPTURED_BORDER: CAPTURED,

  // ── Line-run sidebar hover ───────────────────────────────────────
  LINE_RUN_HOVER: POLY_HOVER,

  // ── Toolbar buttons (black/white only) ───────────────────────────
  BUTTON_ACTIVE:   '#ffffff',
  BUTTON_INACTIVE: 'rgba(255,255,255,0.07)',
  BUTTON_DISABLED: 'transparent',
  TEXT_DISABLED:   'rgba(255,255,255,0.2)',
};
