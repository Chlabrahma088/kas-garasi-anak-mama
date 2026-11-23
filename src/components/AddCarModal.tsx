'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { CurrencyInput } from './CurrencyInput';
import { CarUnit, TransmissionType, UnitStatus, UnitPartner } from '@/types';
import { X, Plus, Car, DollarSign } from 'lucide-react';

interface AddCarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddCarModal: React.FC<AddCarModalProps> = ({ isOpen, onClose }) => {
  const { wallets, addCar } = useApp();

  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number>(2024);
  const [licensePlate, setLicensePlate] = useState('');
  const [color, setColor] = useState('');
  const [transmission, setTransmission] = useState<TransmissionType>('AT');
  const [odometer, setOdometer] = useState<number>(0);
  const [purchaseDate, setPurchaseDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [walletIdPurchase, setWalletIdPurchase] = useState<string>(wallets[0]?.id || 'w1');
  const [targetSellingPrice, setTargetSellingPrice] = useState<number>(0);
  const [status, setStatus] = useState<UnitStatus>('workshop');
  const [notes, setNotes] = useState('');

  // Partner Modal Configuration
  const [partnerType, setPartnerType] = useState<'garasi_only' | 'partner_50' | 'custom'>('garasi_only');
  const [partnerName, setPartnerName] = useState('Partner Investor');
  const [partnerSharePct, setPartnerSharePct] = useState<number>(50);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand || !model || !licensePlate || purchasePrice <= 0) {
      alert('Harap lengkapi Merk, Model, Nopol, dan Harga Beli.');
      return;
    }

    let partners: UnitPartner[] = [];
    if (partnerType === 'garasi_only') {
      partners = [
        {
          id: `p-${Date.now()}-1`,
          unitId: '',
          partnerName: 'Kas Garasi',
          capitalAmount: purchasePrice,
          capitalPercentage: 100,
          profitSharePercentage: 100,
          profitAmount: 0,
          transferStatus: 'pending',
        },
      ];
    } else {
      const pShare = partnerType === 'partner_50' ? 50 : partnerSharePct;
      const gShare = 100 - pShare;
      partners = [
        {
          id: `p-${Date.now()}-1`,
          unitId: '',
          partnerName: 'Kas Garasi',
          capitalAmount: (purchasePrice * gShare) / 100,
          capitalPercentage: gShare,
          profitSharePercentage: gShare,
          profitAmount: 0,
          transferStatus: 'pending',
        },
        {
          id: `p-${Date.now()}-2`,
          unitId: '',
          partnerName: partnerName || 'Partner Investor',
          capitalAmount: (purchasePrice * pShare) / 100,
          capitalPercentage: pShare,
          profitSharePercentage: pShare,
          profitAmount: 0,
          transferStatus: 'pending',
        },
      ];
    }

    const newCarData: Omit<CarUnit, 'id' | 'reconditionExpenses'> = {
      brand,
      model,
      year: Number(year) || 2024,
      licensePlate: licensePlate.toUpperCase().trim(),
      color,
      transmission,
      odometer: Number(odometer) || 0,
      purchaseDate,
      purchasePrice,
      walletIdPurchase,
      status,
      targetSellingPrice: targetSellingPrice || purchasePrice * 1.15,
      dpAmount: 0,
      photoUrl:
        'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80',
      notes,
      partners,
    };

