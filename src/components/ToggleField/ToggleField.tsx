import React, { useState, useRef, useEffect, CSSProperties } from 'react';
import { createPortal } from 'react-dom';

type TriggerType = 'click' | 'hover' | 'focus';

interface ToggleFieldProps {
  ToggleElement?: React.ReactNode;
  FieldContent?: React.ReactNode;
  FieldLocation?: HTMLElement | null;
  trigger?: TriggerType;
  isOpen?: boolean;
  defaultOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  closeOnSelect?: boolean;
  closeOnBlur?: boolean;
  openDelay?: number;
  closeDelay?: number;
  buttonStyle?: CSSProperties;
  buttonStyleWhenOpen?: CSSProperties;
  containerStyle?: CSSProperties;
  hideOnDesktop?: boolean;
  mobileBreakpoint?: number;
  showBackdrop?: boolean;
  backdropStyle?: CSSProperties;
}

const ToggleField: React.FC<ToggleFieldProps> = ({
  ToggleElement,
  FieldContent,
  FieldLocation,
  trigger = 'click',
  isOpen,
  defaultOpen = false,
  onOpen,
  onClose,
  closeOnSelect = false,
  closeOnBlur = true,
  openDelay = 0,
  closeDelay = 0,
  buttonStyle,
  buttonStyleWhenOpen,
  containerStyle,
  hideOnDesktop = false,
  mobileBreakpoint = 768,
  showBackdrop = false,
  backdropStyle,
}) => {
  const controlled = isOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const open = controlled ? isOpen : internalOpen;

  const buttonRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const openTimeout = useRef<number>();
  const closeTimeout = useRef<number>();

  useEffect(() => {
    setMounted(true);
    const handleResize = () => {
      setIsMobile(window.innerWidth <= mobileBreakpoint);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileBreakpoint]);

  const setOpen = (value: boolean) => {
    if (!controlled) setInternalOpen(value);
    if (value) onOpen?.();
    else onClose?.();
  };

  const clearTimers = () => {
    if (openTimeout.current) window.clearTimeout(openTimeout.current);
    if (closeTimeout.current) window.clearTimeout(closeTimeout.current);
  };

  const handleOpen = () => {
    clearTimers();
    openTimeout.current = window.setTimeout(() => setOpen(true), openDelay);
  };

  const handleClose = () => {
    clearTimers();
    closeTimeout.current = window.setTimeout(() => setOpen(false), closeDelay);
  };

  const handleToggle = () => {
    open ? handleClose() : handleOpen();
  };

  useEffect(() => {
    if (!open || !closeOnBlur) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        fieldRef.current &&
        !fieldRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, closeOnBlur]);

  const triggerProps =
    trigger === 'click'
      ? { onClick: handleToggle }
      : trigger === 'hover'
      ? { onMouseEnter: handleOpen, onMouseLeave: handleClose }
      : { onFocus: handleOpen, onBlur: handleClose };

  if (!mounted) return null;
  if (hideOnDesktop && !isMobile) return null;

  const defaultContent = (
    <div style={{ padding: '20px', backgroundColor: '#1a1a1a', color: '#fff', borderRadius: '4px', border: '1px solid #333' }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Toggle Field Content</h3>
      <p style={{ margin: 0, fontSize: '14px' }}>Edit the FieldContent prop to customize this area.</p>
    </div>
  );

  const backdrop = showBackdrop && open ? (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 998,
        ...backdropStyle,
      }}
    />
  ) : null;

  const field = open ? (
    <div ref={fieldRef} style={{ width: '100%', marginTop: '10px' }}>
      {FieldContent || defaultContent}
    </div>
  ) : null;

  const activeButtonStyle = open && buttonStyleWhenOpen ? buttonStyleWhenOpen : buttonStyle;

  return (
    <>
      {backdrop}
      <div className="ToggleField" style={{ position: 'relative', zIndex: open ? 999 : 1, ...containerStyle }}>
        <div
          ref={buttonRef}
          style={{
            cursor: 'pointer',
            padding: '10px 15px',
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '16px',
            userSelect: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            ...activeButtonStyle,
          }}
          {...triggerProps}
        >
          {ToggleElement || (
            <>
              <span>{open ? '▼' : '▶'}</span>
              <span>Toggle</span>
            </>
          )}
        </div>
        {FieldLocation && field ? createPortal(field, FieldLocation) : field}
      </div>
    </>
  );
};

export const togglefieldDefaultProps = {
  trigger: 'click' as TriggerType,
  defaultOpen: false,
  closeOnSelect: false,
  closeOnBlur: true,
  openDelay: 0,
  closeDelay: 0,
  hideOnDesktop: false,
  mobileBreakpoint: 768,
  showBackdrop: false,
};

export const togglefieldPropKeys = [
  'trigger',
  'defaultOpen',
  'closeOnSelect',
  'closeOnBlur',
  'openDelay',
  'closeDelay',
  'hideOnDesktop',
  'mobileBreakpoint',
  'showBackdrop',
];

export const togglefieldPropOptions = {
  trigger: ['click', 'hover', 'focus'],
};

export const togglefieldNumberProps = ['openDelay', 'closeDelay', 'mobileBreakpoint'];

export const togglefieldCodeProps: string[] = [];

export default ToggleField;