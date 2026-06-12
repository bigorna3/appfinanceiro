"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Transaction } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { ExportCsvButton } from "@/components/transactions/export-csv-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

interface Filters {
  search: string;
  month: number | "all";
  year: number;
  type: "all" | "income" | "expense";
  category: string;
}

export default function TransactionsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const now = new Date();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<
    Transaction | undefined
  >();
  const [deletingTransaction, setDeletingTransaction] = useState<
    Transaction | undefined
  >();
  const [deleting, setDeleting] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    search: "",
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    type: "all",
    category: "all",
  });

  async function fetchTransactions() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    let query = supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (filters.month !== "all") {
      const start = `${filters.year}-${String(filters.month).padStart(2, "0")}-01`;
      const end = new Date(filters.year, filters.month, 0)
        .toISOString()
        .split("T")[0];
      query = query.gte("date", start).lte("date", end);
    } else {
      query = query
        .gte("date", `${filters.year}-01-01`)
        .lte("date", `${filters.year}-12-31`);
    }

    const { data } = await query;
    setTransactions(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.month, filters.year]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch = filters.search
        ? t.description.toLowerCase().includes(filters.search.toLowerCase())
        : true;
      const matchType =
        filters.type !== "all" ? t.type === filters.type : true;
      const matchCategory =
        filters.category !== "all" ? t.category === filters.category : true;
      return matchSearch && matchType && matchCategory;
    });
  }, [transactions, filters.search, filters.type, filters.category]);

  async function handleDelete() {
    if (!deletingTransaction) return;
    setDeleting(true);

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", deletingTransaction.id);

    setDeleting(false);
    setDeletingTransaction(undefined);

    if (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
      return;
    }

    toast({ title: "Transação excluída" });
    fetchTransactions();
  }

  function handleEdit(t: Transaction) {
    setEditingTransaction(t);
    setOpenForm(true);
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Transações</h2>
          <p className="text-sm text-muted-foreground">
            {filtered.length}{" "}
            {filtered.length === 1 ? "transação" : "transações"} encontradas
          </p>
        </div>
        <div className="flex gap-2">
          <ExportCsvButton transactions={filtered} />
          <Button
            onClick={() => {
              setEditingTransaction(undefined);
              setOpenForm(true);
            }}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Nova transação
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <TransactionFilters filters={filters} onChange={setFilters} />
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
            <p className="text-sm">Nenhuma transação encontrada</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingTransaction(undefined);
                setOpenForm(true);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Adicionar transação
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(t.date)}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate font-medium text-foreground">
                        {t.description}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {t.category}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={t.type === "income" ? "income" : "expense"}
                        >
                          {t.type === "income" ? "Receita" : "Despesa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        <span
                          className={
                            t.type === "income"
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }
                        >
                          {t.type === "income" ? "+" : "-"}
                          {formatCurrency(t.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                            onClick={() => handleEdit(t)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-600"
                            onClick={() => setDeletingTransaction(t)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y md:hidden">
              {filtered.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Badge
                      variant={t.type === "income" ? "income" : "expense"}
                      className="shrink-0"
                    >
                      {t.type === "income" ? "+" : "-"}
                    </Badge>
                    <div className="overflow-hidden">
                      <p className="truncate text-sm font-medium text-foreground">
                        {t.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t.category} · {formatDate(t.date)}
                      </p>
                    </div>
                  </div>
                  <div className="ml-3 flex shrink-0 items-center gap-2">
                    <span
                      className={`text-sm font-semibold ${
                        t.type === "income"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {formatCurrency(t.amount)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-blue-600"
                      onClick={() => handleEdit(t)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-red-600"
                      onClick={() => setDeletingTransaction(t)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Create / Edit form */}
      <TransactionForm
        open={openForm}
        onOpenChange={(o) => {
          setOpenForm(o);
          if (!o) setEditingTransaction(undefined);
        }}
        onSuccess={() => {
          setOpenForm(false);
          setEditingTransaction(undefined);
          fetchTransactions();
        }}
        transaction={editingTransaction}
      />

      {/* Delete confirmation */}
      <Dialog
        open={!!deletingTransaction}
        onOpenChange={(o) => !o && setDeletingTransaction(undefined)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir transação</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir{" "}
              <strong>
                &ldquo;{deletingTransaction?.description}&rdquo;
              </strong>
              ? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingTransaction(undefined)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
