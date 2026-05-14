import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Transações Recentes</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/transactions" className="flex items-center gap-1 text-xs text-blue-600">
            Ver todas <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">
            Nenhuma transação registrada neste mês
          </p>
        ) : (
          <div className="space-y-3">
            {transactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <Badge
                    variant={t.type === "income" ? "income" : "expense"}
                    className="shrink-0"
                  >
                    {t.type === "income" ? "Receita" : "Despesa"}
                  </Badge>
                  <div className="overflow-hidden">
                    <p className="truncate text-sm font-medium text-slate-700">
                      {t.description}
                    </p>
                    <p className="text-xs text-slate-400">
                      {t.category} · {formatDate(t.date)}
                    </p>
                  </div>
                </div>
                <span
                  className={`ml-3 shrink-0 text-sm font-semibold ${
                    t.type === "income" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {t.type === "income" ? "+" : "-"}
                  {formatCurrency(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
