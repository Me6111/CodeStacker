import React, { useState, useRef } from 'react';

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

export default function SVGcreator() {
  const [tool, setTool] = useState<'draw' | 'move'>('draw');
  const [polygons, setPolygons] = useState<Polygon[]>([]);
  const [currentPolygon, setCurrentPolygon] = useState<Polygon | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ polygonId: string; pointIndex: number } | null>(null);
  const [history, setHistory] = useState<HistoryState[]>([{ polygons: [], currentPolygon: null, selectedId: null }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const svg = useRef<SVGSVGElement>(null);

  const id = () => `${Date.now()}_${Math.random()}`;
  
  const pos = (e: React.MouseEvent) => {
    const r = svg.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  
  const dist = (a: Point, b: Point) => Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);

  const saveHistory = (newPolygons: Polygon[], newCurrent: Polygon | null, newSelected: string | null) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ polygons: newPolygons, currentPolygon: newCurrent, selectedId: newSelected });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const state = history[newIndex];
      setPolygons(state.polygons);
      setCurrentPolygon(state.currentPolygon);
      setSelectedId(state.selectedId);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const state = history[newIndex];
      setPolygons(state.polygons);
      setCurrentPolygon(state.currentPolygon);
      setSelectedId(state.selectedId);
    }
  };

  const saveCurrentPolygon = () => {
    if (currentPolygon && currentPolygon.points.length > 0) {
      const newPolygons = [...polygons, currentPolygon];
      setPolygons(newPolygons);
      setCurrentPolygon(null);
      saveHistory(newPolygons, null, currentPolygon.id);
    } else {
      setCurrentPolygon(null);
    }
  };

  const switchTool = (newTool: 'draw' | 'move') => {
    saveCurrentPolygon();
    setTool(newTool);
  };

  const down = (e: React.MouseEvent) => {
    const p = pos(e);

    if (tool === 'draw') {
      if (!currentPolygon) {
        const newPoly: Polygon = { id: id(), points: [p], closed: false };
        setCurrentPolygon(newPoly);
      } else {
        if (dist(currentPolygon.points[0], p) < 10 && currentPolygon.points.length >= 3) {
          const closedPoly = { ...currentPolygon, closed: true };
          const newPolygons = [...polygons, closedPoly];
          setPolygons(newPolygons);
          setCurrentPolygon(null);
          setSelectedId(closedPoly.id);
          saveHistory(newPolygons, null, closedPoly.id);
        } else {
          const updated = { ...currentPolygon, points: [...currentPolygon.points, p] };
          setCurrentPolygon(updated);
        }
      }
    } else if (tool === 'move') {
      const allPolygons = currentPolygon ? [...polygons, currentPolygon] : polygons;
      for (const poly of allPolygons) {
        for (let i = 0; i < poly.points.length; i++) {
          if (dist(poly.points[i], p) < 10) {
            setDragging({ polygonId: poly.id, pointIndex: i });
            setSelectedId(poly.id);
            return;
          }
        }
      }
    }
  };

  const move = (e: React.MouseEvent) => {
    if (!dragging) return;
    const p = pos(e);
    
    const newPolygons = polygons.map(poly => {
      if (poly.id !== dragging.polygonId) return poly;
      const newPoints = [...poly.points];
      newPoints[dragging.pointIndex] = p;
      return { ...poly, points: newPoints };
    });
    
    setPolygons(newPolygons);
  };

  const up = () => {
    if (dragging) {
      saveHistory(polygons, currentPolygon, selectedId);
      setDragging(null);
    }
  };

  const clearAll = () => {
    setPolygons([]);
    setCurrentPolygon(null);
    setSelectedId(null);
    saveHistory([], null, null);
  };

  const cancelCurrent = () => {
    setCurrentPolygon(null);
  };

  const allPolygons = currentPolygon ? [...polygons, currentPolygon] : polygons;

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 32 }}>SVG Creator</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={undo} disabled={historyIndex === 0} style={{ padding: '12px 18px', background: historyIndex === 0 ? '#ccc' : '#2196F3', color: 'white', border: 'none', borderRadius: 4, cursor: historyIndex === 0 ? 'not-allowed' : 'pointer', fontSize: 24, fontWeight: 'bold' }}>←</button>
          <button onClick={redo} disabled={historyIndex === history.length - 1} style={{ padding: '12px 18px', background: historyIndex === history.length - 1 ? '#ccc' : '#2196F3', color: 'white', border: 'none', borderRadius: 4, cursor: historyIndex === history.length - 1 ? 'not-allowed' : 'pointer', fontSize: 24, fontWeight: 'bold' }}>→</button>
        </div>
      </div>

      <div style={{ background: '#fff', padding: 15, marginBottom: 15, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <button onClick={() => switchTool('draw')} style={{ padding: '10px 20px', margin: 5, background: tool === 'draw' ? '#4CAF50' : '#ddd', color: tool === 'draw' ? 'white' : 'black', border: 'none', borderRadius: 4, fontWeight: tool === 'draw' ? 'bold' : 'normal', cursor: 'pointer' }}>Draw Polygon</button>
        <button onClick={() => switchTool('move')} style={{ padding: '10px 20px', margin: 5, background: tool === 'move' ? '#4CAF50' : '#ddd', color: tool === 'move' ? 'white' : 'black', border: 'none', borderRadius: 4, fontWeight: tool === 'move' ? 'bold' : 'normal', cursor: 'pointer' }}>Move Points</button>
        {currentPolygon && <button onClick={cancelCurrent} style={{ padding: '10px 20px', margin: 5, background: '#ff9800', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>}
        <button onClick={clearAll} style={{ padding: '10px 20px', margin: 5, background: '#f44336', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Clear All</button>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: '0 0 auto' }}>
          <svg ref={svg} width={800} height={600} style={{ border: '2px solid #333', background: 'white', borderRadius: 4, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} onMouseDown={down} onMouseMove={move} onMouseUp={up} onMouseLeave={up}>
            {allPolygons.map((poly) => {
              const isSelected = selectedId === poly.id;
              const isCurrent = poly === currentPolygon;
              
              return (
                <g key={poly.id} onClick={(e) => { e.stopPropagation(); setSelectedId(poly.id); }}>
                  {poly.closed ? (
                    <polygon points={poly.points.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={isSelected ? '#4CAF50' : 'black'} strokeWidth="1" style={{ cursor: 'pointer' }} />
                  ) : (
                    <polyline points={poly.points.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={isCurrent ? '#2196F3' : 'black'} strokeWidth="1" style={{ cursor: 'pointer' }} />
                  )}
                  
                  {tool === 'move' && poly.points.map((point, idx) => (
                    <circle key={idx} cx={point.x} cy={point.y} r={5} fill="red" stroke="white" strokeWidth={2} style={{ cursor: 'move' }} />
                  ))}
                  
                  {isCurrent && poly.points.length > 0 && (
                    <circle cx={poly.points[0].x} cy={poly.points[0].y} r={8} fill="green" stroke="white" strokeWidth={2} />
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ marginTop: 0, marginBottom: 10 }}>Code Preview</h3>
          <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: 20, overflow: 'auto', maxHeight: 600, fontSize: 13, borderRadius: 4, margin: 0, whiteSpace: 'pre' }}>
{`<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
${allPolygons.map(poly => {
  const points = poly.points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  if (poly.closed) {
    return `  <polygon points="${points}" fill="none" stroke="black" stroke-width="1" />`;
  } else {
    return `  <polyline points="${points}" fill="none" stroke="black" stroke-width="1" />`;
  }
}).join('\n')}
</svg>`}
          </pre>
        </div>
      </div>

      <div style={{ marginTop: 15, fontSize: 14, color: '#666', background: '#fff', padding: 15, borderRadius: 4 }}>
        {tool === 'draw' && !currentPolygon && '📏 Click to start polygon'}
        {tool === 'draw' && currentPolygon && currentPolygon.points.length < 3 && '📏 Click to add points'}
        {tool === 'draw' && currentPolygon && currentPolygon.points.length >= 3 && '📏 Click green dot to close polygon'}
        {tool === 'move' && '🖱️ Drag points to move'}
      </div>
    </div>
  );
}