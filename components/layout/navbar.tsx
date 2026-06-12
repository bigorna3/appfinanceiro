"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { TrendingUp, LayoutDashboard, ArrowLeftRight, LogOut, Menu, Repeat2, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", mobileLabel: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transações", mobileLabel: "Transações", icon: ArrowLeftRight },
  { href: "/recurring", label: "Despesas Recorrentes", mobileLabel: "Recorrentes", icon: Repeat2 },
  { href: "/investments", label: "Investimentos", mobileLabel: "Investimentos", icon: LineChart },
];

interface NavbarProps {
  userEmail?: string;
}

export function Navbar({ userEmail }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-card">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Mobile brand */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
            <TrendingUp className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-foreground">
            Finanças<span className="text-blue-500">Pessoais</span>
          </span>
        </div>

        {/* Page title (desktop) */}
        <div className="hidden lg:block">
          <h1 className="text-lg font-semibold text-foreground">
            {NAV_ITEMS.find((i) => i.href === pathname)?.label ?? ""}
          </h1>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          {/* Theme toggle (desktop) */}
          <div className="hidden lg:block">
            <ThemeToggle />
          </div>

          {/* Desktop user menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hidden gap-2 lg:flex">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
                  {userEmail?.charAt(0).toUpperCase() ?? "U"}
                </div>
                <span className="max-w-[160px] truncate text-sm text-muted-foreground">
                  {userEmail}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                {userEmail}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600 focus:text-red-600"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {NAV_ITEMS.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex cursor-pointer items-center gap-2",
                      pathname === item.href && "font-medium text-blue-600"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-sm">Tema</span>
                  <ThemeToggle />
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600 focus:text-red-600"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="flex border-t lg:hidden">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors",
                active ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5",
                  active ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"
                )}
              />
              <span className="truncate max-w-full">{item.mobileLabel}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
