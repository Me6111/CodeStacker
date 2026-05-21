import React, { useState } from 'react';
import { useSVGContext } from '../../context/SVGContext';
import { TEMPLATES, Template } from './templates';
import { Polygon } from '../../types';

type View = 'grid' | 'detail' | 'confirm-save';

function instantiate(template: Template, svgW: number, svgH: number, existingCount: number): Polygon[] {
  const scale = Math.min(svgW, svgH) * 0.36 / 200;
  const base = existingCount * 18;
  const offsetX = (svgW - 200 * scale) / 2 + base;
  const offsetY = (svgH - 200 * scale) / 2 + base;
  return template.polygons.map((tp, i) => {
    const pts = tp.points.map(p => ({
      x: Math.round(p.x * scale + offsetX),
      y: Math.round(p.y * scale + offsetY),
    }));
    return {
      id: `tpl-${Date.now()}-${i}`,
      name: template.polygons.length > 1 ? `${tp.name} ${i + 1}` : tp.name,
      points: pts,
      closed: true,
      history: [pts.map(p => ({ ...p }))],
      historyIndex: 0,
    };
  });
}

function exportSVG(svgObject: any) {
  const polys = svgObject.polygons.map((poly: any) => {
    const pts = poly.points.map((p: any) => `${p.x},${p.y}`).join(' ');
    return `  <polygon points="${pts}" fill="none" stroke="#000000" stroke-width="1"/>`;
  }).join('\n');
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgObject.width}" height="${svgObject.height}">\n${polys}\n</svg>`;
  const blob = new Blob([markup], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${svgObject.name || 'drawing'}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function TemplateThumbnail({ template }: { template: Template }) {
  const allPts = template.polygons.flatMap(p => p.points);
  const xs = allPts.map(p => p.x), ys = allPts.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const pad = 10;
  const vw = maxX - minX + pad * 2, vh = maxY - minY + pad * 2;

  return (
    <svg viewBox={`${minX - pad} ${minY - pad} ${vw} ${vh}`}
      style={{ width: '100%', height: '100%' }} fill="none">
      {template.polygons.map((poly, i) => (
        <polygon key={i}
          points={poly.points.map(p => `${p.x},${p.y}`).join(' ')}
          fill="rgba(255,255,255,0.06)"
          stroke="rgba(255,255,255,0.75)"
          strokeWidth="5"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

export const TemplatesPanel: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { svgObject, appendPolygons, replacePolygons } = useSVGContext();
  const [view, setView] = useState<View>('grid');
  const [selected, setSelected] = useState<Template | null>(null);

  const hasShapes = svgObject.polygons.length > 0;

  const handleAddToSVG = (t: Template) => {
    const polys = instantiate(t, svgObject.width, svgObject.height, svgObject.polygons.length);
    appendPolygons(polys);
    onClose?.();
  };

  const handleOpenAsFile = (t: Template) => {
    if (hasShapes) {
      setView('confirm-save');
    } else {
      const polys = instantiate(t, svgObject.width, svgObject.height, 0);
      replacePolygons(polys);
      onClose?.();
    }
  };

  const handleSaveAndOpen = () => {
    exportSVG(svgObject);
    const polys = instantiate(selected!, svgObject.width, svgObject.height, 0);
    replacePolygons(polys);
    onClose?.();
  };

  const handleDiscardAndOpen = () => {
    const polys = instantiate(selected!, svgObject.width, svgObject.height, 0);
    replacePolygons(polys);
    onClose?.();
  };

  const row: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 6, padding: '10px 14px',
  };
  const actionBtn = (primary = false): React.CSSProperties => ({
    flex: 1, padding: '8px 0',
    background: primary ? 'rgba(255,255,255,0.12)' : 'transparent',
    border: `1px solid ${primary ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.14)'}`,
    borderRadius: 5, color: '#ffffff', fontSize: 12, cursor: 'pointer',
    fontWeight: primary ? 600 : 400,
    transition: 'all 0.12s',
  });

  // ── Confirm save ─────────────────────────────────────────────────────────────
  if (view === 'confirm-save') {
    return (
      <div style={{ padding: '14px 16px', minWidth: 240 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 10 }}>
          Save current work before opening?
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={{ ...actionBtn(true), flex: 1 }} onClick={handleSaveAndOpen}>Save</button>
          <button style={{ ...actionBtn(), flex: 1 }} onClick={handleDiscardAndOpen}>Discard</button>
          <button style={{ ...actionBtn(), flex: 0, padding: '8px 10px' }}
            onClick={() => { setView('detail'); }}>✕</button>
        </div>
      </div>
    );
  }

  // ── Detail view ───────────────────────────────────────────────────────────────
  if (view === 'detail' && selected) {
    return (
      <div style={{ minWidth: 220 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <button onClick={() => { setView('grid'); setSelected(null); }} style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)',
            cursor: 'pointer', fontSize: 12, padding: '2px 4px',
          }}>← Back</button>
          <span style={{ fontSize: 12, color: '#ffffff', fontWeight: 600 }}>{selected.name}</span>
        </div>

        <div style={{ padding: '12px 14px 6px', height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <TemplateThumbnail template={selected} />
        </div>

        <div style={{ ...row, flexDirection: 'column', gap: 6, padding: '8px 14px 14px' }}>
          <button style={{ ...actionBtn(true), width: '100%' }}
            onClick={() => handleAddToSVG(selected)}>
            Add to SVG
          </button>
          <button style={{ ...actionBtn(), width: '100%' }}
            onClick={() => handleOpenAsFile(selected)}>
            Open as new file
          </button>
        </div>
      </div>
    );
  }

  // ── Grid view ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minWidth: 260, padding: '10px 10px 12px' }}>
      <div style={{
        fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.35)', padding: '0 4px 8px',
      }}>Templates</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        {TEMPLATES.map(t => (
          <div key={t.id}
            onClick={() => { setSelected(t); setView('detail'); }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '8px 6px 6px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 6, cursor: 'pointer', transition: 'all 0.12s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.10)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.22)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.10)';
            }}
          >
            <div style={{ width: 44, height: 44 }}>
              <TemplateThumbnail template={t} />
            </div>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.04em', textAlign: 'center' }}>
              {t.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
