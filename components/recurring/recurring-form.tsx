"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  RECURRING_TYPE_LABELS,
  STREAMING_SERVICES,
  type RecurringExpense,
  type RecurringType,
} from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";

// Calculates monthly interest rate using bisection method
// Solves: PMT = P * r * (1+r)^n / ((1+r)^n - 1)
export function calculateMonthlyRate(
  principal: number,
  payment: number,
  n: number
): number {
  if (principal <= 0 || payment <= 0 || n <= 0) return 0;
  if (payment * n <= principal) return 0; // no interest

  let lo = 0.000001;
  let hi = 1;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    const pow = Math.pow(1 + mid, n);
    const pmt = (principal * mid * pow) / (pow - 1);
    if (pmt < payment) lo = mid;
    else hi = mid;
  }
  return ((lo + hi) / 2) * 100;
}

const schema = z.object({
  description: z.string().min(1, "Descrição obrigatória").max(100),
  type: z.enum(["loan", "streaming", "subscription", "credit_card"]),
  subcategory: z.string().optional(),
  amount_per_installment: z
    .string()
    .min(1, "Valor obrigatório")
    .refine(
      (v) => !isNaN(parseFloat(v.replace(",", "."))) && parseFloat(v.replace(",", ".")) > 0,
      "Valor deve ser maior que zero"
    ),
  total_installments: z.string().optional(),
  start_date: z.string().min(1, "Data obrigatória"),
  initial_value: z.string().optional(),
  paid_installments: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface RecurringFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  expense?: RecurringExpense;
}

const RECURRING_TYPES: RecurringType[] = ["loan", "credit_card", "streaming", "subscription"];

export function RecurringForm({
  open,
  onOpenChange,
  onSuccess,
  expense,
}: RecurringFormProps) {
  const supabase = createClient();
  const { toast } = useToast();
  const isEditing = !!expense;

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
      type: "loan",
      start_date: new Date().toISOString().split("T")[0],
    },
  });

  const selectedType = watch("type") as RecurringType;
  const selectedSubcategory = watch("subcategory");
  const watchAmount = watch("amount_per_installment");
  const watchInstallments = watch("total_installments");
  const watchInitial = watch("initial_value");

  const needsInstallments = selectedType === "loan" || selectedType === "credit_card";
  const isStreaming = selectedType === "streaming";
  const isSubscription = selectedType === "subscription";

  // Interest calculation
  const interestInfo = useMemo(() => {
    if (!needsInstallments) return null;
    const P = parseFloat((watchInitial ?? "").replace(",", "."));
    const PMT = parseFloat((watchAmount ?? "").replace(",", "."));
    const n = parseInt(watchInstallments ?? "");
    if (!P || !PMT || !n || P <= 0 || PMT <= 0 || n <= 0) return null;

    const monthlyRate = calculateMonthlyRate(P, PMT, n);
    const annualRate = (Math.pow(1 + monthlyRate / 100, 12) - 1) * 100;
    const totalPaid = PMT * n;
    const totalInterest = totalPaid - P;

    return { monthlyRate, annualRate, totalPaid, totalInterest };
  }, [needsInstallments, watchInitial, watchAmount, watchInstallments]);

  // Clear subcategory when type changes
  useEffect(() => {
    setValue("subcategory", undefined);
  }, [selectedType, setValue]);

  useEffect(() => {
    if (open) {
      if (expense) {
        reset({
          description: expense.description,
          type: expense.type,
          subcategory: expense.subcategory ?? undefined,
          amount_per_installment: String(expense.amount_per_installment),
          total_installments: expense.total_installments
            ? String(expense.total_installments)
            : "",
          start_date: expense.start_date,
          initial_value: expense.initial_value ? String(expense.initial_value) : "",
          paid_installments: String(expense.paid_installments),
        });
      } else {
        reset({
          description: "",
          type: "loan",
          subcategory: undefined,
          amount_per_installment: "",
          total_installments: "",
          start_date: new Date().toISOString().split("T")[0],
          initial_value: "",
          paid_installments: "0",
        });
      }
    }
  }, [open, expense, reset]);

  async function onSubmit(data: FormData) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      description: data.description,
      type: data.type,
      subcategory: data.subcategory || null,
      amount_per_installment: parseFloat(data.amount_per_installment.replace(",", ".")),
      total_installments: data.total_installments
        ? parseInt(data.total_installments)
        : null,
      start_date: data.start_date,
      initial_value: data.initial_value
        ? parseFloat(data.initial_value.replace(",", "."))
        : null,
      paid_installments: data.paid_installments ? parseInt(data.paid_installments) : 0,
      is_active: true,
    };

    let error;
    if (isEditing) {
      ({ error } = await supabase
        .from("recurring_expenses")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", expense.id));
    } else {
      ({ error } = await supabase.from("recurring_expenses").insert(payload));
    }

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: isEditing ? "Recorrência atualizada" : "Recorrência criada",
    });
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar recorrência" : "Nova despesa recorrente"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize os dados da despesa recorrente."
              : "Cadastre empréstimos, assinaturas, parcelas e mais."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Type selector */}
          <div>
            <Label className="mb-2 block">Tipo</Label>
            <div className="grid grid-cols-2 gap-2">
              {RECURRING_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setValue("type", t)}
                  className={`rounded-lg border-2 py-2 text-sm font-medium transition-colors ${
                    selectedType === t
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                      : "border-border text-muted-foreground hover:border-muted-foreground"
                  }`}
                >
                  {RECURRING_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              {selectedType === "credit_card" ? "Produto / Compra" : "Descrição"}
            </Label>
            <Input
              id="description"
              placeholder={
                selectedType === "loan"
                  ? "Ex: Empréstimo Caixa, Financiamento..."
                  : selectedType === "credit_card"
                  ? "Ex: iPhone 15, Notebook Dell..."
                  : selectedType === "streaming"
                  ? "Ex: Plano Família, Plano Individual..."
                  : "Ex: Academia Smart Fit, iCloud..."
              }
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Streaming service selector */}
          {isStreaming && (
            <div className="space-y-2">
              <Label>Serviço de streaming</Label>
              <Select
                value={selectedSubcategory ?? ""}
                onValueChange={(v) => setValue("subcategory", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o serviço" />
                </SelectTrigger>
                <SelectContent>
                  {STREAMING_SERVICES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Subscription free text */}
          {isSubscription && (
            <div className="space-y-2">
              <Label htmlFor="subcategory">Tipo de assinatura</Label>
              <Input
                id="subcategory"
                placeholder="Ex: Academia, iCloud, Antivírus..."
                value={selectedSubcategory ?? ""}
                onChange={(e) => setValue("subcategory", e.target.value)}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount_per_installment">
                {needsInstallments ? "Valor da parcela (R$)" : "Valor mensal (R$)"}
              </Label>
              <Input
                id="amount_per_installment"
                placeholder="0,00"
                inputMode="decimal"
                {...register("amount_per_installment")}
              />
              {errors.amount_per_installment && (
                <p className="text-xs text-red-600">
                  {errors.amount_per_installment.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Data de início</Label>
              <Input id="start_date" type="date" {...register("start_date")} />
              {errors.start_date && (
                <p className="text-xs text-red-600">{errors.start_date.message}</p>
              )}
            </div>
          </div>

          {/* Installment fields for loan and credit_card */}
          {needsInstallments && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="total_installments">Número de parcelas</Label>
                <Input
                  id="total_installments"
                  type="number"
                  min={1}
                  placeholder="Ex: 36"
                  {...register("total_installments")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="initial_value">
                  {selectedType === "loan" ? "Valor contratado (R$)" : "Valor do produto (R$)"}
                </Label>
                <Input
                  id="initial_value"
                  placeholder="0,00"
                  inputMode="decimal"
                  {...register("initial_value")}
                />
              </div>
            </div>
          )}

          {/* Optional total_installments for streaming/subscription */}
          {(isStreaming || isSubscription) && (
            <div className="space-y-2">
              <Label htmlFor="total_installments">
                Duração (meses) — deixe em branco para ilimitado
              </Label>
              <Input
                id="total_installments"
                type="number"
                min={1}
                placeholder="Ex: 12 (ou deixe em branco)"
                {...register("total_installments")}
              />
            </div>
          )}

          {/* Edit only: paid_installments */}
          {isEditing && needsInstallments && (
            <div className="space-y-2">
              <Label htmlFor="paid_installments">Parcelas pagas</Label>
              <Input
                id="paid_installments"
                type="number"
                min={0}
                {...register("paid_installments")}
              />
            </div>
          )}

          {/* Interest calculation display */}
          {interestInfo && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-400">
                <Info className="h-4 w-4" />
                Análise de juros
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <div className="text-muted-foreground">Taxa mensal:</div>
                <div className="font-semibold text-foreground">
                  {interestInfo.monthlyRate.toFixed(2)}% a.m.
                </div>
                <div className="text-muted-foreground">Taxa anual:</div>
                <div className="font-semibold text-foreground">
                  {interestInfo.annualRate.toFixed(2)}% a.a.
                </div>
                <div className="text-muted-foreground">Total pago:</div>
                <div className="font-semibold text-foreground">
                  {formatCurrency(interestInfo.totalPaid)}
                </div>
                <div className="text-muted-foreground">Juros totais:</div>
                <div className="font-semibold text-red-600 dark:text-red-400">
                  {formatCurrency(interestInfo.totalInterest)}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : isEditing ? (
                "Salvar alterações"
              ) : (
                "Adicionar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
