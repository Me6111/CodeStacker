import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SVGObject, Polygon } from '../types';
import { deepClone, rdpSimplify, accuracyToEpsilon } from '../utils';

interface SVGContextType {
  svgObject: SVGObject;
  setSvgObject: React.Dispatch<React.SetStateAction<SVGObject>>;
  addToSVGHistory: (newPolygons: Polygon[]) => void;
  undoSVG: () => void;
  redoSVG: () => void;
  canUndoSVG: boolean;
  canRedoSVG: boolean;
  updateSVGName: (name: string) => void;
  updatePolygonName: (polygonId: string, name: string) => void;
  updateSVGDimensions: (width: number, height: number) => void;
  // polygonId=null → all polygons; fragmentScope → per-line Detail
  applyDetailLive: (
    polygonId: string | null,
    accuracy: number,
    fragmentScope?: {
      polygonId: string;
      // Sub-segment (non-wrapped runs): prefix/run/suffix captured once at drag start
      prefixPoints?: { x: number; y: number }[];
      runPoints?: { x: number; y: number }[];
      suffixPoints?: { x: number; y: number }[];
      // Wrapped runs
      lines?: number[];
      baselinePoints?: { x: number; y: number }[];
    } | null
  ) => void;
  commitDetailHistory: () => void;
  deletePolygon: (polygonId: string) => void;
  deleteSelectedElements: (elements: { polygonId: string; points: number[]; lines: number[] }[]) => void;
  deletePointFromPolygon: (polygonId: string, pointIndex: number) => void;
  clearSVG: () => void;
  appendPolygons: (newPolygons: Polygon[]) => void;
  replacePolygons: (newPolygons: Polygon[]) => void;
}

const SVGContext = createContext<SVGContextType | undefined>(undefined);

// Simplify only the runs of selected edges; non-selected points pass through unchanged.
// Source pts and selectedLines share the same index space — no mismatch possible.
function applyDetailToFragment(
  pts: { x: number; y: number }[],
  selectedLines: number[],
  epsilon: number
): { x: number; y: number }[] {
  const N = pts.length;
  if (N < 3 || selectedLines.length === 0) return pts;

  const selectedSet = new Set(selectedLines);
  if (selectedSet.size >= N) return epsilon > 0 ? rdpSimplify(pts, epsilon) : pts;

  let startIdx = -1;
  for (let i = 0; i < N; i++) {
    if (!selectedSet.has(i)) { startIdx = i; break; }
  }
  if (startIdx === -1) return pts;

  const result: { x: number; y: number }[] = [];
  let i = 0;

  while (i < N) {
    const edgeIdx = (startIdx + i) % N;
    if (!selectedSet.has(edgeIdx)) {
      result.push(pts[edgeIdx]);
      i++;
    } else {
      const subPath: { x: number; y: number }[] = [pts[edgeIdx]];
      while (i < N && selectedSet.has((startIdx + i) % N)) {
        subPath.push(pts[((startIdx + i) + 1) % N]);
        i++;
      }
      const simplified = (epsilon > 0 && subPath.length >= 3) ? rdpSimplify(subPath, epsilon) : subPath;
      result.push(...simplified.slice(0, -1));
    }
  }

  return result.length >= 3 ? result : pts;
}

