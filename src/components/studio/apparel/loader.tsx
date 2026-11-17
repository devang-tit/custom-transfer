"use client";

import dynamic from "next/dynamic";
import { EditorSkeleton } from "@/components/studio/ui/editor-skeleton";
import type { ApparelEditorProps } from "./types";

const DesignStudioEditor = dynamic(() => import("./design-studio-editor"), {
  ssr: false,
  loading: () => <EditorSkeleton label="Loading design studio…" />,
});

export function DesignStudioLoader(props: ApparelEditorProps) {
  return <DesignStudioEditor {...props} />;
}
