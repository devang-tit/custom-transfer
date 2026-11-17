"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fieldInputClass } from "@/components/auth/form-field";

export function PasswordInput({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input type={show ? "text" : "password"} className={cn(fieldInputClass, "pr-11", className)} {...props} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

/** 0–4 score with label, for the register strength meter. */
export function passwordScore(pw: string): { score: number; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  else if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score += 0.5;
  const s = Math.min(4, Math.floor(score));
  return { score: s, label: ["Too weak", "Weak", "Fair", "Strong", "Excellent"][s]! };
}

export function PasswordStrength({ password }: { password: string }) {
  const { score, label } = passwordScore(password);
  const colors = ["bg-destructive", "bg-orange-500", "bg-amber-400", "bg-emerald-500", "bg-emerald-500"];
  if (!password) return <p className="text-xs text-muted-foreground">Use 8+ characters with a mix of letters, numbers & symbols.</p>;
  return (
    <div className="grid gap-1.5" aria-live="polite">
      <div className="grid grid-cols-4 gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn("h-1.5 rounded-full transition-colors duration-300", i < Math.max(1, score) ? colors[score] : "bg-muted")}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Password strength: <span className="font-medium text-foreground">{label}</span>
      </p>
    </div>
  );
}
