"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { INVESTMENT_SUBCATEGORIES, type Transaction } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const schema = z.object({
  description: z.string().min(1, "Descrição obrigatória").max(100),
  subcategory: z.string().min(1, "Tipo de investimento obrigatório"),
  amount: z
    .string()
    .min(1, "Valor obrigatório")
    .refine(
      (v) =>
        !isNaN(parseFloat(v.replace(",", "."))) &&
        parseFloat(v.replace(",", ".")) > 0,
      "Valor deve ser maior que zero"
    ),
  date: z.string().min(1, "Data obrigatória"),
});

type FormData = z.infer<typeof schema>;

interface InvestmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  transaction?: Transaction;
}

export function InvestmentForm({
  open,
  onOpenChange,
  onSuccess,
  transaction,
}: InvestmentFormProps) {
  const supabase = createClient();
  const { toast } = useToast();
  const isEditing = !!transaction;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
    },
  });

  const selectedSubcategory = watch("subcategory");

  useEffect(() => {
    if (open) {
      if (transaction) {
        reset({
          description: transaction.description,
          subcategory: transaction.subcategory ?? "",
          amount: String(transaction.amount),
          date: transaction.date,
        });
      } else {
        reset({
          description: "",
          subcategory: "",
          amount: "",
          date: new Date().toISOString().split("T")[0],
        });
      }
    }
  }, [open, transaction, reset]);

  async function onSubmit(data: FormData) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      description: data.description,
      amount: parseFloat(data.amount.replace(",", ".")),
      type: "expense" as const,
      category: "Investimentos" as const,
      subcategory: data.subcategory,
      date: data.date,
    };

    let error;
    if (isEditing) {
      ({ error } = await supabase
        .from("transactions")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", transaction.id));
    } else {
      ({ error } = await supabase.from("transactions").insert(payload));
    }

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o aporte.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: isEditing ? "Aporte atualizado" : "Aporte registrado",
      description: isEditing
        ? "As alterações foram salvas."
        : "Investimento registrado com sucesso.",
    });
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
              <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <DialogTitle>
                {isEditing ? "Editar aporte" : "Novo aporte"}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Atualize os dados do investimento."
                  : "Registre um novo aporte ou investimento."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          {/* Investment type / subcategory */}
          <div className="space-y-2">
            <Label>Tipo de investimento</Label>
            <div className="grid grid-cols-3 gap-2">
              {INVESTMENT_SUBCATEGORIES.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setValue("subcategory", sub, { shouldValidate: true })}
                  className={`rounded-lg border-2 px-2 py-2 text-xs font-medium transition-colors ${
                    selectedSubcategory === sub
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
                      : "border-border text-muted-foreground hover:border-muted-foreground"
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
            {errors.subcategory && (
              <p className="text-xs text-red-600">{errors.subcategory.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Ex: CDB Itaú, PETR4, Bitcoin, Tesouro IPCA..."
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor aportado (R$)</Label>
              <Input
                id="amount"
                placeholder="0,00"
                inputMode="decimal"
                {...register("amount")}
              />
              {errors.amount && (
                <p className="text-xs text-red-600">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input id="date" type="date" {...register("date")} />
              {errors.date && (
                <p className="text-xs text-red-600">{errors.date.message}</p>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : isEditing ? (
                "Salvar alterações"
              ) : (
                "Registrar aporte"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
