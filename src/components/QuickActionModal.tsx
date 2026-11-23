'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { CurrencyInput } from './CurrencyInput';
import { RECONDITION_CATEGORIES, ReconditionCategory, CashCategory } from '@/types';
import { X, Wrench, Building2, ArrowDownLeft, Plus, Car } from 'lucide-react';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultUnitId?: string;
  onOpenAddCar?: () => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen,
  onClose,
  defaultUnitId,
  onOpenAddCar,
}) => {
  const { cars, wallets, addReconditionExpense, addCashTransaction } = useApp();

  const [mode, setMode] = useState<'recondition' | 'operational' | 'income'>('recondition');
  const [selectedUnitId, setSelectedUnitId] = useState<string>(defaultUnitId || (cars[0]?.id || ''));
  const [reconditionCategory, setReconditionCategory] = useState<ReconditionCategory>('mesin');
  const [selectedWalletId, setSelectedWalletId] = useState<string>(wallets[0]?.id || 'w1');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [operationalCategory, setOperationalCategory] = useState<CashCategory>('operational');

  if (!isOpen) return null;

  const activeCars = cars.filter((c) => c.status !== 'sold');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Harap masukkan nominal lebih dari 0.');
      return;
    }

    if (mode === 'recondition') {
      if (!selectedUnitId) {
        alert('Silakan pilih unit mobil terlebih dahulu.');
        return;
      }
      addReconditionExpense(selectedUnitId, {
        walletId: selectedWalletId,
        category: reconditionCategory,
        description: description || 'Biaya rekondisi',
        amount,
        expenseDate: date,
      });
    } else if (mode === 'operational') {
      addCashTransaction({
        walletId: selectedWalletId,
        transactionType: 'outflow',
        category: operationalCategory,
        amount,
        description: description || 'Pengeluaran operasional garasi',
        transactionDate: date,
      });
    } else if (mode === 'income') {
      addCashTransaction({
        walletId: selectedWalletId,
        transactionType: 'inflow',
        category: 'capital_deposit',
        amount,
        description: description || 'Setor modal / kas masuk',
        transactionDate: date,
      });
    }

    setAmount(0);
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border-t sm:border border-slate-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-5 duration-200">
        
        {/* iOS Drag Handle on Mobile */}
        <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700 mx-auto my-2.5 sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Plus className="w-5 h-5 stroke-[3]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100">
                Input Transaksi Cepat
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Catat biaya lapangan atau mutasi kas seketika
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-3 p-1.5 mx-4 mt-3 mb-2 bg-slate-100 dark:bg-zinc-800/60 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setMode('recondition')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 text-xs font-bold rounded-lg transition min-h-[44px] ${
              mode === 'recondition'
                ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Biaya Unit</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('operational')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 text-xs font-bold rounded-lg transition min-h-[44px] ${
              mode === 'operational'
                ? 'bg-white dark:bg-zinc-700 text-rose-700 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Operasional</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('income')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 text-xs font-bold rounded-lg transition min-h-[44px] ${
              mode === 'income'
                ? 'bg-white dark:bg-zinc-700 text-blue-700 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Kas Masuk</span>
          </button>
        </div>

        {/* Quick link to Add Car Modal if user wants to purchase a new unit */}
        {onOpenAddCar && (
          <div className="mx-4 mb-3 p-2.5 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <span className="font-semibold text-slate-800 dark:text-zinc-200 text-[11px] sm:text-xs">
                Mau beli / tambah unit mobil baru?
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAddCar();
              }}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition shrink-0"
            >
              + Buka Form Mobil
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-5 sm:px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:pb-6 space-y-3.5 overflow-y-auto">
          {/* Unit Selector if Recondition */}
          {mode === 'recondition' && (
            <div>
              <label className="block mb-1 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Pilih Unit Mobil:
              </label>
              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="w-full px-3 py-2.5 text-base sm:text-sm rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none"
                required
              >
                {activeCars.length === 0 ? (
                  <option value="">(Tidak ada unit aktif)</option>
                ) : (
                  activeCars.map((car) => (
                    <option key={car.id} value={car.id}>
                      {car.brand} {car.model} ({car.licensePlate})
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          {/* Category */}
          {mode === 'recondition' && (
            <div>
              <label className="block mb-1 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Kategori Pekerjaan / Rekondisi:
              </label>
              <select
                value={reconditionCategory}
                onChange={(e) => setReconditionCategory(e.target.value as ReconditionCategory)}
                className="w-full px-3 py-2.5 text-base sm:text-sm rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none"
              >
                {RECONDITION_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {mode === 'operational' && (
            <div>
              <label className="block mb-1 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Kategori Operasional:
              </label>
              <select
                value={operationalCategory}
                onChange={(e) => setOperationalCategory(e.target.value as CashCategory)}
                className="w-full px-3 py-2.5 text-base sm:text-sm rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none"
              >
                <option value="operational">Operasional Showroom (Listrik/Sewa/Air)</option>
                <option value="marketing">Marketing, Ads & Konten Medsos</option>
                <option value="prive_withdrawal">Tarik Prive / Profit Owner</option>
                <option value="other">Biaya Lainnya</option>
              </select>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block mb-1 text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Nominal (Rupiah):
            </label>
            <CurrencyInput
              value={amount}
              onChange={setAmount}
              placeholder="0"
              required
            />
          </div>

          {/* Wallet Selector & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Sumber Kas:
              </label>
              <select
                value={selectedWalletId}
                onChange={(e) => setSelectedWalletId(e.target.value)}
                className="w-full px-3 py-2.5 text-base sm:text-sm rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Tanggal:
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 text-base sm:text-sm rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block mb-1 text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Keterangan / Rincian Nota:
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Ganti oli matic + tune up..."
              className="w-full px-3 py-2 text-base sm:text-sm rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition min-h-[44px]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition active:scale-95 min-h-[44px]"
            >
              Simpan Transaksi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
