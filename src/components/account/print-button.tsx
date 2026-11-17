"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton({ label = "Print / Save as PDF" }: { label?: string }) {
  return (
    <Button onClick={() => window.print()} className="h-10 rounded-xl px-4">
      <Printer data-icon="inline-start" /> {label}
    </Button>
  );
}
