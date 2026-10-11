import type { CabinId } from "@/data/programs";
import { NextResponse } from "next/server";

const CODE = /^[A-Z]{3}$/;
const MONTH = /^\d{4}-\d{2}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const CABINS = new Set<CabinId>(["economy", "premium", "business"]);

export function parse(url: string) {
  const sp = new URL(url).searchParams;
  const from = sp.get("from") ?? "";
  const to = sp.get("to") ?? "";
  const month = sp.get("month") ?? "";
  const date = sp.get("date") ?? "";
  const cabinRaw = sp.get("cabin") ?? "economy";
  const cabin = (CABINS.has(cabinRaw as CabinId) ? cabinRaw : "economy") as CabinId;
  const passengers = Math.min(9, Math.max(1, Number(sp.get("pax") ?? 1) || 1));
  return {
    from: CODE.test(from) ? from : null,
    to: CODE.test(to) ? to : null,
    month: MONTH.test(month) ? month : month === "any" ? ("any" as const) : null,
    date: DATE.test(date) ? date : null,
    cabin,
    passengers,
  };
}

export const bad = (msg: string) => NextResponse.json({ error: msg }, { status: 400 });
