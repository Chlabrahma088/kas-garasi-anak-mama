'use client';

import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { formatRupiah, calculateUnitFinancials, formatDateIndo } from '@/lib/utils';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Car,
  DollarSign,
  Wrench,
  PieChart,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { cars, wallets, transactions } = useApp();

  const soldCars = cars.filter((c) => c.status === 'sold');

  // Aggregations
  const totalOmzet = soldCars.reduce((sum, c) => sum + (c.finalSellingPrice || 0), 0);
  const totalNetProfit = soldCars.reduce((sum, c) => {
    const fin = calculateUnitFinancials(c);
    return sum + fin.netProfit;
  }, 0);

  const avgMargin =
    soldCars.length > 0
      ? soldCars.reduce((sum, c) => sum + calculateUnitFinancials(c).marginPct, 0) /
        soldCars.length
      : 0;

  const avgHoldingDays =
    soldCars.length > 0
      ? Math.round(
          soldCars.reduce((sum, c) => sum + calculateUnitFinancials(c).holdingDays, 0) /
            soldCars.length
        )
      : 0;

  // Breakdown Biaya Rekon per Kategori Bengkel
  const allExpenses = useMemo(() => cars.flatMap((c) => c.reconditionExpenses), [cars]);
  const totalAllReconditions = useMemo(
    () => allExpenses.reduce((sum, e) => sum + e.amount, 0),
    [allExpenses]
  );

  const categoryTotals = useMemo(() => {
    const map: Record<string, { label: string; amount: number; count: number; barColor: string }> = {
      body_cat: { label: 'Body & Cat / Sisip', amount: 0, count: 0, barColor: 'bg-rose-500' },
      mesin: { label: 'Mesin & Aki', amount: 0, count: 0, barColor: 'bg-amber-500' },
      kaki_kaki: { label: 'Kaki-kaki, Velg & Ban', amount: 0, count: 0, barColor: 'bg-blue-500' },
      salon_detailing: { label: 'Salon & Detailing', amount: 0, count: 0, barColor: 'bg-emerald-500' },
      pajak_surat: { label: 'Pajak & Plat Nomor', amount: 0, count: 0, barColor: 'bg-purple-500' },
      mediator: { label: 'Pakang & Mediator', amount: 0, count: 0, barColor: 'bg-indigo-500' },
      lainnya: { label: 'Aksesoris, Wiper & Lampu', amount: 0, count: 0, barColor: 'bg-slate-500' },
    };

    allExpenses.forEach((e) => {
      const cat = map[e.category] ? e.category : 'lainnya';
      map[cat].amount += e.amount;
      map[cat].count += 1;
    });

    return Object.entries(map)
      .map(([key, val]) => ({
        key,
        ...val,
        pct: totalAllReconditions > 0 ? (val.amount / totalAllReconditions) * 100 : 0,
      }))
      .filter((c) => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [allExpenses, totalAllReconditions]);

  // CSV Exporters
  const downloadCSV = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportCarsToCSV = () => {
    const headers = [
      'Nopol',
      'Merk',
      'Model',
      'Tahun',
      'Warna',
      'Transmisi',
      'KM',
      'Status',
      'Tgl Beli',
      'Harga Beli',
      'Total Rekondisi',
      'Total HPP',
      'Target Jual',
      'Harga Jual Final',
      'Tgl Terjual',
      'Biaya Jual',
      'Net Profit',
      'Margin (%)',
      'Lama Terjual (Hari)',
      'Partner Modal',
    ];

    const rows = cars.map((c) => {
      const fin = calculateUnitFinancials(c);
      const partnerStr = c.partners.map((p) => `${p.partnerName} (${p.capitalPercentage}%)`).join('; ');
      return [
        `"${c.licensePlate}"`,
        `"${c.brand}"`,
        `"${c.model}"`,
        c.year,
        `"${c.color}"`,
        c.transmission,
        c.odometer,
        `"${c.status}"`,
        c.purchaseDate,
        c.purchasePrice,
        fin.totalRecondition,
        fin.totalHpp,
        c.targetSellingPrice,
        c.finalSellingPrice || 0,
        c.soldDate || '-',
        c.sellingExpenses || 0,
        fin.netProfit,
        fin.marginPct,
        fin.holdingDays,
        `"${partnerStr}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    downloadCSV(csvContent, `Garasi_Anak_Mama_Stok_HPP_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportReconditionsToCSV = () => {
    const headers = ['Nopol Mobil', 'Model', 'Tanggal', 'Kategori', 'Deskripsi', 'Nominal (Rp)'];
    const rows: string[] = [];

    cars.forEach((car) => {
      car.reconditionExpenses.forEach((exp) => {
        rows.push(
          [
            `"${car.licensePlate}"`,
            `"${car.brand} ${car.model}"`,
            exp.expenseDate,
            `"${exp.category}"`,
            `"${exp.description}"`,
            exp.amount,
          ].join(',')
        );
      });
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    downloadCSV(csvContent, `Garasi_Anak_Mama_Rincian_Rekondisi_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportCashflowToCSV = () => {
    const headers = ['Tanggal', 'Dompet', 'Tipe', 'Kategori', 'Keterangan', 'Nominal (Rp)'];
    const rows = transactions.map((tx) => {
      const walletObj = wallets.find((w) => w.id === tx.walletId);
      return [
        tx.transactionDate,
        `"${walletObj?.name || 'Kas'}"`,
        tx.transactionType,
        `"${tx.category}"`,
        `"${tx.description}"`,
        tx.amount,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    downloadCSV(csvContent, `Garasi_Anak_Mama_Buku_Kas_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="space-y-4 pb-20 md:pb-10">
      {/* Top Action Bar (Jalur Seduh style) */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">
            Rekapitulasi Keuangan & Performa Penjualan
          </h3>
          <p className="text-xs text-slate-500">
            Laba bersih, margin, holding period unit laku, & ekspor spreadsheet
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-slate-800 shadow-xs transition active:scale-95"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Cetak PDF</span>
        </button>
      </div>

      {/* Financial Performance Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs">
          <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
            Total Omzet Penjualan
          </span>
          <p className="text-2xl font-black font-mono text-slate-900 dark:text-zinc-50 mt-1">
            {formatRupiah(totalOmzet)}
          </p>
          <span className="text-xs text-slate-500 mt-1 block">
            Dari {soldCars.length} unit laku
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs">
          <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
            Total Net Profit Garasi
          </span>
          <p className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400 mt-1">
            +{formatRupiah(totalNetProfit)}
          </p>
          <span className="text-xs text-slate-500 mt-1 block">
            Laba bersih setelah HPP & komisi
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs">
          <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
            Rata-rata Margin Profit
          </span>
          <p className="text-2xl font-black font-mono text-slate-900 dark:text-zinc-50 mt-1">
            {avgMargin.toFixed(1)}%
          </p>
          <span className="text-xs text-slate-500 mt-1 block">
            Persentase margin per unit laku
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs">
          <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
            Rata-rata Waktu Terjual
          </span>
          <p className="text-2xl font-black font-mono text-slate-900 dark:text-zinc-50 mt-1">
            {avgHoldingDays} Hari
          </p>
          <span className="text-xs text-slate-500 mt-1 block">
            Holding period perputaran stok
          </span>
        </div>
      </div>

      {/* Analisis Biaya Rekondisi per Pos Bengkel (Expense Intelligence) */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-emerald-600" />
              <span>Analisis Pengeluaran Bengkel & Rekon Showroom ({formatRupiah(totalAllReconditions)})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rincian pos perbaikan dari total {allExpenses.length} nota bengkel untuk mengontrol efisiensi vendor
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
            {categoryTotals.length} Pos Perbaikan Aktif
          </span>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="w-full h-3 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
          {categoryTotals.map((cat) => (
            <div
              key={cat.key}
              style={{ width: `${cat.pct}%` }}
              className={`${cat.barColor} h-full transition`}
              title={`${cat.label}: ${formatRupiah(cat.amount)} (${cat.pct.toFixed(1)}%)`}
            />
          ))}
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {categoryTotals.map((cat) => (
            <div
              key={cat.key}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/40 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`w-3 h-3 rounded-full ${cat.barColor} shrink-0`} />
                <div className="truncate">
                  <span className="font-bold text-slate-800 dark:text-zinc-200 block truncate">
                    {cat.label}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {cat.count} Nota Servis
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0 pl-2">
                <span className="font-bold font-mono text-slate-900 dark:text-zinc-100 block">
                  {formatRupiah(cat.amount)}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {cat.pct.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CSV Exporter Cards - Clean & Clear */}
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
            Unduh Data Spreadsheet / CSV
          </h3>
          <p className="text-xs text-slate-500">
            Klik tombol untuk mengunduh file CSV yang siap dibuka di Microsoft Excel atau Google Sheets
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Export 1: Stok & HPP */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 flex flex-col justify-between">
            <div>
              <div className="p-2 w-fit rounded-lg bg-emerald-100 text-emerald-800 mb-2">
                <Car className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                Data Stok Mobil & HPP
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Data lengkap semua unit: Nopol, harga beli, total rekondisi, HPP modal, dan margin.
              </p>
            </div>
            <button
              onClick={exportCarsToCSV}
              className="mt-4 w-full py-2 px-3 text-xs font-bold rounded-lg bg-white dark:bg-zinc-700 border border-slate-300 dark:border-zinc-600 text-slate-800 dark:text-zinc-100 hover:bg-slate-100 transition flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Download CSV Stok & HPP</span>
            </button>
          </div>

          {/* Export 2: Rincian Rekondisi */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 flex flex-col justify-between">
            <div>
              <div className="p-2 w-fit rounded-lg bg-amber-100 text-amber-800 mb-2">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                Rincian Biaya Rekondisi
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Detail seluruh nota servis, bengkel, cat, kaki-kaki, salon, dan sparepart per unit mobil.
              </p>
            </div>
            <button
              onClick={exportReconditionsToCSV}
              className="mt-4 w-full py-2 px-3 text-xs font-bold rounded-lg bg-white dark:bg-zinc-700 border border-slate-300 dark:border-zinc-600 text-slate-800 dark:text-zinc-100 hover:bg-slate-100 transition flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Download className="w-4 h-4 text-amber-600" />
              <span>Download CSV Nota Rekon</span>
            </button>
          </div>

          {/* Export 3: Buku Kas Umum */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 flex flex-col justify-between">
            <div>
              <div className="p-2 w-fit rounded-lg bg-blue-100 text-blue-800 mb-2">
                <DollarSign className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                Mutasi Buku Kas Umum
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Seluruh arus kas masuk, keluar, DP, pelunasan mobil, biaya operasional garasi & bagi hasil.
              </p>
            </div>
            <button
              onClick={exportCashflowToCSV}
              className="mt-4 w-full py-2 px-3 text-xs font-bold rounded-lg bg-white dark:bg-zinc-700 border border-slate-300 dark:border-zinc-600 text-slate-800 dark:text-zinc-100 hover:bg-slate-100 transition flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>Download CSV Buku Kas</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table: Sold Units Breakdown */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
            Rekapitulasi Unit Terjual & Realisasi Laba
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-400 font-bold border-b border-slate-200 dark:border-zinc-800">
              <tr>
                <th className="py-3 px-4">Nopol / Unit</th>
                <th className="py-3 px-4 text-right">Harga Beli</th>
                <th className="py-3 px-4 text-right">Rekondisi</th>
                <th className="py-3 px-4 text-right">Total HPP</th>
                <th className="py-3 px-4 text-right">Harga Jual</th>
                <th className="py-3 px-4 text-right">Net Profit</th>
                <th className="py-3 px-4 text-right">Margin (%)</th>
                <th className="py-3 px-4 text-center">Lama Terjual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-mono">
              {soldCars.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                    Belum ada unit dengan status Terjual (Sold).
                  </td>
                </tr>
              ) : (
                soldCars.map((car) => {
                  const fin = calculateUnitFinancials(car);
                  return (
                    <tr key={car.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                      <td className="py-3 px-4 font-sans font-medium text-slate-900 dark:text-zinc-100">
                        <span className="font-mono font-bold block">{car.licensePlate}</span>
                        <span className="text-xs text-slate-500">{car.brand} {car.model}</span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700 dark:text-zinc-300">
                        {formatRupiah(car.purchasePrice)}
                      </td>
                      <td className="py-3 px-4 text-right text-amber-700 dark:text-amber-400">
                        {formatRupiah(fin.totalRecondition)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-zinc-100">
                        {formatRupiah(fin.totalHpp)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-zinc-100">
                        {formatRupiah(car.finalSellingPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-700 dark:text-emerald-400">
                        +{formatRupiah(fin.netProfit)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-800 dark:text-zinc-200">
                        {fin.marginPct}%
                      </td>
                      <td className="py-3 px-4 text-center font-sans text-slate-500">
                        {fin.holdingDays} hari
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
