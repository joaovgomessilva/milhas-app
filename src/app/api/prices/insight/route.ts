import { serverProvider } from "@/lib/providers/composite";
import { NextResponse } from "next/server";
import { bad, parse } from "../_shared";

export async function GET(req: Request) {
  const p = parse(req.url);
  if (!p.from || !p.to) return bad("from e to são obrigatórios");
  const data = await serverProvider.getRouteInsight(p.from, p.to, p.cabin);
  return NextResponse.json(data, { headers: { "Cache-Control": "public, max-age=1800" } });
}