    addCar(newCarData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border-t sm:border border-slate-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-5 duration-200">
        
        {/* iOS Drag Handle on Mobile */}
        <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700 mx-auto my-2.5 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/60 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100">
                Tambah Unit Mobil Bekas
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Input mobil baru masuk ke showroom
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

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:pb-6">
          {/* Row 1: Brand, Model, Tahun */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block mb-1 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Merk / Pabrikan:
              </label>
              <input
                type="text"
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Contoh: Honda, Toyota..."
                className="w-full px-3 py-2.5 text-base sm:text-sm rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-1 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Model & Varian:
              </label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Contoh: Jazz 1.5 RS, Yaris TRD..."
                className="w-full px-3 py-2.5 text-base sm:text-sm rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-1 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Tahun Pembuatan:
              </label>
              <input
                type="number"
                required
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                min={1990}
                max={2030}
                className="w-full px-3 py-2.5 text-base sm:text-sm rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Row 2: Nopol, Warna, Transmisi, KM */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block mb-1 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Plat Nomor:
              </label>
              <input
                type="text"
                required
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                placeholder="B 1234 MAM"
                className="w-full px-3 py-2.5 text-base sm:text-sm rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 uppercase font-mono font-bold focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-1 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Warna:
              </label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Putih..."
                className="w-full px-3 py-2.5 text-base sm:text-sm rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-1 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Transmisi:
              </label>
              <select
                value={transmission}
                onChange={(e) => setTransmission(e.target.value as TransmissionType)}
                className="w-full px-3 py-2.5 text-base sm:text-sm rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none"
              >
                <option value="AT">Matic (AT)</option>
                <option value="MT">Manual (MT)</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Kilometer:
              </label>
              <input
                type="number"
                value={odometer || ''}
                onChange={(e) => setOdometer(Number(e.target.value))}
                placeholder="95000"
                className="w-full px-3 py-2.5 text-base sm:text-sm rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Section: Pembelian & Finansial */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 space-y-3">
            <span className="block text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
              Finansial Pembelian
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block mb-1 text-xs font-medium text-slate-700 dark:text-zinc-300">
                  Harga Beli Unit:
                </label>
                <CurrencyInput
                  value={purchasePrice}
                  onChange={setPurchasePrice}
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 text-xs font-medium text-slate-700 dark:text-zinc-300">
                  Potong Dari Kas:
                </label>
                <select
                  value={walletIdPurchase}
                  onChange={(e) => setWalletIdPurchase(e.target.value)}
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
                <label className="block mb-1 text-xs font-medium text-slate-700 dark:text-zinc-300">
                  Tanggal Pembelian:
                </label>
                <input
                  type="date"
                  required
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2.5 text-base sm:text-sm rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block mb-1 text-xs font-medium text-slate-700 dark:text-zinc-300">
                  Target Harga Jual:
                </label>
                <CurrencyInput
                  value={targetSellingPrice}
                  onChange={setTargetSellingPrice}
                  placeholder="Contoh: Rp 140.000.000"
                />
              </div>

              <div>
                <label className="block mb-1 text-xs font-medium text-slate-700 dark:text-zinc-300">
                  Status Masuk:
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as UnitStatus)}
                  className="w-full px-3 py-2.5 text-base sm:text-sm rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none"
                >
                  <option value="workshop">Bahan / Masuk Bengkel</option>
                  <option value="ready">Ready Jual / Showroom</option>
                  <option value="booked">Booked / Sudah Terima DP</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Partner Modal */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 space-y-3">
            <span className="block text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
              Sumber Modal & Partner Investor
            </span>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPartnerType('garasi_only')}
                className={`px-3 py-2 text-xs font-bold rounded-lg transition min-h-[44px] ${
                  partnerType === 'garasi_only'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300'
                }`}
              >
                Kas Garasi Penuh (100%)
              </button>
              <button
                type="button"
                onClick={() => setPartnerType('partner_50')}
                className={`px-3 py-2 text-xs font-bold rounded-lg transition min-h-[44px] ${
                  partnerType === 'partner_50'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300'
                }`}
              >
                Kongsi 50:50 Partner
              </button>
              <button
                type="button"
                onClick={() => setPartnerType('custom')}
                className={`px-3 py-2 text-xs font-bold rounded-lg transition min-h-[44px] ${
                  partnerType === 'custom'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300'
                }`}
              >
                Custom Rasio
              </button>
            </div>

            {partnerType !== 'garasi_only' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block mb-1 text-xs font-medium text-slate-700 dark:text-zinc-300">
                    Nama Partner:
                  </label>
                  <input
                    type="text"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    placeholder="Contoh: Om Denny / Mas Reza"
                    className="w-full px-3 py-2.5 text-base sm:text-sm rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
                {partnerType === 'custom' && (
                  <div>
                    <label className="block mb-1 text-xs font-medium text-slate-700 dark:text-zinc-300">
                      Porsi Modal Partner (%):
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={partnerSharePct}
                      onChange={(e) => setPartnerSharePct(Number(e.target.value))}
                      className="w-full px-3 py-2.5 text-base sm:text-sm rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none font-mono"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Catatan Unit */}
          <div>
            <label className="block mb-1 text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Catatan Unit (Kondisi mesin, PR, kelengkapan surat):
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: BPKB komplit, pajak hidup..."
              className="w-full px-3 py-2 text-base sm:text-sm rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
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
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition active:scale-95 min-h-[44px] flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Simpan Mobil ke Garasi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
