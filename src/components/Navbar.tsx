'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { formatRupiah } from '@/lib/utils';
import {
  Car,
  LayoutDashboard,
  Wallet as WalletIcon,
  FileSpreadsheet,
  Sun,
  Moon,
  Plus,
  RotateCcw,
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'dashboard' | 'cars' | 'cash' | 'reports';
  setCurrentTab: (tab: 'dashboard' | 'cars' | 'cash' | 'reports') => void;
  onOpenQuickAction: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenQuickAction,
}) => {
  const { wallets, isDark, toggleDarkMode, resetToMockData } = useApp();

  const totalCash = wallets.reduce((sum, w) => sum + w.balance, 0);

  return (
    <>
      {/* Top Header with iOS Dynamic Island & Safe Area support */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md pt-[env(safe-area-inset-top,0px)] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Tagline */}
            <div
              onClick={() => setCurrentTab('dashboard')}
              className="flex items-center gap-3 cursor-pointer select-none"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold shadow-xs">
                <Car className="w-5 h-5" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-zinc-50">
                    GARASI ANAK MAMA
                  </h1>
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                    Keuangan & Stok
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                  Ada doa mama di setiap mobil
                </p>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              <button
                onClick={() => setCurrentTab('dashboard')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition ${
                  currentTab === 'dashboard'
                    ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setCurrentTab('cars')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition ${
                  currentTab === 'cars'
                    ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Car className="w-4 h-4" />
                <span>Stok Mobil</span>
              </button>

              <button
                onClick={() => setCurrentTab('cash')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition ${
                  currentTab === 'cash'
                    ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                <WalletIcon className="w-4 h-4" />
                <span>Buku Kas</span>
              </button>

              <button
                onClick={() => setCurrentTab('reports')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition ${
                  currentTab === 'reports'
                    ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Laporan & Ekspor</span>
              </button>
            </nav>

            {/* Right Tools: Kas Ticker, Quick Action, Theme, Reset */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Wallet Summary Ticker */}
              <div
                onClick={() => setCurrentTab('cash')}
                className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 transition cursor-pointer"
                title="Buka Buku Kas"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <div className="text-right">
                  <span className="block text-[10px] text-slate-500 dark:text-zinc-400 font-semibold uppercase">
                    Kas Tersedia
                  </span>
                  <span className="text-xs font-bold font-mono text-slate-900 dark:text-zinc-100">
                    {formatRupiah(totalCash)}
                  </span>
                </div>
              </div>

              {/* Quick Action Button Desktop */}
              <button
                onClick={onOpenQuickAction}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Input Biaya (+)</span>
              </button>

              {/* Reset to Mock Button */}
              <button
                onClick={resetToMockData}
                title="Reset simulasi ke data awal"
                className="p-2 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Dark/Light Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                title={isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
                className="p-2 text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-700" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Floating Action Button (+) for Mobile iPhone Pro Max (Thumb-friendly & Safe Area) */}
      <div className="sm:hidden fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] right-4 z-40">
        <button
          onClick={onOpenQuickAction}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-600 text-white shadow-xl shadow-emerald-900/30 active:scale-90 active:bg-emerald-700 transition"
          aria-label="Input Transaksi Cepat"
        >
          <Plus className="w-7 h-7 stroke-[3]" />
        </button>
      </div>

      {/* Mobile Bottom Navigation Bar (Optimized for iPhone Home Indicator) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md px-3 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-lg">
        <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[11px] font-bold min-h-[44px] transition ${
              currentTab === 'dashboard'
                ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                : 'text-slate-500 dark:text-zinc-400'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setCurrentTab('cars')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[11px] font-bold min-h-[44px] transition ${
              currentTab === 'cars'
                ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                : 'text-slate-500 dark:text-zinc-400'
            }`}
          >
            <Car className="w-5 h-5 mb-0.5" />
            <span>Stok</span>
          </button>

          <button
            onClick={() => setCurrentTab('cash')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[11px] font-bold min-h-[44px] transition ${
              currentTab === 'cash'
                ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                : 'text-slate-500 dark:text-zinc-400'
            }`}
          >
            <WalletIcon className="w-5 h-5 mb-0.5" />
            <span>Buku Kas</span>
          </button>

          <button
            onClick={() => setCurrentTab('reports')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[11px] font-bold min-h-[44px] transition ${
              currentTab === 'reports'
                ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                : 'text-slate-500 dark:text-zinc-400'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5 mb-0.5" />
            <span>Laporan</span>
          </button>
        </div>
      </nav>
    </>
  );
};
