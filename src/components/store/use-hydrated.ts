"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** True only after hydration — use to render localStorage-backed state (cart) safely. */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
