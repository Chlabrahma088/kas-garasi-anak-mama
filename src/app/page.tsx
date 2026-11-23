'use client';

import React, { useState, Suspense } from 'react';
import { Navbar } from '@/components/Navbar';
import { DashboardView } from '@/components/DashboardView';
import { CarsListView } from '@/components/CarsListView';
import { CashBookView } from '@/components/CashBookView';
import { ReportsView } from '@/components/ReportsView';
import { CarDetailModal } from '@/components/CarDetailModal';
import { AddCarModal } from '@/components/AddCarModal';
import { QuickActionModal } from '@/components/QuickActionModal';
import { Car, Heart, ShieldCheck } from 'lucide-react';

function DashboardContent() {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'cars' | 'cash' | 'reports'>('dashboard');
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [isAddCarOpen, setIsAddCarOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenQuickAction={() => setIsQuickActionOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] md:pb-12">
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

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/60 py-6 mb-16 md:mb-0 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md overflow-hidden bg-black shrink-0 border border-slate-200 dark:border-zinc-800">
              <img
                src="/logo.jpg"
                alt="Garasi Anak Mama"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                Garasi Anak Mama
              </span>
              <span className="mx-1.5">•</span>
              <span className="italic">&ldquo;Ada doa mama di setiap mobil&rdquo;</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Unit-Level Accounting Ready</span>
            </span>
            <span>Versi 1.0 (Simulation Mode)</span>
          </div>
        </div>
      </footer>
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

