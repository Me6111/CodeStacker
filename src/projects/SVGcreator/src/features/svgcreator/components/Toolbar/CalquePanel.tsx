import React, { useRef } from 'react';
import { useCalqueContext } from '../../context/CalqueContext';
import { useSVGContext } from '../../context/SVGContext';

const Toggle: React.FC<{ value: boolean; onChange: (v: boolean) => void }> = ({ value, onChange }) => (
  <div onClick={() => onChange(!value)} style={{
    width: 32, height: 17, borderRadius: 9, flexShrink: 0, cursor: 'pointer',
    background: value ? '#60a5fa' : 'rgba(255,255,255,0.15)',
    position: 'relative', transition: 'background 0.18s',
  }}>
    <div style={{
      position: 'absolute', top: 2.5, left: value ? 17 : 2.5,
      width: 12, height: 12, borderRadius: '50%', background: '#fff',
      transition: 'left 0.18s', boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
    }} />
  </div>
);

const inputS: React.CSSProperties = {
  padding: '3px 6px', background: '#0d0d0d', color: '#fff',
  border: '1px solid rgba(255,255,255,0.13)', borderRadius: 3,
  fontSize: 12, outline: 'none', textAlign: 'right',
};
const row: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 7 };
const lbl: React.CSSProperties = { fontSize: 12, color: 'rgba(255,255,255,0.65)', whiteSpace: 'nowrap' };
const sectionTitle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 10,
};

export const CalquePanel: React.FC = () => {
  const {
    imageUrl, setImageUrl, imageVisible, setImageVisible,
    imageOpacity, setImageOpacity, imageTransform, setImageTransform,
    gridSize, setGridSize, gridVisible, setGridVisible, snapEnabled, setSnapEnabled,
  } = useCalqueContext();
  const { svgObject } = useSVGContext();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setImageTransform({ x: 0, y: 0, width: svgObject.width, height: svgObject.height });
    setImageVisible(true);
    e.target.value = '';
  };

  return (
    <div style={{ padding: '14px 16px 12px', minWidth: 230 }} onMouseDown={e => e.stopPropagation()}>

      {/* ── Image ── */}
      <div style={sectionTitle}>Image</div>
      <div style={row}>
        <button onClick={() => fileRef.current?.click()} style={{
          flex: 1, padding: '6px 10px', cursor: 'pointer', borderRadius: 4, fontSize: 12,
          background: imageUrl ? 'rgba(255,255,255,0.07)' : 'rgba(96,165,250,0.15)',
          color: '#fff', border: `1px solid ${imageUrl ? 'rgba(255,255,255,0.14)' : '#60a5fa'}`,
        }}>
          {imageUrl ? '↑ Replace image' : '↑ Upload image'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
        {imageUrl && <Toggle value={imageVisible} onChange={setImageVisible} />}
      </div>

      {imageUrl && <>
        <div style={row}>
          <span style={lbl}>Opacity</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="range" min="0" max="100" value={imageOpacity}
              onChange={e => setImageOpacity(Number(e.target.value))}
              style={{ width: 72, accentColor: '#60a5fa' }} />
            <span style={{ ...inputS, width: 32, textAlign: 'center', border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>{imageOpacity}%</span>
          </div>
        </div>
        <div style={row}>
          <span style={lbl}>Position x / y</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <input type="number" value={Math.round(imageTransform.x)} style={{ ...inputS, width: 48 }}
              onChange={e => setImageTransform(t => ({ ...t, x: Number(e.target.value) }))} />
            <input type="number" value={Math.round(imageTransform.y)} style={{ ...inputS, width: 48 }}
              onChange={e => setImageTransform(t => ({ ...t, y: Number(e.target.value) }))} />
          </div>
        </div>
        <div style={row}>
          <span style={lbl}>Size w / h</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <input type="number" value={Math.round(imageTransform.width)} style={{ ...inputS, width: 48 }}
              onChange={e => setImageTransform(t => ({ ...t, width: Math.max(1, Number(e.target.value)) }))} />
            <input type="number" value={Math.round(imageTransform.height)} style={{ ...inputS, width: 48 }}
              onChange={e => setImageTransform(t => ({ ...t, height: Math.max(1, Number(e.target.value)) }))} />
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <button
            onClick={() => setImageTransform({ x: 0, y: 0, width: svgObject.width, height: svgObject.height })}
            style={{ width: '100%', padding: '5px 8px', cursor: 'pointer', borderRadius: 3, fontSize: 11, background: 'transparent', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
          >Fit to SVG canvas</button>
        </div>
        {imageUrl && <div style={{ marginBottom: 10 }}>
          <button
            onClick={() => setImageUrl(null)}
            style={{ width: '100%', padding: '5px 8px', cursor: 'pointer', borderRadius: 3, fontSize: 11, background: 'transparent', color: 'rgba(239,68,68,0.7)', border: '1px solid rgba(239,68,68,0.2)' }}
          >Remove image</button>
        </div>}
      </>}

      <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '6px 0 12px' }} />

      {/* ── Grid / Net ── */}
      <div style={sectionTitle}>Grid / Net</div>
      <div style={row}>
        <span style={lbl}>Show grid</span>
        <Toggle value={gridVisible} onChange={setGridVisible} />
      </div>
      <div style={row}>
        <span style={lbl}>Spacing (px)</span>
        <input type="number" min="2" max="400" value={gridSize} style={{ ...inputS, width: 62 }}
          onChange={e => setGridSize(Math.max(2, Math.min(400, Number(e.target.value))))} />
      </div>
      <div style={row}>
        <span style={lbl}>Snap to grid</span>
        <Toggle value={snapEnabled} onChange={setSnapEnabled} />
      </div>
      {snapEnabled && !gridVisible && (
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: -4, marginBottom: 4, fontStyle: 'italic' }}>
          Snap active — enable grid to see attractors
        </div>
      )}
    </div>
  );
};
