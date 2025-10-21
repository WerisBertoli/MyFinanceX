import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, FirestoreError, deleteDoc } from "firebase/firestore";
import { getFirebase } from "./firebase";
import type { Account, Transaction } from "@/types/finance";
import type { FixedExpense } from "@/types/finance";

// Chaves para LocalStorage (fallback quando Firebase não estiver configurado ou sem permissão)
const LS_KEYS = {
  accounts: "mf.accounts",
  transactions: "mf.transactions",
  fixedExpenses: "mf.fixedExpenses",
};

function readLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (e) {
    return fallback;
  }
}

function writeLS<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function isPermissionError(e: unknown) {
  return typeof e === "object" && e !== null && (e as FirestoreError).code === "permission-denied";
}

export async function listAccounts(userId?: string): Promise<Account[]> {
  const { db, isConfigured } = getFirebase();
  if (db && isConfigured) {
    try {
      const col = collection(db, "accounts");
      const qRef = userId ? query(col, where("userId", "==", userId), orderBy("createdAt", "desc")) : col;
      const snap = await getDocs(qRef as any);
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    } catch (e) {
      if (!isPermissionError(e)) throw e;
      console.warn("Firestore permission denied for listAccounts. Falling back to LocalStorage.");
    }
  }
  return readLS<Account[]>(LS_KEYS.accounts, []);
}

export async function createAccount(account: Omit<Account, "id"> & { userId?: string }): Promise<Account> {
  const { db, isConfigured } = getFirebase();
  if (db && isConfigured) {
    try {
      const col = collection(db, "accounts");
      const docRef = await addDoc(col, account as any);
      return { ...(account as any), id: docRef.id };
    } catch (e) {
      if (!isPermissionError(e)) throw e;
      console.warn("Firestore permission denied for createAccount. Falling back to LocalStorage.");
    }
  }
  const accounts = readLS<Account[]>(LS_KEYS.accounts, []);
  const id = crypto.randomUUID();
  const saved = { ...(account as any), id } as Account;
  accounts.unshift(saved);
  writeLS(LS_KEYS.accounts, accounts);
  return saved;
}

export async function listTransactions(userId?: string): Promise<Transaction[]> {
  const { db, isConfigured } = getFirebase();
  if (db && isConfigured) {
    try {
      const col = collection(db, "transactions");
      const qRef = userId ? query(col, where("userId", "==", userId), orderBy("date", "desc")) : col;
      const snap = await getDocs(qRef as any);
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    } catch (e) {
      if (!isPermissionError(e)) throw e;
      console.warn("Firestore permission denied for listTransactions. Falling back to LocalStorage.");
    }
  }
  return readLS<Transaction[]>(LS_KEYS.transactions, []);
}

export async function createTransaction(tx: Omit<Transaction, "id"> & { userId?: string }): Promise<Transaction> {
  const { db, isConfigured } = getFirebase();
  if (db && isConfigured) {
    try {
      const col = collection(db, "transactions");
      const docRef = await addDoc(col, tx as any);
      return { ...(tx as any), id: docRef.id };
    } catch (e) {
      if (!isPermissionError(e)) throw e;
      console.warn("Firestore permission denied for createTransaction. Falling back to LocalStorage.");
    }
  }
  const list = readLS<Transaction[]>(LS_KEYS.transactions, []);
  const id = crypto.randomUUID();
  const saved = { ...(tx as any), id } as Transaction;
  list.unshift(saved);
  writeLS(LS_KEYS.transactions, list);
  return saved;
}

export async function markTransactionPaid(id: string): Promise<void> {
  const { db, isConfigured } = getFirebase();
  if (db && isConfigured) {
    try {
      const ref = doc(db, "transactions", id);
      await updateDoc(ref, { status: "paid", paidAt: Date.now(), date: Date.now(), updatedAt: Date.now() } as any);
      return;
    } catch (e) {
      if (!isPermissionError(e)) throw e;
      console.warn("Firestore permission denied for markTransactionPaid. Falling back to LocalStorage.");
    }
  }
  const list = readLS<Transaction[]>(LS_KEYS.transactions, []);
  const idx = list.findIndex((t) => t.id === id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], status: "paid", paidAt: Date.now(), date: Date.now(), updatedAt: Date.now() } as Transaction;
    writeLS(LS_KEYS.transactions, list);
  }
}

export async function markTransactionUnpaid(id: string): Promise<void> {
  const { db, isConfigured } = getFirebase();
  if (db && isConfigured) {
    try {
      const ref = doc(db, "transactions", id);
      await updateDoc(ref, { status: "scheduled", paidAt: null } as any);
      return;
    } catch (e) {
      if (!isPermissionError(e)) throw e;
      console.warn("Firestore permission denied for markTransactionUnpaid. Falling back to LocalStorage.");
    }
  }
  const list = readLS<Transaction[]>(LS_KEYS.transactions, []);
  const idx = list.findIndex((t) => t.id === id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], status: "scheduled", paidAt: undefined } as Transaction;
    writeLS(LS_KEYS.transactions, list);
  }
}

// ---- Fixed Expenses (templates) ----
export async function listFixedExpenses(userId?: string): Promise<FixedExpense[]> {
  const { db, isConfigured } = getFirebase();
  if (db && isConfigured) {
    try {
      const col = collection(db, "fixedExpenses");
      const qRef = userId ? query(col, where("userId", "==", userId), orderBy("createdAt", "desc")) : col;
      const snap = await getDocs(qRef as any);
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    } catch (e) {
      if (!isPermissionError(e)) throw e;
      console.warn("Firestore permission denied for listFixedExpenses. Falling back to LocalStorage.");
    }
  }
  return readLS<FixedExpense[]>(LS_KEYS.fixedExpenses, []);
}

export async function createFixedExpense(item: Omit<FixedExpense, "id"> & { userId?: string }): Promise<FixedExpense> {
  const { db, isConfigured } = getFirebase();
  if (db && isConfigured) {
    try {
      const col = collection(db, "fixedExpenses");
      const docRef = await addDoc(col, item as any);
      return { ...(item as any), id: docRef.id };
    } catch (e) {
      if (!isPermissionError(e)) throw e;
      console.warn("Firestore permission denied for createFixedExpense. Falling back to LocalStorage.");
    }
  }
  const list = readLS<FixedExpense[]>(LS_KEYS.fixedExpenses, []);
  const id = crypto.randomUUID();
  const saved = { ...(item as any), id } as FixedExpense;
  list.unshift(saved);
  writeLS(LS_KEYS.fixedExpenses, list);
  return saved;
}

export async function deleteFixedExpense(id: string): Promise<void> {
  const { db, isConfigured } = getFirebase();
  if (db && isConfigured) {
    try {
      const ref = doc(db, "fixedExpenses", id);
      await deleteDoc(ref);
      return;
    } catch (e) {
      if (!isPermissionError(e)) throw e;
      console.warn("Firestore permission denied for deleteFixedExpense. Falling back to LocalStorage.");
    }
  }
  const list = readLS<FixedExpense[]>(LS_KEYS.fixedExpenses, []);
  const next = list.filter((it) => it.id === id ? false : true);
  writeLS(LS_KEYS.fixedExpenses, next);
}