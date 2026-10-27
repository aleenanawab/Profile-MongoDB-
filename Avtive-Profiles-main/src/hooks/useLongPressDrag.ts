'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { DragControls } from 'framer-motion';

export interface UseLongPressDragOptions {
  dragControls: DragControls;
  delayMs?: number;
  moveThreshold?: number;
  onArmed?: () => void;
  onCancelled?: () => void;
}

export function useLongPressDrag({
  dragControls,
  delayMs = 200,
  moveThreshold = 6,
  onArmed,
  onCancelled
}: UseLongPressDragOptions) {
  const [isPressing, setIsPressing] = useState(false);
  const [isArmed, setIsArmed] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startCoordsRef = useRef<{ x: number; y: number } | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const eventRef = useRef<React.PointerEvent | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startCoordsRef.current = null;
    pointerIdRef.current = null;
    eventRef.current = null;
    setIsPressing(false);
    setIsArmed(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only handle primary button
      if (e.button !== 0) return;

      cleanup();

      const startX = e.clientX;
      const startY = e.clientY;
      startCoordsRef.current = { x: startX, y: startY };
      pointerIdRef.current = e.pointerId;
      eventRef.current = e;
      setIsPressing(true);

      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setIsArmed(true);
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
          try {
            navigator.vibrate(12);
          } catch {}
        }
        if (eventRef.current) {
          dragControls.start(eventRef.current);
        }
        onArmed?.();
      }, delayMs);
    },
    [cleanup, delayMs, dragControls, onArmed]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!startCoordsRef.current || !timerRef.current) return;

      const deltaX = Math.abs(e.clientX - startCoordsRef.current.x);
      const deltaY = Math.abs(e.clientY - startCoordsRef.current.y);
      const distance = Math.hypot(deltaX, deltaY);

      if (distance > moveThreshold) {
        // Pointer moved too far before hold completed: cancel drag to allow normal scrolling
        cleanup();
        onCancelled?.();
      }
    },
    [cleanup, moveThreshold, onCancelled]
  );

  const handlePointerUp = useCallback(() => {
    if (timerRef.current) {
      // Released before hold finished
      cleanup();
      onCancelled?.();
    } else {
      cleanup();
    }
  }, [cleanup, onCancelled]);

  const handlePointerCancel = useCallback(() => {
    cleanup();
    onCancelled?.();
  }, [cleanup, onCancelled]);

  return {
    isPressing,
    isArmed,
    dragHandleProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
      style: { touchAction: 'none' } as React.CSSProperties
    }
  };
}
