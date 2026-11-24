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
  CreditCard,
  Sparkles,
  ShieldCheck,
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
  const { cars, wallets, transactions, isDark, updateCar, addCashTransaction } = useApp();
  const [profitFilter, setProfitFilter] = useState<'month' | 'year' | 'all'>('all');

  // 1. Modal Tertanam (HPP Unit Belum Terjual)
  const unsoldCars = cars.filter((c) => c.status !== 'sold');
  const totalModalTertanam = unsoldCars.reduce((sum, c) => {
    const fin = calculateUnitFinancials(c);
    return sum + fin.totalHpp;
  }, 0);

  // 2. Saldo Kas Tersedia
  const totalKasTersedia = wallets.reduce((sum, w) => sum + w.balance, 0);

  // 3. Piutang Pelunasan Unit (Booked / DP)
  const bookedCars = cars.filter((c) => c.status === 'booked');
  const totalPiutang = bookedCars.reduce((sum, c) => {
    const price = c.finalSellingPrice || c.targetSellingPrice;
    const dp = c.dpAmount || 0;
    return sum + Math.max(0, price - dp);
  }, 0);

  // 4. Total Valuasi Kekayaan Bersih Garasi (Kas + Modal Stok + Piutang)
  const totalValuasiAset = totalKasTersedia + totalModalTertanam + totalPiutang;

  // 5. Status Count
  const countWorkshop = cars.filter((c) => c.status === 'workshop').length;
  const countReady = cars.filter((c) => c.status === 'ready').length;
  const countBooked = cars.filter((c) => c.status === 'booked').length;
  const countSold = cars.filter((c) => c.status === 'sold').length;

  // Handler Terima Pelunasan HR-V Padang
  const handleSettleHrvPadang = () => {
    const hrv = cars.find((c) => c.id === 'unit-hrv-2021');
    if (!hrv) return;
    const sisa = (hrv.targetSellingPrice || 210000000) - (hrv.dpAmount || 105000000);
    const confirm = window.confirm(
      `Konfirmasi terima pelunasan akhir Honda HR-V SE 2021 (Padang) sebesar ${formatRupiah(sisa)} ke Rekening Mandiri?`
    );
    if (!confirm) return;

    const today = new Date().toISOString().split('T')[0];
    updateCar(hrv.id, {
      status: 'sold',
      finalSellingPrice: 210000000,
      soldDate: today,
    });

    addCashTransaction({
      walletId: wallets[0]?.id || 'w1',
      transactionType: 'inflow',
      category: 'car_sale',
      amount: sisa,
      description: 'Pelunasan Akhir Honda HR-V SE 2021 Padang (Lunas 210jt)',
      transactionDate: today,
      unitId: hrv.id,
    });

    alert(`Pelunasan ${formatRupiah(sisa)} berhasil dicatat! Saldo Rekening Mandiri bertambah.`);
  };

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
    <div className="space-y-5 pb-20 md:pb-10">
      {/* Valuasi Total Kekayaan Bersih Garasi (Kas + Modal Stok + Piutang) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-zinc-900 border border-slate-800 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Total Valuasi Aset Garasi
            </span>
            <span className="text-xs text-slate-400">Kas + Modal Stok + Piutang Masuk</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
            {formatRupiah(totalValuasiAset)}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-3 md:pt-0 border-t md:border-t-0 md:border-l border-slate-700/80 md:pl-5 text-xs">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">1. Kas Mandiri</span>
            <span className="font-bold font-mono text-emerald-400 text-xs sm:text-sm">{formatRupiah(totalKasTersedia)}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">2. Modal Stok</span>
            <span className="font-bold font-mono text-amber-400 text-xs sm:text-sm">{formatRupiah(totalModalTertanam)}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">3. Sisa Piutang</span>
            <span className="font-bold font-mono text-blue-400 text-xs sm:text-sm">{formatRupiah(totalPiutang)}</span>
          </div>
        </div>
      </div>

      {/* Alert / Aksi Cepat: Piutang Pelunasan Unit (Contoh: HR-V Padang Rp 105 Jt) */}
      {totalPiutang > 0 && (
        <div className="p-4 rounded-xl bg-blue-50/90 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-blue-900 dark:text-blue-200">
                  Piutang Pelunasan Unit: Honda HR-V SE 2021 (Padang)
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  DP Masuk 105jt
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
                Terjual Rp 210jt, sisa yang belum dilunasi: <strong className="font-mono text-blue-700 dark:text-blue-300">Rp 105.000.000</strong>
              </p>
            </div>
          </div>

          <button
            onClick={handleSettleHrvPadang}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition active:scale-95 shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>+ Catat Pelunasan Masuk (105jt)</span>
          </button>
        </div>
      )}

      {/* 4 Main KPI Cards - Simple, High Contrast, Sangat Jelas (Jalur Seduh style) */}
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
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400">
            <span>{wallets[0]?.name || 'Rekening Mandiri (Pribadi)'}</span>
            <span className="font-bold text-slate-800 dark:text-zinc-200 font-mono">100% Likuid</span>
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
