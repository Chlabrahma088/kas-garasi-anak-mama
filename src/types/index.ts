export type UnitStatus = 'workshop' | 'ready' | 'booked' | 'sold';

export type TransmissionType = 'AT' | 'MT';

export type ReconditionCategory =
  | 'mesin'
  | 'kaki_kaki'
  | 'body_cat'
  | 'salon_detailing'
  | 'pajak_surat'
  | 'towing_bensin'
  | 'mediator'
  | 'lainnya';

export const RECONDITION_CATEGORIES: { id: ReconditionCategory; label: string; icon: string }[] = [
  { id: 'mesin', label: 'Mesin & Servis', icon: 'Wrench' },
  { id: 'kaki_kaki', label: 'Kaki-kaki & Ban', icon: 'Disc' },
  { id: 'body_cat', label: 'Body & Cat', icon: 'Paintbrush' },
  { id: 'salon_detailing', label: 'Salon & Detailing', icon: 'Sparkles' },
  { id: 'pajak_surat', label: 'Pajak & Surat', icon: 'FileText' },
  { id: 'towing_bensin', label: 'Towing & Bensin', icon: 'Truck' },
  { id: 'mediator', label: 'Komisi Beli / Makelar', icon: 'Users' },
  { id: 'lainnya', label: 'Biaya Lainnya', icon: 'MoreHorizontal' },
];

export interface ReconditionExpense {
  id: string;
  unitId: string;
  walletId: string;
  category: ReconditionCategory;
  description: string;
  amount: number;
  receiptUrl?: string;
  expenseDate: string;
}

export type TransferStatus = 'pending' | 'transferred';

export interface UnitPartner {
  id: string;
  unitId: string;
  partnerName: string; // e.g. 'Kas Garasi', 'Partner A (Mas Reza)', 'Partner B (Om Denny)'
  capitalAmount: number;
  capitalPercentage: number; // e.g. 50
  profitSharePercentage: number; // e.g. 50
  profitAmount: number;
  transferStatus: TransferStatus;
  transferDate?: string;
}

export interface CarUnit {
  id: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  color: string;
  transmission: TransmissionType;
  odometer: number;
  purchaseDate: string;
  purchasePrice: number;
  walletIdPurchase: string;
  status: UnitStatus;
  targetSellingPrice: number;
  dpAmount: number;
  dpDate?: string;
  walletIdDp?: string;
  finalSellingPrice?: number;
  sellingExpenses?: number;
  soldDate?: string;
  walletIdSale?: string;
  photoUrl?: string;
  notes?: string;
  reconditionExpenses: ReconditionExpense[];
  partners: UnitPartner[];
}

export interface Wallet {
  id: string;
  name: string;
  type: 'bank' | 'cash';
  accountNumber?: string;
  balance: number;
}

export type TransactionType = 'inflow' | 'outflow' | 'transfer';

export type CashCategory =
  | 'buy_unit'
  | 'recondition'
  | 'dp_in'
  | 'car_sale'
  | 'selling_expense'
  | 'capital_deposit'
  | 'prive_withdrawal'
  | 'operational'
  | 'marketing'
  | 'transfer_between_wallets'
  | 'partner_profit_payout'
  | 'other';

export const CASH_CATEGORIES: { id: CashCategory; label: string; type: TransactionType }[] = [
  { id: 'buy_unit', label: 'Beli Unit Mobil', type: 'outflow' },
  { id: 'recondition', label: 'Biaya Rekondisi Unit', type: 'outflow' },
  { id: 'dp_in', label: 'DP / Booking Fee Masuk', type: 'inflow' },
  { id: 'car_sale', label: 'Pelunasan Penjualan Mobil', type: 'inflow' },
  { id: 'selling_expense', label: 'Biaya Jual / Komisi Makelar', type: 'outflow' },
  { id: 'capital_deposit', label: 'Setor Modal Investor/Owner', type: 'inflow' },
  { id: 'prive_withdrawal', label: 'Tarik Prive / Profit Owner', type: 'outflow' },
  { id: 'operational', label: 'Operasional Garasi (Sewa, Listrik, Air)', type: 'outflow' },
  { id: 'marketing', label: 'Marketing & Iklan Konten', type: 'outflow' },
  { id: 'transfer_between_wallets', label: 'Pindah Buku Antar Dompet', type: 'transfer' },
  { id: 'partner_profit_payout', label: 'Bayar Bagi Hasil Partner', type: 'outflow' },
  { id: 'other', label: 'Lain-lain', type: 'outflow' },
];

export interface CashTransaction {
  id: string;
  walletId: string;
  targetWalletId?: string; // used when transfer_between_wallets
  unitId?: string;
  transactionType: TransactionType;
  category: CashCategory;
  amount: number;
  description: string;
  transactionDate: string;
  receiptUrl?: string;
}

export interface UnitCalculations {
  totalRecondition: number;
  totalHpp: number;
  netProfit: number;
  marginPct: number;
  holdingDays: number;
}
