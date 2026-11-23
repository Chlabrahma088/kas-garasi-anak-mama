'use client';

import React, { useState, Suspense } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { DashboardView } from '@/components/DashboardView';
import { CarsListView } from '@/components/CarsListView';
import { CashBookView } from '@/components/CashBookView';
import { ReportsView } from '@/components/ReportsView';
import { CarDetailModal } from '@/components/CarDetailModal';
import { AddCarModal } from '@/components/AddCarModal';
import { QuickActionModal } from '@/components/QuickActionModal';
import { useApp } from '@/context/AppContext';
import { formatRupiah } from '@/lib/utils';
import {
  Menu,
  Plus,
  CreditCard,
  LayoutDashboard,
  Car,
  Wallet,
  FileSpreadsheet,
  ShieldCheck,
} from 'lucide-react';

function DashboardContent() {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'cars' | 'cash' | 'reports'>('dashboard');
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [isAddCarOpen, setIsAddCarOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { wallets } = useApp();
  const totalCash = wallets.reduce((sum, w) => sum + w.balance, 0);

  const tabTitles = {
    dashboard: {
      title: 'Dashboard Keuangan',
      desc: 'Ringkasan modal tertanam, kas garasi, & realisasi laba',
    },
    cars: {
      title: 'Katalog & Stok Mobil',
      desc: 'Daftar unit showroom, biaya rekondisi, & kalkulasi HPP',
    },
    cash: {
      title: 'Buku Kas & Rekening Bank',
      desc: 'Arus uang masuk, keluar, dan mutasi saldo dompet',
    },
    reports: {
      title: 'Laporan Laba & Pembukuan',
      desc: 'Analisis laba bersih, holding period, & cetak laporan',
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col">
      {/* Jalur Seduh Style Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isOpenMobile={isMobileMenuOpen}
        setIsOpenMobile={setIsMobileMenuOpen}
        onOpenAddCar={() => setIsAddCarOpen(true)}
        onOpenQuickAction={() => setIsQuickActionOpen(true)}
      />

      {/* Main Content Wrapper (Shifted by Sidebar on Desktop) */}
      <div className="md:pl-64 flex flex-col flex-1 min-w-0 transition-all duration-200">
        {/* Sticky Top Header Bar (Clean Jalur Seduh Header) */}
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
            {/* Left: Mobile Menu Trigger + Page Title */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 shadow-xs active:scale-95 transition"
                aria-label="Buka Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="truncate">
                <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-zinc-50 tracking-tight truncate">
                  {tabTitles[currentTab].title}
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 font-medium truncate hidden sm:block">
                  {tabTitles[currentTab].desc}
                </p>
              </div>
            </div>

            {/* Right: Quick Action Buttons & Kas Ticker */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Kas Chip (Mobile/Desktop friendly) */}
              <div
                onClick={() => setCurrentTab('cash')}
                className="cursor-pointer hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-zinc-700/80 bg-slate-50 dark:bg-zinc-800/60 hover:bg-slate-100 transition"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-slate-500 font-medium">Kas Showroom:</span>
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-zinc-100">
                  {formatRupiah(totalCash)}
                </span>
              </div>

              <button
                onClick={() => setIsQuickActionOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 shadow-xs transition active:scale-95"
              >
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Catat Kas</span>
              </button>

              <button
                onClick={() => setIsAddCarOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Mobil Baru</span>
              </button>
            </div>
          </div>
        </header>

        {/* View Content Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 pb-24 md:pb-10">
          {currentTab === 'dashboard' && (
            <DashboardView
              onSelectUnit={(id) => setSelectedUnitId(id)}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onOpenQuickAction={() => setIsQuickActionOpen(true)}
              onOpenAddCar={() => setIsAddCarOpen(true)}
            />
          )}

          {currentTab === 'cars' && (
            <CarsListView
              onSelectUnit={(id) => setSelectedUnitId(id)}
              onOpenAddCar={() => setIsAddCarOpen(true)}
            />
          )}

          {currentTab === 'cash' && <CashBookView />}

          {currentTab === 'reports' && <ReportsView />}
        </main>

        {/* Simplified Footer */}
        <footer className="border-t border-slate-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 py-5 mt-auto hidden md:block print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 dark:text-zinc-200">Garasi Anak Mama</span>
              <span>•</span>
              <span className="italic">&ldquo;Ada doa mama di setiap mobil&rdquo;</span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Sistem Akuntansi Mobil Bekas</span>
              </span>
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile Bottom Navigation Bar (Jalur Seduh / POS Thumb Navigation) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-slate-200 dark:border-zinc-800 px-2 py-1.5 flex items-center justify-around shadow-lg print:hidden">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            currentTab === 'dashboard'
              ? 'text-emerald-700 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-zinc-400 font-medium'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Ringkasan</span>
        </button>

        <button
          onClick={() => setCurrentTab('cars')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            currentTab === 'cars'
              ? 'text-emerald-700 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-zinc-400 font-medium'
          }`}
        >
          <Car className="w-5 h-5" />
          <span className="text-[10px]">Stok Mobil</span>
        </button>

        <button
          onClick={() => setCurrentTab('cash')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            currentTab === 'cash'
              ? 'text-emerald-700 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-zinc-400 font-medium'
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[10px]">Buku Kas</span>
        </button>

        <button
          onClick={() => setCurrentTab('reports')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            currentTab === 'reports'
              ? 'text-emerald-700 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-zinc-400 font-medium'
          }`}
        >
          <FileSpreadsheet className="w-5 h-5" />
          <span className="text-[10px]">Laporan</span>
        </button>
      </nav>

      {/* Modals */}
      <CarDetailModal
        unitId={selectedUnitId}
        onClose={() => setSelectedUnitId(null)}
      />

      <AddCarModal
        isOpen={isAddCarOpen}
        onClose={() => setIsAddCarOpen(false)}
      />

      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        onOpenAddCar={() => setIsAddCarOpen(true)}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800">Memuat Garasi Anak Mama...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

