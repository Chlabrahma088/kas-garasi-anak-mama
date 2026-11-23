import { CarUnit, UnitCalculations } from '@/types';

/**
 * Format angka ke format Rupiah standar Indonesia (misal: Rp 150.000.000)
 */
export function formatRupiah(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Rp 0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format angka ke string ribuan murni (misal: 150.000.000) untuk input masking
 */
export function formatNumberMask(value: number | string): string {
  if (!value && value !== 0) return '';
  const numStr = value.toString().replace(/\D/g, '');
  if (!numStr) return '';
  return new Intl.NumberFormat('id-ID').format(parseInt(numStr, 10));
}

/**
 * Parse string Rupiah/ribuan bertitik kembali ke integer number
 */
export function parseNumberMask(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/\D/g, '');
  return cleaned ? parseInt(cleaned, 10) : 0;
}

/**
 * Format tanggal YYYY-MM-DD ke format Indonesia (misal: 15 Okt 2024)
 */
export function formatDateIndo(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Hitung selisih hari antara dua tanggal (Holding period)
 */
export function calculateDaysBetween(startDate: string, endDate?: string): number {
  try {
    if (!endDate) return 0;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const diffTime = Math.max(0, end - start);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

/**
 * Kalkulasi Unit-Level Accounting (Total Rekondisi, Total HPP, Net Profit, Margin %, Lama Hari)
 */
export function calculateUnitFinancials(unit: CarUnit): UnitCalculations {
  const totalRecondition = (unit.reconditionExpenses || []).reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );
  
  const totalHpp = (Number(unit.purchasePrice) || 0) + totalRecondition;
  
  let netProfit = 0;
  let marginPct = 0;
  
  if (unit.status === 'sold' && unit.finalSellingPrice) {
    const sellingExpenses = Number(unit.sellingExpenses) || 0;
    netProfit = Number(unit.finalSellingPrice) - totalHpp - sellingExpenses;
    marginPct = unit.finalSellingPrice > 0 ? (netProfit / unit.finalSellingPrice) * 100 : 0;
  }
  
  const holdingDays = calculateDaysBetween(unit.purchaseDate, unit.soldDate);

  return {
    totalRecondition,
    totalHpp,
    netProfit,
    marginPct: parseFloat(marginPct.toFixed(2)),
    holdingDays,
  };
}
