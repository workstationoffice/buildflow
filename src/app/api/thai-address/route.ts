import { NextRequest, NextResponse } from "next/server";

let service: any = null;

async function getService() {
  if (!service) {
    const { AddressService } = await import("thailand-address");
    const db = (await import("thailand-address/lib/database/db.json")).default;
    service = new AddressService();
    service.loadData(db);
  }
  return service;
}

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });
  const svc = await getService();
  const results = svc.query(q, 10);
  return NextResponse.json({ results });
}
