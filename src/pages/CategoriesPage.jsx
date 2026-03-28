import React from 'react'
import { useBudget } from '../hooks/useBudget'
import CategoryForm from '../components/CategoryForm'
import WalletForm from '../components/WalletForm'
import WalletsTable from '../components/WalletsTable'
import CategoryTable from '../components/CategoryTable'
import PageLayout from '../components/PageLayout'

export default function CategoriesPage() {
  const { categories = [], addCategory, deleteCategory, editCategory, updateCategory, editingCategory, addWallet, updateWallet, deleteWallet, editWallet, editingWallet, wallets = [], walletBalances = [] } = useBudget()

  return (
    <div style={{ width: '100%' }}>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridAutoRows: 'min-content', gap: 18, width: '100%' }}>
        <div style={{ background: 'var(--card-bg)', padding: 12, borderRadius: 8, boxShadow: 'var(--card-shadow)', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ marginTop: 0 }}>Manage Categories</h3>
            <div>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  if (categories && categories.length) {
                    console.log('CategoriesPage: test edit invoking editCategory for id', categories[0].id)
                    editCategory(categories[0])
                  } else {
                    console.warn('CategoriesPage: no categories to test edit')
                  }
                }}
                style={{ marginLeft: 8 }}
              >Test Edit</button>
            </div>
          </div>
          <div style={{ width: '100%' }}>
            <CategoryForm
              onAddCategory={addCategory}
              editingCategory={editingCategory}
              onUpdateCategory={updateCategory}
              onCancelEdit={() => editCategory(null)}
            />
          </div>
        </div>

        <div style={{ width: '100%' }}>
          <h3 style={{ marginTop: 0 }}>Categories</h3>
          <div style={{ marginTop: 8 }}>
            {(() => { console.log('CategoriesPage: deleteCategory present?', !!deleteCategory, 'editCategory?', !!editCategory); try { window.__APP_LOGS = window.__APP_LOGS || []; window.__APP_LOGS.unshift({ ts: Date.now(), msg: 'CategoriesPage: deleteCategory ' + (!!deleteCategory) }) } catch (e) {} ; return <CategoryTable categories={categories} onDeleteCategory={deleteCategory} onEditCategory={editCategory} /> })()}
          </div>
        </div>

        <div style={{ background: 'var(--card-bg)', padding: 12, borderRadius: 8, boxShadow: 'var(--card-shadow)', width: '100%' }}>
          <h3 style={{ marginTop: 0 }}>Manage Wallets</h3>
          <div style={{ width: '100%' }}>
            <WalletForm
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
            />
          </div>
        </div>

        <div style={{ width: '100%' }}>
          <h3 style={{ marginTop: 0 }}>Wallets</h3>
          <div style={{ marginTop: 8 }}>
            <WalletsTable
              wallets={wallets}
              balances={walletBalances}
              onEditWallet={(w) => editWallet(w)}
              onDeleteWallet={(id) => deleteWallet(id)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
