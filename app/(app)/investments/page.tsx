"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MONTHS, INVESTMENT_SUBCATEGORIES, type Transaction } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { InvestmentForm } from "@/components/investments/investment-form";
import { MarketTicker } from "@/components/investments/market-ticker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const SUBCATEGORY_COLORS: Record<string, string> = {
  "Renda Fixa": "#10B981",
  "Renda Variável": "#3B82F6",
  Ações: "#F59E0B",
  ETFs: "#8B5CF6",
  FIIs: "#EC4899",
  Criptomoedas: "#F97316",
  "Tesouro Direto": "#059669",
  "Previdência Privada": "#6366F1",
  Outros: "#6B7280",
};


export default function InvestmentsPage() {
  const router = useRouter();
  const supabase = createClient();

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  async function fetchTransactions() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("category", "Investimentos")
      .gte("date", `${selectedYear}-01-01`)
      .lte("date", `${selectedYear}-12-31`)
      .order("date", { ascending: false });

    setTransactions(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  const totalInvested = useMemo(
    () => transactions.reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  // Group by subcategory for chart
  const bySubcategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of transactions) {
      const key = t.subcategory ?? "Outros";
      map[key] = (map[key] ?? 0) + t.amount;
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // Group by month for monthly summary
  const byMonth = useMemo(() => {
    const map: Record<number, number> = {};
    for (const t of transactions) {
      const month = parseInt(t.date.split("-")[1]);
      map[month] = (map[month] ?? 0) + t.amount;
    }
    return map;
  }, [transactions]);

  const bestMonth = useMemo(() => {
    const entries = Object.entries(byMonth);
    if (!entries.length) return null;
    const [month, value] = entries.sort((a, b) => Number(b[1]) - Number(a[1]))[0];
    return { month: MONTHS[parseInt(month) - 1], value: Number(value) };
  }, [byMonth]);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Investimentos</h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe seus aportes em {selectedYear}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={String(selectedYear)}
            onValueChange={(v) => setSelectedYear(Number(v))}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setOpenForm(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Novo aporte
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Live market prices */}
          <MarketTicker />

          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Investido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(totalInvested)}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {transactions.length} aporte(s) em {selectedYear}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Média Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(totalInvested / 12)}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Média por mês no ano
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Maior Aporte Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {bestMonth ? formatCurrency(bestMonth.value) : "—"}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {bestMonth ? bestMonth.month : "Nenhum aporte registrado"}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Pie chart by subcategory */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Por tipo de investimento</CardTitle>
              </CardHeader>
              <CardContent>
                {bySubcategory.length === 0 ? (
                  <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                    Nenhum aporte registrado
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={bySubcategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {bySubcategory.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={SUBCATEGORY_COLORS[entry.name] ?? "#6B7280"}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                      <Legend
                        formatter={(value) => (
                          <span className="text-xs text-muted-foreground">{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Breakdown list */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Detalhamento por tipo</CardTitle>
              </CardHeader>
              <CardContent>
                {bySubcategory.length === 0 ? (
                  <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                    Nenhum aporte registrado
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bySubcategory.map((item) => {
                      const pct = totalInvested > 0 ? (item.value / totalInvested) * 100 : 0;
                      const color = SUBCATEGORY_COLORS[item.name] ?? "#6B7280";
                      return (
                        <div key={item.name}>
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-block h-2.5 w-2.5 rounded-full"
                                style={{ background: color }}
                              />
                              <span className="font-medium text-foreground">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <span>{pct.toFixed(1)}%</span>
                              <span className="font-semibold text-foreground">
                                {formatCurrency(item.value)}
                              </span>
                            </div>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, background: color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Monthly breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aportes por mês — {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12">
                {MONTHS.map((month, i) => {
                  const monthNum = i + 1;
                  const value = byMonth[monthNum] ?? 0;
                  const maxVal = Math.max(...Object.values(byMonth), 1);
                  const heightPct = value > 0 ? Math.max((value / maxVal) * 100, 15) : 0;
                  return (
                    <div key={month} className="flex flex-col items-center gap-1">
                      <div className="flex h-16 w-full items-end rounded">
                        <div
                          className="w-full rounded-sm bg-indigo-500 dark:bg-indigo-400 transition-all"
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {month.slice(0, 3)}
                      </span>
                      {value > 0 && (
                        <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                          {formatCurrency(value).replace("R$ ", "")}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Transactions list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico de aportes</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {transactions.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                  Nenhum aporte registrado em {selectedYear}
                </div>
              ) : (
                <div className="divide-y">
                  {transactions.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between px-6 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                          <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {t.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t.subcategory ?? "Investimentos"} · {formatDate(t.date)}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(t.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <InvestmentForm
        open={openForm}
        onOpenChange={setOpenForm}
        onSuccess={() => {
          setOpenForm(false);
          fetchTransactions();
        }}
      />
    </>
  );
}