export const SVGContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [svgObject, setSvgObject] = useState<SVGObject>({
    id: 'svg-1',
    name: 'SVG',
    width: 800,
    height: 600,
    polygons: [],
    history: [[]],
    historyIndex: 0,
  });

  const addToSVGHistory = (newPolygons: Polygon[]) => {
    setSvgObject((prev) => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(deepClone(newPolygons));
      return { ...prev, polygons: newPolygons, history: newHistory, historyIndex: newHistory.length - 1 };
    });
  };

  const undoSVG = () => {
    if (svgObject.historyIndex > 0) {
      const newIndex = svgObject.historyIndex - 1;
      setSvgObject((prev) => ({ ...prev, polygons: deepClone(prev.history[newIndex]), historyIndex: newIndex }));
    }
  };

  const redoSVG = () => {
    if (svgObject.historyIndex < svgObject.history.length - 1) {
      const newIndex = svgObject.historyIndex + 1;
      setSvgObject((prev) => ({ ...prev, polygons: deepClone(prev.history[newIndex]), historyIndex: newIndex }));
    }
  };

  const updateSVGName = (name: string) => setSvgObject((prev) => ({ ...prev, name }));

  const updatePolygonName = (polygonId: string, name: string) => {
    setSvgObject((prev) => ({
      ...prev,
      polygons: prev.polygons.map((poly) => (poly.id === polygonId ? { ...poly, name } : poly)),
    }));
  };

  const updateSVGDimensions = (width: number, height: number) =>
    setSvgObject((prev) => ({ ...prev, width, height }));

  const applyDetailLive = (
    polygonId: string | null,
    accuracy: number,
    fragmentScope?: {
      polygonId: string;
      prefixPoints?: { x: number; y: number }[];
      runPoints?: { x: number; y: number }[];
      suffixPoints?: { x: number; y: number }[];
      lines?: number[];
      baselinePoints?: { x: number; y: number }[];
    } | null
  ) => {
    const epsilon = accuracyToEpsilon(accuracy);
    setSvgObject((prev) => ({
      ...prev,
      polygons: prev.polygons.map((poly) => {
        // ── Per-line fragment mode ────────────────────────────────────────────
        if (fragmentScope && fragmentScope.polygonId === poly.id) {
          // Sub-segment: reconstruct entirely from captured prefix/run/suffix.
          // These were sliced from poly.points at drag start and never change,
          // so poly.points.length drift across calls cannot corrupt the result.
          // RDP always preserves endpoints → start/end anchors are immovable.
          if (fragmentScope.prefixPoints && fragmentScope.runPoints) {
            const { prefixPoints, runPoints, suffixPoints = [] } = fragmentScope;
            if (runPoints.length < 2) return poly;
            // 0% = straight line: only start and end anchors, no intermediate points.
            // RDP cannot guarantee this since it only removes points below epsilon —
            // a sharply curved path keeps points that deviate more than epsilon.
            let simplified: { x: number; y: number }[];
            if (accuracy === 0) {
              simplified = [runPoints[0], runPoints[runPoints.length - 1]];
            } else if (epsilon > 0) {
              simplified = rdpSimplify(runPoints, epsilon);
            } else {
              simplified = runPoints;
            }
            if (simplified.length < 2) return poly;
            const newPoints = [...prefixPoints, ...simplified, ...suffixPoints];
            if (newPoints.length < 3) return poly;
            return { ...poly, points: newPoints, originalPoints: poly.originalPoints, fragmentOriginalPoints: poly.fragmentOriginalPoints };
          }

          // Wrapped runs: simplify only the selected edges within the captured baseline.
          const basePts = fragmentScope.baselinePoints ?? poly.points;
          if (basePts.length < 3) return poly;
          const lines = fragmentScope.lines ?? [];
          const coversAll = lines.length >= basePts.length;
          // 0% on wrapped run = straight lines between each sub-run's anchors.
          const simplified = accuracy === 0
            ? applyDetailToFragment(basePts, lines, Infinity)
            : coversAll
              ? (epsilon > 0 ? rdpSimplify(basePts, epsilon) : basePts)
              : applyDetailToFragment(basePts, lines, epsilon);
          if (simplified.length < 3) return poly;
          return {
            ...poly,
            points: simplified,
            originalPoints: poly.originalPoints,
            fragmentOriginalPoints: poly.fragmentOriginalPoints,
          };
        }

        // ── Whole-polygon mode ────────────────────────────────────────────────
        // Non-matching polygon in fragment mode: return the same reference unchanged.
        // Without this, polygonId=null falls through here and applies rdpSimplify to
        // every other polygon in the map — corrupting them silently.
        if (fragmentScope) return poly;
        if (polygonId !== null && poly.id !== polygonId) return poly;
        const origPts = poly.originalPoints ?? poly.points;
        if (origPts.length < 3) return poly;
        const simplified = epsilon > 0 ? rdpSimplify(origPts, epsilon) : origPts;
        if (simplified.length < 3) return poly;
        return {
          ...poly,
          points: simplified,
          originalPoints: origPts,
          fragmentOriginalPoints: undefined,
        };
      }),
    }));
  };

  const deletePolygon = (polygonId: string) => {
    setSvgObject((prev) => ({ ...prev, polygons: prev.polygons.filter((p) => p.id !== polygonId) }));
  };

  const deleteSelectedElements = (elements: { polygonId: string; points: number[]; lines: number[] }[]) => {
    setSvgObject((prev) => {
      const deletionMap: { [polygonId: string]: Set<number> } = {};
      for (const elem of elements) {
        const poly = prev.polygons.find((p) => p.id === elem.polygonId);
        if (!poly) continue;
        if (!deletionMap[elem.polygonId]) deletionMap[elem.polygonId] = new Set();
        for (const idx of elem.points) deletionMap[elem.polygonId].add(idx);
        for (const lineIdx of elem.lines) {
          deletionMap[elem.polygonId].add(lineIdx);
          deletionMap[elem.polygonId].add((lineIdx + 1) % poly.points.length);
        }
      }
      const newPolygons = prev.polygons
        .map((poly) => {
          const toDelete = deletionMap[poly.id];
          if (!toDelete || toDelete.size === 0) return poly;
          const newPoints = poly.points.filter((_, i) => !toDelete.has(i));
          if (newPoints.length < 3) return null;
          return { ...poly, points: newPoints, originalPoints: undefined, fragmentOriginalPoints: undefined };
        })
        .filter(Boolean) as Polygon[];
      return { ...prev, polygons: newPolygons };
    });
  };

  const deletePointFromPolygon = (polygonId: string, pointIndex: number) => {
    setSvgObject((prev) => {
      const newPolygons = prev.polygons
        .map((poly) => {
          if (poly.id !== polygonId) return poly;
          const newPoints = poly.points.filter((_, i) => i !== pointIndex);
          if (newPoints.length < 3) return null;
          return { ...poly, points: newPoints, originalPoints: undefined, fragmentOriginalPoints: undefined };
        })
        .filter(Boolean) as Polygon[];
      return { ...prev, polygons: newPolygons };
    });
  };

  const clearSVG = () => setSvgObject((prev) => ({ ...prev, polygons: [] }));

  const appendPolygons = (newPolygons: Polygon[]) => {
    setSvgObject((prev) => {
      const merged = [...prev.polygons, ...newPolygons];
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(deepClone(merged));
      return { ...prev, polygons: merged, history: newHistory, historyIndex: newHistory.length - 1 };
    });
  };

  const replacePolygons = (newPolygons: Polygon[]) => {
    const cloned = deepClone(newPolygons);
    setSvgObject((prev) => ({
      ...prev, polygons: cloned, history: [deepClone(cloned)], historyIndex: 0,
    }));
  };

  const commitDetailHistory = () => {
    setSvgObject((prev) => {
      // Clear originalPoints so every subsequent drag starts from the committed simplified
      // state, not the original. Without this, a whole-polygon drag reuses the stale
      // originalPoints and reverts any committed fragment simplifications from other tabs.
      const polygons = prev.polygons.map(p =>
        (p.originalPoints !== undefined || p.fragmentOriginalPoints !== undefined)
          ? { ...p, originalPoints: undefined, fragmentOriginalPoints: undefined }
          : p
      );
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(deepClone(polygons));
      return { ...prev, polygons, history: newHistory, historyIndex: newHistory.length - 1 };
    });
  };

  const canUndoSVG = svgObject.historyIndex > 0;
  const canRedoSVG = svgObject.historyIndex < svgObject.history.length - 1;

  return (
    <SVGContext.Provider
      value={{
        svgObject,
        setSvgObject,
        addToSVGHistory,
        undoSVG,
        redoSVG,
        canUndoSVG,
        canRedoSVG,
        updateSVGName,
        updatePolygonName,
        updateSVGDimensions,
        applyDetailLive,
        commitDetailHistory,
        deletePolygon,
        deleteSelectedElements,
        deletePointFromPolygon,
        clearSVG,
        appendPolygons,
        replacePolygons,
      }}
    >
      {children}
    </SVGContext.Provider>
  );
};

export const useSVGContext = () => {
  const context = useContext(SVGContext);
  if (!context) throw new Error('useSVGContext must be used within SVGContextProvider');
  return context;
};
