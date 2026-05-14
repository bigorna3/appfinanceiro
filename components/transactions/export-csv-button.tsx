"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

interface ExportCsvButtonProps {
  transactions: Transaction[];
  disabled?: boolean;
}

export function ExportCsvButton({ transactions, disabled }: ExportCsvButtonProps) {
  function handleExport() {
    const today = new Date().toISOString().split("T")[0];
    exportToCSV(transactions, `transacoes_${today}.csv`);
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={disabled || transactions.length === 0}
      className="gap-1.5"
    >
      <Download className="h-4 w-4" />
      Exportar CSV
    </Button>
  );
}
