import { serverProvider } from "@/lib/providers/composite";
import { NextResponse } from "next/server";
import { bad, parse } from "../_shared";

export async function GET(req: Request) {
  const p = parse(req.url);
  if (!p.from || !p.to || !p.date) return bad("from, to e date (YYYY-MM-DD) são obrigatórios");
  const data = await serverProvider.getFlights({ from: p.from, to: p.to, month: p.date.slice(0, 7), passengers: p.passengers, cabin: p.cabin }, p.date);
  return NextResponse.json(data, { headers: { "Cache-Control": "public, max-age=600" } });
}
