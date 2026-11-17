"use client";

import { forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Kbd } from "./kbd";

type Props = React.ComponentProps<typeof Button> & {
  label: string;
  shortcut?: string;
  active?: boolean;
  side?: "top" | "bottom" | "left" | "right";
};

/** Icon button with tooltip + optional shortcut hint. */
export const ToolButton = forwardRef<HTMLButtonElement, Props>(function ToolButton(
  { label, shortcut, active, side = "bottom", className, variant = "ghost", size = "icon", children, ...props },
  ref
) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          ref={ref}
          variant={variant}
          size={size}
          aria-label={label}
          aria-pressed={active}
          className={cn(active && "bg-accent text-accent-foreground hover:bg-accent", className)}
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side={side} className="flex items-center gap-2">
        {label}
        {shortcut && <Kbd className="border-background/20 bg-background/15 text-background">{shortcut}</Kbd>}
      </TooltipContent>
    </Tooltip>
  );
});
