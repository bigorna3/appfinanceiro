-- ============================================================
-- MIGRAÇÃO: Remove CHECK constraint da coluna category
-- Execute este script no SQL Editor do Supabase caso a tabela
-- já exista com a constraint antiga.
-- ============================================================

-- Remove a constraint antiga que limitava as categorias
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_category_check;

-- A coluna category agora aceita qualquer texto (o app controla os valores)
-- Confirmação:
SELECT 'Migração aplicada com sucesso!' AS status;
