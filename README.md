# FinançasPessoais

Aplicativo de finanças pessoais construído com Next.js 14, Supabase e Tailwind CSS.

## Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, shadcn/ui
- **Backend/Auth**: Supabase (PostgreSQL + Auth)
- **Cotações**: BRAPI (ações e FIIs), CoinGecko (criptomoedas)

## Deploy na Vercel

### 1. Pré-requisitos

- Conta no [Supabase](https://app.supabase.com) com projeto criado
- Conta no [BRAPI](https://brapi.dev) para token de cotações (gratuito)
- Conta na [Vercel](https://vercel.com)

### 2. Banco de dados (Supabase)

Execute as migrations na ordem no SQL Editor do Supabase:

1. `supabase/migration_add_features.sql`
2. `supabase/migration_fix_category.sql`

### 3. Deploy

1. Acesse [vercel.com/new](https://vercel.com/new) e importe o repositório `bigorna3/appfinanceiro`
2. Na etapa **Environment Variables**, adicione:

| Variável | Onde obter |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public |
| `BRAPI_TOKEN` | [brapi.dev](https://brapi.dev) → Dashboard → Token |

3. Clique em **Deploy**

### 4. Configurar URL de redirecionamento no Supabase

Após o deploy, copie a URL da Vercel (ex: `https://appfinanceiro.vercel.app`) e adicione em:

**Supabase → Authentication → URL Configuration → Redirect URLs:**
```
https://appfinanceiro.vercel.app/auth/callback
```

## Desenvolvimento local

```bash
# Instalar dependências
npm install

# Copiar e preencher variáveis de ambiente
cp .env.local.example .env.local

# Iniciar servidor de desenvolvimento
npm run dev
```

## Segurança

- `.env.local` está no `.gitignore` — nunca é enviado ao repositório
- `BRAPI_TOKEN` é usado **exclusivamente** no servidor via `/api/stocks` (sem prefixo `NEXT_PUBLIC_`)
- As chaves Supabase com prefixo `NEXT_PUBLIC_` são seguras para exposição ao cliente (proteção via Row Level Security no Supabase)
