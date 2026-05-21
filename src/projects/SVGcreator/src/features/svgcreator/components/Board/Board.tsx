import React, { useMemo, useEffect, useCallback, useRef, useState } from 'react';
import { useSVGContext } from '../../context/SVGContext';
import { useSelectionContext } from '../../context/SelectionContext';
import { useToolContext } from '../../context/ToolContext';
import { useMousePosition, useCurrentPolygon, usePolygonHistory } from '../../hooks';
import { useSelectionShapeHandling } from '../../hooks/useSelectionShapeHandling';
import {
  DrawTool, DrawTool_Square, DrawTool_Circle, DrawTool_FreeForm,
  SelectTool_Polygon, SelectTool_Point, SelectTool_Line, SelectTool_Square,
  SelectTool_FreeForm, SelectTool_Circle, SelectTool_All,
  BaseTool, ToolContext,
} from '../../tools';
import { PolygonRenderer } from '../PolygonRender/PolygonRender';
import { SelectionShapeRenderer } from '../SelectionShape/SelectionShapeRenderer';
import { SelectionControls, LineRun } from '../SelectionControls/SelectionControls';
import { LinesSidebar } from '../LinesSidebar/LinesSidebar';
import { ArrowMarkerDefs } from '../SelectionShape/MoveIndicator';
import SelectionTabs from './SelectionTabs';
import { CalqueLayer } from './CalqueLayer';
import { useCalqueContext } from '../../context/CalqueContext';

