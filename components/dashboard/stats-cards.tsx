import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export function StatsCards({ totalIncome, totalExpense, balance }: StatsCardsProps) {
  const cards = [
    {
      title: "Receitas",
      value: totalIncome,
      icon: TrendingUp,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      valueColor: "text-green-600",
      description: "Total do mês",
    },
    {
      title: "Despesas",
      value: totalExpense,
      icon: TrendingDown,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      valueColor: "text-red-600",
      description: "Total do mês",
    },
    {
      title: "Saldo",
      value: balance,
      icon: Wallet,
      iconBg: balance >= 0 ? "bg-blue-100" : "bg-orange-100",
      iconColor: balance >= 0 ? "text-blue-600" : "text-orange-600",
      valueColor: balance >= 0 ? "text-blue-600" : "text-red-600",
      description: "Receitas − Despesas",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title} className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
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
            <p className="mt-1 text-xs text-slate-500">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
