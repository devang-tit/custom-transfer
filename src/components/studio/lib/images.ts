"use client";

import { useEffect, useState } from "react";

const cache = new Map<string, Promise<HTMLImageElement>>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  let p = cache.get(src);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => {
        cache.delete(src);
        reject(new Error(`Could not load ${src}`));
      };
      img.src = src;
    });
    cache.set(src, p);
  }
  return p;
}

/** Loaded HTMLImageElement for a URL (null while loading / on error). */
export function useLoadedImage(src: string | undefined): HTMLImageElement | null {
  const [state, setState] = useState<{ src?: string; img: HTMLImageElement | null }>({ img: null });
  useEffect(() => {
    if (!src) return;
    let alive = true;
    loadImage(src)
      .then((img) => alive && setState({ src, img }))
      .catch(() => alive && setState({ src, img: null }));
    return () => {
      alive = false;
    };
  }, [src]);
  return state.src === src ? state.img : null;
}
