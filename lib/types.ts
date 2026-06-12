export type TransactionType = "income" | "expense";

export type Category =
  | "Alimentação"
  | "Transporte"
  | "Moradia"
  | "Lazer"
  | "Saúde"
  | "Educação"
  | "Salário"
  | "Freelance"
  | "Mesada"
  | "Compras Online"
  | "Investimentos"
  | "Outros";

export const INVESTMENT_SUBCATEGORIES = [
  "Renda Fixa",
  "Renda Variável",
  "Ações",
  "ETFs",
  "FIIs",
  "Criptomoedas",
  "Tesouro Direto",
  "Previdência Privada",
  "Outros",
] as const;

export type RecurringType = "loan" | "streaming" | "subscription" | "credit_card";

export const RECURRING_TYPE_LABELS: Record<RecurringType, string> = {
  loan: "Empréstimo",
  streaming: "Streaming",
  subscription: "Assinatura",
  credit_card: "Parcelas de Cartão",
};

export const STREAMING_SERVICES = [
  "Netflix",
  "Spotify",
  "Disney+",
  "Amazon Prime",
  "HBO Max",
  "Globoplay",
  "YouTube Premium",
  "Apple TV+",
  "Crunchyroll",
  "Outro",
];

export interface RecurringExpense {
  id: string;
  user_id: string;
  description: string;
  type: RecurringType;
  subcategory?: string;
  amount_per_installment: number;
  total_installments?: number;
  paid_installments: number;
  start_date: string;
  initial_value?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: Category;
  subcategory?: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export const ALL_CATEGORIES: Category[] = [
  "Alimentação",
  "Transporte",
  "Moradia",
  "Lazer",
  "Saúde",
  "Educação",
  "Salário",
  "Freelance",
  "Mesada",
  "Compras Online",
  "Investimentos",
  "Outros",
];

export const INCOME_CATEGORIES: Category[] = ["Salário", "Freelance", "Mesada", "Outros"];

export const EXPENSE_CATEGORIES: Category[] = [
  "Alimentação",
  "Transporte",
  "Moradia",
  "Lazer",
  "Saúde",
  "Educação",
  "Compras Online",
  "Investimentos",
  "Outros",
];

export const CATEGORY_COLORS: Record<Category, string> = {
  Alimentação: "#F97316",
  Transporte: "#3B82F6",
  Moradia: "#8B5CF6",
  Lazer: "#EC4899",
  Saúde: "#10B981",
  Educação: "#F59E0B",
  Salário: "#059669",
  Freelance: "#0EA5E9",
  Mesada: "#A855F7",
  "Compras Online": "#F43F5E",
  Investimentos: "#6366F1",
  Outros: "#6B7280",
};

export const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
