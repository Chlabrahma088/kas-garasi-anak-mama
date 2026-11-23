'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { formatRupiah, calculateUnitFinancials, formatDateIndo } from '@/lib/utils';
import { LicensePlate } from './LicensePlate';
import {
  TrendingUp,
  Coins,
  Car,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  BookmarkCheck,
  Plus,
  ChevronRight,
  PieChart,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

interface DashboardViewProps {
  onSelectUnit: (unitId: string) => void;
  onNavigateTab: (tab: 'dashboard' | 'cars' | 'cash' | 'reports') => void;
  onOpenQuickAction: () => void;
  onOpenAddCar: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectUnit,
  onNavigateTab,
  onOpenQuickAction,
  onOpenAddCar,
}) => {
  const { cars, wallets, transactions, isDark } = useApp();
  const [profitFilter, setProfitFilter] = useState<'month' | 'year' | 'all'>('all');

  // 1. Modal Tertanam (HPP Unit Belum Terjual)
  const unsoldCars = cars.filter((c) => c.status !== 'sold');
  const totalModalTertanam = unsoldCars.reduce((sum, c) => {
    const fin = calculateUnitFinancials(c);
    return sum + fin.totalHpp;
  }, 0);

  // 2. Saldo Kas Tersedia
  const totalKasTersedia = wallets.reduce((sum, w) => sum + w.balance, 0);

  // 3. Status Count
  const countWorkshop = cars.filter((c) => c.status === 'workshop').length;
  const countReady = cars.filter((c) => c.status === 'ready').length;
  const countBooked = cars.filter((c) => c.status === 'booked').length;
  const countSold = cars.filter((c) => c.status === 'sold').length;

  // 4. Net Profit Realized based on filter
  const soldCars = cars.filter((c) => c.status === 'sold');
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date('2024-11-01T00:00:00Z'));

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const filteredSoldCars = useMemo(() => {
    return soldCars.filter((c) => {
      if (!c.soldDate) return false;
      const d = new Date(c.soldDate);
      if (profitFilter === 'month') {
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      }
      if (profitFilter === 'year') {
        return d.getFullYear() === currentYear;
      }
      return true;
    });
  }, [soldCars, profitFilter, currentYear, currentMonth]);

  const totalNetProfit = filteredSoldCars.reduce((sum, c) => {
    const fin = calculateUnitFinancials(c);
    return sum + fin.netProfit;
  }, 0);

  const totalOmzet = filteredSoldCars.reduce((sum, c) => sum + (c.finalSellingPrice || 0), 0);

  // 5. Data Chart Bulanan (Omzet vs Net Profit)
  const chartData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthlyMap: { [key: string]: { month: string; omzet: number; netProfit: number } } = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      monthlyMap[key] = { month: label, omzet: 0, netProfit: 0 };
    }

    soldCars.forEach((c) => {
      if (!c.soldDate) return;
      const d = new Date(c.soldDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap[key]) {
        const fin = calculateUnitFinancials(c);
        monthlyMap[key].omzet += c.finalSellingPrice || 0;
        monthlyMap[key].netProfit += fin.netProfit;
      }
    });

    return Object.values(monthlyMap);
  }, [soldCars, currentDate]);

  return (
    <div className="space-y-6 pb-20 md:pb-10">
      {/* Top Banner - Simple, Terang & Jelas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              Ringkasan Bisnis
            </span>
            <span className="text-xs text-slate-500 dark:text-zinc-400">Garasi Anak Mama</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">
            Dashboard Keuangan & Stok
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-0.5">
            Pantau modal tertanam di unit belum laku, saldo kas tersedia, dan laba bersih penjualan.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button
            onClick={onOpenAddCar}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Tambah Mobil Masuk</span>
          </button>

          <button
            onClick={onOpenQuickAction}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Input Biaya Bengkel / Kas</span>
          </button>
        </div>
      </div>

      {/* Quick Input Action Hub - Super Jelas & Cepat Diakses */}
      <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-600 animate-pulse" />
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
              Pusat Input & Transaksi Cepat
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
            Klik tombol di bawah untuk mulai mencatat
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Action 1: Beli Mobil Baru */}
          <button
            onClick={onOpenAddCar}
            className="flex flex-col items-start p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800 hover:border-emerald-500 hover:shadow-sm transition text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center font-bold mb-2 group-hover:scale-105 transition">
              <Car className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-zinc-50 block leading-tight">
              + Beli Mobil Masuk
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-tight">
              Catat unit, nopol, harga beli & partner
            </span>
          </button>

          {/* Action 2: Biaya Bengkel */}
          <button
            onClick={onOpenQuickAction}
            className="flex flex-col items-start p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-amber-500 hover:shadow-sm transition text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 flex items-center justify-center font-bold mb-2 group-hover:scale-105 transition">
              <Plus className="w-4 h-4 stroke-[3]" />
            </div>
            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-zinc-50 block leading-tight">
              + Biaya Bengkel / Nota
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-tight">
              Tambah nota mesin, cat, salon, towing
            </span>
          </button>

          {/* Action 3: Jual Mobil / DP */}
          <button
            onClick={() => onNavigateTab('cars')}
            className="flex flex-col items-start p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-blue-500 hover:shadow-sm transition text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 flex items-center justify-center font-bold mb-2 group-hover:scale-105 transition">
              <BookmarkCheck className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-zinc-50 block leading-tight">
              Terima DP / Jual Unit
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-tight">
              Pilih mobil untuk ubah status & profit
            </span>
          </button>

          {/* Action 4: Kas Masuk / Operasional */}
          <button
            onClick={() => onNavigateTab('cash')}
            className="flex flex-col items-start p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-purple-500 hover:shadow-sm transition text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 flex items-center justify-center font-bold mb-2 group-hover:scale-105 transition">
              <Coins className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-zinc-50 block leading-tight">
              Buku Kas & Mutasi
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-tight">
              Pindah rekening, setor modal, operasional
            </span>
          </button>
        </div>
      </div>

      {/* 4 Main KPI Cards - Simple, High Contrast, Sangat Jelas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Modal Tertanam */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                Modal Tertanam (HPP)
              </span>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-zinc-50 mt-2">
              {formatRupiah(totalModalTertanam)}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400">
            <span>Dari <strong>{unsoldCars.length} unit</strong> di showroom</span>
            <span
              onClick={() => onNavigateTab('cars')}
              className="text-emerald-700 dark:text-emerald-400 font-semibold cursor-pointer hover:underline"
            >
              Lihat Stok &rarr;
            </span>
          </div>
        </div>

        {/* Card 2: Saldo Kas Tersedia */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                Total Kas Tersedia
              </span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-700 dark:text-emerald-400 mt-2">
              {formatRupiah(totalKasTersedia)}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400 font-mono">
            <span>BCA: <strong>{formatRupiah(wallets[0]?.balance)}</strong></span>
            <span>Cash: <strong>{formatRupiah(wallets[1]?.balance)}</strong></span>
          </div>
        </div>

        {/* Card 3: Net Profit Realized with Filter */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                  Net Profit
                </span>
                <select
                  value={profitFilter}
                  onChange={(e) => setProfitFilter(e.target.value as 'month' | 'year' | 'all')}
                  className="text-[11px] font-bold py-0.5 px-2 rounded border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 cursor-pointer focus:outline-none"
                >
                  <option value="month">Bulan Ini</option>
                  <option value="year">Tahun Ini</option>
                  <option value="all">Semua</option>
                </select>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-zinc-50 mt-2">
              +{formatRupiah(totalNetProfit)}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400">
            <span>Omzet: <strong className="font-mono text-slate-800 dark:text-zinc-200">{formatRupiah(totalOmzet)}</strong></span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">{filteredSoldCars.length} unit laku</span>
          </div>
        </div>

        {/* Card 4: Status Mobil Showroom */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Status Stok ({cars.length} Unit)
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
              <Car className="w-4 h-4" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div
              onClick={() => onNavigateTab('cars')}
              className="flex items-center justify-between p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 cursor-pointer"
            >
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">Bengkel</span>
              <span className="font-bold text-xs text-amber-800 dark:text-amber-300">{countWorkshop}</span>
            </div>

            <div
              onClick={() => onNavigateTab('cars')}
              className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 cursor-pointer"
            >
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Ready</span>
              <span className="font-bold text-xs text-emerald-800 dark:text-emerald-300">{countReady}</span>
            </div>

            <div
              onClick={() => onNavigateTab('cars')}
              className="flex items-center justify-between p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 cursor-pointer"
            >
              <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">Booked</span>
              <span className="font-bold text-xs text-blue-800 dark:text-blue-300">{countBooked}</span>
            </div>

            <div
              onClick={() => onNavigateTab('cars')}
              className="flex items-center justify-between p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 cursor-pointer"
            >
              <span className="text-xs font-semibold text-purple-800 dark:text-purple-300">Sold</span>
              <span className="font-bold text-xs text-purple-800 dark:text-purple-300">{countSold}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sebaran Modal Tertanam per Mobil - Jelas & Mudah Dibaca */}
      <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-600" />
              <span>Rincian Modal Tertanam per Mobil ({formatRupiah(totalModalTertanam)})</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Mobil yang belum laku beserta jumlah dana yang mengendap di masing-masing unit
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 dark:text-zinc-300">{unsoldCars.length} Unit Aktif</span>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="w-full h-3 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
          {unsoldCars.map((car, idx) => {
            const fin = calculateUnitFinancials(car);
            const pct = totalModalTertanam > 0 ? (fin.totalHpp / totalModalTertanam) * 100 : 0;
            const colors = ['bg-amber-500', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500'];
            return (
              <div
                key={car.id}
                style={{ width: `${pct}%` }}
                className={`${colors[idx % colors.length]} h-full transition`}
                title={`${car.brand} ${car.model}: ${formatRupiah(fin.totalHpp)} (${pct.toFixed(0)}%)`}
              />
            );
          })}
        </div>

        {/* Legend Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          {unsoldCars.map((car, idx) => {
            const fin = calculateUnitFinancials(car);
            const pct = totalModalTertanam > 0 ? (fin.totalHpp / totalModalTertanam) * 100 : 0;
            const dotColors = ['bg-amber-500', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500'];
            return (
              <div
                key={car.id}
                onClick={() => onSelectUnit(car.id)}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 hover:border-emerald-500 cursor-pointer transition text-xs"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className={`w-3 h-3 rounded-full ${dotColors[idx % dotColors.length]} shrink-0`} />
                  <div className="truncate">
                    <span className="font-bold text-slate-900 dark:text-zinc-100 block truncate">
                      {car.brand} {car.model}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono font-semibold">{car.licensePlate}</span>
                  </div>
                </div>
                <div className="text-right shrink-0 pl-2">
                  <span className="font-bold font-mono text-slate-900 dark:text-zinc-100 block">
                    {formatRupiah(fin.totalHpp)}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">{pct.toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Chart & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recharts Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                  Tren Omzet & Net Profit
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Realisasi perputaran penjualan dan laba bersih bulanan
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                6 Bulan Terakhir
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#f1f5f9'} />
                  <XAxis
                    dataKey="month"
                    stroke={isDark ? '#71717a' : '#64748b'}
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke={isDark ? '#71717a' : '#64748b'}
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)}jt`}
                  />
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(val: any) => [formatRupiah(Number(val) || 0), '']}
                    contentStyle={{
                      backgroundColor: isDark ? '#18181b' : '#ffffff',
                      borderColor: isDark ? '#27272a' : '#cbd5e1',
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      color: isDark ? '#f4f4f5' : '#0f172a',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="omzet" name="Omzet Penjualan" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="netProfit" name="Net Profit Garasi" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right: Recent Transactions Feed */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                  Mutasi Kas Terakhir
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Arus kas showroom & perbaikan unit
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('cash')}
                className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center"
              >
                <span>Lihat Semua</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {transactions.slice(0, 5).map((tx) => {
                const isInflow = tx.transactionType === 'inflow';
                return (
                  <div
                    key={tx.id}
                    className="flex items-start justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800 hover:border-slate-300 transition"
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`p-1.5 rounded-md mt-0.5 ${
                          isInflow
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {isInflow ? (
                          <ArrowDownRight className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-zinc-100 line-clamp-1">
                          {tx.description}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-zinc-400">
                          <span>{formatDateIndo(tx.transactionDate)}</span>
                          <span>•</span>
                          <span className="capitalize">{tx.category.replace(/_/g, ' ')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right pl-2 shrink-0">
                      <span
                        className={`text-xs font-black font-mono ${
                          isInflow
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-rose-700 dark:text-rose-400'
                        }`}
                      >
                        {isInflow ? '+' : '-'} {formatRupiah(tx.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 mt-4">
            <button
              onClick={onOpenQuickAction}
              className="w-full py-2.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 transition text-center"
            >
              + Input Mutasi Kas Baru
            </button>
          </div>
        </div>
      </div>

      {/* Featured Ready Units */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
              Unit Prioritas di Showroom
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Mobil dengan status Ready Jual, Masuk Bengkel, atau Booked
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('cars')}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>Semua Stok ({cars.length}) &rarr;</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cars
            .filter((c) => c.status !== 'sold')
            .slice(0, 3)
            .map((car) => {
              const fin = calculateUnitFinancials(car);
              const estProfit = car.targetSellingPrice - fin.totalHpp;
              return (
                <div
                  key={car.id}
                  onClick={() => onSelectUnit(car.id)}
                  className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-500 hover:shadow-md cursor-pointer transition overflow-hidden flex flex-col justify-between"
                >
                  {/* Photo Header */}
                  <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={car.photoUrl}
                      alt={car.model}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <LicensePlate plate={car.licensePlate} size="sm" />
                    </div>

                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          car.status === 'ready'
                            ? 'bg-emerald-600 text-white'
                            : car.status === 'booked'
                            ? 'bg-blue-600 text-white'
                            : 'bg-amber-500 text-slate-950 font-bold'
                        }`}
                      >
                        {car.status === 'ready' ? 'Ready Jual' : car.status === 'booked' ? 'Booked/DP' : 'Bengkel'}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                        {car.brand} {car.model}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tahun {car.year} • {car.transmission} • {(car.odometer).toLocaleString()} KM
                      </p>
                    </div>

                    {/* HPP vs Target Jual */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total HPP Modal:</span>
                        <span className="font-bold font-mono text-slate-900 dark:text-zinc-100">
                          {formatRupiah(fin.totalHpp)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Target Jual:</span>
                        <span className="font-bold font-mono text-emerald-700 dark:text-emerald-400">
                          {formatRupiah(car.targetSellingPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-zinc-700 font-bold text-emerald-700 dark:text-emerald-400">
                        <span>Potensi Laba:</span>
                        <span>+{formatRupiah(estProfit)}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs text-slate-500">
                      <span>{car.reconditionExpenses.length} Nota Rekon</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                        Buka HPP &rarr;
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
