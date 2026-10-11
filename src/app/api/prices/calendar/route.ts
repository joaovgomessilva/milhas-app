import { serverProvider } from "@/lib/providers/composite";
import { NextResponse } from "next/server";
import { bad, parse } from "../_shared";

export async function GET(req: Request) {
  const p = parse(req.url);
  if (!p.from || !p.to || !p.month || p.month === "any") return bad("from, to e month (YYYY-MM) são obrigatórios");
  const data = await serverProvider.getCalendar({ from: p.from, to: p.to, month: p.month, passengers: p.passengers, cabin: p.cabin });
  return NextResponse.json(data, { headers: { "Cache-Control": "public, max-age=600" } });
}
