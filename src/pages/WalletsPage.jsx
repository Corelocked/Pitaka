import React from 'react'
import { useBudget } from '../hooks/useBudget'
import WalletForm from '../components/WalletForm'
import PageLayout from '../components/PageLayout'
import WalletSummary from '../components/WalletSummary'
import IncomeForm from '../components/IncomeForm'
import ExpenseForm from '../components/ExpenseForm'

export default function WalletsPage() {
  const {
    wallets = [],
    walletBalances = [],
    addWallet,
    updateWallet,
    deleteWallet,
    editWallet,
    editingWallet,
    addIncome,
    addExpense,
    editingIncome,
    editingExpense,
    updateIncome,
    updateExpense,
    categories = [],
    incomes = [],
    expenses = []
  } = useBudget()

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <WalletSummary wallets={wallets} incomes={incomes} expenses={expenses} />
      </div>

      <div className="breakdown-section">
        <div className="breakdown-container">
          <div className="income-breakdown">
            <h4>Recent Income</h4>
            <div className="breakdown-form">
              <IncomeForm
                onAddIncome={addIncome}
                editingIncome={editingIncome}
                onUpdateIncome={updateIncome}
                onCancelEdit={() => {}}
                wallets={walletBalances}
              />
            </div>
          </div>

          <div className="expense-breakdown">
            <h4>Recent Expenses</h4>
            <div className="breakdown-form">
              <ExpenseForm
                onAddExpense={addExpense}
                editingExpense={editingExpense}
                onUpdateExpense={updateExpense}
                onCancelEdit={() => {}}
                categories={categories}
                wallets={walletBalances}
              />
            </div>
          </div>
        </div>
      </div>

      <PageLayout
        pageTitle="Wallets"
        leftHeader="Manage Wallets"
        left={<WalletForm
          onSubmit={async (payload) => {
            if (editingWallet) {
              await updateWallet({ id: editingWallet.id, ...payload })
              return editingWallet.id
            } else {
              return await addWallet(payload)
            }
          }}
          editingWallet={editingWallet}
          onCancel={() => editWallet(null)}
        />}
      />
    </div>
  )
}
