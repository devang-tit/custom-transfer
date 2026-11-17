import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  return (
    <div className="grid gap-8">
      <div className="grid gap-3">
        <h1 className="text-3xl font-bold sm:text-4xl">Create your account</h1>
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          {["Save designs & gang sheets", "1-click reorders", "Live order tracking"].map((b) => (
            <li key={b} className="inline-flex items-center gap-1.5">
              <Check className="size-3.5 text-primary" /> {b}
            </li>
          ))}
        </ul>
      </div>
      <RegisterForm next={next} />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
