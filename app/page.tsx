import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  PieChart,
  Shield,
  Download,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">
              Finanças<span className="text-blue-600">Pessoais</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild>
              <Link href="/register">
                Começar grátis <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700 ring-1 ring-blue-100">
            <CheckCircle2 className="h-4 w-4" />
            Gratuito e sem cartão de crédito
          </div>
          <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight text-slate-900 md:text-6xl">
            Controle suas finanças{" "}
            <span className="text-blue-600">com clareza</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-xl text-slate-600">
            Registre receitas e despesas, categorize seus gastos e acompanhe seu
            saldo mensal com gráficos intuitivos.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link href="/register">
                Criar conta grátis <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
              <Link href="/login">Já tenho conta</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="container mx-auto px-4 pb-24">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                <feature.icon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mb-2 font-semibold text-slate-900">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-slate-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA bottom */}
      <section className="border-t bg-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-slate-900">
            Comece hoje, é gratuito
          </h2>
          <p className="mb-8 text-slate-600">
            Crie sua conta e tenha controle total das suas finanças em minutos.
          </p>
          <Button size="lg" asChild>
            <Link href="/register">
              Criar minha conta <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} FinançasPessoais. Feito com ❤️ para o seu
        bolso.
      </footer>
    </div>
  );
}

const FEATURES = [
  {
    title: "Dashboard Visual",
    description:
      "Cards de Receita, Despesa e Saldo do mês atual com atualização em tempo real.",
    icon: TrendingUp,
  },
  {
    title: "Gráfico por Categoria",
    description:
      "Visualize sua distribuição de gastos com um gráfico de pizza interativo.",
    icon: PieChart,
  },
  {
    title: "Dados Seguros",
    description:
      "Autenticação segura e Row Level Security: só você acessa seus dados.",
    icon: Shield,
  },
  {
    title: "Exportar CSV",
    description:
      "Exporte suas transações filtradas para analisar em qualquer planilha.",
    icon: Download,
  },
];
