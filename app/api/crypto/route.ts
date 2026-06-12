import { NextResponse } from "next/server";

const CRYPTO_IDS = [
  "bitcoin",
  "ethereum",
  "solana",
  "binancecoin",
  "ripple",
  "cardano",
  "avalanche-2",
  "matic-network",
  "chainlink",
  "dogecoin",
  "polkadot",
  "litecoin",
].join(",");

export async function GET() {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=brl&ids=${CRYPTO_IDS}&order=market_cap_desc&per_page=20&sparkline=false&locale=pt`,
      {
        next: { revalidate: 60 },
        headers: { Accept: "application/json" },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Falha ao buscar dados da CoinGecko" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
