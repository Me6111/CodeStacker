import React, { useState } from 'react';
import TrashIcon from '../Icons/TrashIcon';

interface TabOverlay {
  id: string;
  type: string;
  confirmed?: boolean;
  source?: string;
  targetPolygonId?: string | null;
  targetPolygonName?: string;
}

interface SelectionTabsProps {
  overlays: TabOverlay[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onConfirm: (id: string) => void;
  onEdit: (id: string) => void;
}

const TYPE_ICON: Record<string, string>  = { rectangle: '□', polygon: '▱', freeform: '~', circle: '○' };
const TYPE_LABEL: Record<string, string> = { rectangle: 'Rectangle', polygon: 'Polygon', freeform: 'Freeform', circle: 'Circle' };

const ACTIVE_BG  = 'rgba(96,165,250,0.18)';
const ACTIVE_BDR = '#60a5fa';
const ACTIVE_CLR = '#93c5fd';

const INACT_BG   = 'rgba(96,165,250,0.05)';
const INACT_BDR  = 'rgba(96,165,250,0.55)';
const INACT_CLR  = 'rgba(96,165,250,0.7)';

const SelectionTabs: React.FC<SelectionTabsProps> = ({ overlays, activeId, onSelect, onClose, onConfirm, onEdit }) => {
  const [tooltip, setTooltip] = useState<{ id: string; x: number; y: number } | null>(null);

  if (overlays.length === 0) return null;

  const tooltipOverlay = tooltip ? overlays.find(o => o.id === tooltip.id) : null;

  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 2,
        padding: '0 12px',
        background: '#000000',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        flexShrink: 0, overflowX: 'auto',
      }}>
        {overlays.map((tab, idx) => {
          const isActive = tab.id === activeId;
          const isConf   = !!tab.confirmed;
          const bg  = isActive ? ACTIVE_BG  : INACT_BG;
          const bdr = isActive ? ACTIVE_BDR : INACT_BDR;
          const clr = isActive ? ACTIVE_CLR : INACT_CLR;

          return (
            <div
              key={tab.id}
              onClick={() => onSelect(tab.id)}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltip({ id: tab.id, x: rect.left, y: rect.bottom + 4 });
              }}
              onMouseLeave={() => setTooltip(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 6px 5px 10px',
                background: bg, color: clr,
                border: `1px solid ${bdr}`,
                borderBottom: 'none',
                borderRadius: '5px 5px 0 0',
                cursor: 'pointer', fontSize: 12,
                fontWeight: isActive ? 600 : 400,
                whiteSpace: 'nowrap' as const,
                userSelect: 'none' as const,
                transition: 'all 0.12s',
              }}
            >
              <span>{idx + 1}</span>

              <span
                onClick={(e) => { e.stopPropagation(); isConf ? onEdit(tab.id) : onConfirm(tab.id); }}
                title={isConf ? 'Edit selection' : 'Confirm selection'}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 16, height: 16, borderRadius: 3, fontSize: 11,
                  color: clr, opacity: isActive ? 1 : 0.6,
                  cursor: 'pointer', transition: 'opacity 0.12s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = isActive ? '1' : '0.6')}
              >
                {isConf ? '✓' : '✎'}
              </span>

              <span
                onClick={(e) => { e.stopPropagation(); onClose(tab.id); }}
                title="Close selection"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 16, height: 16, borderRadius: 3,
                  cursor: 'pointer', opacity: 0.35, transition: 'opacity 0.12s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.35')}
              >
                <TrashIcon size={10} />
              </span>
            </div>
          );
        })}
      </div>

      {tooltip && tooltipOverlay && (
        <div style={{
          position: 'fixed', left: tooltip.x, top: tooltip.y, zIndex: 9999,
          background: '#0e0e0e',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 5, padding: '7px 11px',
          fontSize: 11, color: 'rgba(255,255,255,0.6)',
          whiteSpace: 'nowrap', pointerEvents: 'none',
          boxShadow: '0 4px 16px rgba(0,0,0,0.8)',
          lineHeight: 1.75,
        }}>
          <div style={{ fontWeight: 600, color: '#ffffff', marginBottom: 2, fontSize: 12 }}>
            <span style={{ marginRight: 6, opacity: 0.65 }}>{TYPE_ICON[tooltipOverlay.type] ?? '◻'}</span>
            {TYPE_LABEL[tooltipOverlay.type] ?? tooltipOverlay.type}
          </div>
          <div>
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>Source </span>
            {tooltipOverlay.source === 'objectmap' ? 'Object Map'
              : tooltipOverlay.source === 'manual' ? 'Manual'
              : '—'}
          </div>
          {tooltipOverlay.source === 'objectmap' && (
            <div>
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>Target </span>
              {tooltipOverlay.targetPolygonId === null
                ? 'SVG'
                : tooltipOverlay.targetPolygonName ?? tooltipOverlay.targetPolygonId ?? '—'}
            </div>
          )}
          <div>
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>Status </span>
            {tooltipOverlay.confirmed ? 'Confirmed' : 'Unconfirmed'}
          </div>
        </div>
      )}
    </>
  );
};

export default SelectionTabs;
