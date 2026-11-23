import { supabase } from './supabase';
import { CarUnit, Wallet, CashTransaction, ReconditionExpense, UnitPartner } from '@/types';

/**
 * Fetch all units and their associated reconditions and partners from Supabase
 */
export async function fetchCarsFromSupabase(): Promise<CarUnit[] | null> {
  try {
    const { data: units, error: unitsError } = await supabase
      .from('units')
      .select('*')
      .order('purchase_date', { ascending: false });

    if (unitsError || !units) {
      console.warn('Could not fetch units from Supabase:', unitsError?.message);
      return null;
    }

    const { data: expenses } = await supabase.from('recondition_expenses').select('*');
    const { data: partners } = await supabase.from('unit_partners').select('*');

    const mappedCars: CarUnit[] = units.map((u: any) => {
      const carExpenses: ReconditionExpense[] = (expenses || [])
        .filter((e: any) => e.unit_id === u.id)
        .map((e: any) => ({
          id: e.id,
          unitId: e.unit_id,
          walletId: e.wallet_id || 'w1',
          category: e.category,
          description: e.description,
          amount: Number(e.amount) || 0,
          receiptUrl: e.receipt_url || undefined,
          expenseDate: e.expense_date,
        }));

      const carPartners: UnitPartner[] = (partners || [])
        .filter((p: any) => p.unit_id === u.id)
        .map((p: any) => ({
          id: p.id,
          unitId: p.unit_id,
          partnerName: p.partner_name,
          capitalAmount: Number(p.capital_amount) || 0,
          capitalPercentage: Number(p.capital_percentage) || 50,
          profitSharePercentage: Number(p.profit_share_percentage) || 50,
          profitAmount: Number(p.profit_amount) || 0,
          transferStatus: p.transfer_status,
        }));

      return {
        id: u.id,
        brand: u.brand,
        model: u.model,
        year: u.year,
        licensePlate: u.license_plate,
        color: u.color,
        transmission: u.transmission,
        odometer: u.odometer,
        purchaseDate: u.purchase_date,
        purchasePrice: Number(u.purchase_price) || 0,
        walletIdPurchase: u.wallet_id_purchase || 'w1',
        status: u.status,
        targetSellingPrice: Number(u.target_selling_price) || 0,
        dpAmount: Number(u.dp_amount) || 0,
        dpDate: u.dp_date || undefined,
        walletIdDp: u.wallet_id_dp || undefined,
        finalSellingPrice: u.final_selling_price ? Number(u.final_selling_price) : undefined,
        sellingExpenses: u.selling_expenses ? Number(u.selling_expenses) : undefined,
        soldDate: u.sold_date || undefined,
        walletIdSale: u.wallet_id_sale || undefined,
        photoUrl: u.photo_url || 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1000&q=80',
        notes: u.notes || '',
        partners: carPartners.length > 0 ? carPartners : [
          {
            id: `p-${u.id}-default`,
            unitId: u.id,
            partnerName: 'Kas Garasi',
            capitalAmount: Number(u.purchase_price) || 0,
            capitalPercentage: 100,
            profitSharePercentage: 100,
            profitAmount: 0,
            transferStatus: 'pending',
          }
        ],
        reconditionExpenses: carExpenses,
      };
    });

    return mappedCars;
  } catch (err) {
    console.warn('Supabase fetch error:', err);
    return null;
  }
}

/**
 * Fetch wallets from Supabase
 */
export async function fetchWalletsFromSupabase(): Promise<Wallet[] | null> {
  try {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) return null;

    return data.map((w: any) => ({
      id: w.id,
      name: w.name,
      type: w.type,
      accountNumber: w.account_number || undefined,
      balance: Number(w.balance) || 0,
    }));
  } catch {
    return null;
  }
}

/**
 * Fetch cash transactions from Supabase
 */
export async function fetchTransactionsFromSupabase(): Promise<CashTransaction[] | null> {
  try {
    const { data, error } = await supabase
      .from('cash_transactions')
      .select('*')
      .order('transaction_date', { ascending: false });

    if (error || !data) return null;

    return data.map((t: any) => ({
      id: t.id,
      walletId: t.wallet_id,
      targetWalletId: t.target_wallet_id || undefined,
      transactionType: t.transaction_type,
      category: t.category,
      amount: Number(t.amount) || 0,
      description: t.description,
      transactionDate: t.transaction_date,
      unitId: t.unit_id || undefined,
      reconditionId: t.recondition_id || undefined,
    }));
  } catch {
    return null;
  }
}

/**
 * Sync Insert Car to Supabase
 */
