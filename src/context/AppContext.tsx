'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  CarUnit,
  Wallet,
  CashTransaction,
  ReconditionExpense,
  UnitPartner,
} from '@/types';
import { INITIAL_CARS, INITIAL_WALLETS, INITIAL_TRANSACTIONS } from '@/lib/mockData';
import { calculateUnitFinancials } from '@/lib/utils';
import {
  fetchCarsFromSupabase,
  fetchWalletsFromSupabase,
  fetchTransactionsFromSupabase,
  insertCarToSupabase,
  updateCarInSupabase,
  deleteCarFromSupabase,
  insertExpenseToSupabase,
  deleteExpenseFromSupabase,
  insertTransactionToSupabase,
  updateWalletBalanceInSupabase,
  updatePartnerStatusInSupabase,
} from '@/lib/supabaseRepo';

interface AppContextType {
  cars: CarUnit[];
  wallets: Wallet[];
  transactions: CashTransaction[];
  isDark: boolean;
  toggleDarkMode: () => void;
  // Car actions
  addCar: (car: Omit<CarUnit, 'id' | 'reconditionExpenses'>, initialExpenses?: Omit<ReconditionExpense, 'id' | 'unitId'>[]) => void;
  updateCar: (id: string, updates: Partial<CarUnit>) => void;
  deleteCar: (id: string) => void;
  // Recondition actions
  addReconditionExpense: (
    unitId: string,
    expense: Omit<ReconditionExpense, 'id' | 'unitId'>
  ) => void;
  deleteReconditionExpense: (unitId: string, expenseId: string) => void;
  // Sell car
  markCarSold: (
    unitId: string,
    saleData: {
      finalSellingPrice: number;
      sellingExpenses: number;
      soldDate: string;
      walletIdSale: string;
      partners: UnitPartner[];
    }
  ) => void;
  // Partner payout status
  updatePartnerTransferStatus: (
    unitId: string,
    partnerId: string,
    status: 'pending' | 'transferred'
  ) => void;
  // Cash transaction actions
  addCashTransaction: (
    tx: Omit<CashTransaction, 'id'>
  ) => void;
  // Reset
  resetToMockData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CARS: 'gam_cars_v10',
  WALLETS: 'gam_wallets_v10',
  TRANSACTIONS: 'gam_txs_v10',
  THEME: 'gam_theme_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cars, setCars] = useState<CarUnit[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [isDark, setIsDark] = useState<boolean>(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize from LocalStorage and then sync with Supabase
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      if (storedTheme) {
        setIsDark(storedTheme === 'dark');
      } else {
        setIsDark(false); // default terang / light mode
      }

