'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { formatRupiah } from '@/lib/utils';
import {
  LayoutDashboard,
  Car,
  Wallet,
  FileSpreadsheet,
  Plus,
  Sun,
  Moon,
  X,
  CreditCard,
  TrendingUp,
} from 'lucide-react';

interface SidebarProps {
  currentTab: 'dashboard' | 'cars' | 'cash' | 'reports';
  setCurrentTab: (tab: 'dashboard' | 'cars' | 'cash' | 'reports') => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  onOpenAddCar: () => void;
  onOpenQuickAction: () => void;
}

const navItems = [
  { id: 'dashboard' as const, label: 'Dashboard', desc: 'Ringkasan performa', icon: LayoutDashboard },
  { id: 'cars' as const, label: 'Stok Mobil', desc: 'Katalog & HPP unit', icon: Car },
  { id: 'cash' as const, label: 'Buku Kas & Bank', desc: 'Arus kas & dompet', icon: Wallet },
  { id: 'reports' as const, label: 'Laporan', desc: 'Laba rugi & pembukuan', icon: FileSpreadsheet },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  isOpenMobile,
  setIsOpenMobile,
  onOpenAddCar,
  onOpenQuickAction,
}) => {
  const { wallets, isDark, toggleDarkMode, cars } = useApp();

  const totalCash = wallets.reduce((sum, w) => sum + w.balance, 0);
  const readyCars = cars.filter((c) => c.status === 'ready').length;
  const soldCars = cars.filter((c) => c.status === 'sold').length;

  const content = (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200">
      {/* Brand Header (Jalur Seduh style) */}
      <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-black shrink-0 border border-slate-200 dark:border-zinc-800 shadow-xs">
            <img
              src="/logo.jpg"
              alt="Garasi Anak Mama"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 dark:text-zinc-50 tracking-tight leading-tight">
              GARASI ANAK MAMA
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium leading-tight mt-0.5">
              Ada doa mama di setiap mobil
            </p>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setIsOpenMobile(false)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 md:hidden"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          Menu Utama
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setCurrentTab(item.id);
                setIsOpenMobile(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400 dark:text-emerald-600' : 'text-slate-400 dark:text-zinc-500'}`} />
                <div className="text-left">
                  <span className="block font-bold">{item.label}</span>
                  <span className={`text-[10px] block font-normal leading-tight ${isActive ? 'text-slate-300 dark:text-zinc-600' : 'text-slate-400 dark:text-zinc-500'}`}>
                    {item.desc}
                  </span>
                </div>
              </div>

              {/* Badges */}
              {item.id === 'cars' && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  isActive
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
                }`}>
                  {readyCars} Ready
                </span>
              )}
            </button>
          );
        })}

        {/* Quick Actions in Sidebar */}
        <div className="pt-4 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          Aksi Cepat
        </div>
        <div className="space-y-1.5 px-1">
          <button
            onClick={() => {
              onOpenAddCar();
              setIsOpenMobile(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tambah Mobil Masuk</span>
          </button>

          <button
            onClick={() => {
              onOpenQuickAction();
              setIsOpenMobile(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-750 transition"
          >
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Catat Kas / Rekon</span>
          </button>
        </div>
      </nav>

      {/* Footer Area: Saldo Kas Box & Theme Toggle */}
      <div className="p-4 border-t border-slate-100 dark:border-zinc-800 space-y-3">
        {/* Total Saldo Kas Card */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 mb-1">
            <span className="font-medium">Total Kas & Bank:</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-sm font-black font-mono text-slate-900 dark:text-zinc-100">
            {formatRupiah(totalCash)}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 pt-1 border-t border-slate-200/60 dark:border-zinc-700/40">
            <span>BCA Pribadi: {formatRupiah(wallets[0]?.balance || 0)}</span>
            <span>Kas Tunai: {formatRupiah(wallets[1]?.balance || 0)}</span>
          </div>
        </div>

        {/* Theme Mode Toggle Button */}
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
        >
          <span className="flex items-center gap-2">
            {isDark ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            <span>Mode {isDark ? 'Gelap' : 'Terang'}</span>
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold">
            {isDark ? 'Dark' : 'Light'}
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed Left) */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 z-30">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpenMobile(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
