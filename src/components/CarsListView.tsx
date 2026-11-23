'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { CarUnit, UnitStatus } from '@/types';
import { formatRupiah, calculateUnitFinancials, formatDateIndo } from '@/lib/utils';
import { LicensePlate } from './LicensePlate';
import {
  Car,
  Search,
  Plus,
  SlidersHorizontal,
  ChevronRight,
  Clock,
  CheckCircle2,
  BookmarkCheck,
  Users,
  Calendar,
  Zap,
  ExternalLink,
} from 'lucide-react';

interface CarsListViewProps {
  onSelectUnit: (unitId: string) => void;
  onOpenAddCar: () => void;
}

export const CarsListView: React.FC<CarsListViewProps> = ({
  onSelectUnit,
  onOpenAddCar,
}) => {
  const { cars } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | UnitStatus>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'hpp_high' | 'price_low'>('newest');

  // Filter & Search Logic
  const filteredCars = useMemo(() => {
    return cars
      .filter((car) => {
        const matchesStatus = statusFilter === 'all' ? true : car.status === statusFilter;
        const query = search.toLowerCase().trim();
        const matchesSearch =
          !query ||
          car.brand.toLowerCase().includes(query) ||
          car.model.toLowerCase().includes(query) ||
          car.licensePlate.toLowerCase().includes(query) ||
          car.year.toString().includes(query);

        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
        }
        if (sortBy === 'hpp_high') {
          const finA = calculateUnitFinancials(a);
          const finB = calculateUnitFinancials(b);
          return finB.totalHpp - finA.totalHpp;
        }
        if (sortBy === 'price_low') {
          return a.purchasePrice - b.purchasePrice;
        }
        return 0;
      });
  }, [cars, statusFilter, search, sortBy]);

  // Counts
  const counts = {
    all: cars.length,
    workshop: cars.filter((c) => c.status === 'workshop').length,
    ready: cars.filter((c) => c.status === 'ready').length,
    booked: cars.filter((c) => c.status === 'booked').length,
    sold: cars.filter((c) => c.status === 'sold').length,
  };

  return (
    <div className="space-y-6 pb-20 md:pb-10">
      {/* Top Header - Simple, Terang & Jelas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              Katalog Showroom
            </span>
            <span className="text-xs text-slate-500">Stok Mobil Bekas</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">
            Manajemen Stok & Kalkulasi HPP
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-0.5">
            Daftar lengkap mobil, rincian biaya perbaikan bengkel, target harga jual, dan bagi hasil partner.
          </p>
        </div>

        <button
          onClick={onOpenAddCar}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Tambah Mobil Baru Masuk</span>
        </button>
      </div>

      {/* Controls: Search, Status Filter Tabs, Sort */}
      <div className="space-y-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nopol (B 1829 MAM), merk (Jazz, Lancer), atau model..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Urutkan:</span>
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'hpp_high' | 'price_low')}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="newest">Paling Baru Masuk</option>
              <option value="hpp_high">Total HPP Tertinggi</option>
              <option value="price_low">Harga Beli Termurah</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs - Simple Clean */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
            }`}
          >
            Semua ({counts.all})
          </button>

          <button
            onClick={() => setStatusFilter('workshop')}
            className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap flex items-center gap-1.5 transition ${
              statusFilter === 'workshop'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Bahan/Bengkel ({counts.workshop})</span>
          </button>

          <button
            onClick={() => setStatusFilter('ready')}
            className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap flex items-center gap-1.5 transition ${
              statusFilter === 'ready'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Ready Jual ({counts.ready})</span>
          </button>

          <button
            onClick={() => setStatusFilter('booked')}
            className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap flex items-center gap-1.5 transition ${
              statusFilter === 'booked'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60'
            }`}
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>Booked/DP ({counts.booked})</span>
          </button>

          <button
            onClick={() => setStatusFilter('sold')}
            className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap flex items-center gap-1.5 transition ${
              statusFilter === 'sold'
                ? 'bg-purple-600 text-white font-bold'
                : 'bg-purple-50 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Sold ({counts.sold})</span>
          </button>
        </div>
      </div>

      {/* Car Cards Grid */}
      {filteredCars.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
          <Car className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-600 mb-2" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-300">
            Tidak ada unit mobil yang sesuai filter
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Coba ubah kata kunci pencarian atau status mobil
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredCars.map((car) => {
            const fin = calculateUnitFinancials(car);
            const estProfit = car.targetSellingPrice - fin.totalHpp;
            return (
              <div
                key={car.id}
                onClick={() => onSelectUnit(car.id)}
                className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-500 hover:shadow-md cursor-pointer transition overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Photo Header */}
                  <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
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
                        className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-xs ${
                          car.status === 'ready'
                            ? 'bg-emerald-600 text-white'
                            : car.status === 'booked'
                            ? 'bg-blue-600 text-white'
                            : car.status === 'workshop'
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-purple-600 text-white'
                        }`}
                      >
                        {car.status === 'ready'
                          ? 'Ready Jual'
                          : car.status === 'booked'
                          ? 'Booked/DP'
                          : car.status === 'workshop'
                          ? 'Bahan/Bengkel'
                          : 'Sold'}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-zinc-50">
                        {car.brand} {car.model}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tahun {car.year} • {car.transmission} • {car.color} • {(car.odometer).toLocaleString()} KM
                      </p>
                    </div>

                    {/* Financial Metrics Strip - Sangat Jelas */}
                    <div className="grid grid-cols-3 gap-2 p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 text-xs font-mono">
                      <div>
                        <span className="block text-[10px] text-slate-500 font-sans font-medium">
                          1. Harga Beli
                        </span>
                        <span className="font-bold text-slate-800 dark:text-zinc-200 text-xs sm:text-sm">
                          {formatRupiah(car.purchasePrice)}
                        </span>
                      </div>

                      <div>
                        <span className="block text-[10px] text-slate-500 font-sans font-medium">
                          2. Total Rekon
                        </span>
                        <span className="font-bold text-amber-700 dark:text-amber-400 text-xs sm:text-sm">
                          {formatRupiah(fin.totalRecondition)}
                        </span>
                      </div>

                      <div>
                        <span className="block text-[10px] text-slate-500 font-sans font-bold text-emerald-700 dark:text-emerald-400">
                          Total HPP Modal
                        </span>
                        <span className="font-black text-slate-900 dark:text-zinc-100 text-xs sm:text-sm">
                          {formatRupiah(fin.totalHpp)}
                        </span>
                      </div>
                    </div>

                    {/* If Sold, show profit banner & Selling Speed */}
                    {car.status === 'sold' && (
                      <div className="space-y-2">
                        <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] text-purple-700 dark:text-purple-300 font-bold uppercase block">
                              Terjual {car.soldDate ? `• ${formatDateIndo(car.soldDate)}` : ''}
                            </span>
                            <span className="font-bold font-mono text-slate-900 dark:text-zinc-100 text-sm">
                              {formatRupiah(car.finalSellingPrice)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-purple-700 dark:text-purple-300 font-bold uppercase block">
                              Net Profit Garasi
                            </span>
                            <span className="font-black font-mono text-emerald-700 dark:text-emerald-400 text-sm">
                              +{formatRupiah(fin.netProfit)} ({fin.marginPct}%)
                            </span>
                          </div>
                        </div>

                        {/* Durasi Terjual sejak Posting IG */}
                        {car.postingDate && (
                          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60 text-xs">
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-300 text-[11px]">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>Posting: <b>{formatDateIndo(car.postingDate)}</b></span>
                            </div>
                            {fin.daysToSellFromPost !== undefined && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                                <Zap className="w-3 h-3 fill-amber-500 text-amber-500" />
                                <span>Laku dlm {fin.daysToSellFromPost} Hari</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* If Active, show Target & Potensi Cuan */}
                    {car.status !== 'sold' && car.status !== 'booked' && (
                      <div className="space-y-2">
                        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold uppercase block">
                              Target Jual
                            </span>
                            <span className="font-bold font-mono text-slate-900 dark:text-zinc-100 text-sm">
                              {formatRupiah(car.targetSellingPrice)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold uppercase block">
                              Potensi Cuan
                            </span>
                            <span className="font-black font-mono text-emerald-700 dark:text-emerald-400 text-sm">
                              +{formatRupiah(estProfit)}
                            </span>
                          </div>
                        </div>

                        {car.postingDate && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60 text-[11px] text-slate-600 dark:text-zinc-300">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>Diposting IG: <b>{formatDateIndo(car.postingDate)}</b></span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* If Booked, show DP info & Selling Speed */}
                    {car.status === 'booked' && (
                      <div className="space-y-2">
                        <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 flex items-center justify-between text-xs">
                          <span className="text-blue-700 dark:text-blue-300 font-semibold">
                            DP Booking Masuk:
                          </span>
                          <span className="font-black font-mono text-blue-700 dark:text-blue-300">
                            {formatRupiah(car.dpAmount)}
                          </span>
                        </div>

                        {car.postingDate && (
                          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60 text-xs">
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-300 text-[11px]">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>Posting: <b>{formatDateIndo(car.postingDate)}</b></span>
                              {car.soldDate && <span>• Laku: <b>{formatDateIndo(car.soldDate)}</b></span>}
                            </div>
                            {fin.daysToSellFromPost !== undefined && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                                <Zap className="w-3 h-3 fill-amber-500 text-amber-500" />
                                <span>Laku dlm {fin.daysToSellFromPost} Hari</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer of Card: Partner & Action */}
                <div className="px-5 py-3 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/40 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px] truncate max-w-[220px]">
                    <Users className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span className="truncate font-medium">
                      {car.partners.map((p) => p.partnerName).join(' + ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {car.instagramUrl && (
                      <a
                        href={car.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      >
                        <span>📸 Post IG</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-0.5 text-xs">
                      <span>Rincian</span>
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
