'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  CarUnit,
  ReconditionCategory,
  RECONDITION_CATEGORIES,
  UnitStatus,
  TransmissionType,
} from '@/types';
import {
  formatRupiah,
  calculateUnitFinancials,
  formatDateIndo,
} from '@/lib/utils';
import { CurrencyInput } from './CurrencyInput';
import { LicensePlate } from './LicensePlate';
import { CarPhotoGallery } from './CarPhotoGallery';
import {
  X,
  Wrench,
  DollarSign,
  Users,
  CheckCircle,
  Clock,
  Printer,
  Trash2,
  Plus,
  ShieldCheck,
  Sliders,
  Calendar,
  Zap,
  ExternalLink,
  Share2,
} from 'lucide-react';

interface CarDetailModalProps {
  unitId: string | null;
  onClose: () => void;
}

export const CarDetailModal: React.FC<CarDetailModalProps> = ({ unitId, onClose }) => {
  const {
    cars,
    wallets,
    updateCar,
    deleteCar,
    addReconditionExpense,
    deleteReconditionExpense,
    markCarSold,
    updatePartnerTransferStatus,
  } = useApp();

  const car = cars.find((c) => c.id === unitId);

  // States for adding recondition expense
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState<ReconditionCategory>('mesin');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseWalletId, setExpenseWalletId] = useState<string>(wallets[0]?.id || 'w1');
  const [expenseDate, setExpenseDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [expenseReceipt, setExpenseReceipt] = useState<string>('');

  // States for Mark Sold flow
  const [showSoldModal, setShowSoldModal] = useState(false);
  const [finalSellingPrice, setFinalSellingPrice] = useState<number>(car?.targetSellingPrice || 0);
  const [sellingExpenses, setSellingExpenses] = useState<number>(0);
  const [soldDate, setSoldDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [walletIdSale, setWalletIdSale] = useState<string>(wallets[0]?.id || 'w1');

  // Filter recondition category
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  // DP input flow
  const [showDpModal, setShowDpModal] = useState(false);
  const [dpInputAmount, setDpInputAmount] = useState<number>(car?.dpAmount || 5000000);
  const [dpWalletId, setDpWalletId] = useState<string>(wallets[0]?.id || 'w1');

  // Live Profit Simulator
  const [simulatedPrice, setSimulatedPrice] = useState<number>(car?.targetSellingPrice || 0);
  const [isCopiedWa, setIsCopiedWa] = useState(false);

  const handleCopyWhatsApp = () => {
    if (!car) return;
    const text = [
      `*Bismillah Dijual: ${car.brand} ${car.model} (${car.year})*`,
      `• Plat Nomor: ${car.licensePlate}`,
      `• Transmisi: ${car.transmission} • Warna: ${car.color}`,
      `• Odometer: ${(car.odometer).toLocaleString('id-ID')} KM`,
      car.notes ? `• Spek & Kondisi: ${car.notes.replace(/\[META:.*?\]/g, '').trim()}` : '',
      car.targetSellingPrice > 0 ? `• Harga: ${formatRupiah(car.targetSellingPrice)} (Nego)` : '',
      `• Lokasi Showroom: Garasi Anak Mama, Jelupang Serpong`,
      car.instagramUrl ? `📸 Post Instagram: ${car.instagramUrl}` : '',
      `🌐 Katalog Web: https://kas-garasi-anak-mama.vercel.app`,
    ]
      .filter(Boolean)
      .join('\n');

    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setIsCopiedWa(true);
      setTimeout(() => setIsCopiedWa(false), 2500);
    }
  };

  if (!car) return null;

  const fin = calculateUnitFinancials(car);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseAmount <= 0 || !expenseDesc) {
      alert('Masukkan keterangan dan nominal pengeluaran rekondisi.');
      return;
    }
    addReconditionExpense(car.id, {
      category: expenseCategory,
      description: expenseDesc,
      amount: expenseAmount,
      walletId: expenseWalletId,
      expenseDate,
      receiptUrl: expenseReceipt || undefined,
    });
    setExpenseAmount(0);
    setExpenseDesc('');
    setExpenseReceipt('');
    setShowAddExpense(false);
  };

  const handleConfirmSold = (e: React.FormEvent) => {
    e.preventDefault();
    if (finalSellingPrice <= 0) {
      alert('Masukkan harga jual final.');
      return;
    }

    markCarSold(car.id, {
      finalSellingPrice,
      sellingExpenses,
      soldDate,
      walletIdSale,
      partners: car.partners,
    });
    setShowSoldModal(false);
  };

  const handleConfirmDp = (e: React.FormEvent) => {
    e.preventDefault();
    if (dpInputAmount <= 0) {
      alert('Masukkan nominal DP.');
      return;
    }
    updateCar(car.id, {
      status: 'booked',
      dpAmount: dpInputAmount,
      dpDate: new Date().toISOString().split('T')[0],
      walletIdDp: dpWalletId,
    });
    setShowDpModal(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredExpenses = car.reconditionExpenses.filter((e) =>
    activeCategoryFilter === 'all' ? true : e.category === activeCategoryFilter
  );

  // Profit Simulation values & margin health
  const simProfit = simulatedPrice > 0 ? simulatedPrice - fin.totalHpp : 0;
  const simMarginVal = simulatedPrice > 0 ? (simProfit / simulatedPrice) * 100 : 0;
  const simMargin = simMarginVal.toFixed(1);

  // Visual helper for category badges
  const getCategoryBadgeClass = (category: ReconditionCategory) => {
    switch (category) {
      case 'mesin':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/80';
      case 'kaki_kaki':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/80';
      case 'body_cat':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/80';
      case 'salon_detailing':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/80';
      case 'pajak_surat':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/80';
      case 'towing_bensin':
        return 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200/80 dark:border-cyan-800/80';
      case 'mediator':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/80';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border-slate-200 dark:border-zinc-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white dark:bg-zinc-900 border-t sm:border border-slate-200/90 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[94vh] flex flex-col animate-in slide-in-from-bottom-5 duration-200 print:border-none print:shadow-none overflow-hidden">
        
        {/* iOS Drag Handle on Mobile */}
        <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700 mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Executive Clean Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200/90 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/80 backdrop-blur-xs print:bg-white shrink-0">
          <div className="flex items-center gap-3">
            <LicensePlate plate={car.licensePlate} size="md" />
            <div>
              <h2 className="text-sm sm:text-lg font-black text-slate-900 dark:text-zinc-50 flex items-center gap-2 tracking-tight">
                <span>{car.brand} {car.model}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-300/50 dark:border-zinc-700">
                  {car.year}
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 mt-0.5 font-medium">
                {car.transmission} • {car.color} • {(car.odometer).toLocaleString()} KM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handleCopyWhatsApp}
              className="px-3 py-1.5 text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition flex items-center gap-1.5 text-xs font-bold active:scale-95 shadow-2xs"
              title="Salin spek mobil siap kirim ke calon pembeli di WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{isCopiedWa ? '✓ Tersalin!' : 'Salin WA'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-slate-600 dark:text-zinc-300 hover:text-slate-900 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition flex items-center gap-1.5 text-xs font-bold"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body - Scrollable with iOS Safe Area support */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto pb-[calc(2rem+env(safe-area-inset-bottom,0px))] sm:pb-6 print:max-h-none print:overflow-visible">
          
          {/* Car Photo Gallery Carousel (Instagram multi-photos) */}
          <div className="print:hidden">
            <CarPhotoGallery
              photos={
                car.galleryUrls && car.galleryUrls.length > 0
                  ? car.galleryUrls
                  : car.photoUrl
                  ? [car.photoUrl]
                  : []
              }
              carName={`${car.brand} ${car.model} (${car.year})`}
              plateNumber={car.licensePlate}
              instagramUrl={car.instagramUrl}
            />
          </div>

          {/* Status Bar & Quick Actions - Elevated & Tactile */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50/90 dark:bg-zinc-800/50 border border-slate-200/90 dark:border-zinc-700/60 shadow-2xs print:hidden">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                Status:
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-2xs ${
                  car.status === 'ready'
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                    : car.status === 'booked'
                    ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30'
                    : car.status === 'workshop'
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                    : 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30'
                }`}
              >
                {car.status === 'ready'
                  ? 'Ready Jual'
                  : car.status === 'booked'
                  ? 'Booked / DP'
                  : car.status === 'workshop'
                  ? 'Bahan / Bengkel'
                  : 'Sold / Terjual'}
              </span>
            </div>

            {/* Change Status Buttons (Thumb Friendly) */}
            <div className="flex items-center gap-2 flex-wrap">
              {car.status !== 'workshop' && car.status !== 'sold' && (
                <button
                  onClick={() => updateCar(car.id, { status: 'workshop' })}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 transition shadow-xs active:scale-95 min-h-[38px]"
                >
                  Masuk Bengkel
                </button>
              )}
              {car.status !== 'ready' && car.status !== 'sold' && (
                <button
                  onClick={() => updateCar(car.id, { status: 'ready' })}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs active:scale-95 min-h-[38px]"
                >
                  Set Ready
                </button>
              )}
              {car.status !== 'booked' && car.status !== 'sold' && (
                <button
                  onClick={() => setShowDpModal(true)}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition shadow-xs active:scale-95 min-h-[38px]"
                >
                  Terima DP
                </button>
              )}
              {car.status !== 'sold' && (
                <button
                  onClick={() => setShowSoldModal(true)}
                  className="px-4 py-2 text-xs font-black rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition shadow-xs active:scale-95 min-h-[38px]"
                >
                  Unit Terjual (Sold)
                </button>
              )}
            </div>
          </div>

          {/* Section: HPP Calculation Big Cards - Modern 3-Step Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* 1. Harga Beli */}
            <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-800/90 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-slate-300 dark:bg-zinc-700" />
              <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                1. Harga Beli Unit
              </span>
              <p className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-zinc-50 mt-1.5 tracking-tight">
                {formatRupiah(car.purchasePrice)}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 mt-2 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Beli: {formatDateIndo(car.purchaseDate)}</span>
              </div>
            </div>

            {/* 2. Total Biaya Rekondisi */}
            <div className="p-4 sm:p-5 rounded-2xl border border-amber-200/90 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-400 uppercase tracking-wider block">
                  2. Total Rekondisi
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {car.reconditionExpenses.length} Nota Servis
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-black font-mono text-amber-700 dark:text-amber-400 mt-1.5 tracking-tight">
                {formatRupiah(fin.totalRecondition)}
              </p>
              <span className="text-xs text-amber-800/80 dark:text-amber-400/80 mt-2 block font-medium">
                Bengkel, cat, kaki-kaki, salon, dll
              </span>
            </div>

            {/* 3. Total HPP Modal Bersih (Featured Hero) */}
            <div className="p-4 sm:p-5 rounded-2xl border-2 border-emerald-500/80 dark:border-emerald-500/60 bg-gradient-to-br from-emerald-50/80 via-emerald-50/30 to-teal-50/20 dark:from-emerald-950/40 dark:via-zinc-900 dark:to-teal-950/20 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                  Total HPP Modal Bersih
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                  Modal Net
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-zinc-50 mt-1.5 tracking-tight">
                {formatRupiah(fin.totalHpp)}
              </p>
              <span className="text-xs text-slate-600 dark:text-zinc-400 mt-2 block font-medium">
                (Harga Beli + Total Rekondisi)
              </span>
            </div>
          </div>

          {/* Live Profit Simulator (When not sold yet) */}
          {car.status !== 'sold' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 dark:bg-zinc-800/60 border border-slate-200/90 dark:border-zinc-700 shadow-2xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                      Simulator Proyeksi Cuan & Bagi Hasil Partner
                    </h3>
                    <p className="text-[11px] text-slate-500">Ketik estimasi harga deal untuk melihat proyeksi laba seketika</p>
                  </div>
                </div>

                {/* Live Margin Health Pill */}
                {simulatedPrice > 0 && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${
                      simProfit < 0
                        ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300'
                        : simMarginVal < 5
                        ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                        : simMarginVal < 10
                        ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        simProfit < 0
                          ? 'bg-rose-500'
                          : simMarginVal < 5
                          ? 'bg-amber-500'
                          : simMarginVal < 10
                          ? 'bg-blue-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                    <span>
                      {simProfit < 0
                        ? 'Rugi / Boncos'
                        : simMarginVal < 5
                        ? 'Margin Tipis (<5%)'
                        : simMarginVal < 10
                        ? 'Margin Wajar (5-10%)'
                        : 'Margin Sehat (>10%)'}
                    </span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block mb-1 text-xs text-slate-600 dark:text-zinc-300 font-bold">
                    Target Harga Deal (Rp):
                  </label>
                  <CurrencyInput
                    value={simulatedPrice}
                    onChange={setSimulatedPrice}
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-2xs">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold tracking-wider">
                    Estimasi Net Profit Garasi
                  </span>
                  <span
                    className={`text-lg sm:text-xl font-black font-mono block mt-0.5 ${
                      simProfit < 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    {simProfit >= 0 ? '+' : ''}{formatRupiah(simProfit)}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                    Margin: {simMargin}% dari harga jual
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-2xs">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold tracking-wider">
                    Porsi Bagi Hasil Partner
                  </span>
                  <div className="space-y-1 mt-1 text-xs font-mono">
                    {car.partners.map((p) => {
                      const share = Math.round((simProfit * p.profitSharePercentage) / 100);
                      return (
                        <div key={p.id} className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-600 dark:text-zinc-400 truncate">{p.partnerName}:</span>
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatRupiah(share)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* If Status is SOLD: Profit & Realized Results */}
          {car.status === 'sold' && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50/90 via-white to-purple-50/50 dark:from-purple-950/40 dark:via-zinc-900 dark:to-purple-950/20 border border-purple-200/90 dark:border-purple-800/60 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-black text-purple-900 dark:text-purple-300 uppercase tracking-wider">
                    Realisasi Penjualan & Profit Unit
                  </h3>
                </div>
                {car.soldDate && (
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-100/70 dark:bg-purple-900/40 px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-800">
                    Laku: {formatDateIndo(car.soldDate)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-800 dark:text-zinc-200 pt-1">
                <div className="p-3 rounded-xl bg-white/80 dark:bg-zinc-800/80 border border-purple-100 dark:border-purple-900/40">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Harga Jual Final:</span>
                  <span className="text-sm sm:text-base font-black font-mono text-slate-900 dark:text-zinc-100 block mt-0.5">
                    {formatRupiah(car.finalSellingPrice)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/80 dark:bg-zinc-800/80 border border-purple-100 dark:border-purple-900/40">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Biaya Jual / Komisi:</span>
                  <span className="text-sm sm:text-base font-black font-mono text-rose-700 dark:text-rose-400 block mt-0.5">
                    {formatRupiah(car.sellingExpenses || 0)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/80 dark:bg-zinc-800/80 border border-purple-100 dark:border-purple-900/40">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Net Profit Garasi:</span>
                  <span className="text-sm sm:text-base font-black font-mono text-emerald-700 dark:text-emerald-400 block mt-0.5">
                    +{formatRupiah(fin.netProfit)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/80 dark:bg-zinc-800/80 border border-purple-100 dark:border-purple-900/40">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Margin Laba:</span>
                  <span className="text-sm sm:text-base font-black font-mono text-slate-900 dark:text-zinc-100 block mt-0.5">
                    {fin.marginPct}%
                  </span>
                </div>
              </div>

              {/* Tanggal Posting & Kecepatan Terjual */}
              {(car.postingDate || car.instagramUrl) && (
                <div className="pt-2.5 border-t border-purple-200/80 dark:border-purple-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3 flex-wrap">
                    {car.postingDate && (
                      <span className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-purple-600" />
                        <span>Posting IG: <b>{formatDateIndo(car.postingDate)}</b></span>
                      </span>
                    )}
                    {fin.daysToSellFromPost !== undefined && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-black text-[11px] bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>Terjual dalam {fin.daysToSellFromPost} Hari sejak Posting</span>
                      </span>
                    )}
                  </div>
                  {car.instagramUrl && (
                    <a
                      href={car.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
                    >
                      <span>Lihat Postingan Instagram</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* If Status is not sold, but has Instagram link or post date */}
          {car.status !== 'sold' && (car.postingDate || car.instagramUrl) && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-2xs">
              <div className="flex items-center gap-3 flex-wrap">
                {car.postingDate && (
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-rose-600" />
                    <span>Diposting di Instagram: <b>{formatDateIndo(car.postingDate)}</b></span>
                  </span>
                )}
                {car.status === 'booked' && fin.daysToSellFromPost !== undefined && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-black text-[11px] bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>Laku / Booked dalam {fin.daysToSellFromPost} Hari</span>
                  </span>
                )}
              </div>
              {car.instagramUrl && (
                <a
                  href={car.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
                >
                  <span>Buka di Instagram</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}

          {/* Section: Partner Modal & Profit Sharing */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/40 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
                    Sumber Modal & Bagi Hasil Partner
                  </h4>
                  <p className="text-[11px] text-slate-500">Struktur penyertaan modal dan porsi profit per pemodal</p>
                </div>
              </div>
              <span className="text-xs text-slate-600 dark:text-zinc-400 font-mono font-bold px-2.5 py-1 rounded-full bg-slate-200/60 dark:bg-zinc-700">
                {car.partners.length} Partner
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {car.partners.map((partner) => (
                <div
                  key={partner.id}
                  className="p-4 rounded-xl border border-slate-200/90 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex flex-col justify-between shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-black text-slate-900 dark:text-zinc-100">
                        {partner.partnerName}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-700 font-bold text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-600">
                        Modal: {partner.capitalPercentage}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono">
                      Setoran: <span className="font-bold text-slate-800 dark:text-zinc-200">{formatRupiah(partner.capitalAmount)}</span>
                    </p>
                  </div>

                  {/* Profit Share Section */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-700 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Bagi Hasil ({partner.profitSharePercentage}%):</span>
                      <span className="font-black font-mono text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm">
                        {car.status === 'sold'
                          ? formatRupiah(partner.profitAmount)
                          : 'Tergantung Jual'}
                      </span>
                    </div>

                    {car.status === 'sold' && (
                      <button
                        onClick={() =>
                          updatePartnerTransferStatus(
                            car.id,
                            partner.id,
                            partner.transferStatus === 'transferred' ? 'pending' : 'transferred'
                          )
                        }
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition min-h-[34px] shadow-2xs active:scale-95 ${
                          partner.transferStatus === 'transferred'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {partner.transferStatus === 'transferred'
                          ? '✓ Sudah Ditransfer'
                          : 'Belum Dibagi (Klik)'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Recondition Expense Details Table */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                    Rincian Biaya Rekondisi Unit
                  </h3>
                  <p className="text-[11px] text-slate-500">Detail seluruh nota bengkel, servis, salon, dan sparepart</p>
                </div>
              </div>

              <div className="flex items-center gap-2 print:hidden">
                <button
                  onClick={() => setShowAddExpense(!showAddExpense)}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition shadow-xs active:scale-95 min-h-[38px]"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Tambah Nota Bengkel</span>
                </button>
              </div>
            </div>

            {/* Filter Category Tabs - Rounded Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs print:hidden">
              <button
                onClick={() => setActiveCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition shadow-2xs ${
                  activeCategoryFilter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                }`}
              >
                Semua Nota ({car.reconditionExpenses.length})
              </button>
              {RECONDITION_CATEGORIES.map((cat) => {
                const count = car.reconditionExpenses.filter((e) => e.category === cat.id).length;
                if (count === 0) return null;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategoryFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition shadow-2xs ${
                      activeCategoryFilter === cat.id
                        ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {cat.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Add Expense Form Collapsible */}
            {showAddExpense && (
              <form
                onSubmit={handleAddExpense}
                className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-slate-50/90 dark:bg-zinc-800/80 space-y-3.5 print:hidden animate-in fade-in duration-150 shadow-xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-zinc-700">
                  <h4 className="text-xs font-black text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
                    Input Nota / Biaya Rekondisi Baru
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowAddExpense(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-zinc-300"
                  >
                    Tutup
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block mb-1 text-xs font-bold text-slate-700 dark:text-zinc-300">
                      Kategori Rekondisi:
                    </label>
                    <select
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value as ReconditionCategory)}
                      className="w-full px-3 py-2.5 text-base sm:text-xs rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 focus:outline-none"
                    >
                      {RECONDITION_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 text-xs font-bold text-slate-700 dark:text-zinc-300">
                      Nominal Biaya:
                    </label>
                    <CurrencyInput
                      value={expenseAmount}
                      onChange={setExpenseAmount}
                      placeholder="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-xs font-bold text-slate-700 dark:text-zinc-300">
                      Potong Dari Kas:
                    </label>
                    <select
                      value={expenseWalletId}
                      onChange={(e) => setExpenseWalletId(e.target.value)}
                      className="w-full px-3 py-2.5 text-base sm:text-xs rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 focus:outline-none"
                    >
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 text-xs font-bold text-slate-700 dark:text-zinc-300">
                      Keterangan Pekerjaan / Komponen:
                    </label>
                    <input
                      type="text"
                      required
                      value={expenseDesc}
                      onChange={(e) => setExpenseDesc(e.target.value)}
                      placeholder="Contoh: Ganti kampas rem depan, tune up..."
                      className="w-full px-3 py-2.5 text-base sm:text-xs rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-xs font-bold text-slate-700 dark:text-zinc-300">
                      Tanggal Transaksi:
                    </label>
                    <input
                      type="date"
                      required
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      className="w-full px-3 py-2.5 text-base sm:text-xs rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-zinc-700">
                  <button
                    type="button"
                    onClick={() => setShowAddExpense(false)}
                    className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition min-h-[38px]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition active:scale-95 min-h-[38px]"
                  >
                    Simpan Biaya
                  </button>
                </div>
              </form>
            )}

            {/* Expenses List / Table - Clean & High Contrast */}
            <div className="border border-slate-200/90 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs bg-white dark:bg-zinc-900">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 font-bold border-b border-slate-200/90 dark:border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Deskripsi Nota / Pekerjaan</th>
                    <th className="py-3 px-4 text-right">Biaya (HPP)</th>
                    <th className="py-3 px-4 text-center print:hidden">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 font-medium">
                        Belum ada catatan rekondisi untuk unit ini.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => {
                      const catInfo = RECONDITION_CATEGORIES.find((c) => c.id === exp.category);
                      return (
                        <tr
                          key={exp.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition"
                        >
                          <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                            {formatDateIndo(exp.expenseDate)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getCategoryBadgeClass(exp.category)}`}>
                              {catInfo?.label || exp.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-800 dark:text-zinc-200 font-medium">
                            {exp.description}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-amber-700 dark:text-amber-400 whitespace-nowrap">
                            {formatRupiah(exp.amount)}
                          </td>
                          <td className="py-3 px-4 text-center print:hidden">
                            <button
                              onClick={() => deleteReconditionExpense(car.id, exp.id)}
                              title="Hapus pengeluaran dan kembalikan saldo kas"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {filteredExpenses.length > 0 && (
                  <tfoot className="bg-slate-50/80 dark:bg-zinc-800/60 font-bold border-t border-slate-200/90 dark:border-zinc-800">
                    <tr>
                      <td colSpan={3} className="py-3 px-4 text-right text-slate-700 dark:text-zinc-300 font-bold">
                        Subtotal Rekondisi:
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-amber-700 dark:text-amber-400 text-sm">
                        {formatRupiah(
                          filteredExpenses.reduce((sum, item) => sum + item.amount, 0)
                        )}
                      </td>
                      <td className="print:hidden"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Delete Car Danger Zone */}
          <div className="pt-4 border-t border-slate-200/90 dark:border-zinc-800 flex items-center justify-between print:hidden">
            <button
              onClick={() => {
                if (confirm('Yakin ingin menghapus unit ini dari showroom?')) {
                  deleteCar(car.id);
                  onClose();
                }
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1.5 py-2 px-3 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Unit Dari Garasi</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Sub-modal: Record SOLD */}
      {showSoldModal && (
        <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border-t sm:border border-slate-200/90 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/90 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100">
                  Konfirmasi Penjualan Unit
                </h3>
              </div>
              <button
                onClick={() => setShowSoldModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmSold} className="space-y-3.5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-0">
              <div>
                <label className="block mb-1 text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Harga Jual Final (Deal Pembeli):
                </label>
                <CurrencyInput
                  value={finalSellingPrice}
                  onChange={setFinalSellingPrice}
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Biaya Jual / Komisi Makelar / Diskon:
                </label>
                <CurrencyInput
                  value={sellingExpenses}
                  onChange={setSellingExpenses}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block mb-1 text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Tanggal Terjual:
                </label>
                <input
                  type="date"
                  required
                  value={soldDate}
                  onChange={(e) => setSoldDate(e.target.value)}
                  className="w-full px-3 py-2.5 text-base sm:text-xs rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-1 text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Kas Penerima Pelunasan:
                </label>
                <select
                  value={walletIdSale}
                  onChange={(e) => setWalletIdSale(e.target.value)}
                  className="w-full px-3 py-2.5 text-base sm:text-xs rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Live Preview Profit Calculation */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-xs space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Harga Jual:</span>
                  <span className="font-bold">{formatRupiah(finalSellingPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Total HPP:</span>
                  <span className="text-rose-600 dark:text-rose-400 font-bold">- {formatRupiah(fin.totalHpp)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Biaya Jual:</span>
                  <span className="text-rose-600 dark:text-rose-400 font-bold">- {formatRupiah(sellingExpenses)}</span>
                </div>
                <div className="flex justify-between font-black pt-1.5 border-t border-slate-200 dark:border-zinc-700 text-emerald-700 dark:text-emerald-400 text-sm">
                  <span className="font-sans">Estimasi Net Profit:</span>
                  <span>{formatRupiah(finalSellingPrice - fin.totalHpp - sellingExpenses)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowSoldModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl min-h-[38px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition active:scale-95 min-h-[38px]"
                >
                  Simpan Unit Terjual
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-modal: Record DP */}
      {showDpModal && (
        <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border-t sm:border border-slate-200/90 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-3.5 animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/90 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100">
                  Terima DP / Booking Fee
                </h3>
              </div>
              <button
                onClick={() => setShowDpModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmDp} className="space-y-3.5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-0">
              <div>
                <label className="block mb-1 text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Nominal DP Masuk:
                </label>
                <CurrencyInput
                  value={dpInputAmount}
                  onChange={setDpInputAmount}
                  placeholder="Contoh: 10000000"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Masuk Ke Dompet:
                </label>
                <select
                  value={dpWalletId}
                  onChange={(e) => setDpWalletId(e.target.value)}
                  className="w-full px-3 py-2.5 text-base sm:text-xs rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowDpModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl min-h-[38px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition active:scale-95 min-h-[38px]"
                >
                  Terima DP & Set Booked
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
