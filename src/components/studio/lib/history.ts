"use client";

import { useCallback, useRef, useState } from "react";

type HistoryState<T> = { past: T[]; present: T; future: T[] };
const LIMIT = 100;

/**
 * Undo/redo state. Calls sharing a `coalesceKey` within 800ms merge into one
 * history step (e.g. typing in a size field).
 */
export function useHistory<T>(initial: T | (() => T)) {
  const [state, setState] = useState<HistoryState<T>>(() => ({
    past: [],
    present: typeof initial === "function" ? (initial as () => T)() : initial,
    future: [],
  }));
  const last = useRef<{ key: string; t: number } | null>(null);

  const set = useCallback((next: T | ((prev: T) => T), coalesceKey?: string) => {
    const now = Date.now();
    const coalesce = !!coalesceKey && last.current?.key === coalesceKey && now - last.current.t < 800;
    last.current = coalesceKey ? { key: coalesceKey, t: now } : null;
    setState((s) => {
      const value = typeof next === "function" ? (next as (p: T) => T)(s.present) : next;
      if (Object.is(value, s.present)) return s;
      return {
        past: coalesce ? s.past : [...s.past.slice(-(LIMIT - 1)), s.present],
        present: value,
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    last.current = null;
    setState((s) => {
      if (!s.past.length) return s;
      const prev = s.past[s.past.length - 1]!;
      return { past: s.past.slice(0, -1), present: prev, future: [s.present, ...s.future] };
    });
  }, []);

  const redo = useCallback(() => {
    last.current = null;
    setState((s) => {
      if (!s.future.length) return s;
      const [next, ...rest] = s.future;
      return { past: [...s.past, s.present], present: next!, future: rest };
    });
  }, []);

  /** Replace the present value without creating an undo step (e.g. re-measuring fonts). */
  const replace = useCallback((next: T | ((prev: T) => T)) => {
    setState((s) => ({ ...s, present: typeof next === "function" ? (next as (p: T) => T)(s.present) : next }));
  }, []);

  const reset = useCallback((value: T) => {
    last.current = null;
    setState({ past: [], present: value, future: [] });
  }, []);

  return {
    value: state.present,
    set,
    undo,
    redo,
    reset,
    replace,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
