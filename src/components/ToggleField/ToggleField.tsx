import React, { useState, useRef, useEffect, CSSProperties } from 'react';
import { createPortal } from 'react-dom';

type TriggerType = 'click' | 'hover' | 'focus';

interface ToggleFieldProps {
  ToggleElement?: React.ReactNode;
  FieldContent: React.ReactNode;
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
  containerStyle?: CSSProperties;
  hideOnDesktop?: boolean;
  mobileBreakpoint?: number;
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
  containerStyle,
  hideOnDesktop = false,
  mobileBreakpoint = 768,
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

  const field = open ? (
    <div ref={fieldRef}>
      {FieldContent}
    </div>
  ) : null;

  return (
    <div className="ToggleField" style={containerStyle}>
      <div
        ref={buttonRef}
        style={{
          cursor: 'pointer',
          ...buttonStyle,
        }}
        {...triggerProps}
      >
        {ToggleElement || '☰'}
      </div>
      {FieldLocation && field ? createPortal(field, FieldLocation) : field}
    </div>
  );
};

export default ToggleField;