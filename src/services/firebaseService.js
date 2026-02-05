import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore'
import { db } from '../firebase'

const COLLECTION_NAMES = {
  INCOMES: 'incomes',
  EXPENSES: 'expenses',
  SAVINGS: 'savings',
  CATEGORIES: 'categories',
  WALLETS: 'wallets'
}

// Income operations
export const incomeService = {
  // Get all incomes for a user
  subscribeToIncomes: (userId, callback) => {
    const q = query(
      collection(db, COLLECTION_NAMES.INCOMES),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    )

    return onSnapshot(q, (querySnapshot) => {
      const incomes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      callback(incomes)
    })
  },

  // Add new income
  addIncome: async (income, userId) => {
    const docRef = await addDoc(collection(db, COLLECTION_NAMES.INCOMES), {
      ...income,
      userId,
      createdAt: new Date()
    })
    return docRef.id
  },

  // Update income
  updateIncome: async (incomeId, updates) => {
    const docRef = doc(db, COLLECTION_NAMES.INCOMES, incomeId)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date()
    })
  },

  // Delete income
  deleteIncome: async (incomeId) => {
    await deleteDoc(doc(db, COLLECTION_NAMES.INCOMES, incomeId))
  }
}

// Expense operations
export const expenseService = {
  // Get all expenses for a user
  subscribeToExpenses: (userId, callback) => {
    const q = query(
      collection(db, COLLECTION_NAMES.EXPENSES),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    )

    return onSnapshot(q, (querySnapshot) => {
      const expenses = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      callback(expenses)
    })
  },

  // Add new expense
  addExpense: async (expense, userId) => {
    const docRef = await addDoc(collection(db, COLLECTION_NAMES.EXPENSES), {
      ...expense,
      userId,
      createdAt: new Date()
    })
    return docRef.id
  },

  // Update expense
  updateExpense: async (expenseId, updates) => {
    const docRef = doc(db, COLLECTION_NAMES.EXPENSES, expenseId)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date()
    })
  },

  // Delete expense
  deleteExpense: async (expenseId) => {
    await deleteDoc(doc(db, COLLECTION_NAMES.EXPENSES, expenseId))
  }
}

// Savings operations
export const savingsService = {
  // Get all savings for a user
  subscribeToSavings: (userId, callback) => {
    const q = query(
      collection(db, COLLECTION_NAMES.SAVINGS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )

    return onSnapshot(q, (querySnapshot) => {
      const savings = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      callback(savings)
    })
  },

  // Add new savings goal
  addSavings: async (savings, userId) => {
    const docRef = await addDoc(collection(db, COLLECTION_NAMES.SAVINGS), {
      ...savings,
      userId,
      createdAt: new Date()
    })
    return docRef.id
  },

  // Update savings goal
  updateSavings: async (savingsId, updates) => {
    const docRef = doc(db, COLLECTION_NAMES.SAVINGS, savingsId)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date()
    })
  },

  // Delete savings goal
  deleteSavings: async (savingsId) => {
    await deleteDoc(doc(db, COLLECTION_NAMES.SAVINGS, savingsId))
  }
}

// Category operations
export const categoryService = {
  // Get all categories for a user
  subscribeToCategories: (userId, callback) => {
    const q = query(
      collection(db, COLLECTION_NAMES.CATEGORIES),
      where('userId', '==', userId),
      orderBy('name', 'asc')
    )

    return onSnapshot(q, (querySnapshot) => {
      const categories = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      callback(categories)
    })
  },

  // Add new category
  addCategory: async (category, userId) => {
    const docRef = await addDoc(collection(db, COLLECTION_NAMES.CATEGORIES), {
      ...category,
      userId,
      createdAt: new Date()
    })
    return docRef.id
  },

  // Update category
  updateCategory: async (categoryId, updates) => {
    const docRef = doc(db, COLLECTION_NAMES.CATEGORIES, categoryId)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date()
    })
  },

  // Delete category
  deleteCategory: async (categoryId) => {
    await deleteDoc(doc(db, COLLECTION_NAMES.CATEGORIES, categoryId))
  }
}

// Wallet operations
export const walletService = {
  // Get all wallets for a user
  subscribeToWallets: (userId, callback) => {
    const q = query(
      collection(db, COLLECTION_NAMES.WALLETS),
      where('userId', '==', userId),
      orderBy('name', 'asc')
    )

    // Provide an error handler to avoid uncaught errors when Firestore
    // requires a composite index or permissions block the query.
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        try {
          const wallets = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }))
          callback(wallets || [])
        } catch (err) {
          console.error('Error processing wallets snapshot:', err)
          callback([])
        }
      },
      (err) => {
        console.error('Wallets snapshot listener error:', err)
        // report empty list to allow UI to render a fallback
        try { callback([]) } catch (e) { /* swallow */ }
      }
    )

    return unsubscribe
  },

  // Add new wallet
  addWallet: async (wallet, userId) => {
    const docRef = await addDoc(collection(db, COLLECTION_NAMES.WALLETS), {
      ...wallet,
      userId,
      createdAt: new Date()
    })
    return docRef.id
  },

  // Update wallet
  updateWallet: async (walletId, updates) => {
    const docRef = doc(db, COLLECTION_NAMES.WALLETS, walletId)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date()
    })
  },

  // Delete wallet
  deleteWallet: async (walletId) => {
    await deleteDoc(doc(db, COLLECTION_NAMES.WALLETS, walletId))
  }
}