      const storedCars = localStorage.getItem(STORAGE_KEYS.CARS);
      const storedWallets = localStorage.getItem(STORAGE_KEYS.WALLETS);
      const storedTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);

      if (storedCars && storedWallets) {
        setCars(JSON.parse(storedCars));
        setWallets(JSON.parse(storedWallets));
        setTransactions(storedTx ? JSON.parse(storedTx) : INITIAL_TRANSACTIONS);
      } else {
        setCars(INITIAL_CARS);
        setWallets(INITIAL_WALLETS);
        setTransactions(INITIAL_TRANSACTIONS);
      }
    } catch (e) {
      console.error('Failed to load from localStorage', e);
      setCars(INITIAL_CARS);
      setWallets(INITIAL_WALLETS);
      setTransactions(INITIAL_TRANSACTIONS);
    } finally {
      setIsLoaded(true);
    }

    // Sync live from Supabase in the background
    async function syncFromSupabase() {
      try {
        const [cloudCars, cloudWallets, cloudTx] = await Promise.all([
          fetchCarsFromSupabase(),
          fetchWalletsFromSupabase(),
          fetchTransactionsFromSupabase(),
        ]);

        if (cloudCars && cloudCars.length > 0) {
          setCars(cloudCars);
          localStorage.setItem(STORAGE_KEYS.CARS, JSON.stringify(cloudCars));
        }

        if (cloudWallets && cloudWallets.length > 0) {
          setWallets(cloudWallets);
          localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(cloudWallets));
        }

        if (cloudTx && cloudTx.length > 0) {
          setTransactions(cloudTx);
          localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(cloudTx));
        }
      } catch (err) {
        console.warn('Background Supabase sync skipped:', err);
      }
    }

    syncFromSupabase();
  }, []);

  // Sync to theme class & localStorage
  useEffect(() => {
    if (!isLoaded) return;
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(STORAGE_KEYS.THEME, 'light');
    }
  }, [isDark, isLoaded]);

  // Sync state to LocalStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEYS.CARS, JSON.stringify(cars));
    } catch (e) {
      console.error('Error saving cars', e);
    }
  }, [cars, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
    } catch (e) {
      console.error('Error saving wallets', e);
    }
  }, [wallets, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error('Error saving transactions', e);
    }
  }, [transactions, isLoaded]);

  const toggleDarkMode = () => {
    setIsDark((prev) => !prev);
  };

  const resetToMockData = () => {
    if (confirm('Kembalikan semua data ke simulasi awal (4 unit mobil)? Data yang baru diinput akan terhapus.')) {
      setCars(INITIAL_CARS);
      setWallets(INITIAL_WALLETS);
      setTransactions(INITIAL_TRANSACTIONS);
      localStorage.removeItem(STORAGE_KEYS.CARS);
      localStorage.removeItem(STORAGE_KEYS.WALLETS);
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    }
  };

  // Add Car with auto purchase deduction + Supabase sync
  const addCar = (
    carData: Omit<CarUnit, 'id' | 'reconditionExpenses'>,
    initialExpenses: Omit<ReconditionExpense, 'id' | 'unitId'>[] = []
  ) => {
    const newCarId = `car-${Date.now()}`;
    const expensesWithId: ReconditionExpense[] = initialExpenses.map((exp, idx) => ({
      ...exp,
      id: `rec-${Date.now()}-${idx}`,
      unitId: newCarId,
    }));

    const newCar: CarUnit = {
      ...carData,
      id: newCarId,
      reconditionExpenses: expensesWithId,
    };

    setCars((prev) => [newCar, ...prev]);

    // Async sync to Supabase
    insertCarToSupabase(newCar, expensesWithId);

    // Potong kas untuk beli unit
    if (newCar.purchasePrice > 0 && newCar.walletIdPurchase) {
      const buyTx: CashTransaction = {
        id: `tx-${Date.now()}`,
        walletId: newCar.walletIdPurchase,
        unitId: newCarId,
        transactionType: 'outflow',
        category: 'buy_unit',
        amount: newCar.purchasePrice,
        description: `Beli unit ${newCar.brand} ${newCar.model} (${newCar.licensePlate})`,
        transactionDate: newCar.purchaseDate,
      };

      setTransactions((prev) => [buyTx, ...prev]);
      insertTransactionToSupabase(buyTx);

      const targetWallet = wallets.find((w) => w.id === newCar.walletIdPurchase);
      const newBal = (targetWallet?.balance || 0) - newCar.purchasePrice;
      updateWalletBalanceInSupabase(newCar.walletIdPurchase, newBal);

      setWallets((prev) =>
        prev.map((w) =>
          w.id === newCar.walletIdPurchase ? { ...w, balance: newBal } : w
        )
      );
    }

    // Catat transaksi kas untuk initial expenses jika ada
    expensesWithId.forEach((exp, idx) => {
      const recTx: CashTransaction = {
        id: `tx-rec-${Date.now()}-${idx}`,
        walletId: exp.walletId,
        unitId: newCarId,
        transactionType: 'outflow',
        category: 'recondition',
        amount: exp.amount,
        description: `Rekondisi [${exp.category}] ${newCar.licensePlate}: ${exp.description}`,
        transactionDate: exp.expenseDate,
      };
      setTransactions((prev) => [recTx, ...prev]);
      insertTransactionToSupabase(recTx);

      const targetWallet = wallets.find((w) => w.id === exp.walletId);
      const newBal = (targetWallet?.balance || 0) - exp.amount;
      updateWalletBalanceInSupabase(exp.walletId, newBal);

      setWallets((prev) =>
        prev.map((w) => (w.id === exp.walletId ? { ...w, balance: newBal } : w))
      );
    });
  };

  const updateCar = (id: string, updates: Partial<CarUnit>) => {
    setCars((prev) =>
      prev.map((car) => {
        if (car.id !== id) return car;
        const updated = { ...car, ...updates };

        // Jika status baru menjadi booked dan ada DP baru
        if (updates.dpAmount !== undefined && updates.dpAmount > car.dpAmount) {
          const addedDp = updates.dpAmount - car.dpAmount;
          const targetWallet = updates.walletIdDp || car.walletIdDp || 'w1';
          const dpTx: CashTransaction = {
            id: `tx-dp-${Date.now()}`,
            walletId: targetWallet,
            unitId: car.id,
            transactionType: 'inflow',
            category: 'dp_in',
            amount: addedDp,
            description: `DP Booking Fee masuk unit ${car.brand} ${car.model} (${car.licensePlate})`,
            transactionDate: updates.dpDate || new Date().toISOString().split('T')[0],
          };
          setTransactions((prevTx) => [dpTx, ...prevTx]);
          insertTransactionToSupabase(dpTx);

          const curWallet = wallets.find((w) => w.id === targetWallet);
          const newBal = (curWallet?.balance || 0) + addedDp;
          updateWalletBalanceInSupabase(targetWallet, newBal);

          setWallets((prevW) =>
            prevW.map((w) => (w.id === targetWallet ? { ...w, balance: newBal } : w))
          );
        }

        return updated;
      })
    );

    // Sync update to Supabase
    updateCarInSupabase(id, updates);
  };

  const deleteCar = (id: string) => {
    if (confirm('Yakin ingin menghapus unit mobil ini?')) {
      setCars((prev) => prev.filter((car) => car.id !== id));
      deleteCarFromSupabase(id);
    }
  };

  // Add Recondition Expense
  const addReconditionExpense = (
    unitId: string,
    expense: Omit<ReconditionExpense, 'id' | 'unitId'>
  ) => {
    const targetCar = cars.find((c) => c.id === unitId);
    if (!targetCar) return;

    const newExpense: ReconditionExpense = {
      ...expense,
      id: `rec-${Date.now()}`,
      unitId,
    };

    setCars((prev) =>
      prev.map((car) =>
        car.id === unitId
          ? {
              ...car,
              reconditionExpenses: [...car.reconditionExpenses, newExpense],
            }
          : car
      )
    );

    insertExpenseToSupabase(newExpense);

    // Potong kas
    const expTx: CashTransaction = {
      id: `tx-${Date.now()}`,
      walletId: expense.walletId,
      unitId,
      transactionType: 'outflow',
      category: 'recondition',
      amount: expense.amount,
      description: `Rekondisi ${targetCar.brand} ${targetCar.model} (${targetCar.licensePlate}): ${expense.description}`,
      transactionDate: expense.expenseDate,
      receiptUrl: expense.receiptUrl,
    };

    setTransactions((prev) => [expTx, ...prev]);
    insertTransactionToSupabase(expTx);

    const curWallet = wallets.find((w) => w.id === expense.walletId);
    const newBal = (curWallet?.balance || 0) - expense.amount;
    updateWalletBalanceInSupabase(expense.walletId, newBal);

    setWallets((prev) =>
      prev.map((w) => (w.id === expense.walletId ? { ...w, balance: newBal } : w))
    );
  };

  const deleteReconditionExpense = (unitId: string, expenseId: string) => {
    const targetCar = cars.find((c) => c.id === unitId);
    const targetExpense = targetCar?.reconditionExpenses.find((e) => e.id === expenseId);
    if (!targetExpense) return;

    if (!confirm(`Hapus pengeluaran "${targetExpense.description}"? Saldo kas akan dikembalikan.`)) {
      return;
    }

    setCars((prev) =>
      prev.map((car) =>
        car.id === unitId
          ? {
              ...car,
              reconditionExpenses: car.reconditionExpenses.filter((e) => e.id !== expenseId),
            }
          : car
      )
    );

    deleteExpenseFromSupabase(expenseId);

    // Kembalikan saldo dompet
    const curWallet = wallets.find((w) => w.id === targetExpense.walletId);
    const newBal = (curWallet?.balance || 0) + targetExpense.amount;
    updateWalletBalanceInSupabase(targetExpense.walletId, newBal);

    setWallets((prev) =>
      prev.map((w) =>
        w.id === targetExpense.walletId ? { ...w, balance: newBal } : w
      )
    );

    // Hapus transaksi kas terkait
    setTransactions((prev) => prev.filter((tx) => !(tx.unitId === unitId && tx.amount === targetExpense.amount)));
  };

  // Mark car sold
  const markCarSold = (
    unitId: string,
    saleData: {
      finalSellingPrice: number;
      sellingExpenses: number;
      soldDate: string;
      walletIdSale: string;
      partners: UnitPartner[];
    }
  ) => {
    const car = cars.find((c) => c.id === unitId);
    if (!car) return;

    // Hitung net profit
    const fin = calculateUnitFinancials({
      ...car,
      status: 'sold',
      finalSellingPrice: saleData.finalSellingPrice,
      sellingExpenses: saleData.sellingExpenses,
      soldDate: saleData.soldDate,
    });

    // Hitung profit per partner
    const updatedPartners = saleData.partners.map((p) => {
      const sharePct = Number(p.profitSharePercentage) || 0;
      const profitVal = Math.round((fin.netProfit * sharePct) / 100);
      const isKasGarasi = p.partnerName.includes('Kas Garasi');
      const transferStatus: 'pending' | 'transferred' = isKasGarasi ? 'transferred' : p.transferStatus;
      
      // Update partner in Supabase
      updatePartnerStatusInSupabase(p.id, transferStatus, profitVal);

      return {
        ...p,
        profitAmount: profitVal,
        transferStatus,
        transferDate: isKasGarasi ? saleData.soldDate : p.transferDate,
      };
    });

    const updatedCar: CarUnit = {
      ...car,
      status: 'sold',
      finalSellingPrice: saleData.finalSellingPrice,
      sellingExpenses: saleData.sellingExpenses,
      soldDate: saleData.soldDate,
      walletIdSale: saleData.walletIdSale,
      partners: updatedPartners,
    };

    setCars((prev) => prev.map((c) => (c.id === unitId ? updatedCar : c)));

    // Sync car updates to Supabase
    updateCarInSupabase(unitId, {
      status: 'sold',
      finalSellingPrice: saleData.finalSellingPrice,
      sellingExpenses: saleData.sellingExpenses,
      soldDate: saleData.soldDate,
      walletIdSale: saleData.walletIdSale,
    });

    // Kas masuk dari penjualan
    const netCashInflow = saleData.finalSellingPrice - (car.dpAmount || 0);

    const saleTx: CashTransaction = {
      id: `tx-sale-${Date.now()}`,
      walletId: saleData.walletIdSale,
      unitId,
      transactionType: 'inflow',
      category: 'car_sale',
      amount: netCashInflow,
      description: `Pelunasan jual unit ${car.brand} ${car.model} (${car.licensePlate})`,
      transactionDate: saleData.soldDate,
    };

    const newTransactions = [saleTx];
    insertTransactionToSupabase(saleTx);

    // Potong kas untuk biaya jual jika ada
    if (saleData.sellingExpenses > 0) {
      const expTx: CashTransaction = {
        id: `tx-sellexp-${Date.now()}`,
        walletId: saleData.walletIdSale,
        unitId,
        transactionType: 'outflow',
        category: 'selling_expense',
        amount: saleData.sellingExpenses,
        description: `Biaya jual / komisi makelar ${car.licensePlate}`,
        transactionDate: saleData.soldDate,
      };
      newTransactions.push(expTx);
      insertTransactionToSupabase(expTx);
    }

    setTransactions((prev) => [...newTransactions, ...prev]);

    // Update saldo dompet
    const deltaWallet = netCashInflow - (saleData.sellingExpenses || 0);
    const curWallet = wallets.find((w) => w.id === saleData.walletIdSale);
    const newBal = (curWallet?.balance || 0) + deltaWallet;
    updateWalletBalanceInSupabase(saleData.walletIdSale, newBal);

    setWallets((prev) =>
      prev.map((w) =>
        w.id === saleData.walletIdSale ? { ...w, balance: newBal } : w
      )
    );
  };

  // Update partner transfer status
  const updatePartnerTransferStatus = (
    unitId: string,
    partnerId: string,
    status: 'pending' | 'transferred'
  ) => {
    setCars((prev) =>
      prev.map((car) => {
        if (car.id !== unitId) return car;
        const updatedPartners = car.partners.map((p) => {
          if (p.id !== partnerId) return p;
          return {
            ...p,
            transferStatus: status,
            transferDate: status === 'transferred' ? new Date().toISOString().split('T')[0] : undefined,
          };
        });
        return { ...car, partners: updatedPartners };
      })
    );

    updatePartnerStatusInSupabase(partnerId, status);
  };

  // Add Cash Transaction (general, non-unit, deposit, prive, transfer)
  const addCashTransaction = (tx: Omit<CashTransaction, 'id'>) => {
    const newTx: CashTransaction = {
      ...tx,
      id: `tx-${Date.now()}`,
    };

    setTransactions((prev) => [newTx, ...prev]);
    insertTransactionToSupabase(newTx);

    // Update saldo dompet
    setWallets((prev) =>
      prev.map((w) => {
        if (tx.transactionType === 'transfer') {
          if (w.id === tx.walletId) {
            const newBal = w.balance - tx.amount;
            updateWalletBalanceInSupabase(w.id, newBal);
            return { ...w, balance: newBal };
          }
          if (w.id === tx.targetWalletId) {
            const newBal = w.balance + tx.amount;
            updateWalletBalanceInSupabase(w.id, newBal);
            return { ...w, balance: newBal };
          }
          return w;
        }
        if (w.id === tx.walletId) {
          const newBal = tx.transactionType === 'inflow' ? w.balance + tx.amount : w.balance - tx.amount;
          updateWalletBalanceInSupabase(w.id, newBal);
          return { ...w, balance: newBal };
        }
        return w;
      })
    );
  };

  return (
    <AppContext.Provider
      value={{
        cars,
        wallets,
        transactions,
        isDark,
        toggleDarkMode,
        addCar,
        updateCar,
        deleteCar,
        addReconditionExpense,
        deleteReconditionExpense,
        markCarSold,
        updatePartnerTransferStatus,
        addCashTransaction,
        resetToMockData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
