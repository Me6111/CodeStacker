import { useState, useRef, useCallback, useEffect } from 'react';
import { Point } from '../types';
import { ToolContext } from '../tools';
import { useSelectionContext } from '../context/SelectionContext';

interface VisualOverlayItem {
  id: string;
  activeShape?: any;
  drawingShape?: any;
  type: string;
  confirmed?: boolean;
  source?: 'objectmap' | 'manual';
  targetPolygonId?: string | null;
}

type SVGSnapshot = { [polygonId: string]: { [pointIndex: number]: Point } };

export const useSelectionShapeHandling = (
  svgObject: any,
  currentTool: any,
  setSvgObject: (obj: any) => void,
  onCommitHistory?: (polygons: any[]) => void,
  onCommitPolygonHistory?: (polygonId: string, points: Point[]) => void
) => {
  const [visualOverlays, setVisualOverlays] = useState<VisualOverlayItem[]>([]);
  const [selectedElementsMap, setSelectedElementsMap] = useState<{ [id: string]: { polygonId: string; points: number[]; lines: number[] }[] }>({});
  const [draggingSelectionHandle, setDraggingSelectionHandle] = useState<{
    selectionId: string;
    type: 'corner' | 'line' | 'containerCorner' | 'containerEdge' | 'rotate' | 'move';
    index?: number;
    key?: string;
  } | null>(null);

  const dragStartPosRef = useRef<Point | null>(null);
  const oldBoundsRef = useRef<any>(null);
  const cornerInitialPosRef = useRef<Point | null>(null);
  const lineDragInitialPosRef = useRef<{ [key: number]: Point } | null>(null);
  const rotateCenterRef = useRef<Point | null>(null);
  const rotateInitialShapeRef = useRef<any>(null);
  const moveInitialShapeRef = useRef<any>(null);
  // Snapshot of the overlay shape at drag-start for all scale operations (corner/edge/containerCorner/containerEdge).
  // Using the current overlay shape as the transform source compounds on each frame → runaway scaling.
  const scaleInitialShapeRef = useRef<any>(null);
  const currentDrawingIdRef = useRef<string | null>(null);
  const svgInitialPointsRef = useRef<SVGSnapshot | null>(null);

  const { selection: mapSelection } = useSelectionContext();

  const svgObjectRef = useRef(svgObject);
  useEffect(() => { svgObjectRef.current = svgObject; }, [svgObject]);

  const selectedElementsMapRef = useRef(selectedElementsMap);
  useEffect(() => { selectedElementsMapRef.current = selectedElementsMap; }, [selectedElementsMap]);

  const visualOverlaysRef = useRef(visualOverlays);
  useEffect(() => { visualOverlaysRef.current = visualOverlays; }, [visualOverlays]);

  // Tracks the last-seen activeShape reference per manual overlay.
  // Prevents element drift when poly.points change (Detail slider) without the selection shape moving.
  const prevManualShapesRef = useRef<Map<string, any>>(new Map());

  const copyShape = (shape: any, type: string) => {
    if (type === 'rectangle') return { topLeft: { ...shape.topLeft }, bottomRight: { ...shape.bottomRight } };
    return { points: (shape.points as Point[]).map((p: Point) => ({ ...p })) };
  };

  const isPointInPolygon = (point: Point, polygon: Point[]): boolean => {
    if (polygon.length < 3) return false;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      const intersect = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const isPointInRectangle = (point: Point, shape: { topLeft: Point; bottomRight: Point }): boolean => {
    const minX = Math.min(shape.topLeft.x, shape.bottomRight.x);
    const maxX = Math.max(shape.topLeft.x, shape.bottomRight.x);
    const minY = Math.min(shape.topLeft.y, shape.bottomRight.y);
    const maxY = Math.max(shape.topLeft.y, shape.bottomRight.y);
    return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
  };

const getBoundingRect = (points: Point[]) => {
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
  };

  const snapshotSVGPoints = (selectionId: string) => {
    const overlay = visualOverlaysRef.current.find(o => o.id === selectionId);
    if (!overlay?.confirmed) { svgInitialPointsRef.current = null; return; }
    const selectedElements = selectedElementsMapRef.current[selectionId] || [];
    const snapshot: SVGSnapshot = {};
    for (const { polygonId, points, lines } of selectedElements) {
      const poly = svgObjectRef.current.polygons.find((p: any) => p.id === polygonId);
      if (!poly) continue;
      const N = poly.points.length;
      if (!snapshot[polygonId]) snapshot[polygonId] = {};
      for (const idx of points) {
        if (idx >= N) continue;
        snapshot[polygonId][idx] = { ...poly.points[idx] };
      }
      for (const lineIdx of lines) {
        if (lineIdx >= N) continue;
        const ni = (lineIdx + 1) % N;
        if (snapshot[polygonId][lineIdx] === undefined) snapshot[polygonId][lineIdx] = { ...poly.points[lineIdx] };
        if (snapshot[polygonId][ni] === undefined) snapshot[polygonId][ni] = { ...poly.points[ni] };
      }
    }
    svgInitialPointsRef.current = Object.keys(snapshot).length > 0 ? snapshot : null;
  };

  const applyTransformToSVG = (getNewPos: (init: Point) => Point, polygonId?: string, applyToOriginalPoints = false) => {
    if (!svgInitialPointsRef.current) return;
    const snapshot = svgInitialPointsRef.current;
    const newPolygons = svgObjectRef.current.polygons.map((poly: any) => {
      if (polygonId && poly.id !== polygonId) return poly;
      const polySnapshot = snapshot[poly.id];
      if (!polySnapshot) return poly;
      const newPoints = [...poly.points];
      for (const [idxStr, initPos] of Object.entries(polySnapshot)) {
        newPoints[Number(idxStr)] = getNewPos(initPos as Point);
      }
      let newOriginalPoints = poly.originalPoints as Point[] | undefined;
      if (newOriginalPoints) {
        const allSelected = Object.keys(polySnapshot).length >= poly.points.length;
        if (allSelected) {
          // Move/rotate: safe to apply uniform transform to originalPoints.
          // Scale: ob is derived from simplified bounds, extrapolates originalPoints outside ob → corrupt coords. Clear instead.
          newOriginalPoints = applyToOriginalPoints
            ? newOriginalPoints.map((pt: Point) => getNewPos(pt))
            : undefined;
        }
        // Partial selection: keep originalPoints unchanged (not all points moved)
      }
      return { ...poly, points: newPoints, originalPoints: newOriginalPoints, fragmentOriginalPoints: undefined };
    });
    setSvgObject({ ...svgObjectRef.current, polygons: newPolygons });
  };

  const calculateSelectedElements = useCallback((overlay: VisualOverlayItem) => {
    const effectiveShape = overlay.activeShape ?? overlay.drawingShape;
    if (!effectiveShape) return [];
    const results: { polygonId: string; points: number[]; lines: number[] }[] = [];

    const atPolygonScope = mapSelection.level === 'polygon' || mapSelection.level === 'line' || mapSelection.level === 'point';
    const scopedPolygons = atPolygonScope
      ? svgObject.polygons.filter((p: any) => p.id === mapSelection.polygonId)
      : svgObject.polygons;

    for (const poly of scopedPolygons) {
      const selectedPoints: number[] = [];
      const selectedLines: number[] = [];

      const allPointIndices: number[] = poly.points.map((_: any, i: number) => i);
      const pointScope = mapSelection.level === 'point' && mapSelection.polygonId === poly.id && mapSelection.elementIndex !== null
        ? [mapSelection.elementIndex] : allPointIndices;
      const lineScope = mapSelection.level === 'line' && mapSelection.polygonId === poly.id && mapSelection.elementIndex !== null
        ? [mapSelection.elementIndex] : allPointIndices;

      const checkInside = (pt: Point): boolean => {
        if (overlay.type === 'rectangle') return isPointInRectangle(pt, effectiveShape);
        if (overlay.type === 'freeform' || overlay.type === 'polygon') {
          return (effectiveShape.points?.length ?? 0) >= 3 ? isPointInPolygon(pt, effectiveShape.points) : false;
        }
        return false;
      };
      for (const i of pointScope) {
        if (checkInside(poly.points[i])) selectedPoints.push(i);
      }
      for (const i of lineScope) {
        const ni = (i + 1) % poly.points.length;
        if (checkInside(poly.points[i]) && checkInside(poly.points[ni])) selectedLines.push(i);
      }
      if (selectedPoints.length > 0 || selectedLines.length > 0) results.push({ polygonId: poly.id, points: selectedPoints, lines: selectedLines });
    }
    return results;
  }, [svgObject.polygons, mapSelection.level, mapSelection.polygonId, mapSelection.elementIndex]);

  const prevCalculateRef = useRef(calculateSelectedElements);

  const recalculateAllSelectedElements = useCallback(() => {
    const shapeCache = prevManualShapesRef.current;
    // When the scope changes (e.g. switching polygons in ObjectMap), calculateSelectedElements
    // gets a new reference. Clear the shape cache so all overlays are recomputed with the new scope.
    if (prevCalculateRef.current !== calculateSelectedElements) {
      shapeCache.clear();
      prevCalculateRef.current = calculateSelectedElements;
    }
    const updates: { [id: string]: { polygonId: string; points: number[]; lines: number[] }[] } = {};

    visualOverlays.forEach(overlay => {
      if (overlay.source === 'objectmap') return;
      // For confirmed overlays that are being dragged: skip recalculation mid-flight.
      if (overlay.confirmed && draggingSelectionHandle?.selectionId === overlay.id) return;
      const effectiveShape = overlay.activeShape ?? overlay.drawingShape;
      // Always recalculate for overlays being actively drawn — the tool mutates drawingShape
      // in place so the reference never changes, but the coordinates do on every frame.
      const isBeingDrawn = !overlay.activeShape && !!overlay.drawingShape;
      if (!isBeingDrawn && shapeCache.get(overlay.id) === effectiveShape) return;
      updates[overlay.id] = calculateSelectedElements(overlay);
    });

    // Keep shape cache in sync so the next call has the right baseline.
    visualOverlays.forEach(overlay => {
      if (overlay.source !== 'objectmap') shapeCache.set(overlay.id, overlay.activeShape ?? overlay.drawingShape);
    });

    if (Object.keys(updates).length > 0) {
      setSelectedElementsMap(prev => ({ ...prev, ...updates }));
    }
  }, [visualOverlays, calculateSelectedElements, draggingSelectionHandle]);

  useEffect(() => { recalculateAllSelectedElements(); }, [recalculateAllSelectedElements]);

  const handleCornerDragStart = useCallback((selectionId: string, cornerIndex: number) => {
    if (!dragStartPosRef.current) return;
    const overlay = visualOverlaysRef.current.find(o => o.id === selectionId);
    if (!overlay?.activeShape) return;
    if (currentTool?.loadShape) currentTool.loadShape(overlay.activeShape);
    if (overlay.activeShape.points) {
      oldBoundsRef.current = getBoundingRect(overlay.activeShape.points);
      cornerInitialPosRef.current = { ...overlay.activeShape.points[cornerIndex] };
    } else {
      oldBoundsRef.current = { ...overlay.activeShape };
      cornerInitialPosRef.current = null;
    }
    scaleInitialShapeRef.current = copyShape(overlay.activeShape, overlay.type);
    snapshotSVGPoints(selectionId);
    setDraggingSelectionHandle({ selectionId, type: 'corner', index: cornerIndex });
  }, [currentTool]);

  const handleLineDragStart = useCallback((selectionId: string, lineIndex: number) => {
    if (!dragStartPosRef.current) return;
    const overlay = visualOverlaysRef.current.find(o => o.id === selectionId);
    if (!overlay?.activeShape?.points) return;
    if (overlay?.activeShape && currentTool?.loadShape) currentTool.loadShape(overlay.activeShape);
    const nextIdx = (lineIndex + 1) % overlay.activeShape.points.length;
    lineDragInitialPosRef.current = {
      [lineIndex]: { ...overlay.activeShape.points[lineIndex] },
      [nextIdx]: { ...overlay.activeShape.points[nextIdx] },
    };
    oldBoundsRef.current = getBoundingRect(overlay.activeShape.points);
    snapshotSVGPoints(selectionId);
    setDraggingSelectionHandle({ selectionId, type: 'line', index: lineIndex });
  }, [currentTool]);

  const handleContainerCornerDragStart = useCallback((selectionId: string, corner: string) => {
    if (!dragStartPosRef.current) return;
    const overlay = visualOverlaysRef.current.find(o => o.id === selectionId);
    if (!overlay?.activeShape) return;
    if (currentTool?.loadShape) currentTool.loadShape(overlay.activeShape);
    if (overlay.type === 'rectangle') oldBoundsRef.current = { ...overlay.activeShape };
    else oldBoundsRef.current = getBoundingRect(overlay.activeShape.points);
    scaleInitialShapeRef.current = copyShape(overlay.activeShape, overlay.type);
    snapshotSVGPoints(selectionId);
    setDraggingSelectionHandle({ selectionId, type: 'containerCorner', key: corner });
  }, [currentTool]);

  const handleContainerEdgeDragStart = useCallback((selectionId: string, edge: string) => {
    if (!dragStartPosRef.current) return;
    const overlay = visualOverlaysRef.current.find(o => o.id === selectionId);
    if (!overlay?.activeShape) return;
    if (currentTool?.loadShape) currentTool.loadShape(overlay.activeShape);
    if (overlay.type === 'rectangle') oldBoundsRef.current = { ...overlay.activeShape };
    else oldBoundsRef.current = getBoundingRect(overlay.activeShape.points);
    scaleInitialShapeRef.current = copyShape(overlay.activeShape, overlay.type);
    snapshotSVGPoints(selectionId);
    setDraggingSelectionHandle({ selectionId, type: 'containerEdge', key: edge });
  }, [currentTool]);

  const handleMoveDragStart = useCallback((selectionId: string) => {
    if (!dragStartPosRef.current) return;
    const overlay = visualOverlaysRef.current.find(o => o.id === selectionId);
    if (!overlay?.activeShape) return;
    if (currentTool?.loadShape) currentTool.loadShape(overlay.activeShape);
    moveInitialShapeRef.current = overlay.type === 'rectangle'
      ? { ...overlay.activeShape }
      : { points: overlay.activeShape.points.map((p: Point) => ({ ...p })) };
    snapshotSVGPoints(selectionId);
    setDraggingSelectionHandle({ selectionId, type: 'move' });
  }, [currentTool]);

  const handleRotateHandleDragStart = useCallback((selectionId: string) => {
    if (!dragStartPosRef.current) return;
    const overlay = visualOverlaysRef.current.find(o => o.id === selectionId);
    if (!overlay?.activeShape) return;
    if (currentTool?.loadShape) currentTool.loadShape(overlay.activeShape);
    let initPoints: Point[];
    let centerX = 0, centerY = 0;
    if (overlay.type === 'rectangle') {
      const tl = overlay.activeShape.topLeft;
      const br = overlay.activeShape.bottomRight;
      const minX = Math.min(tl.x, br.x), maxX = Math.max(tl.x, br.x);
      const minY = Math.min(tl.y, br.y), maxY = Math.max(tl.y, br.y);
      initPoints = [{ x: minX, y: minY }, { x: maxX, y: minY }, { x: maxX, y: maxY }, { x: minX, y: maxY }];
      centerX = (minX + maxX) / 2; centerY = (minY + maxY) / 2;
    } else {
      initPoints = overlay.activeShape.points.map((p: Point) => ({ ...p }));
      const rect = getBoundingRect(initPoints);
      centerX = (rect.minX + rect.maxX) / 2; centerY = (rect.minY + rect.maxY) / 2;
    }
    rotateInitialShapeRef.current = { points: initPoints };
    rotateCenterRef.current = { x: centerX, y: centerY };
    snapshotSVGPoints(selectionId);
    setDraggingSelectionHandle({ selectionId, type: 'rotate' });
  }, [currentTool]);

  const RECT_CORNER_KEYS: Record<number, string> = { 0: 'topLeft', 1: 'topRight', 2: 'bottomRight', 3: 'bottomLeft' };

  const handleSelectionDrag = useCallback((point: Point, context: ToolContext) => {
    if (!draggingSelectionHandle || !dragStartPosRef.current) return null;
    let result: any = null;
    const { type, selectionId } = draggingSelectionHandle;
    const overlay = visualOverlaysRef.current.find(o => o.id === selectionId);
    const isConfirmed = overlay?.confirmed;

    if (type === 'corner') {
      if (isConfirmed && svgInitialPointsRef.current && oldBoundsRef.current && scaleInitialShapeRef.current) {
        if (overlay!.type === 'rectangle') {
          const cornerKey = RECT_CORNER_KEYS[draggingSelectionHandle.index!];
          if (cornerKey) {
            const ob = normalizeOldBounds(oldBoundsRef.current, 'rectangle');
            const nb = newBoundsFromCorner(cornerKey, point, ob);
            const newShape = applyScaleToShape(scaleInitialShapeRef.current, 'rectangle', ob, nb);
            setVisualOverlays(prev => prev.map(o => o.id === selectionId ? { ...o, activeShape: newShape } : o));
            applyTransformToSVG((init) => scaledPoint(init, ob, nb));
          }
        } else if (cornerInitialPosRef.current) {
          const ob = oldBoundsRef.current as { minX: number; maxX: number; minY: number; maxY: number };
          const newPoints = (scaleInitialShapeRef.current.points as Point[]).map((p: Point, i: number) =>
            i === draggingSelectionHandle.index! ? { x: point.x, y: point.y } : { ...p }
          );
          const nb = getBoundingRect(newPoints);
          setVisualOverlays(prev => prev.map(o => o.id === selectionId ? { ...o, activeShape: { points: newPoints } } : o));
          applyTransformToSVG((init) => scaledPoint(init, ob, nb));
        }
        return null;
      }
      if (!isConfirmed && overlay?.activeShape && scaleInitialShapeRef.current) {
        const idx = draggingSelectionHandle.index!;
        if (overlay.type === 'rectangle') {
          const tl = { ...scaleInitialShapeRef.current.topLeft };
          const br = { ...scaleInitialShapeRef.current.bottomRight };
          if (idx === 0) { tl.x = point.x; tl.y = point.y; }
          else if (idx === 1) { br.x = point.x; tl.y = point.y; }
          else if (idx === 2) { br.x = point.x; br.y = point.y; }
          else if (idx === 3) { tl.x = point.x; br.y = point.y; }
          setVisualOverlays(prev => prev.map(o => o.id === selectionId ? { ...o, activeShape: { topLeft: tl, bottomRight: br } } : o));
        } else {
          const newPoints = (scaleInitialShapeRef.current.points as Point[]).map((p: Point, i: number) =>
            i === idx ? { x: point.x, y: point.y } : { ...p }
          );
          setVisualOverlays(prev => prev.map(o => o.id === selectionId ? { ...o, activeShape: { points: newPoints } } : o));
        }
        return null;
      }
      if (currentTool.updateCorner) result = currentTool.updateCorner(draggingSelectionHandle.index!, point, context);

    } else if (type === 'line' && lineDragInitialPosRef.current) {
      const dx = point.x - dragStartPosRef.current.x;
      const dy = point.y - dragStartPosRef.current.y;
      if (isConfirmed && svgInitialPointsRef.current) {
        const lineIdx = draggingSelectionHandle.index!;
        const initPos = lineDragInitialPosRef.current;
        const pts: Point[] = overlay!.activeShape.points;
        const nextIdx = (lineIdx + 1) % pts.length;
        const newPoints = pts.map((p: Point, i: number) => {
          if (i === lineIdx) return { x: initPos[lineIdx].x + dx, y: initPos[lineIdx].y + dy };
          if (i === nextIdx) return { x: initPos[nextIdx].x + dx, y: initPos[nextIdx].y + dy };
          return p;
        });
        setVisualOverlays(prev => prev.map(o => o.id === selectionId ? { ...o, activeShape: { points: newPoints } } : o));
        applyTransformToSVG((init) => ({ x: init.x + dx, y: init.y + dy }), undefined, true);
        return null;
      }
      if (!isConfirmed && overlay?.activeShape?.points && lineDragInitialPosRef.current) {
        const lineIdx = draggingSelectionHandle.index!;
        const initPos = lineDragInitialPosRef.current;
        const pts: Point[] = overlay.activeShape.points;
        const nextIdx = (lineIdx + 1) % pts.length;
        const newPoints = pts.map((p: Point, i: number) => {
          if (i === lineIdx) return { x: initPos[lineIdx].x + dx, y: initPos[lineIdx].y + dy };
          if (i === nextIdx) return { x: initPos[nextIdx].x + dx, y: initPos[nextIdx].y + dy };
          return { ...p };
        });
        setVisualOverlays(prev => prev.map(o => o.id === selectionId ? { ...o, activeShape: { points: newPoints } } : o));
        return null;
      }
      if (currentTool.updateLine) result = currentTool.updateLine(draggingSelectionHandle.index!, { dx, dy }, lineDragInitialPosRef.current, context);

    } else if (type === 'containerCorner') {
      if (oldBoundsRef.current && scaleInitialShapeRef.current) {
        const ob = normalizeOldBounds(oldBoundsRef.current, overlay!.type);
        const nb = newBoundsFromCorner(draggingSelectionHandle.key!, point, ob);
        const newShape = applyScaleToShape(scaleInitialShapeRef.current, overlay!.type, ob, nb);
        setVisualOverlays(prev => prev.map(o => o.id === selectionId ? { ...o, activeShape: newShape } : o));
        if (isConfirmed && svgInitialPointsRef.current) applyTransformToSVG((init) => scaledPoint(init, ob, nb));
        return null;
      }
      if (currentTool.updateContainerCorner) result = currentTool.updateContainerCorner(draggingSelectionHandle.key!, point, oldBoundsRef.current, context);

    } else if (type === 'containerEdge') {
      if (oldBoundsRef.current && scaleInitialShapeRef.current) {
        const ob = normalizeOldBounds(oldBoundsRef.current, overlay!.type);
        const nb = newBoundsFromEdge(draggingSelectionHandle.key!, point, ob);
        const newShape = applyScaleToShape(scaleInitialShapeRef.current, overlay!.type, ob, nb);
        setVisualOverlays(prev => prev.map(o => o.id === selectionId ? { ...o, activeShape: newShape } : o));
        if (isConfirmed && svgInitialPointsRef.current) applyTransformToSVG((init) => scaledPoint(init, ob, nb));
        return null;
      }
      if (currentTool.updateContainerEdge) result = currentTool.updateContainerEdge(draggingSelectionHandle.key!, point, oldBoundsRef.current, context);

    } else if (type === 'move' && moveInitialShapeRef.current) {
      const dx = point.x - dragStartPosRef.current.x;
      const dy = point.y - dragStartPosRef.current.y;
      const newShape = applyMoveToShape(moveInitialShapeRef.current, overlay!.type, dx, dy);
      setVisualOverlays(prev => prev.map(o => o.id === selectionId ? { ...o, activeShape: newShape } : o));
      if (isConfirmed && svgInitialPointsRef.current) applyTransformToSVG((init) => ({ x: init.x + dx, y: init.y + dy }), undefined, true);
      return null;

    } else if (type === 'rotate' && rotateCenterRef.current && rotateInitialShapeRef.current) {
      const center = rotateCenterRef.current;
      const startAngle = Math.atan2(dragStartPosRef.current.y - center.y, dragStartPosRef.current.x - center.x);
      const currentAngle = Math.atan2(point.y - center.y, point.x - center.x);
      const angle = currentAngle - startAngle;
      const rot = (p: Point): Point => ({
        x: center.x + (p.x - center.x) * Math.cos(angle) - (p.y - center.y) * Math.sin(angle),
        y: center.y + (p.x - center.x) * Math.sin(angle) + (p.y - center.y) * Math.cos(angle),
      });
      const initPts = rotateInitialShapeRef.current.points as Point[];
      const newPoints = initPts.map(rot);
      setVisualOverlays(prev => prev.map(o => o.id === selectionId ? { ...o, type: 'polygon', activeShape: { points: newPoints } } : o));
      if (isConfirmed && svgInitialPointsRef.current) applyTransformToSVG(rot, undefined, true);
      return null;
    }

    if (result) {
      const updatedOverlay = currentTool.getVisualOverlay?.();
      if (updatedOverlay) {
        setVisualOverlays(prev => prev.map(o => o.id === selectionId ? { ...o, ...updatedOverlay } : o));
        setSelectedElementsMap(prev => ({ ...prev, [selectionId]: result.selectedElements }));
      }
    }

    return result;
  }, [draggingSelectionHandle, currentTool]);

  const getSelectionShapePoints = (overlay: VisualOverlayItem): Point[] => {
    if (overlay.activeShape) {
      if (overlay.type === 'rectangle') {
        const { topLeft, bottomRight } = overlay.activeShape;
        return [topLeft, { x: bottomRight.x, y: topLeft.y }, bottomRight, { x: topLeft.x, y: bottomRight.y }];
      } else if (overlay.type === 'polygon' || overlay.type === 'freeform') {
        return overlay.activeShape.points;
      }
    }
    if (overlay.drawingShape) {
      if (overlay.type === 'rectangle') {
        const { topLeft, bottomRight } = overlay.drawingShape;
        return [topLeft, { x: bottomRight.x, y: topLeft.y }, bottomRight, { x: topLeft.x, y: bottomRight.y }];
      } else if (overlay.type === 'polygon' || overlay.type === 'freeform') {
        return overlay.drawingShape.points;
      }
    }
    return [];
  };

  const addOrUpdateOverlay = (overlay: any) => {
    if (overlay.drawingShape) {
      if (currentDrawingIdRef.current) {
        setVisualOverlays(prev => prev.map(o =>
          o.id === currentDrawingIdRef.current
            ? { ...o, drawingShape: overlay.drawingShape, type: overlay.type }
            : o
        ));
      } else {
        const newId = `selection_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        currentDrawingIdRef.current = newId;
        setVisualOverlays(prev => [...prev, { id: newId, drawingShape: overlay.drawingShape, type: overlay.type, confirmed: false }]);
      }
    } else if (overlay.activeShape) {
      if (currentDrawingIdRef.current) {
        const id = currentDrawingIdRef.current;
        currentDrawingIdRef.current = null;
        setVisualOverlays(prev => prev.map(o =>
          o.id === id
            ? { id: o.id, activeShape: overlay.activeShape, type: overlay.type, confirmed: false }
            : o
        ));
        if (currentTool?.clearSelection) currentTool.clearSelection();
      }
    }
  };

  const deleteOverlay = (id: string) => {
    if (currentTool?.clearSelection) currentTool.clearSelection();
    if (currentDrawingIdRef.current === id) currentDrawingIdRef.current = null;
    setVisualOverlays(prev => prev.filter(o => o.id !== id));
    setSelectedElementsMap(prev => { const m = { ...prev }; delete m[id]; return m; });
  };

  const confirmSelection = (id: string) => {
    setVisualOverlays(prev => prev.map(o => o.id === id ? { ...o, confirmed: true } : o));
  };

  const editSelection = (id: string) => {
    setVisualOverlays(prev => prev.map(o => o.id === id ? { ...o, confirmed: false } : o));
  };

  const clearCurrentDrawing = useCallback(() => {
    if (currentDrawingIdRef.current) {
      const id = currentDrawingIdRef.current;
      currentDrawingIdRef.current = null;
      setVisualOverlays(prev => prev.filter(o => o.id !== id));
    }
  }, []);

  // Commit to undo history after any confirmed selection drag
  const clearDragging = useCallback(() => {
    const hadTransform = svgInitialPointsRef.current !== null;
    const affectedPolygonIds = hadTransform ? Object.keys(svgInitialPointsRef.current!) : [];
    setDraggingSelectionHandle(null);
    dragStartPosRef.current = null;
    oldBoundsRef.current = null;
    cornerInitialPosRef.current = null;
    lineDragInitialPosRef.current = null;
    rotateCenterRef.current = null;
    rotateInitialShapeRef.current = null;
    moveInitialShapeRef.current = null;
    scaleInitialShapeRef.current = null;
    svgInitialPointsRef.current = null;
    if (currentTool?.clearSelection) currentTool.clearSelection();
    if (hadTransform && onCommitHistory) {
      onCommitHistory(svgObjectRef.current.polygons);
      if (onCommitPolygonHistory) {
        for (const polygonId of affectedPolygonIds) {
          const poly = svgObjectRef.current.polygons.find((p: any) => p.id === polygonId);
          if (poly) onCommitPolygonHistory(polygonId, poly.points);
        }
      }
    }
  }, [currentTool, onCommitHistory, onCommitPolygonHistory]);

  // Create a confirmed bounding-box overlay for the given polygon(s), sourced from ObjectMap.
  // Replaces only the previous objectmap overlay — manually drawn selections are preserved.
  const createConfirmedSelectionForPolygon = useCallback((polygonId: string | null) => {
    const polygons: any[] = polygonId
      ? svgObjectRef.current.polygons.filter((p: any) => p.id === polygonId)
      : svgObjectRef.current.polygons;
    if (polygons.length === 0) return;
    const allPoints = polygons.flatMap((p: any) => p.points);
    if (allPoints.length === 0) return;
    const xs = allPoints.map((p: any) => p.x);
    const ys = allPoints.map((p: any) => p.y);
    const newOverlay: VisualOverlayItem = {
      id: `sel_all_${Date.now()}`,
      type: 'rectangle',
      activeShape: {
        topLeft: { x: Math.min(...xs) - 10, y: Math.min(...ys) - 10 },
        bottomRight: { x: Math.max(...xs) + 10, y: Math.max(...ys) + 10 },
      },
      confirmed: true,
      source: 'objectmap',
      targetPolygonId: polygonId,
    };
    const elements = polygons.map((poly: any) => ({
      polygonId: poly.id,
      points: poly.points.map((_: any, i: number) => i),
      lines: poly.points.map((_: any, i: number) => i),
    }));
    currentDrawingIdRef.current = null;
    const existingObjectmapId = visualOverlaysRef.current.find(o => o.source === 'objectmap')?.id;
    setVisualOverlays(prev => [...prev.filter(o => o.source !== 'objectmap'), newOverlay]);
    setSelectedElementsMap(prev => {
      const next = { ...prev };
      if (existingObjectmapId) delete next[existingObjectmapId];
      next[newOverlay.id] = elements;
      return next;
    });
  }, []);

  // Recompute bounding box for every objectmap overlay from current polygon points.
  // Pass skipId to leave the actively-dragged overlay alone while dragging.
  const updateObjectmapOverlayBounds = useCallback((polygons: any[], skipId?: string | null) => {
    setVisualOverlays(prev => {
      let changed = false;
      const next = prev.map(overlay => {
        if (overlay.source !== 'objectmap') return overlay;
        if (skipId && overlay.id === skipId) return overlay;

        let targetPoints: Point[];
        if (overlay.targetPolygonId === null || overlay.targetPolygonId === undefined) {
          targetPoints = polygons.flatMap((p: any) => p.points as Point[]);
        } else {
          const poly = polygons.find((p: any) => p.id === overlay.targetPolygonId);
          if (!poly || poly.points.length === 0) return overlay;
          targetPoints = poly.points as Point[];
        }
        if (targetPoints.length === 0) return overlay;

        const xs = targetPoints.map((p) => p.x);
        const ys = targetPoints.map((p) => p.y);
        const newTopLeft     = { x: Math.min(...xs) - 10, y: Math.min(...ys) - 10 };
        const newBottomRight = { x: Math.max(...xs) + 10, y: Math.max(...ys) + 10 };

        if (
          overlay.activeShape &&
          overlay.type === 'rectangle' &&
          overlay.activeShape.topLeft?.x     === newTopLeft.x &&
          overlay.activeShape.topLeft?.y     === newTopLeft.y &&
          overlay.activeShape.bottomRight?.x === newBottomRight.x &&
          overlay.activeShape.bottomRight?.y === newBottomRight.y
        ) return overlay;

        changed = true;
        return { ...overlay, type: 'rectangle', activeShape: { topLeft: newTopLeft, bottomRight: newBottomRight } };
      });
      return changed ? next : prev;
    });

    // Keep selectedElementsMap line indices in sync with current poly.points.length.
    // Without this, stale indices cause coversAll = false → Detail only affects a fragment.
    setSelectedElementsMap(prev => {
      const next = { ...prev };
      for (const overlay of visualOverlaysRef.current) {
        if (overlay.source !== 'objectmap') continue;
        if (skipId && overlay.id === skipId) continue;
        const targetPolys: any[] = overlay.targetPolygonId == null
          ? polygons
          : polygons.filter((p: any) => p.id === overlay.targetPolygonId);
        if (targetPolys.length === 0) continue;
        next[overlay.id] = targetPolys.map((poly: any) => ({
          polygonId: poly.id,
          points: poly.points.map((_: any, i: number) => i),
          lines: poly.points.map((_: any, i: number) => i),
        }));
      }
      return next;
    });
  }, []);

  // Bypass the shape cache and recompute every manual overlay's selected elements
  // from the current polygon state. Call this after undo/redo so stale index maps
  // (which were computed on a previous polygon state) are replaced immediately.
  const forceRecalculateAllSelectedElements = useCallback(() => {
    prevManualShapesRef.current.clear();
    const updates: { [id: string]: { polygonId: string; points: number[]; lines: number[] }[] } = {};
    visualOverlaysRef.current.forEach(overlay => {
      if (overlay.source === 'objectmap') return;
      if (!overlay.activeShape) return;
      updates[overlay.id] = calculateSelectedElements(overlay);
      prevManualShapesRef.current.set(overlay.id, overlay.activeShape);
    });
    if (Object.keys(updates).length > 0) {
      setSelectedElementsMap(prev => ({ ...prev, ...updates }));
    }
  }, [calculateSelectedElements]);

  const cleanupOrphanedOverlays = useCallback((currentPolygonIds: string[]) => {
    const idSet = new Set(currentPolygonIds);
    setVisualOverlays(prev => {
      const toRemove = prev.filter(o =>
        o.source === 'objectmap' &&
        o.targetPolygonId !== null && o.targetPolygonId !== undefined &&
        !idSet.has(o.targetPolygonId)
      );
      if (toRemove.length === 0) return prev;
      const removeIds = new Set(toRemove.map(o => o.id));
      if (currentDrawingIdRef.current && removeIds.has(currentDrawingIdRef.current)) {
        currentDrawingIdRef.current = null;
      }
      setSelectedElementsMap(m => {
        const next = { ...m };
        removeIds.forEach(id => delete next[id]);
        return next;
      });
      return prev.filter(o => !removeIds.has(o.id));
    });
  }, []);

  return {
    visualOverlays,
    selectedElementsMap,
    draggingSelectionHandle,
    dragStartPosRef,
    handleCornerDragStart,
    handleLineDragStart,
    handleContainerCornerDragStart,
    handleContainerEdgeDragStart,
    handleRotateHandleDragStart,
    handleMoveDragStart,
    handleSelectionDrag,
    getSelectionShapePoints,
    addOrUpdateOverlay,
    deleteOverlay,
    confirmSelection,
    editSelection,
    clearCurrentDrawing,
    clearDragging,
    createConfirmedSelectionForPolygon,
    cleanupOrphanedOverlays,
    updateObjectmapOverlayBounds,
    forceRecalculateAllSelectedElements,
  };
};

function normalizeOldBounds(ob: any, type: string) {
  if (type === 'rectangle') {
    return {
      minX: Math.min(ob.topLeft.x, ob.bottomRight.x),
      maxX: Math.max(ob.topLeft.x, ob.bottomRight.x),
      minY: Math.min(ob.topLeft.y, ob.bottomRight.y),
      maxY: Math.max(ob.topLeft.y, ob.bottomRight.y),
    };
  }
  return ob as { minX: number; maxX: number; minY: number; maxY: number };
}

function newBoundsFromCorner(corner: string, p: Point, ob: { minX: number; maxX: number; minY: number; maxY: number }) {
  let { minX, maxX, minY, maxY } = ob;
  if (corner === 'topLeft') { minX = p.x; minY = p.y; }
  else if (corner === 'topRight') { maxX = p.x; minY = p.y; }
  else if (corner === 'bottomLeft') { minX = p.x; maxY = p.y; }
  else if (corner === 'bottomRight') { maxX = p.x; maxY = p.y; }
  return { minX, maxX, minY, maxY };
}

function newBoundsFromEdge(edge: string, p: Point, ob: { minX: number; maxX: number; minY: number; maxY: number }) {
  let { minX, maxX, minY, maxY } = ob;
  if (edge === 'top') minY = p.y;
  else if (edge === 'bottom') maxY = p.y;
  else if (edge === 'left') minX = p.x;
  else if (edge === 'right') maxX = p.x;
  return { minX, maxX, minY, maxY };
}

function scaledPoint(
  init: Point,
  ob: { minX: number; maxX: number; minY: number; maxY: number },
  nb: { minX: number; maxX: number; minY: number; maxY: number }
): Point {
  const oldW = ob.maxX - ob.minX || 1;
  const oldH = ob.maxY - ob.minY || 1;
  const newW = nb.maxX - nb.minX;
  const newH = nb.maxY - nb.minY;
  return {
    x: nb.minX + (init.x - ob.minX) * (newW / oldW),
    y: nb.minY + (init.y - ob.minY) * (newH / oldH),
  };
}

function applyScaleToShape(shape: any, type: string, ob: any, nb: any): any {
  if (type === 'rectangle') {
    return {
      topLeft: scaledPoint(shape.topLeft, ob, nb),
      bottomRight: scaledPoint(shape.bottomRight, ob, nb),
    };
  }
  return { points: (shape.points as Point[]).map(p => scaledPoint(p, ob, nb)) };
}

function applyMoveToShape(shape: any, type: string, dx: number, dy: number): any {
  if (type === 'rectangle') {
    return {
      topLeft: { x: shape.topLeft.x + dx, y: shape.topLeft.y + dy },
      bottomRight: { x: shape.bottomRight.x + dx, y: shape.bottomRight.y + dy },
    };
  }
  return { points: (shape.points as Point[]).map(p => ({ x: p.x + dx, y: p.y + dy })) };
}

