import { useSVGContext } from '../context/SVGContext';
import { useSelectionContext } from '../context/SelectionContext';
import { Point } from '../types';
import { deepClone } from '../utils';

export const usePolygonHistory = () => {
  const { svgObject, setSvgObject } = useSVGContext();
  const { selection } = useSelectionContext();

  const addToPolygonHistory = (polygonId: string, newPoints: Point[]) => {
    setSvgObject((prev) => ({
      ...prev,
      polygons: prev.polygons.map((poly) => {
        if (poly.id !== polygonId) return poly;
        const newHistory = poly.history.slice(0, poly.historyIndex + 1);
        newHistory.push(deepClone(newPoints));
        return { ...poly, points: newPoints, history: newHistory, historyIndex: newHistory.length - 1 };
      }),
    }));
  };

  const undoPolygon = () => {
    if (!selection.polygonId) return;
    const poly = svgObject.polygons.find((p) => p.id === selection.polygonId);
    if (!poly || poly.historyIndex <= 0) return;

    setSvgObject((prev) => ({
      ...prev,
      polygons: prev.polygons.map((p) => {
        if (p.id !== selection.polygonId) return p;
        const newIndex = p.historyIndex - 1;
        return { ...p, points: deepClone(p.history[newIndex]), historyIndex: newIndex };
      }),
    }));
  };

  const redoPolygon = () => {
    if (!selection.polygonId) return;
    const poly = svgObject.polygons.find((p) => p.id === selection.polygonId);
    if (!poly || poly.historyIndex >= poly.history.length - 1) return;

    setSvgObject((prev) => ({
      ...prev,
      polygons: prev.polygons.map((p) => {
        if (p.id !== selection.polygonId) return p;
        const newIndex = p.historyIndex + 1;
        return { ...p, points: deepClone(p.history[newIndex]), historyIndex: newIndex };
      }),
    }));
  };

  const canUndoPolygon = (() => {
    if (!selection.polygonId) return false;
    const poly = svgObject.polygons.find((p) => p.id === selection.polygonId);
    return poly ? poly.historyIndex > 0 : false;
  })();

  const canRedoPolygon = (() => {
    if (!selection.polygonId) return false;
    const poly = svgObject.polygons.find((p) => p.id === selection.polygonId);
    return poly ? poly.historyIndex < poly.history.length - 1 : false;
  })();

  const undoPolygonById = (polygonId: string) => {
    const poly = svgObject.polygons.find((p) => p.id === polygonId);
    if (!poly || poly.historyIndex <= 0) return;
    setSvgObject((prev) => ({
      ...prev,
      polygons: prev.polygons.map((p) => {
        if (p.id !== polygonId) return p;
        const newIndex = p.historyIndex - 1;
        return { ...p, points: deepClone(p.history[newIndex]), historyIndex: newIndex };
      }),
    }));
  };

  const redoPolygonById = (polygonId: string) => {
    const poly = svgObject.polygons.find((p) => p.id === polygonId);
    if (!poly || poly.historyIndex >= poly.history.length - 1) return;
    setSvgObject((prev) => ({
      ...prev,
      polygons: prev.polygons.map((p) => {
        if (p.id !== polygonId) return p;
        const newIndex = p.historyIndex + 1;
        return { ...p, points: deepClone(p.history[newIndex]), historyIndex: newIndex };
      }),
    }));
  };

  const canUndoById = (polygonId: string) => {
    const poly = svgObject.polygons.find((p) => p.id === polygonId);
    return poly ? poly.historyIndex > 0 : false;
  };

  const canRedoById = (polygonId: string) => {
    const poly = svgObject.polygons.find((p) => p.id === polygonId);
    return poly ? poly.historyIndex < poly.history.length - 1 : false;
  };

  return { addToPolygonHistory, undoPolygon, redoPolygon, canUndoPolygon, canRedoPolygon, undoPolygonById, redoPolygonById, canUndoById, canRedoById };
};