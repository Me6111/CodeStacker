import React, { useState, useRef } from 'react';

interface Point { x: number; y: number; }

interface Polygon {
  id: string;
  points: Point[];
  closed: boolean;
  history: Point[][];
  historyIndex: number;
}

interface SVGObject {
  id: string;
  polygons: Polygon[];
  history: Polygon[][];
  historyIndex: number;
}

interface SelectionState {
  level: 'svg' | 'polygon' | 'line' | 'point' | null;
  polygonId: string | null;
  elementType: 'line' | 'point' | null;
  elementIndex: number | null;
}

interface HoverState {
  polygonId: string | null;
  elementType: 'line' | 'point' | null;
  elementIndex: number | null;
}

export default function SVGcreator() {
  const [svgObject, setSvgObject] = useState<SVGObject>({ id: 'svg-1', polygons: [], history: [[]], historyIndex: 0 });
  const [currentPolygon, setCurrentPolygon] = useState<Polygon | null>(null);
  const [selection, setSelection] = useState<SelectionState>({ level: null, polygonId: null, elementType: null, elementIndex: null });
  const [hover, setHover] = useState<HoverState>({ polygonId: null, elementType: null, elementIndex: null });
  const [expandedPolygons, setExpandedPolygons] = useState<{ [key: string]: boolean }>({});
  const [polygonViews, setPolygonViews] = useState<{ [key: string]: 'lines' | 'points' }>({});
  const [tool, setTool] = useState<'draw' | 'select' | 'move' | 'rotate' | 'split'>('draw');
  const [selectMode, setSelectMode] = useState<'rectangle' | 'freeform' | 'all' | 'polygon' | 'point' | 'line'>('polygon');
  const [selectPoints, setSelectPoints] = useState(true);
  const [selectLines, setSelectLines] = useState(true);
  const [dragging, setDragging] = useState<any>(null);
  const [rotating, setRotating] = useState<{ polygonId: string; center: Point; startAngle: number; initialPolygons: Polygon[] } | null>(null);
  const svg = useRef<SVGSVGElement>(null);

  const id = () => `${Date.now()}_${Math.random()}`;
  
  const pos = (e: React.MouseEvent) => {
    if (!svg.current) return { x: 0, y: 0 };
    const rect = svg.current.getBoundingClientRect();
    return { 
      x: e.clientX - rect.left, 
      y: e.clientY - rect.top 
    };
  };
  
  const dist = (a: Point, b: Point) => Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);

  const getCenter = (points: Point[]): Point => {
    const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    return { x: sum.x / points.length, y: sum.y / points.length };
  };

  const rotatePoint = (point: Point, center: Point, angle: number): Point => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    return {
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos
    };
  };

  const addToSVGHistory = (newPolygons: Polygon[]) => {
    setSvgObject(prev => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(newPolygons)));
      return { ...prev, polygons: newPolygons, history: newHistory, historyIndex: newHistory.length - 1 };
    });
  };

  const undoSVG = () => {
    if (svgObject.historyIndex > 0) {
      const newIndex = svgObject.historyIndex - 1;
      setSvgObject(prev => ({ ...prev, polygons: JSON.parse(JSON.stringify(prev.history[newIndex])), historyIndex: newIndex }));
    }
  };

  const redoSVG = () => {
    if (svgObject.historyIndex < svgObject.history.length - 1) {
      const newIndex = svgObject.historyIndex + 1;
      setSvgObject(prev => ({ ...prev, polygons: JSON.parse(JSON.stringify(prev.history[newIndex])), historyIndex: newIndex }));
    }
  };

  const addToPolygonHistory = (polygonId: string, newPoints: Point[]) => {
    setSvgObject(prev => ({
      ...prev,
      polygons: prev.polygons.map(poly => {
        if (poly.id !== polygonId) return poly;
        const newHistory = poly.history.slice(0, poly.historyIndex + 1);
        newHistory.push(JSON.parse(JSON.stringify(newPoints)));
        return { ...poly, points: newPoints, history: newHistory, historyIndex: newHistory.length - 1 };
      })
    }));
  };

  const undoPolygon = () => {
    if (!selection.polygonId) return;
    const poly = svgObject.polygons.find(p => p.id === selection.polygonId);
    if (!poly || poly.historyIndex <= 0) return;
    
    setSvgObject(prev => ({
      ...prev,
      polygons: prev.polygons.map(p => {
        if (p.id !== selection.polygonId) return p;
        const newIndex = p.historyIndex - 1;
        return { ...p, points: JSON.parse(JSON.stringify(p.history[newIndex])), historyIndex: newIndex };
      })
    }));
  };

  const redoPolygon = () => {
    if (!selection.polygonId) return;
    const poly = svgObject.polygons.find(p => p.id === selection.polygonId);
    if (!poly || poly.historyIndex >= poly.history.length - 1) return;
    
    setSvgObject(prev => ({
      ...prev,
      polygons: prev.polygons.map(p => {
        if (p.id !== selection.polygonId) return p;
        const newIndex = p.historyIndex + 1;
        return { ...p, points: JSON.parse(JSON.stringify(p.history[newIndex])), historyIndex: newIndex };
      })
    }));
  };

  const togglePolygon = (polygonId: string) => {
    setExpandedPolygons(prev => ({ ...prev, [polygonId]: !prev[polygonId] }));
    if (!polygonViews[polygonId]) {
      setPolygonViews(prev => ({ ...prev, [polygonId]: 'points' }));
    }
  };

  const setPolygonView = (polygonId: string, view: 'lines' | 'points') => {
    setPolygonViews(prev => ({ ...prev, [polygonId]: view }));
  };

  const down = (e: React.MouseEvent) => {
    const p = pos(e);

    if (tool === 'draw') {
      if (!currentPolygon) {
        const newPoly: Polygon = { id: id(), points: [p], closed: false, history: [[p]], historyIndex: 0 };
        setCurrentPolygon(newPoly);
      } else {
        if (dist(currentPolygon.points[0], p) < 10 && currentPolygon.points.length >= 3) {
          const closedPoly = { ...currentPolygon, closed: true };
          addToSVGHistory([...svgObject.polygons, closedPoly]);
          setCurrentPolygon(null);
        } else {
          const newPoints = [...currentPolygon.points, p];
          const newHistory = [...currentPolygon.history, newPoints];
          const updated = { ...currentPolygon, points: newPoints, history: newHistory, historyIndex: newHistory.length - 1 };
          setCurrentPolygon(updated);
        }
      }
      return;
    }

    if (tool === 'move' && selection.level === 'point' && selection.polygonId && selection.elementIndex !== null) {
      const poly = svgObject.polygons.find(p => p.id === selection.polygonId);
      if (poly && dist(poly.points[selection.elementIndex], p) < 10) {
        setDragging({ type: 'point', polygonId: selection.polygonId, pointIndex: selection.elementIndex, initialPoints: JSON.parse(JSON.stringify(poly.points)) });
      }
      return;
    }

    if (tool === 'move' && selection.level === 'line' && selection.polygonId && selection.elementIndex !== null) {
      const poly = svgObject.polygons.find(p => p.id === selection.polygonId);
      if (poly) {
        const i = selection.elementIndex;
        const nextIdx = (i + 1) % poly.points.length;
        const a = poly.points[i];
        const b = poly.points[nextIdx];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) return;
        const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (len * len)));
        const projX = a.x + t * dx;
        const projY = a.y + t * dy;
        const distance = Math.sqrt((p.x - projX) ** 2 + (p.y - projY) ** 2);
        
        if (distance < 15) {
          setDragging({ type: 'line', polygonId: selection.polygonId, lineIndex: i, startPos: p, initialPoints: JSON.parse(JSON.stringify(poly.points)) });
        }
      }
      return;
    }

    if (tool === 'move' && selection.level === 'polygon' && selection.polygonId) {
      const poly = svgObject.polygons.find(p => p.id === selection.polygonId);
      if (poly) {
        setDragging({ type: 'polygon', polygonId: selection.polygonId, startPos: p, initialPoints: JSON.parse(JSON.stringify(poly.points)) });
      }
      return;
    }

    if (tool === 'rotate' && selection.level === 'polygon' && selection.polygonId) {
      const poly = svgObject.polygons.find(p => p.id === selection.polygonId);
      if (poly) {
        const center = getCenter(poly.points);
        const angle = Math.atan2(p.y - center.y, p.x - center.x);
        setRotating({ polygonId: selection.polygonId, center, startAngle: angle, initialPolygons: JSON.parse(JSON.stringify(svgObject.polygons)) });
      }
      return;
    }

    if (tool === 'select') {
      if (selectMode === 'polygon') {
        for (const poly of svgObject.polygons) {
          for (let i = 0; i < poly.points.length; i++) {
            if (dist(poly.points[i], p) < 10) {
              setSelection({ level: 'polygon', polygonId: poly.id, elementType: null, elementIndex: null });
              return;
            }
          }
          for (let i = 0; i < poly.points.length; i++) {
            const nextIdx = (i + 1) % poly.points.length;
            if (!poly.closed && nextIdx === 0) continue;
            const a = poly.points[i];
            const b = poly.points[nextIdx];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len === 0) continue;
            const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (len * len)));
            const projX = a.x + t * dx;
            const projY = a.y + t * dy;
            const distance = Math.sqrt((p.x - projX) ** 2 + (p.y - projY) ** 2);
            
            if (distance < 10) {
              setSelection({ level: 'polygon', polygonId: poly.id, elementType: null, elementIndex: null });
              return;
            }
          }
        }
      }
      
      if (selectMode === 'point' && selection.level === 'polygon' && selection.polygonId) {
        const poly = svgObject.polygons.find(p => p.id === selection.polygonId);
        if (poly) {
          for (let i = 0; i < poly.points.length; i++) {
            if (dist(poly.points[i], p) < 10) {
              setSelection({ ...selection, level: 'point', elementType: 'point', elementIndex: i });
              return;
            }
          }
        }
      }

      if (selectMode === 'line' && selection.level === 'polygon' && selection.polygonId) {
        const poly = svgObject.polygons.find(p => p.id === selection.polygonId);
        if (poly) {
          for (let i = 0; i < poly.points.length; i++) {
            const nextIdx = (i + 1) % poly.points.length;
            const a = poly.points[i];
            const b = poly.points[nextIdx];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len === 0) continue;
            const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (len * len)));
            const projX = a.x + t * dx;
            const projY = a.y + t * dy;
            const distance = Math.sqrt((p.x - projX) ** 2 + (p.y - projY) ** 2);
            
            if (distance < 10) {
              setSelection({ ...selection, level: 'line', elementType: 'line', elementIndex: i });
              return;
            }
          }
        }
      }
    }

    if (tool === 'split' && selection.level === 'line' && selection.polygonId && selection.elementIndex !== null) {
      const poly = svgObject.polygons.find(p => p.id === selection.polygonId);
      if (poly) {
        const i = selection.elementIndex;
        const nextIdx = (i + 1) % poly.points.length;
        const a = poly.points[i];
        const b = poly.points[nextIdx];
        
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) return;
        const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (len * len)));
        const splitPoint = { x: a.x + t * dx, y: a.y + t * dy };
        
        const newPoints = [...poly.points];
        newPoints.splice(nextIdx, 0, splitPoint);
        
        addToPolygonHistory(poly.id, newPoints);
      }
    }
  };

  const move = (e: React.MouseEvent) => {
    const p = pos(e);
    
    if (dragging) {
      if (dragging.type === 'point') {
        setSvgObject(prev => ({
          ...prev,
          polygons: prev.polygons.map(poly => {
            if (poly.id !== dragging.polygonId) return poly;
            const newPoints = [...poly.points];
            newPoints[dragging.pointIndex] = p;
            return { ...poly, points: newPoints };
          })
        }));
      } else if (dragging.type === 'line') {
        const dx = p.x - dragging.startPos.x;
        const dy = p.y - dragging.startPos.y;
        
        setSvgObject(prev => ({
          ...prev,
          polygons: prev.polygons.map(poly => {
            if (poly.id !== dragging.polygonId) return poly;
            const newPoints = [...dragging.initialPoints];
            const i = dragging.lineIndex;
            const nextIdx = (i + 1) % poly.points.length;
            
            newPoints[i] = { x: dragging.initialPoints[i].x + dx, y: dragging.initialPoints[i].y + dy };
            newPoints[nextIdx] = { x: dragging.initialPoints[nextIdx].x + dx, y: dragging.initialPoints[nextIdx].y + dy };
            
            return { ...poly, points: newPoints };
          })
        }));
      } else if (dragging.type === 'polygon') {
        const dx = p.x - dragging.startPos.x;
        const dy = p.y - dragging.startPos.y;
        
        setSvgObject(prev => ({
          ...prev,
          polygons: prev.polygons.map(poly => {
            if (poly.id !== dragging.polygonId) return poly;
            const newPoints = dragging.initialPoints.map((pt: Point) => ({ x: pt.x + dx, y: pt.y + dy }));
            return { ...poly, points: newPoints };
          })
        }));
      }
      return;
    }

    if (rotating) {
      const angle = Math.atan2(p.y - rotating.center.y, p.x - rotating.center.x);
      const deltaAngle = angle - rotating.startAngle;
      
      setSvgObject(prev => ({
        ...prev,
        polygons: prev.polygons.map(poly => {
          if (poly.id !== rotating.polygonId) return poly;
          const originalPoly = rotating.initialPolygons.find((p: Polygon) => p.id === poly.id);
          if (!originalPoly) return poly;
          const newPoints = originalPoly.points.map((pt: Point) => rotatePoint(pt, rotating.center, deltaAngle));
          return { ...poly, points: newPoints };
        })
      }));
    }
  };

  const up = () => {
    if (dragging) {
      const poly = svgObject.polygons.find(p => p.id === dragging.polygonId);
      if (poly) {
        addToPolygonHistory(dragging.polygonId, poly.points);
      }
      setDragging(null);
    }
    if (rotating) {
      addToSVGHistory(svgObject.polygons);
      setRotating(null);
    }
  };

  const selectPolygon = (polygonId: string) => {
    setSelection({ level: 'polygon', polygonId, elementType: null, elementIndex: null });
  };

  const selectElement = (polygonId: string, type: 'line' | 'point', index: number) => {
    setSelection({ level: type, polygonId, elementType: type, elementIndex: index });
  };

  const allPolygons = currentPolygon ? [...svgObject.polygons, currentPolygon] : svgObject.polygons;

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif', background: '#f0f0f0' }}>
      <div style={{ width: 280, background: '#fff', borderRight: '1px solid #ccc', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e0e0e0', background: '#fafafa' }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#333' }}>ObjectMap</h3>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
          {svgObject.polygons.map((poly, idx) => {
            const isExpanded = expandedPolygons[poly.id];
            const view = polygonViews[poly.id] || 'points';
            const isSelected = selection.polygonId === poly.id && !selection.elementType;
            const isHovered = hover.polygonId === poly.id && !hover.elementType;
            
            return (
              <div key={poly.id}>
                <div 
                  onClick={() => selectPolygon(poly.id)}
                  onMouseEnter={() => setHover({ polygonId: poly.id, elementType: null, elementIndex: null })}
                  onMouseLeave={() => setHover({ polygonId: null, elementType: null, elementIndex: null })}
                  style={{ 
                    padding: '8px 16px', 
                    background: isSelected ? '#e3f2fd' : isHovered ? '#f5f5f5' : 'transparent', 
                    borderLeft: isSelected ? '3px solid #0078d4' : '3px solid transparent', 
                    cursor: 'pointer', 
                    fontSize: 13, 
                    color: '#333', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8, 
                    transition: 'all 0.1s' 
                  }}
                >
                  <span 
                    onClick={(e) => { e.stopPropagation(); togglePolygon(poly.id); }}
                    style={{ cursor: 'pointer', userSelect: 'none', fontSize: 14 }}
                  >
                    {isExpanded ? '▼' : '▶'}
                  </span>
                  <span style={{ fontSize: 16 }}>📐</span>
                  <span>Polygon {idx + 1}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: '#666' }}>({poly.points.length})</span>
                </div>

                {isExpanded && (
                  <div style={{ paddingLeft: 24, background: '#fafafa', borderLeft: '3px solid #e0e0e0', marginLeft: 16 }}>
                    <div style={{ display: 'flex', gap: 4, padding: '8px 12px', borderBottom: '1px solid #e0e0e0' }}>
                      <button 
                        onClick={() => setPolygonView(poly.id, 'points')}
                        style={{ 
                          flex: 1, 
                          padding: '4px 8px', 
                          background: view === 'points' ? '#0078d4' : 'transparent', 
                          color: view === 'points' ? 'white' : '#333', 
                          border: '1px solid #d0d0d0', 
                          borderRadius: 3, 
                          fontSize: 11, 
                          cursor: 'pointer',
                          fontWeight: view === 'points' ? 600 : 400
                        }}
                      >
                        Points
                      </button>
                      <button 
                        onClick={() => setPolygonView(poly.id, 'lines')}
                        style={{ 
                          flex: 1, 
                          padding: '4px 8px', 
                          background: view === 'lines' ? '#0078d4' : 'transparent', 
                          color: view === 'lines' ? 'white' : '#333', 
                          border: '1px solid #d0d0d0', 
                          borderRadius: 3, 
                          fontSize: 11, 
                          cursor: 'pointer',
                          fontWeight: view === 'lines' ? 600 : 400
                        }}
                      >
                        Lines
                      </button>
                    </div>

                    {view === 'points' && (
                      <div>
                        {poly.points.map((pt, ptIdx) => {
                          const isPointSelected = selection.elementType === 'point' && selection.elementIndex === ptIdx && selection.polygonId === poly.id;
                          const isPointHovered = hover.elementType === 'point' && hover.elementIndex === ptIdx && hover.polygonId === poly.id;
                          
                          return (
                            <div 
                              key={ptIdx} 
                              onClick={() => selectElement(poly.id, 'point', ptIdx)}
                              onMouseEnter={() => setHover({ polygonId: poly.id, elementType: 'point', elementIndex: ptIdx })}
                              onMouseLeave={() => setHover({ polygonId: null, elementType: null, elementIndex: null })}
                              style={{ 
                                padding: '6px 12px', 
                                background: isPointSelected ? '#e3f2fd' : isPointHovered ? '#f5f5f5' : 'transparent', 
                                borderLeft: isPointSelected ? '3px solid #0078d4' : '3px solid transparent', 
                                cursor: 'pointer', 
                                fontSize: 12, 
                                color: '#333', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 6,
                                transition: 'all 0.1s'
                              }}
                            >
                              <span style={{ fontSize: 14 }}>⚫</span>
                              <span>Point {ptIdx + 1}</span>
                              <span style={{ marginLeft: 'auto', fontSize: 10, color: '#666' }}>({pt.x.toFixed(0)}, {pt.y.toFixed(0)})</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {view === 'lines' && (
                      <div>
                        {poly.points.map((_, lineIdx) => {
                          const isLineSelected = selection.elementType === 'line' && selection.elementIndex === lineIdx && selection.polygonId === poly.id;
                          const isLineHovered = hover.elementType === 'line' && hover.elementIndex === lineIdx && hover.polygonId === poly.id;
                          
                          return (
                            <div 
                              key={lineIdx} 
                              onClick={() => selectElement(poly.id, 'line', lineIdx)}
                              onMouseEnter={() => setHover({ polygonId: poly.id, elementType: 'line', elementIndex: lineIdx })}
                              onMouseLeave={() => setHover({ polygonId: null, elementType: null, elementIndex: null })}
                              style={{ 
                                padding: '6px 12px', 
                                background: isLineSelected ? '#e3f2fd' : isLineHovered ? '#f5f5f5' : 'transparent', 
                                borderLeft: isLineSelected ? '3px solid #0078d4' : '3px solid transparent', 
                                cursor: 'pointer', 
                                fontSize: 12, 
                                color: '#333', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 6,
                                transition: 'all 0.1s'
                              }}
                            >
                              <span style={{ fontSize: 14 }}>📏</span>
                              <span>Line {lineIdx + 1}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          
          {svgObject.polygons.length === 0 && (
            <div style={{ padding: '16px', textAlign: 'center', color: '#999', fontSize: 12 }}>No polygons yet</div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 20px', background: '#fff', borderBottom: '1px solid #ccc' }}>
          <h2 style={{ margin: '0 0 12px 0', fontSize: 18, color: '#333' }}>SVG Creator</h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {(selection.level === null || selection.level === 'svg') && (
              <>
                <button onClick={undoSVG} disabled={svgObject.historyIndex === 0} style={{ padding: '6px 12px', background: svgObject.historyIndex === 0 ? '#e0e0e0' : '#0078d4', color: svgObject.historyIndex === 0 ? '#999' : 'white', border: 'none', borderRadius: 3, cursor: svgObject.historyIndex === 0 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500 }}>← Undo</button>
                <button onClick={redoSVG} disabled={svgObject.historyIndex >= svgObject.history.length - 1} style={{ padding: '6px 12px', background: svgObject.historyIndex >= svgObject.history.length - 1 ? '#e0e0e0' : '#0078d4', color: svgObject.historyIndex >= svgObject.history.length - 1 ? '#999' : 'white', border: 'none', borderRadius: 3, cursor: svgObject.historyIndex >= svgObject.history.length - 1 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500 }}>Redo →</button>
                <div style={{ width: 1, height: 24, background: '#ddd', margin: '0 4px' }}></div>
                <button onClick={() => { setTool('draw'); setSelection({ level: null, polygonId: null, elementType: null, elementIndex: null }); }} style={{ padding: '6px 16px', background: tool === 'draw' ? '#107c10' : '#f0f0f0', color: tool === 'draw' ? 'white' : '#333', border: '1px solid #d0d0d0', borderRadius: 3, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Draw</button>
                <button onClick={() => setTool('select')} style={{ padding: '6px 16px', background: tool === 'select' ? '#107c10' : '#f0f0f0', color: tool === 'select' ? 'white' : '#333', border: '1px solid #d0d0d0', borderRadius: 3, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Select</button>
                {tool === 'select' && (
                  <>
                    <select value={selectMode} onChange={(e) => setSelectMode(e.target.value as any)} style={{ padding: '6px 10px', border: '1px solid #d0d0d0', borderRadius: 3, fontSize: 13, background: 'white' }}>
                      <option value="polygon">Polygon</option>
                      <option value="rectangle">Rectangle</option>
                      <option value="freeform">Free-form</option>
                      <option value="all">All</option>
                    </select>
                    {(selectMode === 'rectangle' || selectMode === 'freeform') && (
                      <span style={{ display: 'flex', gap: 12, marginLeft: 8, fontSize: 13 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}><input type="checkbox" checked={selectPoints} onChange={(e) => setSelectPoints(e.target.checked)} /> Points</label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}><input type="checkbox" checked={selectLines} onChange={(e) => setSelectLines(e.target.checked)} /> Lines</label>
                      </span>
                    )}
                  </>
                )}
              </>
            )}

            {selection.level === 'polygon' && (
              <>
                <button onClick={undoPolygon} disabled={!selection.polygonId || svgObject.polygons.find(p => p.id === selection.polygonId)?.historyIndex === 0} style={{ padding: '6px 12px', background: (!selection.polygonId || svgObject.polygons.find(p => p.id === selection.polygonId)?.historyIndex === 0) ? '#e0e0e0' : '#0078d4', color: (!selection.polygonId || svgObject.polygons.find(p => p.id === selection.polygonId)?.historyIndex === 0) ? '#999' : 'white', border: 'none', borderRadius: 3, cursor: (!selection.polygonId || svgObject.polygons.find(p => p.id === selection.polygonId)?.historyIndex === 0) ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500 }}>← Undo</button>
                <button onClick={redoPolygon} disabled={!selection.polygonId || (svgObject.polygons.find(p => p.id === selection.polygonId)?.historyIndex ?? 0) >= (svgObject.polygons.find(p => p.id === selection.polygonId)?.history.length ?? 1) - 1} style={{ padding: '6px 12px', background: (!selection.polygonId || (svgObject.polygons.find(p => p.id === selection.polygonId)?.historyIndex ?? 0) >= (svgObject.polygons.find(p => p.id === selection.polygonId)?.history.length ?? 1) - 1) ? '#e0e0e0' : '#0078d4', color: (!selection.polygonId || (svgObject.polygons.find(p => p.id === selection.polygonId)?.historyIndex ?? 0) >= (svgObject.polygons.find(p => p.id === selection.polygonId)?.history.length ?? 1) - 1) ? '#999' : 'white', border: 'none', borderRadius: 3, cursor: (!selection.polygonId || (svgObject.polygons.find(p => p.id === selection.polygonId)?.historyIndex ?? 0) >= (svgObject.polygons.find(p => p.id === selection.polygonId)?.history.length ?? 1) - 1) ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500 }}>Redo →</button>
                <div style={{ width: 1, height: 24, background: '#ddd', margin: '0 4px' }}></div>
                <button onClick={() => { setTool('select'); setSelectMode('point'); }} style={{ padding: '6px 16px', background: '#f0f0f0', color: '#333', border: '1px solid #d0d0d0', borderRadius: 3, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Select</button>
                {tool === 'select' && (
                  <>
                    <select value={selectMode} onChange={(e) => setSelectMode(e.target.value as any)} style={{ padding: '6px 10px', border: '1px solid #d0d0d0', borderRadius: 3, fontSize: 13, background: 'white' }}>
                      <option value="point">Point</option>
                      <option value="line">Line</option>
                      <option value="rectangle">Rectangle</option>
                      <option value="freeform">Free-form</option>
                      <option value="all">All</option>
                    </select>
                    {(selectMode === 'rectangle' || selectMode === 'freeform') && (
                      <span style={{ display: 'flex', gap: 12, marginLeft: 8, fontSize: 13 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}><input type="checkbox" checked={selectPoints} onChange={(e) => setSelectPoints(e.target.checked)} /> Points</label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}><input type="checkbox" checked={selectLines} onChange={(e) => setSelectLines(e.target.checked)} /> Lines</label>
                      </span>
                    )}
                  </>
                )}
                <button onClick={() => setTool('move')} style={{ padding: '6px 16px', background: tool === 'move' ? '#107c10' : '#f0f0f0', color: tool === 'move' ? 'white' : '#333', border: '1px solid #d0d0d0', borderRadius: 3, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Move</button>
                <button onClick={() => setTool('rotate')} style={{ padding: '6px 16px', background: tool === 'rotate' ? '#107c10' : '#f0f0f0', color: tool === 'rotate' ? 'white' : '#333', border: '1px solid #d0d0d0', borderRadius: 3, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Rotate</button>
              </>
            )}

            {selection.level === 'line' && (
              <>
                <button onClick={() => setTool('move')} style={{ padding: '6px 16px', background: tool === 'move' ? '#107c10' : '#f0f0f0', color: tool === 'move' ? 'white' : '#333', border: '1px solid #d0d0d0', borderRadius: 3, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Move</button>
                <button onClick={() => setTool('rotate')} style={{ padding: '6px 16px', background: '#f0f0f0', color: '#333', border: '1px solid #d0d0d0', borderRadius: 3, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Rotate</button>
                <button onClick={() => setTool('split')} style={{ padding: '6px 16px', background: tool === 'split' ? '#8e24aa' : '#f0f0f0', color: tool === 'split' ? 'white' : '#333', border: '1px solid #d0d0d0', borderRadius: 3, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Split</button>
              </>
            )}

            {selection.level === 'point' && (
              <button onClick={() => setTool('move')} style={{ padding: '6px 16px', background: tool === 'move' ? '#107c10' : '#f0f0f0', color: tool === 'move' ? 'white' : '#333', border: '1px solid #d0d0d0', borderRadius: 3, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Move</button>
            )}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ flex: '0 0 auto', padding: 20, background: '#e8e8e8' }}>
            <svg ref={svg} width={800} height={600} style={{ border: '1px solid #999', background: 'white', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} onMouseDown={down} onMouseMove={move} onMouseUp={up} onMouseLeave={up}>
              {allPolygons.map((poly) => {
                const isCurrent = poly === currentPolygon;
                const isSelected = selection.polygonId === poly.id;
                const isHovered = hover.polygonId === poly.id && !hover.elementType;
                const hasAnySelection = selection.polygonId === poly.id || hover.polygonId === poly.id;
                
                return (
                  <g key={poly.id}>
                    {poly.closed && (
                      <polygon 
                        points={poly.points.map(p => `${p.x},${p.y}`).join(' ')} 
                        fill="none" 
                        stroke={isCurrent ? '#2196F3' : isSelected ? '#4CAF50' : isHovered ? '#FFC107' : 'black'} 
                        strokeWidth={isSelected ? '3' : isHovered ? '2' : '1'} 
                      />
                    )}
                    {!poly.closed && (
                      <polyline points={poly.points.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#2196F3" strokeWidth="1" />
                    )}
                    
                    {poly.closed && hover.polygonId === poly.id && hover.elementType === 'line' && hover.elementIndex !== null && (
                      <line 
                        x1={poly.points[hover.elementIndex].x} 
                        y1={poly.points[hover.elementIndex].y} 
                        x2={poly.points[(hover.elementIndex + 1) % poly.points.length].x} 
                        y2={poly.points[(hover.elementIndex + 1) % poly.points.length].y} 
                        stroke="#FFC107" 
                        strokeWidth="4" 
                        style={{ pointerEvents: 'none' }}
                      />
                    )}

                    {poly.closed && selection.polygonId === poly.id && selection.elementType === 'line' && selection.elementIndex !== null && (
                      <line 
                        x1={poly.points[selection.elementIndex].x} 
                        y1={poly.points[selection.elementIndex].y} 
                        x2={poly.points[(selection.elementIndex + 1) % poly.points.length].x} 
                        y2={poly.points[(selection.elementIndex + 1) % poly.points.length].y} 
                        stroke="#4CAF50" 
                        strokeWidth="4" 
                        style={{ pointerEvents: 'none' }}
                      />
                    )}
                    
                    {(hasAnySelection || isCurrent) && poly.points.map((point, idx) => {
                      const isPointSelected = selection.elementType === 'point' && selection.elementIndex === idx && selection.polygonId === poly.id;
                      const isPointHovered = hover.elementType === 'point' && hover.elementIndex === idx && hover.polygonId === poly.id;
                      
                      return (
                        <circle 
                          key={idx} 
                          cx={point.x} 
                          cy={point.y} 
                          r={isPointSelected || isPointHovered ? 6 : 4} 
                          fill={isPointSelected ? '#4CAF50' : isPointHovered ? '#FFC107' : 'red'} 
                          stroke="white" 
                          strokeWidth={2} 
                        />
                      );
                    })}
                    
                    {isCurrent && poly.points.length > 0 && (
                      <circle cx={poly.points[0].x} cy={poly.points[0].y} r={8} fill="green" stroke="white" strokeWidth={2} />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          <div style={{ flex: 1, padding: 20, overflowY: 'auto', background: '#fafafa' }}>
            <h3 style={{ marginTop: 0, fontSize: 14, color: '#333', fontWeight: 600 }}>Code Preview</h3>
            <div style={{ background: '#1e1e1e', padding: 16, borderRadius: 4, overflow: 'auto', fontFamily: 'Consolas, Monaco, monospace', fontSize: 12, lineHeight: 1.6 }}>
              <div style={{ color: '#569cd6' }}>&lt;svg <span style={{ color: '#9cdcfe' }}>width</span>=<span style={{ color: '#ce9178' }}>"800"</span> <span style={{ color: '#9cdcfe' }}>height</span>=<span style={{ color: '#ce9178' }}>"600"</span> <span style={{ color: '#9cdcfe' }}>xmlns</span>=<span style={{ color: '#ce9178' }}>"http://www.w3.org/2000/svg"</span>&gt;</div>
              {svgObject.polygons.map((poly) => {
                const isPolyHighlighted = (selection.polygonId === poly.id && !selection.elementType) || (hover.polygonId === poly.id && !hover.elementType);
                const pointsStr = poly.points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`);
                
                return (
                  <div 
                    key={poly.id}
                    style={{ 
                      background: isPolyHighlighted ? '#264f78' : 'transparent',
                      padding: '2px 0',
                      margin: '2px 0',
                      borderLeft: isPolyHighlighted ? '3px solid #0078d4' : '3px solid transparent',
                      paddingLeft: 8,
                      transition: 'all 0.15s'
                    }}
                  >
                    <span style={{ color: '#d4d4d4' }}>  &lt;</span>
                    <span style={{ color: '#569cd6' }}>polygon</span>
                    <span style={{ color: '#d4d4d4' }}> </span>
                    <span style={{ color: '#9cdcfe' }}>points</span>
                    <span style={{ color: '#d4d4d4' }}>=</span>
                    <span style={{ color: '#ce9178' }}>"</span>
                    {pointsStr.map((pt, ptIdx) => {
                      const isPointHighlighted = (selection.polygonId === poly.id && selection.elementType === 'point' && selection.elementIndex === ptIdx) || (hover.polygonId === poly.id && hover.elementType === 'point' && hover.elementIndex === ptIdx);
                      const isLineHighlighted = (selection.polygonId === poly.id && selection.elementType === 'line' && (selection.elementIndex === ptIdx || selection.elementIndex === (ptIdx - 1 + poly.points.length) % poly.points.length)) || (hover.polygonId === poly.id && hover.elementType === 'line' && (hover.elementIndex === ptIdx || hover.elementIndex === (ptIdx - 1 + poly.points.length) % poly.points.length));
                      
                      return (
                        <span key={ptIdx}>
                          <span style={{ color: '#ce9178', background: isPointHighlighted ? '#4a90e2' : isLineHighlighted ? '#6a5acd' : 'transparent', padding: '0 2px' }}>
                            {pt}
                          </span>
                          {ptIdx < pointsStr.length - 1 && <span style={{ color: '#ce9178' }}> </span>}
                        </span>
                      );
                    })}
                    <span style={{ color: '#ce9178' }}>"</span>
                    <span style={{ color: '#d4d4d4' }}> </span>
                    <span style={{ color: '#9cdcfe' }}>fill</span>
                    <span style={{ color: '#d4d4d4' }}>=</span>
                    <span style={{ color: '#ce9178' }}>"none"</span>
                    <span style={{ color: '#d4d4d4' }}> </span>
                    <span style={{ color: '#9cdcfe' }}>stroke</span>
                    <span style={{ color: '#d4d4d4' }}>=</span>
                    <span style={{ color: '#ce9178' }}>"black"</span>
                    <span style={{ color: '#d4d4d4' }}> </span>
                    <span style={{ color: '#9cdcfe' }}>stroke-width</span>
                    <span style={{ color: '#d4d4d4' }}>=</span>
                    <span style={{ color: '#ce9178' }}>"1"</span>
                    <span style={{ color: '#d4d4d4' }}> /&gt;</span>
                  </div>
                );
              })}
              <div style={{ color: '#569cd6' }}>&lt;/svg&gt;</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}