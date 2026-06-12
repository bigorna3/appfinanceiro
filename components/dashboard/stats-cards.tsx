import { TrendingUp, TrendingDown, Wallet, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  previousBalance?: number;
}

export function StatsCards({
  totalIncome,
  totalExpense,
  balance,
  previousBalance = 0,
}: StatsCardsProps) {
  const accumulated = previousBalance + balance;

  const cards = [
    {
      title: "Receitas",
      value: totalIncome,
      icon: TrendingUp,
      iconBg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
      valueColor: "text-green-600 dark:text-green-400",
      description: "Total do mês",
    },
    {
      title: "Despesas",
      value: totalExpense,
      icon: TrendingDown,
      iconBg: "bg-red-100 dark:bg-red-900/30",
      iconColor: "text-red-600 dark:text-red-400",
      valueColor: "text-red-600 dark:text-red-400",
      description: "Total do mês",
    },
    {
      title: "Saldo do Mês",
      value: balance,
      icon: Wallet,
      iconBg:
        balance >= 0
          ? "bg-blue-100 dark:bg-blue-900/30"
          : "bg-orange-100 dark:bg-orange-900/30",
      iconColor:
        balance >= 0
          ? "text-blue-600 dark:text-blue-400"
          : "text-orange-600 dark:text-orange-400",
      valueColor:
        balance >= 0
          ? "text-blue-600 dark:text-blue-400"
          : "text-red-600 dark:text-red-400",
      description: "Receitas − Despesas",
    },
    {
      title: "Saldo Acumulado",
      value: accumulated,
      icon: BarChart3,
      iconBg:
        accumulated >= 0
          ? "bg-indigo-100 dark:bg-indigo-900/30"
          : "bg-orange-100 dark:bg-orange-900/30",
      iconColor:
        accumulated >= 0
          ? "text-indigo-600 dark:text-indigo-400"
          : "text-orange-600 dark:text-orange-400",
      valueColor:
        accumulated >= 0
          ? "text-indigo-600 dark:text-indigo-400"
          : "text-red-600 dark:text-red-400",
      description: "Meses anteriores + mês atual",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={cn("rounded-lg p-2", card.iconBg)}>
              <card.icon className={cn("h-4 w-4", card.iconColor)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", card.valueColor)}>
              {formatCurrency(card.value)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
