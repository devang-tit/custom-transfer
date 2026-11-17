import { NextResponse } from "next/server";
import { searchProducts } from "@/app/(store)/_actions/search";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const results = await searchProducts(q.slice(0, 80), 8);
  return NextResponse.json({ results });
}
