import { serverProvider } from "@/lib/providers/composite";
import { NextResponse } from "next/server";
import { bad, parse } from "../_shared";

export async function GET(req: Request) {
  const p = parse(req.url);
  if (!p.from || !p.month) return bad("from e month (YYYY-MM ou any) são obrigatórios");
  const data = await serverProvider.getExplore({ from: p.from, month: p.month, passengers: p.passengers, cabin: p.cabin });
  return NextResponse.json(data, { headers: { "Cache-Control": "public, max-age=900" } });
}
