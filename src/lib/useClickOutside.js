'use client';
import { useEffect } from 'react';

/**
 * useClickOutside
 * - Підтримує один ref або масив ref-ів
 * - Викликає onOutside при mousedown/touchstart поза зонами
 * - (опц.) Закриває по Escape
 */
export function useClickOutside(refOrRefs, onOutside, { closeOnEscape = true } = {}) {
  useEffect(() => {
    const refs = Array.isArray(refOrRefs) ? refOrRefs : [refOrRefs];

    function isInsideAny(target) {
      if (!(target instanceof Node)) return false;
      return refs.some((r) => r?.current && r.current.contains(target));
    }

    function onPointer(e) {
      if (!isInsideAny(e.target)) onOutside?.(e);
    }

    function onKey(e) {
      if (closeOnEscape && e.key === 'Escape') onOutside?.(e);
    }

    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer, { passive: true });
    if (closeOnEscape) document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
      if (closeOnEscape) document.removeEventListener('keydown', onKey);
    };
  }, [refOrRefs, onOutside, closeOnEscape]);
}
