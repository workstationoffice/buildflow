import { NextRequest, NextResponse } from "next/server";
import { requireTenantUser } from "@/lib/auth";

// DBD Open Data API — get your key at https://opendata.dbd.go.th/
// Set DBD_API_KEY in .env.local

export async function GET(req: NextRequest) {
  try {
    await requireTenantUser();

    const { searchParams } = new URL(req.url);
    const taxId = searchParams.get("taxId")?.trim();

    if (!taxId || !/^\d{13}$/.test(taxId)) {
      return NextResponse.json({ error: "Tax ID must be exactly 13 digits" }, { status: 400 });
    }

    const apiKey = process.env.DBD_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "DBD_API_KEY not configured" }, { status: 503 });
    }

    // DBD Open Data API v1
    // Endpoint: https://openapi.dbd.go.th/api/v1/juristic_person/{id}
    // Auth: Authorization header with API key from opendata.dbd.go.th
    const dbdRes = await fetch(
      `https://openapi.dbd.go.th/api/v1/juristic_person/${taxId}`,
      {
        headers: {
          "Authorization": apiKey,
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const rawText = await dbdRes.text();

    // WAF block check (Imperva returns HTML "Request Rejected" with 200 status)
    if (rawText.includes("Request Rejected") || rawText.trimStart().startsWith("<html")) {
      return NextResponse.json(
        { error: "DBD API blocked this request. The API requires a Thai IP address. Make sure you are accessing from Thailand and your API key is registered at opendata.dbd.go.th" },
        { status: 502 }
      );
    }

    if (dbdRes.status === 404 || rawText.includes("not found")) {
      return NextResponse.json({ error: "ไม่พบข้อมูลนิติบุคคลในระบบ DBD (Tax ID not found)" }, { status: 404 });
    }

    if (!dbdRes.ok) {
      return NextResponse.json({ error: `DBD API error: ${dbdRes.status}` }, { status: 502 });
    }

    let raw: any;
    try {
      raw = JSON.parse(rawText);
    } catch {
      return NextResponse.json({ error: "DBD returned an unexpected response format" }, { status: 502 });
    }

    // Normalize response — DBD v1 may wrap in array or return object directly
    const record = Array.isArray(raw?.data)
      ? raw.data[0]
      : Array.isArray(raw)
      ? raw[0]
      : raw?.result ?? raw;

    if (!record || (!record.juristicNameTh && !record.juristic_name_th && !record.name_th)) {
      return NextResponse.json({ error: "ไม่พบข้อมูลนิติบุคคลในระบบ DBD (Tax ID not found)" }, { status: 404 });
    }

    // Support both camelCase and snake_case field names from DBD v1
    const nameTh = record.juristicNameTh ?? record.juristic_name_th ?? record.name_th ?? "";
    const nameEn = record.juristicNameEng ?? record.juristicNameEn ?? record.juristic_name_eng ?? record.name_en ?? "";
    const type    = record.juristicType   ?? record.juristic_type   ?? record.type   ?? "";
    const status  = record.juristicStatus ?? record.juristic_status ?? record.status ?? "";
    const capital = record.registeredCapital ?? record.registered_capital ?? record.capital ?? null;
    const regDate = record.registrationDate  ?? record.registration_date  ?? record.reg_date ?? "";
    const objective = record.juristicObjective ?? record.objective ?? "";

    // Build address string from structured object or flat string
    let address = "";
    const addr = record.address ?? record.juristicAddress ?? record.headOfficeAddress ?? {};
    if (typeof addr === "string") {
      address = addr;
    } else {
      const parts = [
        addr.houseNo   ?? addr.house_no   ?? addr.addressNo,
        addr.buildingName ?? addr.building ? `อาคาร${addr.buildingName ?? addr.building}` : null,
        addr.floor     ? `ชั้น${addr.floor}`     : null,
        addr.roomNo    ? `ห้อง${addr.roomNo}`    : null,
        addr.moo       ? `หมู่${addr.moo}`       : null,
        addr.soi       ? `ซอย${addr.soi}`        : null,
        addr.road      ? `ถนน${addr.road}`       : null,
        (addr.tumbon ?? addr.thambol ?? addr.subDistrict) ? `แขวง/ตำบล${addr.tumbon ?? addr.thambol ?? addr.subDistrict}` : null,
        (addr.amphur ?? addr.district)  ? `เขต/อำเภอ${addr.amphur ?? addr.district}` : null,
        addr.province  ? `จังหวัด${addr.province}` : null,
        addr.postCode  ?? addr.post_code ?? addr.zipCode,
      ].filter(Boolean);
      address = parts.join(" ");
    }

    return NextResponse.json({
      juristicId: record.juristicId ?? record.juristic_id ?? taxId,
      nameTh,
      nameEn,
      type,
      status,
      capital,
      registrationDate: regDate,
      objective,
      address,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
