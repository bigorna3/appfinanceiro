"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { Button } from "@/components/ui/button";
import { MONTHS, type Category, type Transaction } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [previousBalance, setPreviousBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  async function fetchTransactions() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
    const endDate = new Date(selectedYear, selectedMonth, 0)
      .toISOString()
      .split("T")[0];

    // Fetch current month transactions and previous balance in parallel
    const [currentRes, prevRes] = await Promise.all([
      supabase
        .from("transactions")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false }),
      supabase
        .from("transactions")
        .select("amount, type")
        .lt("date", startDate),
    ]);

    setTransactions(currentRes.data ?? []);

    const prevBal = (prevRes.data ?? []).reduce((sum, t) => {
      return sum + (t.type === "income" ? t.amount : -t.amount);
    }, 0);
    setPreviousBalance(prevBal);

    setLoading(false);
  }

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear]);

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  const expenseChartData = Object.entries(
    transactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] ?? 0) + t.amount;
        return acc;
      }, {} as Record<string, number>)
  )
    .map(([name, value]) => ({ name: name as Category, value }))
    .sort((a, b) => b.value - a.value);

  const incomeChartData = Object.entries(
    transactions
      .filter((t) => t.type === "income")
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] ?? 0) + t.amount;
        return acc;
      }, {} as Record<string, number>)
  )
    .map(([name, value]) => ({ name: name as Category, value }))
    .sort((a, b) => b.value - a.value);

  const recentTransactions = transactions.slice(0, 5);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Resumo financeiro de {MONTHS[selectedMonth - 1]} {selectedYear}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={String(selectedMonth)}
            onValueChange={(v) => setSelectedMonth(Number(v))}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
            <span className="hidden sm:inline">Nova transação</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          <StatsCards
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            balance={balance}
            previousBalance={previousBalance}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <CategoryChart
              title="Despesas por Categoria"
              data={expenseChartData}
              emptyMessage="Nenhuma despesa registrada neste mês"
            />
            <CategoryChart
              title="Receitas por Categoria"
              data={incomeChartData}
              emptyMessage="Nenhuma receita registrada neste mês"
            />
          </div>

          <RecentTransactions transactions={recentTransactions} />
        </div>
      )}

      <TransactionForm
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
