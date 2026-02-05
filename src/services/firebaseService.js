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
  EXPENSES: 'expenses'
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
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAMES.INCOMES), {
        ...income,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      return docRef.id
    } catch (error) {
      throw new Error(`Failed to add income: ${error.message}`)
    }
  },

  // Update income
  updateIncome: async (incomeId, updates) => {
    try {
      const docRef = doc(db, COLLECTION_NAMES.INCOMES, incomeId)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      })
    } catch (error) {
      throw new Error(`Failed to update income: ${error.message}`)
    }
  },

  // Delete income
  deleteIncome: async (incomeId) => {
    try {
      await deleteDoc(doc(db, COLLECTION_NAMES.INCOMES, incomeId))
    } catch (error) {
      throw new Error(`Failed to delete income: ${error.message}`)
    }
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
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAMES.EXPENSES), {
        ...expense,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      return docRef.id
    } catch (error) {
      throw new Error(`Failed to add expense: ${error.message}`)
    }
  },

  // Update expense
  updateExpense: async (expenseId, updates) => {
    try {
      const docRef = doc(db, COLLECTION_NAMES.EXPENSES, expenseId)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      })
    } catch (error) {
      throw new Error(`Failed to update expense: ${error.message}`)
    }
  },

  // Delete expense
  deleteExpense: async (expenseId) => {
    try {
      await deleteDoc(doc(db, COLLECTION_NAMES.EXPENSES, expenseId))
    } catch (error) {
      throw new Error(`Failed to delete expense: ${error.message}`)
    }
  }
}