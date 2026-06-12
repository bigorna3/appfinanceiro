"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  TrendingDown,
  CreditCard,
  Tv,
  FileText,
  Infinity,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  RECURRING_TYPE_LABELS,
  type RecurringExpense,
  type RecurringType,
} from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { calculateMonthlyRate, RecurringForm } from "@/components/recurring/recurring-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

const TYPE_ICONS: Record<RecurringType, React.ElementType> = {
  loan: TrendingDown,
  credit_card: CreditCard,
  streaming: Tv,
  subscription: FileText,
};

const TYPE_COLORS: Record<RecurringType, string> = {
  loan: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  credit_card: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  streaming: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  subscription: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

function ProgressBar({ paid, total }: { paid: number; total?: number }) {
  if (!total) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Infinity className="h-3.5 w-3.5" />
        <span>{paid} pago(s)</span>
      </div>
    );
  }
  const pct = Math.min((paid / total) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{paid}/{total} parcelas</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function RecurringPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | undefined>();
  const [deletingExpense, setDeletingExpense] = useState<RecurringExpense | undefined>();
  const [deleting, setDeleting] = useState(false);
  const [paying, setPaying] = useState<string | null>(null);
  const [completedExpense, setCompletedExpense] = useState<RecurringExpense | undefined>();

  async function fetchExpenses() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data } = await supabase
      .from("recurring_expenses")
      .select("*")
      .order("is_active", { ascending: false })
      .order("created_at", { ascending: false });

    setExpenses(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete() {
    if (!deletingExpense) return;
    setDeleting(true);
    const { error } = await supabase
      .from("recurring_expenses")
      .delete()
      .eq("id", deletingExpense.id);
    setDeleting(false);
    setDeletingExpense(undefined);
    if (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
      return;
    }
    toast({ title: "Recorrência excluída" });
    fetchExpenses();
  }

  async function handleToggleActive(expense: RecurringExpense) {
    const { error } = await supabase
      .from("recurring_expenses")
      .update({ is_active: !expense.is_active, updated_at: new Date().toISOString() })
      .eq("id", expense.id);
    if (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
      return;
    }
    fetchExpenses();
  }

  async function handleMarkPaid(expense: RecurringExpense) {
    setPaying(expense.id);
    const newPaid = expense.paid_installments + 1;
    const isComplete =
      expense.total_installments !== null &&
      expense.total_installments !== undefined &&
      newPaid >= expense.total_installments;

    const updates: Partial<RecurringExpense> & { updated_at: string } = {
      paid_installments: newPaid,
      updated_at: new Date().toISOString(),
    };
    if (isComplete) updates.is_active = false;

    const { error } = await supabase
      .from("recurring_expenses")
      .update(updates)
      .eq("id", expense.id);

    setPaying(null);
    if (error) {
      toast({ title: "Erro ao registrar pagamento", variant: "destructive" });
      return;
    }
    toast({ title: "Pagamento registrado!" });
    if (isComplete) setCompletedExpense(expense);
    fetchExpenses();
  }

  function handleEdit(expense: RecurringExpense) {
    setEditingExpense(expense);
    setOpenForm(true);
  }

  const activeExpenses = expenses.filter((e) => e.is_active);
  const monthlyCommitment = activeExpenses.reduce(
    (sum, e) => sum + e.amount_per_installment,
    0
  );

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Despesas Recorrentes</h2>
          <p className="text-sm text-muted-foreground">
            Empréstimos, assinaturas, streamings e parcelas fixas
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingExpense(undefined);
            setOpenForm(true);
          }}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Nova recorrência
        </Button>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Compromisso Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(monthlyCommitment)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Total de despesas ativas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recorrências Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeExpenses.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {expenses.length - activeExpenses.length} concluídas / inativas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Cadastros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{expenses.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">Todos os compromissos</p>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <div className="rounded-lg border bg-card">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
            <p className="text-sm">Nenhuma despesa recorrente cadastrada</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingExpense(undefined);
                setOpenForm(true);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Adicionar recorrência
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {expenses.map((expense) => {
              const Icon = TYPE_ICONS[expense.type];
              const typeColor = TYPE_COLORS[expense.type];
              const isLoanOrCard =
                expense.type === "loan" || expense.type === "credit_card";

              let interestRate: number | null = null;
              if (
                isLoanOrCard &&
                expense.initial_value &&
                expense.total_installments
              ) {
                interestRate = calculateMonthlyRate(
                  expense.initial_value,
                  expense.amount_per_installment,
                  expense.total_installments
                );
              }

              const canPay =
                expense.is_active &&
                (expense.total_installments === null ||
                  expense.total_installments === undefined ||
                  expense.paid_installments < expense.total_installments);

              return (
                <div key={expense.id} className="p-4">
                  {/* Mobile + Desktop layout */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    {/* Left: icon + info */}
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${typeColor}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-foreground">
                            {expense.description}
                          </span>
                          {expense.subcategory && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              {expense.subcategory}
                            </span>
                          )}
                          {!expense.is_active && (
                            <Badge variant="secondary" className="text-xs">
                              Inativo
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span>{RECURRING_TYPE_LABELS[expense.type]}</span>
                          <span>·</span>
                          <span>Início: {formatDate(expense.start_date)}</span>
                          {interestRate !== null && interestRate > 0 && (
                            <>
                              <span>·</span>
                              <span className="text-orange-600 dark:text-orange-400">
                                {interestRate.toFixed(2)}% a.m.
                              </span>
                            </>
                          )}
                        </div>
                        <div className="mt-2 max-w-48">
                          <ProgressBar
                            paid={expense.paid_installments}
                            total={expense.total_installments ?? undefined}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right: amount + actions */}
                    <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                      <div className="text-right">
                        <div className="font-semibold text-foreground">
                          {formatCurrency(expense.amount_per_installment)}
                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                            /mês
                          </span>
                        </div>
                        {expense.initial_value && (
                          <div className="text-xs text-muted-foreground">
                            Total: {formatCurrency(expense.initial_value)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {canPay && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-green-600"
                            onClick={() => handleMarkPaid(expense)}
                            disabled={paying === expense.id}
                            title="Registrar pagamento"
                          >
                            {paying === expense.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-yellow-600"
                          onClick={() => handleToggleActive(expense)}
                          title={expense.is_active ? "Desativar" : "Ativar"}
                        >
                          {expense.is_active ? (
                            <XCircle className="h-3.5 w-3.5" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                          onClick={() => handleEdit(expense)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-600"
                          onClick={() => setDeletingExpense(expense)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit form */}
      <RecurringForm
        open={openForm}
        onOpenChange={(o) => {
          setOpenForm(o);
          if (!o) setEditingExpense(undefined);
        }}
        onSuccess={() => {
          setOpenForm(false);
          setEditingExpense(undefined);
          fetchExpenses();
        }}
        expense={editingExpense}
      />

      {/* Delete confirmation */}
      <Dialog
        open={!!deletingExpense}
        onOpenChange={(o) => !o && setDeletingExpense(undefined)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir recorrência</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir{" "}
              <strong>&ldquo;{deletingExpense?.description}&rdquo;</strong>?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingExpense(undefined)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Completed installments dialog */}
      <Dialog
        open={!!completedExpense}
        onOpenChange={(o) => !o && setCompletedExpense(undefined)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>🎉 Todas as parcelas pagas!</DialogTitle>
            <DialogDescription>
              <strong>&ldquo;{completedExpense?.description}&rdquo;</strong> foi quitado
              e marcado como inativo automaticamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setCompletedExpense(undefined)}>Entendido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
