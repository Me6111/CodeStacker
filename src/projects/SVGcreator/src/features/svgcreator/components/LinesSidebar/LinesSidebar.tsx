import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LineRun } from '../SelectionControls/SelectionControls';
import { useSVGContext } from '../../context/SVGContext';
import { useSelectionContext } from '../../context/SelectionContext';
import { rdpSimplify, accuracyToEpsilon } from '../../utils';

type Pt = { x: number; y: number };

interface LinesSidebarProps {
  lineRuns: LineRun[];
  isConfirmed: boolean;
  onDetailCommit?: () => void;
}

type CapturedBaseline =
  | { kind: 'sub'; prefixPoints: Pt[]; runPoints: Pt[]; suffixPoints: Pt[] }
  | { kind: 'wrap'; baselinePoints: Pt[]; lines: number[] }
  | null;

type ColKey = 'pt' | 'seg' | 'detail';
const ALL_COLS: ColKey[] = ['pt', 'seg', 'detail'];
const COL_LABELS: Record<ColKey, string> = { pt: 'pt', seg: 'seg', detail: 'Detail' };
const MIN_HEIGHT = 60;
const DEFAULT_HEIGHT = 180;

function findAccuracyForPtCount(pts: Pt[], targetPt: number): number {
  if (targetPt >= pts.length) return 100;
  if (targetPt <= 2) return 0;
  let lo = 0, hi = 100;
  for (let k = 0; k < 30; k++) {
    const mid = (lo + hi) / 2;
    const count = rdpSimplify(pts, accuracyToEpsilon(mid)).length;
    if (count > targetPt) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}

function getRunPts(captured: CapturedBaseline, isAllEdges: boolean, poly: any): Pt[] | null {
  if (captured?.kind === 'sub') return captured.runPoints;
  if (captured?.kind === 'wrap') return captured.baselinePoints;
  if (isAllEdges && poly) return poly.points.map((p: any) => ({ x: p.x, y: p.y }));
  return null;
}

function deriveFromAcc(acc: number, runPts: Pt[], isAllEdges: boolean) {
  const eps = accuracyToEpsilon(acc);
  const ptCount = acc === 0 ? 2 : eps > 0 ? rdpSimplify(runPts, eps).length : runPts.length;
  return { pt: ptCount, seg: isAllEdges ? ptCount : ptCount - 1, pct: Math.round(acc) };
}

function deriveFromPt(ptCount: number, runPts: Pt[], isAllEdges: boolean) {
  const acc = findAccuracyForPtCount(runPts, ptCount);
  return { pt: ptCount, seg: isAllEdges ? ptCount : ptCount - 1, pct: Math.round(acc) };
}

// ── Shared styles ────────────────────────────────────────────────────────────

const INPUT_BASE: React.CSSProperties = {
  padding: '3px 6px',
  background: '#0d0d0d',
  color: '#ffffff',
  fontSize: 12,
  fontFamily: "'Fira Code','Cascadia Code','Consolas',monospace",
  textAlign: 'right',
  outline: 'none',
  flexShrink: 0,
  lineHeight: 1.4,
  // spinners hidden via className lws-num + <style> below
};

const ADJ_BTN: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 14, flex: '1 1 0',
  background: '#0d0d0d',
  border: 'none', margin: 0, padding: 0,
  color: 'rgba(255,255,255,0.5)',
  cursor: 'pointer', fontSize: 7, lineHeight: 1,
  flexShrink: 0,
};

// ── NumInput: input field + stacked ▲▼ buttons ───────────────────────────────

interface NumInputProps {
  value: string;
  min: number;
  max?: number;
  inputWidth: number;
  focused: boolean;
  onFocus: () => void;
  onChange: (v: string) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onAdjust: (delta: number) => void;
}