export async function insertCarToSupabase(car: CarUnit, initialExpenses: ReconditionExpense[] = []) {
  try {
    await supabase.from('units').insert({
      id: car.id,
      brand: car.brand,
      model: car.model,
      year: car.year,
      license_plate: car.licensePlate,
      color: car.color,
      transmission: car.transmission,
      odometer: car.odometer,
      purchase_date: car.purchaseDate,
      purchase_price: car.purchasePrice,
      wallet_id_purchase: car.walletIdPurchase,
      status: car.status,
      target_selling_price: car.targetSellingPrice,
      dp_amount: car.dpAmount,
      photo_url: car.photoUrl,
      notes: car.notes,
    });

    if (car.partners && car.partners.length > 0) {
      await supabase.from('unit_partners').insert(
        car.partners.map((p) => ({
          id: p.id,
          unit_id: car.id,
          partner_name: p.partnerName,
          capital_amount: p.capitalAmount,
          capital_percentage: p.capitalPercentage,
          profit_share_percentage: p.profitSharePercentage,
          profit_amount: p.profitAmount,
          transfer_status: p.transferStatus,
        }))
      );
    }

    if (initialExpenses.length > 0) {
      await supabase.from('recondition_expenses').insert(
        initialExpenses.map((exp) => ({
          id: exp.id,
          unit_id: car.id,
          wallet_id: exp.walletId,
          category: exp.category,
          description: exp.description,
          amount: exp.amount,
          expense_date: exp.expenseDate,
        }))
      );
    }
  } catch (e) {
    console.warn('Failed to insert car to Supabase', e);
  }
}

/**
 * Sync Update Car to Supabase
 */
export async function updateCarInSupabase(id: string, updates: Partial<CarUnit>) {
  try {
    const payload: any = {};
    if (updates.status) payload.status = updates.status;
    if (updates.dpAmount !== undefined) payload.dp_amount = updates.dpAmount;
    if (updates.dpDate) payload.dp_date = updates.dpDate;
    if (updates.walletIdDp) payload.wallet_id_dp = updates.walletIdDp;
    if (updates.finalSellingPrice !== undefined) payload.final_selling_price = updates.finalSellingPrice;
    if (updates.sellingExpenses !== undefined) payload.selling_expenses = updates.sellingExpenses;
    if (updates.soldDate) payload.sold_date = updates.soldDate;
    if (updates.walletIdSale) payload.wallet_id_sale = updates.walletIdSale;
    if (updates.targetSellingPrice !== undefined) payload.target_selling_price = updates.targetSellingPrice;
    if (updates.notes !== undefined) payload.notes = updates.notes;

    if (Object.keys(payload).length > 0) {
      await supabase.from('units').update(payload).eq('id', id);
    }
  } catch (e) {
    console.warn('Failed to update car in Supabase', e);
  }
}

/**
 * Sync Delete Car
 */
export async function deleteCarFromSupabase(id: string) {
  try {
    await supabase.from('units').delete().eq('id', id);
  } catch (e) {
    console.warn('Failed to delete car from Supabase', e);
  }
}

/**
 * Sync Insert Recondition Expense
 */
export async function insertExpenseToSupabase(expense: ReconditionExpense) {
  try {
    await supabase.from('recondition_expenses').insert({
      id: expense.id,
      unit_id: expense.unitId,
      wallet_id: expense.walletId,
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      expense_date: expense.expenseDate,
      receipt_url: expense.receiptUrl,
    });
  } catch (e) {
    console.warn('Failed to insert expense to Supabase', e);
  }
}

/**
 * Sync Delete Expense
 */
export async function deleteExpenseFromSupabase(id: string) {
  try {
    await supabase.from('recondition_expenses').delete().eq('id', id);
  } catch (e) {
    console.warn('Failed to delete expense from Supabase', e);
  }
}

/**
 * Sync Cash Transaction
 */
export async function insertTransactionToSupabase(tx: CashTransaction) {
  try {
    await supabase.from('cash_transactions').insert({
      id: tx.id,
      wallet_id: tx.walletId,
      target_wallet_id: tx.targetWalletId,
      transaction_type: tx.transactionType,
      category: tx.category,
      amount: tx.amount,
      description: tx.description,
      transaction_date: tx.transactionDate,
      unit_id: tx.unitId,
      recondition_id: tx.reconditionId,
    });
  } catch (e) {
    console.warn('Failed to insert tx to Supabase', e);
  }
}

/**
 * Sync Update Wallet Balance
 */
export async function updateWalletBalanceInSupabase(walletId: string, balance: number) {
  try {
    await supabase.from('wallets').update({ balance }).eq('id', walletId);
  } catch (e) {
    console.warn('Failed to update wallet in Supabase', e);
  }
}

/**
 * Sync Partner Status
 */
export async function updatePartnerStatusInSupabase(partnerId: string, status: 'pending' | 'transferred', profitAmount?: number) {
  try {
    const payload: any = { transfer_status: status };
    if (profitAmount !== undefined) payload.profit_amount = profitAmount;
    await supabase.from('unit_partners').update(payload).eq('id', partnerId);
  } catch (e) {
    console.warn('Failed to update partner in Supabase', e);
  }
}
