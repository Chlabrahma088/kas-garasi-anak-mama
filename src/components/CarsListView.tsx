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
  Share2,
  Camera,
  Check,
  ArrowUpRight,
  DollarSign,
  Layers,
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
  const [copiedCarId, setCopiedCarId] = useState<string | null>(null);

  const handleCopyWhatsApp = (car: CarUnit, e: React.MouseEvent) => {
    e.stopPropagation();
    const fin = calculateUnitFinancials(car);
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
      setCopiedCarId(car.id);
      setTimeout(() => setCopiedCarId(null), 2500);
    }
  };

  // Filter & Search logic
  const filteredCars = useMemo(() => {
    return cars
      .filter((car) => {
        // Status filter
        if (statusFilter !== 'all' && car.status !== statusFilter) {
          return false;
        }

        // Search filter
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchPlate = car.licensePlate.toLowerCase().includes(q);
          const matchBrand = car.brand.toLowerCase().includes(q);
          const matchModel = car.model.toLowerCase().includes(q);
          const matchColor = car.color.toLowerCase().includes(q);
          return matchPlate || matchBrand || matchModel || matchColor;
        }

        return true;
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

  // Status counts
  const counts = useMemo(() => {
    return {
      all: cars.length,
      workshop: cars.filter((c) => c.status === 'workshop').length,
      ready: cars.filter((c) => c.status === 'ready').length,
      booked: cars.filter((c) => c.status === 'booked').length,
      sold: cars.filter((c) => c.status === 'sold').length,
    };
  }, [cars]);

  return (
    <div className="space-y-6 pb-20 md:pb-10">
      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nopol (B 1840 ZKS), merk (City, Altis, Fortuner), atau warna..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition shadow-2xs placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold text-slate-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-2xs cursor-pointer"
            >
              <option value="newest">Urutkan: Terbaru Masuk</option>
              <option value="hpp_high">Urutkan: HPP Tertinggi</option>
              <option value="price_low">Urutkan: Harga Beli Termurah</option>
            </select>
            <SlidersHorizontal className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <button
            onClick={onOpenAddCar}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm hover:shadow transition active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Unit</span>
          </button>
        </div>
      </div>

      {/* Segmented Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all shadow-2xs ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 ring-2 ring-slate-900/10 dark:ring-white/10'
              : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50'
          }`}
        >
          Semua ({counts.all})
        </button>

        <button
          onClick={() => setStatusFilter('ready')}
          className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shadow-2xs ${
            statusFilter === 'ready'
              ? 'bg-emerald-600 text-white shadow-emerald-600/20'
              : 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 border border-slate-200 dark:border-zinc-800 hover:bg-emerald-50/50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Ready Jual ({counts.ready})</span>
        </button>

        <button
          onClick={() => setStatusFilter('workshop')}
          className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shadow-2xs ${
            statusFilter === 'workshop'
              ? 'bg-amber-500 text-slate-950 font-black shadow-amber-500/20'
              : 'bg-white dark:bg-zinc-900 text-amber-700 dark:text-amber-400 border border-slate-200 dark:border-zinc-800 hover:bg-amber-50/50'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span>Bahan/Bengkel ({counts.workshop})</span>
        </button>

        <button
          onClick={() => setStatusFilter('booked')}
          className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shadow-2xs ${
            statusFilter === 'booked'
              ? 'bg-blue-600 text-white shadow-blue-600/20'
              : 'bg-white dark:bg-zinc-900 text-blue-700 dark:text-blue-400 border border-slate-200 dark:border-zinc-800 hover:bg-blue-50/50'
          }`}
        >
          <BookmarkCheck className="w-3.5 h-3.5 text-blue-500" />
          <span>Booked/DP ({counts.booked})</span>
        </button>

        <button
          onClick={() => setStatusFilter('sold')}
          className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shadow-2xs ${
            statusFilter === 'sold'
              ? 'bg-purple-600 text-white shadow-purple-600/20'
              : 'bg-white dark:bg-zinc-900 text-purple-700 dark:text-purple-400 border border-slate-200 dark:border-zinc-800 hover:bg-purple-50/50'
          }`}
        >
          <Car className="w-3.5 h-3.5 text-purple-500" />
          <span>Sold ({counts.sold})</span>
        </button>
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
            const hasMultiplePhotos = car.galleryUrls && car.galleryUrls.length > 1;

            return (
              <div
                key={car.id}
                onClick={() => onSelectUnit(car.id)}
                className="group rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-500/60 dark:hover:border-emerald-500/50 shadow-xs hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Cinematic Photo Header with 16:10 Ratio */}
                  <div className="relative h-52 sm:h-56 w-full bg-slate-950 overflow-hidden select-none">
                    <img
                      src={car.photoUrl}
                      alt={car.model}
                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Gradient Overlay for Crisp Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/30 pointer-events-none" />

                    {/* Top Badges: License Plate & Unit Status */}
                    <div className="absolute top-3 left-3 z-10 drop-shadow-md">
                      <LicensePlate plate={car.licensePlate} size="sm" />
                    </div>

                    <div className="absolute top-3 right-3 z-10">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md backdrop-blur-md border ${
                          car.status === 'ready'
                            ? 'bg-emerald-600/90 text-white border-emerald-400/30'
                            : car.status === 'booked'
                            ? 'bg-blue-600/90 text-white border-blue-400/30'
                            : car.status === 'workshop'
                            ? 'bg-amber-400/95 text-slate-950 font-bold border-amber-300/40'
                            : 'bg-purple-600/90 text-white border-purple-400/30'
                        }`}
                      >
                        {car.status === 'ready'
                          ? 'Ready Jual'
                          : car.status === 'booked'
                          ? 'Booked / DP'
                          : car.status === 'workshop'
                          ? 'Bahan/Bengkel'
                          : 'Sold'}
                      </span>
                    </div>

                    {/* Bottom Badges: Photo Counter & Instagram Link Badge */}
                    <div className="absolute bottom-3 inset-x-3 z-10 flex items-center justify-between pointer-events-none">
                      {hasMultiplePhotos ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold border border-white/15 shadow-sm">
                          <Camera className="w-3 h-3 text-emerald-400" />
                          <span>{car.galleryUrls?.length} Foto Asli</span>
                        </div>
                      ) : <div />}

                      {car.instagramUrl && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-600/90 via-pink-600/90 to-amber-500/90 backdrop-blur-md text-white text-[10px] font-bold border border-white/20 shadow-sm">
                          <span>📸 IG Post</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5 space-y-4">
                    {/* Title & Key Specs */}
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-zinc-50 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {car.brand} {car.model}
                        </h3>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-bold">
                          {car.year}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5 flex-wrap">
                        <span>{car.transmission}</span>
                        <span>•</span>
                        <span>{car.color}</span>
                        <span>•</span>
                        <span className="font-mono font-semibold">{(car.odometer).toLocaleString('id-ID')} KM</span>
                      </p>
                    </div>

                    {/* Financial Metrics Strip - 3 Pos Utama */}
                    <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50/90 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800/80 text-xs font-mono">
                      <div>
                        <span className="block text-[10px] text-slate-500 dark:text-zinc-400 font-sans font-medium">
                          1. Harga Beli
                        </span>
                        <span className="font-bold text-slate-800 dark:text-zinc-200 text-xs sm:text-sm">
                          {formatRupiah(car.purchasePrice)}
                        </span>
                      </div>

                      <div>
                        <span className="block text-[10px] text-slate-500 dark:text-zinc-400 font-sans font-medium">
                          2. Rekondisi
                        </span>
                        <span className="font-bold text-amber-600 dark:text-amber-400 text-xs sm:text-sm">
                          {formatRupiah(fin.totalRecondition)}
                        </span>
                      </div>

                      <div>
                        <span className="block text-[10px] text-slate-500 dark:text-zinc-400 font-sans font-bold text-emerald-700 dark:text-emerald-400">
                          Total HPP Modal
                        </span>
                        <span className="font-black text-slate-900 dark:text-zinc-50 text-xs sm:text-sm">
                          {formatRupiah(fin.totalHpp)}
                        </span>
                      </div>
                    </div>

                    {/* Unit Status Highlight Card */}
                    {/* Status: Ready */}
                    {car.status !== 'sold' && car.status !== 'booked' && (
                      <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/80 dark:border-emerald-800/50 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold uppercase tracking-wider block">
                            Target Jual
                          </span>
                          <span className="font-black font-mono text-slate-900 dark:text-zinc-50 text-base sm:text-lg">
                            {formatRupiah(car.targetSellingPrice)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold uppercase tracking-wider block">
                            Potensi Cuan
                          </span>
                          <span className="font-black font-mono text-emerald-700 dark:text-emerald-400 text-sm sm:text-base">
                            +{formatRupiah(estProfit)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Status: Sold */}
                    {car.status === 'sold' && (
                      <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-50 to-fuchsia-50/50 dark:from-purple-950/30 dark:to-fuchsia-950/20 border border-purple-200/80 dark:border-purple-800/50 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-purple-800 dark:text-purple-300 font-bold uppercase tracking-wider block">
                            Terjual {car.soldDate ? `• ${formatDateIndo(car.soldDate)}` : ''}
                          </span>
                          <span className="font-black font-mono text-slate-900 dark:text-zinc-50 text-base sm:text-lg">
                            {formatRupiah(car.finalSellingPrice)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-purple-800 dark:text-purple-300 font-bold uppercase tracking-wider block">
                            Net Profit Garasi
                          </span>
                          <span className="font-black font-mono text-emerald-700 dark:text-emerald-400 text-sm sm:text-base">
                            +{formatRupiah(fin.netProfit)} ({fin.marginPct}%)
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Status: Booked */}
                    {car.status === 'booked' && (
                      <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50 to-sky-50/50 dark:from-blue-950/30 dark:to-sky-950/20 border border-blue-200/80 dark:border-blue-800/50 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-blue-800 dark:text-blue-300 font-bold uppercase tracking-wider block">
                            DP Masuk Diterima
                          </span>
                          <span className="font-black font-mono text-blue-700 dark:text-blue-300 text-base sm:text-lg">
                            {formatRupiah(car.dpAmount)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-blue-800 dark:text-blue-300 font-bold uppercase tracking-wider block">
                            Sisa Pelunasan
                          </span>
                          <span className="font-black font-mono text-slate-900 dark:text-zinc-100 text-sm sm:text-base">
                            {formatRupiah((car.targetSellingPrice || 0) - (car.dpAmount || 0))}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Posting Info / Selling Speed */}
                    {car.postingDate && (
                      <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800/50 text-[11px] text-slate-500 dark:text-zinc-400 border border-slate-100 dark:border-zinc-800">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Posting IG: <strong className="text-slate-700 dark:text-zinc-300">{formatDateIndo(car.postingDate)}</strong></span>
                        </div>
                        {fin.daysToSellFromPost !== undefined && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                            <Zap className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>Laku dlm {fin.daysToSellFromPost} Hari</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer: Partner Info & Quick Action Buttons */}
                <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 dark:border-zinc-800/80 mt-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate max-w-[130px] sm:max-w-[170px]">
                      {car.partners && car.partners.length > 0
                        ? car.partners.map((p) => p.partnerName).join(', ')
                        : 'Kas Garasi (100%)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleCopyWhatsApp(car, e)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-2xs active:scale-95 ${
                        copiedCarId === car.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 border border-emerald-200/80 dark:border-emerald-800/60'
                      }`}
                      title="Salin spek mobil siap kirim ke calon pembeli di WhatsApp"
                    >
                      {copiedCarId === car.id ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Salin WA</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => onSelectUnit(car.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 transition shadow-2xs group-hover:bg-emerald-600 group-hover:text-white"
                    >
                      <span>Rincian</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
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