const NumInput: React.FC<NumInputProps> = ({ value, min, max, inputWidth, focused, onFocus, onChange, onBlur, onKeyDown, onAdjust }) => {
  const border = focused ? '1px solid rgba(255,255,255,0.45)' : '1px solid rgba(255,255,255,0.13)';
  return (
    <div style={{ display: 'flex', flexShrink: 0 }}>
      <input
        type="number"
        className="lws-num"
        value={value}
        min={min}
        max={max}
        style={{ ...INPUT_BASE, width: inputWidth, border, borderRadius: '3px 0 0 3px', borderRight: 'none' }}
        onFocus={onFocus}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />
      <div style={{
        display: 'flex', flexDirection: 'column',
        border, borderLeft: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '0 3px 3px 0', overflow: 'hidden', flexShrink: 0,
      }}>
        <button
          onMouseDown={e => { e.preventDefault(); onAdjust(1); }}
          style={{ ...ADJ_BTN, borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >▲</button>
        <button
          onMouseDown={e => { e.preventDefault(); onAdjust(-1); }}
          style={ADJ_BTN}
        >▼</button>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

export const LinesSidebar: React.FC<LinesSidebarProps> = ({ lineRuns, isConfirmed, onDetailCommit }) => {
  const { svgObject, applyDetailLive, commitDetailHistory } = useSVGContext();
  const { setLineRunHover } = useSelectionContext();

  const [runAccuracies, setRunAccuracies] = useState<number[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [listHeight, setListHeight] = useState(DEFAULT_HEIGHT);
  const [visibleCols, setVisibleCols] = useState<Set<ColKey>>(new Set<ColKey>(ALL_COLS));
  const [colMenuOpen, setColMenuOpen] = useState(false);
  const [activeEdit, setActiveEdit] = useState<{ row: number; pt: string; seg: string; pct: string } | null>(null);

  const colMenuRef = useRef<HTMLDivElement>(null);
  const runBaselinesRef = useRef<CapturedBaseline[]>([]);
  const rafHandles = useRef<(number | null)[]>([]);
  const pendingApplies = useRef<((() => void) | null)[]>([]);
  const dragStartY = useRef<number | null>(null);
  const dragStartHeight = useRef<number>(DEFAULT_HEIGHT);
  const pendingRecalcRef = useRef(false);

  const hasRuns = lineRuns.length > 0;

  const onDragHandleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragStartY.current = e.clientY;
    dragStartHeight.current = listHeight;
    const onMove = (ev: MouseEvent) => {
      if (dragStartY.current === null) return;
      setListHeight(Math.max(MIN_HEIGHT, dragStartHeight.current + (ev.clientY - dragStartY.current)));
    };
    const onUp = () => { dragStartY.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [listHeight]);

  useEffect(() => {
    if (!colMenuOpen) return;
    const h = (e: MouseEvent) => { if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node)) setColMenuOpen(false); };
    window.addEventListener('mousedown', h);
    return () => window.removeEventListener('mousedown', h);
  }, [colMenuOpen]);

  useEffect(() => { pendingRecalcRef.current = false; }, [lineRuns]);
  useEffect(() => { if (!hasRuns) setLineRunHover(null); }, [hasRuns, setLineRunHover]);
  useEffect(() => {
    setRunAccuracies(lineRuns.map(() => 100));
    runBaselinesRef.current = lineRuns.map(() => null);
    rafHandles.current = lineRuns.map(() => null);
    pendingApplies.current = lineRuns.map(() => null);
    setActiveEdit(null);
  }, [lineRuns.length]);
  useEffect(() => { if (!isConfirmed) runBaselinesRef.current = lineRuns.map(() => null); }, [isConfirmed]);

  const toggleCol = (col: ColKey) => setVisibleCols(prev => { const n = new Set(prev); n.has(col) ? n.delete(col) : n.add(col); return n; });

  const ensureBaseline = useCallback((i: number): CapturedBaseline => {
    const existing = runBaselinesRef.current[i];
    if (existing) {
      // Invalidate if the polygon has been moved/transformed since capture.
      // RDP always preserves poly.points[0] (wrap) and runPoints[0] at prefixPoints.length (sub),
      // so a coordinate mismatch means a move/handle drag happened, not simplification.
      const run0 = lineRuns[i];
      const poly0 = run0 ? svgObject.polygons.find((p: any) => p.id === run0.polygonId) : null;
      let stale = false;
      if (poly0) {
        if (existing.kind === 'wrap' && existing.baselinePoints.length > 0 && poly0.points.length > 0) {
          // applyDetailToFragment rotates the output when edge 0 is inside the selected run,
          // so poly.points[0] no longer matches baselinePoints[0] even without any movement.
          // Use value-based search on a non-selected anchor point (never removed by simplification).
          const wrapLineSet = new Set(existing.lines);
          let anchorIdx = -1;
          for (let k = 0; k < existing.baselinePoints.length; k++) {
            if (!wrapLineSet.has(k)) { anchorIdx = k; break; }
          }
          if (anchorIdx >= 0) {
            const bp = existing.baselinePoints[anchorIdx];
            const found = (poly0.points as Pt[]).some(pp => pp.x === bp.x && pp.y === bp.y);
            if (!found) stale = true;
          } else {
            // All edges selected — rdpSimplify is used (no rotation), index 0 is safe
            const bp = existing.baselinePoints[0], pp = poly0.points[0];
            if (pp.x !== bp.x || pp.y !== bp.y) stale = true;
          }
        } else if (existing.kind === 'sub' && existing.runPoints.length > 0) {
          const fe = existing.prefixPoints.length;
          const rp = existing.runPoints[0], pp = poly0.points[fe];
          if (pp && (pp.x !== rp.x || pp.y !== rp.y)) stale = true;
        }
      }
      if (!stale) return existing;
      runBaselinesRef.current = runBaselinesRef.current.map((b, j) => j === i ? null : b);
    }

    if (pendingRecalcRef.current) return null;
    const run = lineRuns[i]; if (!run) return null;
    const poly = svgObject.polygons.find((p: any) => p.id === run.polygonId);
    const N = poly?.points?.length ?? 0;
    if (!poly || N < 3) return null;
    const isAllEdges = run.edgeIndices.length >= N && N > 0;
    let captured: CapturedBaseline;
    if (isAllEdges) {
      captured = {
        kind: 'wrap',
        baselinePoints: poly.points.map((p: any) => ({ x: p.x, y: p.y })),
        lines: Array.from({ length: N }, (_, k) => k),
      };
    } else {
      const fe = run.edgeIndices[0], le = run.edgeIndices[run.edgeIndices.length - 1];
      if (fe >= N || le >= N) return null;
      const isWrapped = (run.edgeIndices.length > 1 && fe > le) || le === N - 1;
      captured = isWrapped
        ? { kind: 'wrap', baselinePoints: poly.points.map((p: any) => ({ x: p.x, y: p.y })), lines: [...run.edgeIndices] }
        : { kind: 'sub',
            prefixPoints: poly.points.slice(0, fe).map((p: any) => ({ x: p.x, y: p.y })),
            runPoints: poly.points.slice(fe, le + 2).map((p: any) => ({ x: p.x, y: p.y })),
            suffixPoints: poly.points.slice(le + 2).map((p: any) => ({ x: p.x, y: p.y })) };
    }
    runBaselinesRef.current = runBaselinesRef.current.map((b, j) => j === i ? captured : b);
    return captured;
  }, [lineRuns, svgObject.polygons]);

  const scheduleApply = useCallback((i: number, acc: number, captured: CapturedBaseline, isAllEdges: boolean) => {
    const run = lineRuns[i]; if (!run) return;
    const applyNow = () => {
      if (captured?.kind === 'sub') applyDetailLive(null, acc, { polygonId: run.polygonId, prefixPoints: captured.prefixPoints, runPoints: captured.runPoints, suffixPoints: captured.suffixPoints });
      else if (captured?.kind === 'wrap') applyDetailLive(null, acc, { polygonId: run.polygonId, lines: captured.lines, baselinePoints: captured.baselinePoints });
      // captured===null means baseline not yet ready (pendingRecalc); skip silently
    };
    pendingApplies.current[i] = applyNow;
    if (rafHandles.current[i] !== null) cancelAnimationFrame(rafHandles.current[i]!);
    rafHandles.current[i] = requestAnimationFrame(() => { pendingApplies.current[i]?.(); pendingApplies.current[i] = null; rafHandles.current[i] = null; });
  }, [lineRuns, applyDetailLive]);

  const flushAndCommit = useCallback((i: number) => {
    if (rafHandles.current[i] !== null) { cancelAnimationFrame(rafHandles.current[i]!); rafHandles.current[i] = null; }
    pendingApplies.current[i]?.(); pendingApplies.current[i] = null;
    commitDetailHistory(); pendingRecalcRef.current = true; onDetailCommit?.();
  }, [commitDetailHistory, onDetailCommit]);

  const handleInputChange = useCallback((i: number, field: 'pt' | 'seg' | 'pct', raw: string, captured: CapturedBaseline, isAllEdges: boolean, runPts: Pt[] | null) => {
    const num = parseFloat(raw);
    if (!runPts || isNaN(num)) {
      setActiveEdit(prev => prev?.row === i ? { ...prev, [field]: raw } : { row: i, pt: raw, seg: raw, pct: raw });
      return;
    }
    let d: { pt: number; seg: number; pct: number };
    if (field === 'pct') {
      d = deriveFromAcc(Math.min(100, Math.max(0, num)), runPts, isAllEdges);
    } else {
      const targetPt = field === 'pt' ? Math.max(2, Math.round(num)) : (isAllEdges ? Math.max(3, Math.round(num)) : Math.max(1, Math.round(num)) + 1);
      d = deriveFromPt(targetPt, runPts, isAllEdges);
    }
    setActiveEdit({ row: i, pt: String(d.pt), seg: String(d.seg), pct: String(d.pct) });
    setRunAccuracies(prev => prev.map((a, j) => j === i ? d.pct : a));
    scheduleApply(i, d.pct, captured, isAllEdges);
  }, [scheduleApply]);

  const commitActiveEdit = useCallback((i: number) => {
    const acc = activeEdit?.row === i ? (Number(activeEdit.pct) || 0) : (runAccuracies[i] ?? 100);
    setRunAccuracies(prev => prev.map((a, j) => j === i ? Math.round(acc) : a));
    flushAndCommit(i);
    setActiveEdit(null);
  }, [activeEdit, runAccuracies, flushAndCommit]);

  return (
    <>
      <style>{`.lws-num::-webkit-outer-spin-button,.lws-num::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}.lws-num{-moz-appearance:textfield}`}</style>
      <div
        style={{
          position: 'absolute', top: 0, left: 0,
          width: 'max-content', maxWidth: '100%',
          background: '#080808',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          borderRight: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '0 0 8px 0',
          zIndex: 200, pointerEvents: 'auto', userSelect: 'none',
        }}
        onMouseLeave={() => setLineRunHover(null)}
      >
        {/* Header */}
        <div style={{
          padding: '7px 14px 6px',
          borderBottom: (expanded && hasRuns) ? '1px solid rgba(255,255,255,0.07)' : 'none',
          display: 'flex', alignItems: 'center', gap: 16,
          fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: '#4ade80',
          cursor: hasRuns ? 'pointer' : 'default', whiteSpace: 'nowrap',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => hasRuns && setExpanded(e => !e)}>
            {hasRuns && <span style={{ fontSize: 8, opacity: 0.45 }}>{expanded ? '▼' : '▶'}</span>}
            Lines within selection
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: hasRuns ? '#ffffff' : 'rgba(255,255,255,0.2)' }}>{lineRuns.length}</span>
            <div ref={colMenuRef} style={{ position: 'relative' }}>
              <button onClick={e => { e.stopPropagation(); setColMenuOpen(o => !o); }} style={{
                background: colMenuOpen ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: '1px solid rgba(255,255,255,0.15)', borderRadius: 3,
                color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 10,
                padding: '1px 5px', lineHeight: 1,
              }}>⚙</button>
              {colMenuOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 4,
                  background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 5, padding: '4px 0', zIndex: 300, minWidth: 100,
                  boxShadow: '0 6px 20px rgba(0,0,0,0.8)',
                }}>
                  {ALL_COLS.map(col => {
                    const on = visibleCols.has(col);
                    return (
                      <div key={col} onClick={e => { e.stopPropagation(); toggleCol(col); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 11px', cursor: 'pointer', fontSize: 11, color: on ? '#fff' : 'rgba(255,255,255,0.3)' }}
                        onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                        onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        <span style={{ width: 12, height: 12, flexShrink: 0, border: `1px solid ${on ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.18)'}`, borderRadius: 2, background: on ? 'rgba(255,255,255,0.85)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#000' }}>
                          {on ? '✓' : ''}
                        </span>
                        {COL_LABELS[col]}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </span>
        </div>

        {/* Rows */}
        {hasRuns && expanded && (
          <>
            <div style={{ maxHeight: `min(${listHeight}px, calc(100vh - 80px))`, overflowY: 'auto', overflowX: 'hidden' }}>
              {lineRuns.map((run, i) => {
                const accuracy = runAccuracies[i] ?? 100;
                const poly = svgObject.polygons.find((p: any) => p.id === run.polygonId);
                const polyN = poly?.points?.length ?? 0;
                const isAllEdgesRun = run.edgeIndices.length >= polyN && polyN > 0;
                const baseline = runBaselinesRef.current[i];
                const livePtCount = baseline?.kind === 'sub'
                  ? polyN - baseline.prefixPoints.length - baseline.suffixPoints.length
                  : isAllEdgesRun ? polyN : run.edgeCount + 1;
                const liveSegCount = isAllEdgesRun ? livePtCount : livePtCount - 1;

                const isEditing = activeEdit?.row === i;
                const ptVal  = isEditing ? activeEdit!.pt  : String(livePtCount);
                const segVal = isEditing ? activeEdit!.seg : String(liveSegCount);
                const pctVal = isEditing ? activeEdit!.pct : String(accuracy);
                const sliderVal = isEditing ? (Number(activeEdit!.pct) || 0) : accuracy;

                const getCtx = () => {
                  const captured = ensureBaseline(i);
                  const runPts = getRunPts(captured, isAllEdgesRun, poly);
                  return { captured, runPts };
                };

                const onFocusRow = () => setActiveEdit({ row: i, pt: ptVal, seg: segVal, pct: pctVal });

                const onChangeField = (field: 'pt' | 'seg' | 'pct', raw: string) => {
                  const { captured, runPts } = getCtx();
                  handleInputChange(i, field, raw, captured, isAllEdgesRun, runPts);
                };

                const onAdjust = (field: 'pt' | 'seg' | 'pct', delta: number) => {
                  const cur = field === 'pt' ? ptVal : field === 'seg' ? segVal : pctVal;
                  const n = (parseFloat(cur) || 0) + delta;
                  const min = field === 'pt' ? 2 : field === 'seg' ? 1 : 0;
                  const max = field === 'pct' ? 100 : 999999;
                  onChangeField(field, String(Math.min(max, Math.max(min, n))));
                };

                const onBlurRow = () => commitActiveEdit(i);

                const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: 'pt' | 'seg' | 'pct') => {
                  if (e.key === 'Enter') { e.preventDefault(); commitActiveEdit(i); (e.target as HTMLInputElement).blur(); }
                  else if (e.key === 'Escape') { setActiveEdit(null); (e.target as HTMLInputElement).blur(); }
                };

                return (
                  <div key={i}
                    onMouseEnter={() => setLineRunHover({ polygonId: run.polygonId, edgeIndices: run.edgeIndices })}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px', borderBottom: i < lineRuns.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                    onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(74,222,128,0.06)'; }}
                    onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                  >
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', minWidth: 14, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>

                    <span style={{ fontSize: 12, color: '#4ade80', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 60 }}>
                      {run.polygonName}
                    </span>

                    {visibleCols.has('pt') && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>pt</span>
                        <NumInput value={ptVal} min={2} inputWidth={42} focused={isEditing}
                          onFocus={onFocusRow}
                          onChange={v => onChangeField('pt', v)}
                          onBlur={onBlurRow}
                          onKeyDown={e => onKeyDown(e, 'pt')}
                          onAdjust={d => onAdjust('pt', d)}
                        />
                      </div>
                    )}

                    {visibleCols.has('seg') && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>seg</span>
                        <NumInput value={segVal} min={1} inputWidth={42} focused={isEditing}
                          onFocus={onFocusRow}
                          onChange={v => onChangeField('seg', v)}
                          onBlur={onBlurRow}
                          onKeyDown={e => onKeyDown(e, 'seg')}
                          onAdjust={d => onAdjust('seg', d)}
                        />
                      </div>
                    )}

                    {visibleCols.has('detail') && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <input type="range" min="0" max="100" value={sliderVal}
                          onChange={e => {
                            const v = Number(e.target.value);
                            const { captured, runPts } = getCtx();
                            if (runPts) {
                              const d = deriveFromAcc(v, runPts, isAllEdgesRun);
                              setActiveEdit({ row: i, pt: String(d.pt), seg: String(d.seg), pct: String(d.pct) });
                            }
                            setRunAccuracies(prev => prev.map((a, j) => j === i ? v : a));
                            scheduleApply(i, v, getCtx().captured, isAllEdgesRun);
                          }}
                          onMouseUp={() => flushAndCommit(i)}
                          style={{ width: 88, cursor: 'pointer', accentColor: '#ffffff', flexShrink: 0 }}
                        />
                        <NumInput value={pctVal} min={0} max={100} inputWidth={38} focused={isEditing}
                          onFocus={onFocusRow}
                          onChange={v => onChangeField('pct', v)}
                          onBlur={onBlurRow}
                          onKeyDown={e => onKeyDown(e, 'pct')}
                          onAdjust={d => onAdjust('pct', d)}
                        />
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>%</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div onMouseDown={onDragHandleMouseDown}
              style={{ height: 6, cursor: 'ns-resize', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 32, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.12)' }} />
            </div>
          </>
        )}
      </div>
    </>
  );
};