const Board: React.FC = () => {
  const { svgObject, setSvgObject, addToSVGHistory } = useSVGContext();
  const { selection, setSelection } = useSelectionContext();
  const { hover, setHover, lineRunHover } = useSelectionContext();
  const {
    tool, selectMode, drawMode,
    setConfirmedSelectionElements, pendingSelectAll, setPendingSelectAll,
    toolArmed, setToolArmed,
    subSelectMode, setSubSelectMode,
  } = useToolContext();
  const { svgRef, getMousePosition } = useMousePosition();
  const { currentPolygon, setCurrentPolygon } = useCurrentPolygon();
  const { addToPolygonHistory } = usePolygonHistory();
  const { gridSize, snapEnabled, imageTransform, setImageTransform, imageUrl, imageVisible } = useCalqueContext();

  const boardWidth  = svgObject.width;
  const boardHeight = svgObject.height;

  const currentPolygonRef = useRef(currentPolygon);
  currentPolygonRef.current = currentPolygon;
  const svgPolygonsRef = useRef(svgObject.polygons);
  svgPolygonsRef.current = svgObject.polygons;
  const prevToolRef = useRef(tool);
  const toolRef = useRef(tool);
  toolRef.current = tool;
  const toolArmedRef = useRef(toolArmed);
  toolArmedRef.current = toolArmed;
  const prevCurrentPolygonRef = useRef<typeof currentPolygon>(null);
  const prevActiveIdsRef = useRef<string[]>([]);

  const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  const toolInstances = useMemo(() => ({
    draw: new DrawTool(), drawSquare: new DrawTool_Square(), drawCircle: new DrawTool_Circle(), drawFreeform: new DrawTool_FreeForm(),
    selectPolygon: new SelectTool_Polygon(), selectPoint: new SelectTool_Point(), selectLine: new SelectTool_Line(),
    selectRectangle: new SelectTool_Square(), selectFreeform: new SelectTool_FreeForm(),
    selectCircle: new SelectTool_Circle(), selectAll: new SelectTool_All(),
  }), []);

  const getCurrentTool = (): BaseTool => {
    if (tool === 'draw') {
      if (drawMode === 'square') return toolInstances.drawSquare;
      if (drawMode === 'circle') return toolInstances.drawCircle;
      if (drawMode === 'freeform') return toolInstances.drawFreeform;
      return toolInstances.draw;
    }
    if (tool === 'select') {
      if (selectMode === 'polygon') return toolInstances.selectPolygon;
      if (selectMode === 'point') return toolInstances.selectPoint;
      if (selectMode === 'line') return toolInstances.selectLine;
      if (selectMode === 'rectangle') return toolInstances.selectRectangle;
      if (selectMode === 'freeform') return toolInstances.selectFreeform;
      if (selectMode === 'circle') return toolInstances.selectCircle;
      if (selectMode === 'all') return toolInstances.selectAll;
    }
    return toolInstances.draw;
  };

  const currentTool: BaseTool = getCurrentTool();

  const {
    visualOverlays, selectedElementsMap, draggingSelectionHandle, dragStartPosRef,
    handleCornerDragStart, handleLineDragStart, handleContainerCornerDragStart,
    handleContainerEdgeDragStart, handleRotateHandleDragStart, handleMoveDragStart,
    handleSelectionDrag, getSelectionShapePoints, addOrUpdateOverlay,
    deleteOverlay, confirmSelection, editSelection, clearCurrentDrawing, clearDragging,
    createConfirmedSelectionForPolygon, cleanupOrphanedOverlays, updateObjectmapOverlayBounds,
    forceRecalculateAllSelectedElements,
  } = useSelectionShapeHandling(svgObject, currentTool, setSvgObject, addToSVGHistory, addToPolygonHistory);

  const draggingHandleRef = useRef(draggingSelectionHandle);
  draggingHandleRef.current = draggingSelectionHandle;
  // Keeps the last-dragged selection ID alive for one render after clearDragging so that
  // the svgObject.polygons effect (which fires in the same batch as the drag-state clear)
  // can still skip recalculating the just-resized objectmap overlay.
  const lastDraggedSelectionIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (draggingSelectionHandle) lastDraggedSelectionIdRef.current = draggingSelectionHandle.selectionId;
  }, [draggingSelectionHandle]);

  // Sub-mode drag state
  const subDragRef = useRef<{
    polygonId: string;
    pointIndex: number;
    isLine: boolean; // true = dragging a line segment (two endpoints)
    siblingIndex: number; // for line drag: the second endpoint index
    lastPos: { x: number; y: number };
  } | null>(null);
  const subSelectModeRef = useRef(subSelectMode);
  subSelectModeRef.current = subSelectMode;

  const imageTransformRef = useRef(imageTransform);
  imageTransformRef.current = imageTransform;
  const imageDragRef = useRef<{
    type: 'move' | 'tl' | 'tr' | 'bl' | 'br';
    startPos: { x: number; y: number };
    startTransform: { x: number; y: number; width: number; height: number };
  } | null>(null);

  const ptToSegDist = (p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }): number => {
    const dx = b.x - a.x, dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
  };

  const applySnap = (point: { x: number; y: number }): { x: number; y: number } => {
    if (!snapEnabled || gridSize < 2) return point;
    const snappedX = Math.round(point.x / gridSize) * gridSize;
    const snappedY = Math.round(point.y / gridSize) * gridSize;
    return {
      x: Math.abs(point.x - snappedX) < gridSize / 2 ? snappedX : point.x,
      y: Math.abs(point.y - snappedY) < gridSize / 2 ? snappedY : point.y,
    };
  };

  const handleImageDragStart = useCallback((e: React.MouseEvent, type: 'move' | 'tl' | 'tr' | 'bl' | 'br') => {
    const pos = getMousePosition(e);
    imageDragRef.current = { type, startPos: pos, startTransform: { ...imageTransformRef.current } };
  }, [getMousePosition]);

  const autoCloseDrawing = useCallback(() => {
    const poly = currentPolygonRef.current;
    if (poly && poly.points.length >= 3) {
      addToSVGHistory([...svgPolygonsRef.current, { ...poly, closed: true }]);
    }
    setCurrentPolygon(null);
  }, [addToSVGHistory, setCurrentPolygon]);

  // After drawing completes: disarm, auto-create bounding-box overlay, stay on draw (disarmed)
  useEffect(() => {
    const prev = prevCurrentPolygonRef.current;
    prevCurrentPolygonRef.current = currentPolygon;
    if (prev !== null && currentPolygon === null && toolRef.current === 'draw') {
      setToolArmed(false);
      setPendingSelectAll(prev.id);
    }
  }, [currentPolygon]);

  useEffect(() => {
    const skipId = draggingHandleRef.current?.selectionId ?? lastDraggedSelectionIdRef.current ?? null;
    lastDraggedSelectionIdRef.current = null;
    updateObjectmapOverlayBounds(svgObject.polygons, skipId);
  }, [svgObject.polygons]);

  // After undo/redo the polygon points change but the selection shape doesn't,
  // so the shape-cache would block recalculation. Force it so selected edge
  // indices are always consistent with the current polygon state.
  const prevHistoryIndexRef = useRef(svgObject.historyIndex);
  useEffect(() => {
    if (prevHistoryIndexRef.current !== svgObject.historyIndex) {
      prevHistoryIndexRef.current = svgObject.historyIndex;
      forceRecalculateAllSelectedElements();
    }
  }, [svgObject.historyIndex, forceRecalculateAllSelectedElements]);

  useEffect(() => {
    const activeIds = visualOverlays.filter(o => o.activeShape).map(o => o.id);
    if (activeIds.length === 0) {
      setActiveOverlayId(null);
    } else {
      const newIds = activeIds.filter(id => !prevActiveIdsRef.current.includes(id));
      if (newIds.length > 0) {
        setActiveOverlayId(newIds[newIds.length - 1]);
      } else {
        setActiveOverlayId(prev => (!prev || !activeIds.includes(prev)) ? activeIds[activeIds.length - 1] : prev);
      }
    }
    prevActiveIdsRef.current = activeIds;
  }, [visualOverlays]);

  useEffect(() => {
    if (pendingSelectAll !== null) {
      if (tool === 'draw' && currentPolygonRef.current) {
        autoCloseDrawing();
        clearCurrentDrawing();
      }
      const targetId = pendingSelectAll === 'svg' ? null : pendingSelectAll;
      // If an objectmap overlay already exists for this polygon, just activate it —
      // don't recreate it (that would wipe out any manual edits the user made).
      const existing = visualOverlays.find(o =>
        o.source === 'objectmap' &&
        (targetId === null ? o.targetPolygonId == null : o.targetPolygonId === targetId)
      );
      if (existing) {
        setActiveOverlayId(existing.id);
      } else {
        createConfirmedSelectionForPolygon(targetId);
      }
      setPendingSelectAll(null);
      setToolArmed(false);
    }
  }, [pendingSelectAll, visualOverlays]);

  useEffect(() => {
    const ids = svgObject.polygons.map((p: any) => p.id);
    cleanupOrphanedOverlays(ids);
  }, [svgObject.polygons]);

  useEffect(() => {
    const activeOverlay = visualOverlays.find(o => o.id === activeOverlayId);
    const drawingOverlay = visualOverlays.find(o => o.drawingShape && !o.activeShape);
    // Show live elements in all fields (ObjectMap, CodePreview, etc.) during drawing
    // and when an overlay is active, regardless of confirmation state.
    const liveId = activeOverlayId ?? drawingOverlay?.id ?? null;
    setConfirmedSelectionElements(liveId ? (selectedElementsMap[liveId] ?? null) : null);
    if (!activeOverlay?.confirmed) {
      setSubSelectMode('none');
      subDragRef.current = null;
      setHover({ polygonId: null, elementType: null, elementIndex: null });
    }
  }, [selectedElementsMap, activeOverlayId, visualOverlays]);

  const handleConfirmSelection = useCallback((id: string) => {
    // Deconfirm every other confirmed overlay first — only one confirmed at a time
    visualOverlays.filter(o => o.id !== id && o.confirmed).forEach(o => editSelection(o.id));
    confirmSelection(id);
    setConfirmedSelectionElements(selectedElementsMap[id] ?? null);
  }, [confirmSelection, editSelection, visualOverlays, selectedElementsMap, setConfirmedSelectionElements]);

  const handleEditSelection = useCallback((id: string) => {
    editSelection(id);
  }, [editSelection]);

  const handleDeleteOverlay = useCallback((id: string) => {
    deleteOverlay(id);
    setConfirmedSelectionElements(null);
  }, [deleteOverlay, setConfirmedSelectionElements]);

  // When switching tabs, auto-deconfirm the previously active overlay so there is
  // never more than one confirmed selection at a time.
  const handleTabSelect = useCallback((id: string) => {
    if (id === activeOverlayId) return;
    if (activeOverlayId) {
      const prev = visualOverlays.find(o => o.id === activeOverlayId);
      if (prev?.confirmed) editSelection(activeOverlayId);
    }
    setActiveOverlayId(id);
  }, [activeOverlayId, visualOverlays, editSelection]);

  useEffect(() => {
    const wasDrawTool = prevToolRef.current === 'draw';
    prevToolRef.current = tool;
    if (wasDrawTool && tool !== 'draw' && currentPolygonRef.current) {
      autoCloseDrawing();
    }
    (currentTool as any).clearSelection?.();
    clearCurrentDrawing();
  }, [tool, selectMode, drawMode]);

  const checkAndDisarmSelectTool = useCallback((overlay: any) => {
    if (toolRef.current === 'select' && overlay?.activeShape && !overlay?.drawingShape) {
      setToolArmed(false);
    }
  }, [setToolArmed]);

  const handleToolUpdate = (update: any) => {
    if (update.svgObject) setSvgObject(update.svgObject);
    if (update.selection) setSelection(update.selection);
    if (update.currentPolygon !== undefined) setCurrentPolygon(update.currentPolygon);
    if (update.saveToSVGHistory && update.svgObject) addToSVGHistory(update.svgObject.polygons);
    if (update.saveToPolygonHistory) addToPolygonHistory(update.saveToPolygonHistory.polygonId, update.saveToPolygonHistory.points);
  };

  const mkContext = (extra?: any): ToolContext => ({
    svgObject, selection, currentPolygon,
    selectMode, selectPoints: true, selectLines: true, freeformAccuracy: 100,
    ...extra,
  });

  const HIT_RADIUS = 14;

  const handleSubModeDown = useCallback((point: { x: number; y: number }) => {
    const mode = subSelectModeRef.current;
    if (mode === 'none') return false;
    const elements = activeOverlayId ? (selectedElementsMap[activeOverlayId] ?? []) : [];
    if (elements.length === 0) return false;

    if (mode === 'movePoint') {
      let best: { dist: number; polygonId: string; pointIndex: number } | null = null;
      for (const elem of elements) {
        const poly = svgPolygonsRef.current.find(p => p.id === elem.polygonId);
        if (!poly) continue;
        for (const ptIdx of elem.points) {
          if (ptIdx < 0 || ptIdx >= poly.points.length) continue;
          const d = Math.hypot(point.x - poly.points[ptIdx].x, point.y - poly.points[ptIdx].y);
          if (d < HIT_RADIUS && (!best || d < best.dist)) {
            best = { dist: d, polygonId: poly.id, pointIndex: ptIdx };
          }
        }
      }
      if (best) {
        subDragRef.current = { polygonId: best.polygonId, pointIndex: best.pointIndex, isLine: false, siblingIndex: -1, lastPos: point };
        return true;
      }
    }

    if (mode === 'moveLine') {
      let best: { dist: number; polygonId: string; lineIdx: number; siblingIdx: number } | null = null;
      for (const elem of elements) {
        const poly = svgPolygonsRef.current.find(p => p.id === elem.polygonId);
        if (!poly) continue;
        const N = poly.points.length;
        for (const lineIdx of elem.lines) {
          if (lineIdx < 0 || lineIdx >= N) continue;
          const a = poly.points[lineIdx], b = poly.points[(lineIdx + 1) % N];
          if (!a || !b) continue;
          const d = ptToSegDist(point, a, b);
          if (d < HIT_RADIUS && (!best || d < best.dist)) {
            best = { dist: d, polygonId: poly.id, lineIdx, siblingIdx: (lineIdx + 1) % N };
          }
        }
      }
      if (best) {
        subDragRef.current = { polygonId: best.polygonId, pointIndex: best.lineIdx, isLine: true, siblingIndex: best.siblingIdx, lastPos: point };
        return true;
      }
    }

    return false;
  }, [activeOverlayId, selectedElementsMap]);

  const down = (e: React.MouseEvent) => {
    const rawPoint = getMousePosition(e);
    const point = applySnap(rawPoint);
    dragStartPosRef.current = point;
    if (subSelectModeRef.current !== 'none') {
      const hit = handleSubModeDown(rawPoint);
      if (hit) return;
      // No element hit — fall through to allow starting a new selection shape
      setSubSelectMode('none');
    }
    if (draggingSelectionHandle) return;
    if ((tool === 'draw' || tool === 'select') && !toolArmedRef.current) return;
    const update = currentTool.onMouseDown(point, mkContext());
    handleToolUpdate(update);
    if (update.internalState && currentTool.getVisualOverlay) {
      const overlay = currentTool.getVisualOverlay();
      if (overlay) { addOrUpdateOverlay(overlay); checkAndDisarmSelectTool(overlay); }
    }
  };

  const move = (e: React.MouseEvent) => {
    const rawPoint = getMousePosition(e);
    setCursorPos(rawPoint);
    const point = applySnap(rawPoint);
    if (imageDragRef.current) {
      const drag = imageDragRef.current;
      const dx = rawPoint.x - drag.startPos.x;
      const dy = rawPoint.y - drag.startPos.y;
      const { x, y, width, height } = drag.startTransform;
      if (drag.type === 'move') setImageTransform({ x: x + dx, y: y + dy, width, height });
      else if (drag.type === 'tl') setImageTransform({ x: x + dx, y: y + dy, width: Math.max(1, width - dx), height: Math.max(1, height - dy) });
      else if (drag.type === 'tr') setImageTransform({ x, y: y + dy, width: Math.max(1, width + dx), height: Math.max(1, height - dy) });
      else if (drag.type === 'bl') setImageTransform({ x: x + dx, y, width: Math.max(1, width - dx), height: Math.max(1, height + dy) });
      else if (drag.type === 'br') setImageTransform({ x, y, width: Math.max(1, width + dx), height: Math.max(1, height + dy) });
      return;
    }
    if (subDragRef.current) {
      const drag = subDragRef.current;
      const dx = rawPoint.x - drag.lastPos.x;
      const dy = rawPoint.y - drag.lastPos.y;
      drag.lastPos = rawPoint;
      setSvgObject(prev => ({
        ...prev,
        polygons: prev.polygons.map(poly => {
          if (poly.id !== drag.polygonId) return poly;
          const newPoints = poly.points.map((pt, i) => {
            if (i === drag.pointIndex || (drag.isLine && i === drag.siblingIndex)) {
              return { x: pt.x + dx, y: pt.y + dy };
            }
            return pt;
          });
          return { ...poly, points: newPoints, originalPoints: undefined, fragmentOriginalPoints: undefined };
        }),
      }));
      return;
    }
    if (subSelectModeRef.current !== 'none') {
      const mode = subSelectModeRef.current;
      const elements = activeOverlayId ? (selectedElementsMap[activeOverlayId] ?? []) : [];
      let found: { polygonId: string; elementType: 'point' | 'line'; elementIndex: number } | null = null;
      if (mode === 'movePoint') {
        let bestDist = HIT_RADIUS;
        for (const elem of elements) {
          const poly = svgPolygonsRef.current.find(p => p.id === elem.polygonId);
          if (!poly) continue;
          for (const ptIdx of elem.points) {
            if (ptIdx < 0 || ptIdx >= poly.points.length) continue;
            const d = Math.hypot(rawPoint.x - poly.points[ptIdx].x, rawPoint.y - poly.points[ptIdx].y);
            if (d < bestDist) { bestDist = d; found = { polygonId: poly.id, elementType: 'point', elementIndex: ptIdx }; }
          }
        }
      } else if (mode === 'moveLine') {
        let bestDist = HIT_RADIUS;
        for (const elem of elements) {
          const poly = svgPolygonsRef.current.find(p => p.id === elem.polygonId);
          if (!poly) continue;
          const N = poly.points.length;
          for (const lineIdx of elem.lines) {
            if (lineIdx < 0 || lineIdx >= N) continue;
            const d = ptToSegDist(rawPoint, poly.points[lineIdx], poly.points[(lineIdx + 1) % N]);
            if (d < bestDist) { bestDist = d; found = { polygonId: poly.id, elementType: 'line', elementIndex: lineIdx }; }
          }
        }
      }
      if (found) {
        setHover({ polygonId: found.polygonId, elementType: found.elementType, elementIndex: found.elementIndex });
      } else {
        setHover({ polygonId: null, elementType: null, elementIndex: null });
      }
      return;
    }
    if (!draggingSelectionHandle) dragStartPosRef.current = point;
    if (draggingSelectionHandle && dragStartPosRef.current) {
      handleSelectionDrag(point, mkContext());
      return;
    }
    if ((tool === 'draw' || tool === 'select') && !toolArmedRef.current) return;
    const update = currentTool.onMouseMove(point, mkContext());
    handleToolUpdate(update);
    if (update.internalState && currentTool.getVisualOverlay) {
      const overlay = currentTool.getVisualOverlay();
      if (overlay) { addOrUpdateOverlay(overlay); checkAndDisarmSelectTool(overlay); }
    }
  };

  const up = (e: React.MouseEvent) => {
    if (e.type === 'mouseleave') setCursorPos(null);
    const point = applySnap(getMousePosition(e));
    if (imageDragRef.current) { imageDragRef.current = null; return; }
    if (subDragRef.current) {
      addToSVGHistory(svgPolygonsRef.current);
      subDragRef.current = null;
      return;
    }
    if (draggingSelectionHandle) { clearDragging(); return; }
    if ((tool === 'draw' || tool === 'select') && !toolArmedRef.current) return;
    const update = currentTool.onMouseUp(point, mkContext());
    handleToolUpdate(update);
    if (update.internalState && currentTool.getVisualOverlay) {
      const overlay = currentTool.getVisualOverlay();
      if (overlay) { addOrUpdateOverlay(overlay); checkAndDisarmSelectTool(overlay); }
    }
  };

  const getControlsPosition = (overlay: any) => {
    const points = getSelectionShapePoints(overlay);
    if (points.length === 0) return { x: 0, y: 0, layout: 'vertical' as const };
    const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
    const maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const btnCount = overlay.confirmed ? 4 : 2;
    const vW = 36, vH = 36 * btnCount + 4 * (btnCount - 1);
    const hW = 36 * btnCount + 4 * (btnCount - 1), hH = 36;
    let x = maxX + 12, y = minY, layout: 'vertical' | 'horizontal' = 'vertical';
    if (x + vW > boardWidth) {
      layout = 'horizontal'; x = maxX - hW; y = maxY + 12;
      if (y + hH > boardHeight) y = minY - hH - 12;
      if (x < 0) x = 10;
      if (y < 0) y = 10;
    } else {
      if (y + vH > boardHeight) y = boardHeight - vH;
      if (y < 0) y = 0;
    }
    return { x, y, layout };
  };

  const allSelectedElements = useMemo(() => {
    const id = activeOverlayId ?? visualOverlays.find(o => o.drawingShape && !o.activeShape)?.id ?? null;
    if (!id) return [];
    return selectedElementsMap[id] ?? [];
  }, [selectedElementsMap, activeOverlayId, visualOverlays]);

  // Build list of contiguous edge runs (line pieces) for the active overlay.
  const lineRuns = useMemo((): LineRun[] => {
    if (!activeOverlayId) return [];
    const elements = selectedElementsMap[activeOverlayId] ?? [];
    const runs: LineRun[] = [];

    for (const elem of elements) {
      const poly = svgObject.polygons.find((p: any) => p.id === elem.polygonId);
      if (!poly || elem.lines.length === 0) continue;
      const N = poly.points.length;
      if (N < 2) continue;
      const pts = poly.points;

      // Guard against stale indices: selectedElementsMap and svgObject update in separate
      // state slices, so during the render after a simplification they can be momentarily
      // mismatched. Skip any index that is out of bounds for the current polygon.
      const validLines = elem.lines.filter((i: number) => i >= 0 && i < N);
      if (validLines.length === 0) continue;

      const edgeLength = (i: number) => {
        const a = pts[i], b = pts[(i + 1) % N];
        if (!a || !b) return 0;
        return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
      };

      if (validLines.length >= N) {
        let len = 0;
        for (let i = 0; i < N; i++) len += edgeLength(i);
        runs.push({ polygonId: poly.id, polygonName: poly.name, edgeCount: N, totalLength: len, edgeIndices: validLines });
        continue;
      }

      const sel = new Set(validLines);
      const visited = new Set<number>();

      for (const startEdge of validLines) {
        if (visited.has(startEdge)) continue;
        if (sel.has((startEdge - 1 + N) % N)) continue;

        const edgeIndices: number[] = [];
        let cur = startEdge;
        let totalLength = 0;
        while (sel.has(cur) && !visited.has(cur)) {
          totalLength += edgeLength(cur);
          edgeIndices.push(cur);
          visited.add(cur);
          cur = (cur + 1) % N;
        }
        if (edgeIndices.length > 0) {
          runs.push({ polygonId: poly.id, polygonName: poly.name, edgeCount: edgeIndices.length, totalLength, edgeIndices });
        }
      }
    }
    return runs;
  }, [selectedElementsMap, activeOverlayId, svgObject.polygons]);

  const isToolBusy = (tool === 'draw' || tool === 'select') && toolArmed;
  const activeTabs = visualOverlays.filter(o => o.activeShape).map(o => ({
    ...o,
    targetPolygonName: o.source === 'objectmap' && o.targetPolygonId
      ? svgObject.polygons.find((p: any) => p.id === o.targetPolygonId)?.name
      : undefined,
  }));
  const activeOverlay = visualOverlays.find(o => o.id === activeOverlayId);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#000000', overflow: 'hidden', position: 'relative' }}>
      <SelectionTabs
        overlays={activeTabs}
        activeId={activeOverlayId}
        onSelect={handleTabSelect}
        onClose={handleDeleteOverlay}
        onConfirm={handleConfirmSelection}
        onEdit={handleEditSelection}
      />

      <div
        style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', overflow: 'auto' }}
        onMouseMove={move}
        onMouseUp={up}
        onMouseLeave={up}
      >
        <svg
          ref={svgRef}
          width={boardWidth}
          height={boardHeight}
          style={{ background: '#000000', border: '1px solid rgba(255,255,255,0.2)', display: 'block', flexShrink: 0, cursor: subSelectMode !== 'none' ? 'crosshair' : undefined }}
          onMouseDown={down}
        >
          <ArrowMarkerDefs />
          <CalqueLayer
            width={boardWidth}
            height={boardHeight}
            onImageDragStart={handleImageDragStart}
            showHandles={!isToolBusy && !!(imageUrl && imageVisible)}
          />
          <PolygonRenderer
            polygons={svgObject.polygons}
            currentPolygon={currentPolygon}
            selection={selection}
            hover={hover}
            selectedElements={allSelectedElements}
            lineRunHover={lineRunHover}
          />

          {/* In-progress polygon drawing */}
          {visualOverlays.map(overlay => {
            if (overlay.drawingShape?.points && overlay.type === 'polygon') {
              return (
                <g key={overlay.id}>
                  <polyline
                    points={overlay.drawingShape.points.map((p: any) => `${p.x},${p.y}`).join(' ')}
                    fill="none" stroke="#ffffff" strokeWidth="2"
                  />
                  {overlay.drawingShape.points.map((p: any, idx: number) => (
                    <circle key={idx} cx={p.x} cy={p.y}
                      r={idx === 0 ? 8 : 5}
                      fill={idx === 0 ? '#ffffff' : '#000000'}
                      stroke="#ffffff" strokeWidth="2"
                    />
                  ))}
                </g>
              );
            }
            return null;
          })}

          <g style={{ pointerEvents: isToolBusy ? 'none' : 'auto' }}>
            {visualOverlays.map(overlay => {
              if (overlay.activeShape || (overlay.drawingShape && overlay.type !== 'polygon')) {
                const isActiveTab = overlay.id === activeOverlayId || (!!overlay.drawingShape && !overlay.activeShape);
                return (
                  <SelectionShapeRenderer
                    key={overlay.id}
                    selectionId={overlay.id}
                    type={overlay.type as any}
                    actualShape={getSelectionShapePoints(overlay)}
                    isDrawing={!!overlay.drawingShape}
                    isEditable={!overlay.confirmed}
                    isInteractive={!isToolBusy && isActiveTab && subSelectMode === 'none'}
                    isActive={isActiveTab}
                    onCornerDragStart={handleCornerDragStart}
                    onLineDragStart={handleLineDragStart}
                    onContainerCornerDragStart={handleContainerCornerDragStart}
                    onContainerEdgeDragStart={handleContainerEdgeDragStart}
                    onRotateHandleDragStart={handleRotateHandleDragStart}
                    onMoveDragStart={handleMoveDragStart}
                  />
                );
              }
              return null;
            })}

            {!isToolBusy && visualOverlays.map(overlay => {
              if (overlay.activeShape && overlay.id === activeOverlayId) {
                const pos = getControlsPosition(overlay);
                return (
                  <SelectionControls
                    key={`controls_${overlay.id}`}
                    selectionId={overlay.id}
                    position={{ x: pos.x, y: pos.y }}
                    isConfirmed={overlay.confirmed || false}
                    subSelectMode={subSelectMode}
                    onDelete={handleDeleteOverlay}
                    onConfirm={handleConfirmSelection}
                    onEdit={handleEditSelection}
                    onToggleSubMode={(mode) => setSubSelectMode(mode)}
                    layout={pos.layout}
                  />
                );
              }
              return null;
            })}
          </g>
        </svg>

        <LinesSidebar
          lineRuns={lineRuns}
          isConfirmed={activeOverlay?.confirmed ?? false}
          onDetailCommit={forceRecalculateAllSelectedElements}
        />
      </div>

      {cursorPos && (
        <div style={{
          position: 'absolute', bottom: 10, right: 12,
          fontSize: 11, fontVariantNumeric: 'tabular-nums',
          color: 'rgba(255,255,255,0.45)',
          pointerEvents: 'none', userSelect: 'none',
          letterSpacing: '0.04em',
        }}>
          {Math.round(cursorPos.x)}, {Math.round(cursorPos.y)}
        </div>
      )}
    </div>
  );
};

export default Board;
