import { NextRequest, NextResponse } from "next/server";

const STOCKS = ["PETR4", "VALE3", "ITUB4", "BBDC4", "ABEV3", "WEGE3"];
const FIIS   = ["HGLG11", "MXRF11", "XPLG11", "KNRI11", "BCFF11", "VISC11"];

async function fetchOne(symbol: string, token: string): Promise<Record<string, unknown> | null> {
  try {
    const url = `https://brapi.dev/api/quote/${symbol}?token=${token}&fundamental=false`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error || !data.results?.[0]) return null;
    return data.results[0];
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const token = process.env.BRAPI_TOKEN;

  if (!token || token === "SEU_TOKEN_AQUI") {
    return NextResponse.json({ error: "BRAPI_TOKEN_NOT_CONFIGURED" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "stocks";
  const symbols = type === "fiis" ? FIIS : STOCKS;

  try {
    const results = await Promise.all(symbols.map((s) => fetchOne(s, token)));
    const valid = results.filter(Boolean);
    return NextResponse.json(valid, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate" },
    });
  } catch {
    return NextResponse.json({ error: "Erro ao buscar dados da BRAPI" }, { status: 500 });
  }
}
