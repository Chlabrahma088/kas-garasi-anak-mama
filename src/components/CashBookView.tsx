'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { formatRupiah, formatDateIndo } from '@/lib/utils';
import { CurrencyInput } from './CurrencyInput';
import { CASH_CATEGORIES, CashCategory, TransactionType } from '@/types';
import {
  Wallet as WalletIcon,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Plus,
  Building,
  Coins,
  Filter,
} from 'lucide-react';

export const CashBookView: React.FC = () => {
  const { wallets, transactions, addCashTransaction } = useApp();

  // Modal / Form state for new cash mutation
  const [showAddTx, setShowAddTx] = useState(false);
  const [txType, setTxType] = useState<TransactionType>('outflow');
  const [txCategory, setTxCategory] = useState<CashCategory>('operational');
  const [txAmount, setTxAmount] = useState<number>(0);
  const [txSourceWalletId, setTxSourceWalletId] = useState<string>(wallets[0]?.id || 'w1');
  const [txTargetWalletId, setTxTargetWalletId] = useState<string>(wallets[1]?.id || 'w2');
  const [txDesc, setTxDesc] = useState('');
  const [txDate, setTxDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Filters
  const [walletFilter, setWalletFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  // Filtered transactions
  const filteredTx = useMemo(() => {
    return transactions.filter((tx) => {
      const matchWallet =
        walletFilter === 'all'
          ? true
          : tx.walletId === walletFilter || tx.targetWalletId === walletFilter;
      const matchType = typeFilter === 'all' ? true : tx.transactionType === typeFilter;
      const matchCategory =
        categoryFilter === 'all' ? true : tx.category === categoryFilter;

      return matchWallet && matchType && matchCategory;
    });
  }, [transactions, walletFilter, typeFilter, categoryFilter]);

  const handleAddTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (txAmount <= 0) {
      alert('Harap masukkan nominal transaksi.');
      return;
    }

    if (txType === 'transfer' && txSourceWalletId === txTargetWalletId) {
      alert('Dompet asal dan tujuan transfer tidak boleh sama.');
      return;
    }

    addCashTransaction({
      walletId: txSourceWalletId,
      targetWalletId: txType === 'transfer' ? txTargetWalletId : undefined,
      transactionType: txType,
      category: txType === 'transfer' ? 'transfer_between_wallets' : txCategory,
      amount: txAmount,
      description:
        txDesc ||
        (txType === 'transfer'
          ? 'Pindah dana antar rekening & kas tunai'
          : txType === 'inflow'
          ? 'Penerimaan kas masuk'
          : 'Pengeluaran operasional'),
      transactionDate: txDate,
    });

    setTxAmount(0);
    setTxDesc('');
    setShowAddTx(false);
  };

  return (
    <div className="space-y-4 pb-20 md:pb-10">
      {/* Wallets Cards - Executive Jalur Seduh / Linear styling */}
      <div className={`grid grid-cols-1 ${wallets.length > 1 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}>
        {/* Total Available Liquid Cash */}
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-black tracking-wider text-emerald-100">
                Total Saldo Kas Garasi
              </span>
              <div className="p-2 rounded-xl bg-white/15 text-white backdrop-blur-xs">
                <Coins className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black font-mono mt-3 tracking-tight">
              {formatRupiah(totalBalance)}
            </p>
          </div>
          <p className="text-xs text-emerald-100/90 mt-3 font-medium relative z-10">
            Dana likuid aktif siap belanja unit mobil & operasional
          </p>
        </div>

        {/* Wallets list */}
        {wallets.map((w) => (
          <div
            key={w.id}
            className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-slate-300 dark:hover:border-zinc-700 transition"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                    <Building className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
                    {w.name}
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200/80 dark:border-zinc-700">
                  {w.accountNumber || 'Mandiri'}
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-zinc-100 mt-3 tracking-tight">
                {formatRupiah(w.balance)}
              </p>
            </div>
            <span className="text-xs text-slate-500 dark:text-zinc-400 mt-3 font-medium">
              Rekening perputaran belanja unit, DP, pelunasan & nota bengkel
            </span>
          </div>
        ))}
      </div>

      {/* Add Mutation Collapsible Form */}
      {showAddTx && (
        <form
          onSubmit={handleAddTx}
          className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-700 shadow-xl space-y-4 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between border-b border-slate-200/90 dark:border-zinc-800 pb-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                <Plus className="w-4 h-4 stroke-[3]" />
              </div>
              <span>Input Mutasi Kas Non-Unit / Operasional Showroom</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowAddTx(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200"
            >
              Tutup
            </button>
          </div>

          {/* Type Selector Tabs */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setTxType('outflow')}
              className={`py-2.5 px-3 text-xs font-black rounded-xl border transition flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs ${
                txType === 'outflow'
                  ? 'bg-rose-50 border-rose-400 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800 shadow-xs'
                  : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Kas Keluar (-)</span>
            </button>

            <button
              type="button"
              onClick={() => setTxType('inflow')}
              className={`py-2.5 px-3 text-xs font-black rounded-xl border transition flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs ${
                txType === 'inflow'
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 shadow-xs'
                  : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Kas Masuk (+)</span>
            </button>

            <button
              type="button"
              onClick={() => setTxType('transfer')}
              className={`py-2.5 px-3 text-xs font-black rounded-xl border transition flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs ${
                txType === 'transfer'
                  ? 'bg-blue-50 border-blue-400 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800 shadow-xs'
                  : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Pindah Buku</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {txType !== 'transfer' ? (
              <div>
                <label className="block mb-1 text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Kategori Arus:
                </label>
                <select
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value as CashCategory)}
                  className="w-full px-3 py-2.5 text-base sm:text-xs rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none"
                >
                  {txType === 'outflow' ? (
                    <>
                      <option value="operational">Operasional (Listrik, Sewa, Wifi)</option>
                      <option value="marketing">Marketing & Konten</option>
                      <option value="prive_withdrawal">Tarik Prive / Profit Owner</option>
                      <option value="partner_profit_payout">Bayar Bagi Hasil Partner</option>
                      <option value="other">Pengeluaran Lainnya</option>
                    </>
                  ) : (
                    <>
                      <option value="capital_deposit">Setor Modal Tambahan</option>
                      <option value="other">Penerimaan Lainnya</option>
                    </>
                  )}
                </select>
              </div>
            ) : (
              <div>
                <label className="block mb-1 text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Dompet Tujuan:
                </label>
                <select
                  value={txTargetWalletId}
                  onChange={(e) => setTxTargetWalletId(e.target.value)}
                  className="w-full px-3 py-2.5 text-base sm:text-xs rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block mb-1 text-xs font-bold text-slate-700 dark:text-zinc-300">
                Nominal Transaksi:
              </label>
              <CurrencyInput
                value={txAmount}
                onChange={setTxAmount}
                placeholder="0"
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-xs font-bold text-slate-700 dark:text-zinc-300">
                {txType === 'transfer' ? 'Dari Dompet:' : 'Sumber Dompet:'}
              </label>
              <select
                value={txSourceWalletId}
                onChange={(e) => setTxSourceWalletId(e.target.value)}
                className="w-full px-3 py-2.5 text-base sm:text-xs rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none"
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
                Deskripsi / Keperluan:
              </label>
              <input
                type="text"
                required
                value={txDesc}
                onChange={(e) => setTxDesc(e.target.value)}
                placeholder="Contoh: Bayar sewa garasi bulan November..."
                className="w-full px-3 py-2.5 text-base sm:text-xs rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-1 text-xs font-bold text-slate-700 dark:text-zinc-300">
                Tanggal Transaksi:
              </label>
              <input
                type="date"
                required
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                className="w-full px-3 py-2.5 text-base sm:text-xs rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200/90 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setShowAddTx(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl min-h-[38px]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition active:scale-95 min-h-[38px]"
            >
              Simpan Mutasi
            </button>
          </div>
        </form>
      )}

      {/* Filter Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <span className="font-black text-slate-900 dark:text-zinc-100 block">Filter Riwayat Arus Kas</span>
            <span className="text-[11px] text-slate-500">Saring berdasarkan dompet atau jenis transaksi</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={walletFilter}
            onChange={(e) => setWalletFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200/90 dark:border-zinc-700 bg-slate-50/80 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 focus:outline-none font-medium text-xs"
          >
            <option value="all">Semua Dompet</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200/90 dark:border-zinc-700 bg-slate-50/80 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 focus:outline-none font-medium text-xs"
          >
            <option value="all">Semua Tipe Arus</option>
            <option value="inflow">Kas Masuk (+)</option>
            <option value="outflow">Kas Keluar (-)</option>
            <option value="transfer">Pindah Dompet</option>
          </select>

          <button
            onClick={() => setShowAddTx(!showAddTx)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs active:scale-95 text-xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>{showAddTx ? 'Tutup Form' : '+ Catat Mutasi'}</span>
          </button>
        </div>
      </div>

      {/* Transactions Table - Clean, High Contrast & Tactile */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-3xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200/90 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100">
              Riwayat Mutasi & Arus Kas Garasi
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">Menampilkan {filteredTx.length} rekaman transaksi</p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
            {filteredTx.length} Baris
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 font-bold border-b border-slate-200/90 dark:border-zinc-800">
              <tr>
                <th className="py-3.5 px-4">Tanggal</th>
                <th className="py-3.5 px-4">Dompet</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Keterangan Aktivitas</th>
                <th className="py-3.5 px-4 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
              {filteredTx.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500 font-medium">
                    Tidak ada transaksi kas yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredTx.map((tx) => {
                  const isInflow = tx.transactionType === 'inflow';
                  const isTransfer = tx.transactionType === 'transfer';
                  const walletObj = wallets.find((w) => w.id === tx.walletId);
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition"
                    >
                      <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap font-medium">
                        {formatDateIndo(tx.transactionDate)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-zinc-200 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-[11px] font-bold border border-slate-200/80 dark:border-zinc-700">
                          {walletObj?.name || 'Kas'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            isTransfer
                              ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                              : isInflow
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                              : 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                          }`}
                        >
                          {tx.category.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-900 dark:text-zinc-100 font-medium">
                        {tx.description}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap text-sm">
                        <span
                          className={
                            isTransfer
                              ? 'text-blue-700 dark:text-blue-400 font-bold'
                              : isInflow
                              ? 'text-emerald-700 dark:text-emerald-400 font-black'
                              : 'text-rose-700 dark:text-rose-400 font-black'
                          }
                        >
                          {isTransfer ? '⇄ ' : isInflow ? '+ ' : '- '}
                          {formatRupiah(tx.amount)}
                        </span>
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
