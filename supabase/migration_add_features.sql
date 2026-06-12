-- ============================================================
-- MIGRAÇÃO: Adiciona subcategoria em transactions e tabela
-- de despesas recorrentes
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- 1. Adiciona coluna subcategory em transactions (para Investimentos)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- 2. Cria tabela de despesas recorrentes
CREATE TABLE IF NOT EXISTS recurring_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('loan', 'streaming', 'subscription', 'credit_card')),
  subcategory TEXT,
  amount_per_installment DECIMAL(10,2) NOT NULL CHECK (amount_per_installment > 0),
  total_installments INTEGER,
  paid_installments INTEGER NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  initial_value DECIMAL(10,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Habilita RLS
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;

-- 4. Política RLS: usuário só acessa seus próprios dados
DROP POLICY IF EXISTS "users can manage their own recurring expenses" ON recurring_expenses;
CREATE POLICY "users can manage their own recurring expenses"
  ON recurring_expenses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

SELECT 'Migração de features aplicada com sucesso!' AS status;
