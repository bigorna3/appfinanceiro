"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, TrendingUp, TrendingDown, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
}

interface StockData {
  symbol: string;
  shortName: string;
  regularMarketPrice: number;
  regularMarketChangePercent: number;
  regularMarketPreviousClose: number;
}

type Tab = "crypto" | "stocks" | "fiis";

function PriceCard({ name, symbol, price, change, image }: {
  name: string;
  symbol: string;
  price: number;
  change: number;
  image?: string;
}) {
  const isPositive = change >= 0;
  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-3 transition-colors hover:bg-muted/40">
      <div className="flex items-center gap-2.5 overflow-hidden">
        {image ? (
          <img src={image} alt={name} className="h-7 w-7 rounded-full" />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-xs font-bold text-blue-700 dark:text-blue-400">
            {symbol.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="overflow-hidden">
          <p className="truncate text-sm font-semibold text-foreground">{symbol.toUpperCase()}</p>
          <p className="truncate text-xs text-muted-foreground">{name}</p>
        </div>
      </div>
      <div className="ml-2 shrink-0 text-right">
        <p className="text-sm font-bold text-foreground">
          {formatCurrency(price)}
        </p>
        <div className={`flex items-center justify-end gap-0.5 text-xs font-medium ${
          isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
        }`}>
          {isPositive
            ? <TrendingUp className="h-3 w-3" />
            : <TrendingDown className="h-3 w-3" />}
          {isPositive ? "+" : ""}{change.toFixed(2)}%
        </div>
      </div>
    </div>
  );
}

function TokenMissingAlert() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center dark:border-yellow-800 dark:bg-yellow-900/20">
      <AlertCircle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
      <div>
        <p className="font-semibold text-yellow-800 dark:text-yellow-300">
          Token BRAPI não configurado
        </p>
        <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
          Crie sua conta gratuita em{" "}
          <a
            href="https://brapi.dev"
            target="_blank"
            rel="noreferrer"
            className="underline hover:no-underline"
          >
            brapi.dev
          </a>
          , copie o token e cole em{" "}
          <code className="rounded bg-yellow-100 px-1 dark:bg-yellow-900/50">.env.local</code>:
        </p>
        <code className="mt-2 block rounded bg-yellow-100 px-3 py-1.5 text-xs dark:bg-yellow-900/50">
          BRAPI_TOKEN=seu_token_aqui
        </code>
        <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-500">
          Após alterar o arquivo, reinicie o servidor com <code>npm run dev</code>
        </p>
      </div>
    </div>
  );
}

export function MarketTicker() {
  const [activeTab, setActiveTab] = useState<Tab>("crypto");
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [stocksData, setStocksData] = useState<StockData[]>([]);
  const [fiisData, setFiisData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(false);
  const [brapiMissing, setBrapiMissing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchCrypto = useCallback(async () => {
    const res = await fetch("/api/crypto");
    if (!res.ok) throw new Error("Falha ao buscar criptomoedas");
    return res.json() as Promise<CryptoData[]>;
  }, []);

  const fetchStocks = useCallback(async (type: "stocks" | "fiis") => {
    const res = await fetch(`/api/stocks?type=${type}`);
    if (res.status === 503) {
      setBrapiMissing(true);
      return [];
    }
    if (!res.ok) throw new Error("Falha ao buscar cotações");
    setBrapiMissing(false);
    return res.json() as Promise<StockData[]>;
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [crypto, stocks, fiis] = await Promise.all([
        fetchCrypto(),
        fetchStocks("stocks"),
        fetchStocks("fiis"),
      ]);
      setCryptoData(crypto);
      setStocksData(stocks);
      setFiisData(fiis);
      setLastUpdated(new Date());
    } catch (e) {
      setError("Não foi possível carregar as cotações. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [fetchCrypto, fetchStocks]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 60_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "crypto", label: "Criptomoedas" },
    { id: "stocks", label: "Ações (B3)" },
    { id: "fiis", label: "FIIs" },
  ];

  const activeData =
    activeTab === "crypto"
      ? cryptoData.map((c) => ({
          name: c.name,
          symbol: c.symbol,
          price: c.current_price,
          change: c.price_change_percentage_24h ?? 0,
          image: c.image,
        }))
      : (activeTab === "stocks" ? stocksData : fiisData).map((s) => ({
          name: s.shortName,
          symbol: s.symbol,
          price: s.regularMarketPrice,
          change: s.regularMarketChangePercent ?? 0,
        }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Cotações ao Vivo</CardTitle>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                {lastUpdated.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={fetchAll}
              disabled={loading}
              title="Atualizar cotações"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {activeTab !== "crypto" && brapiMissing ? (
          <TokenMissingAlert />
        ) : loading && activeData.length === 0 ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {activeData.map((item) => (
              <PriceCard key={item.symbol} {...item} />
            ))}
          </div>
        )}

        <p className="mt-3 text-center text-xs text-muted-foreground">
          {activeTab === "crypto"
            ? "Fonte: CoinGecko · Atualizado a cada 60s"
            : "Fonte: BRAPI (B3) · Atualizado a cada 60s"}
        </p>
      </CardContent>
    </Card>
  );
}
