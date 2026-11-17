"use client";

import dynamic from "next/dynamic";
import { EditorSkeleton } from "@/components/studio/ui/editor-skeleton";
import type { GangEditorProps } from "./types";

// Konva touches `window`, so the editor is client-only.
const GangSheetEditor = dynamic(() => import("./gang-sheet-editor"), {
  ssr: false,
  loading: () => <EditorSkeleton label="Loading gang sheet builder…" />,
});

export function GangSheetLoader(props: GangEditorProps) {
  return <GangSheetEditor {...props} />;
}
