import Auth from './Auth'

export default function AccountDeletionPage() {
  return <main className="public-account-page">
    <a href="/">← Pitaka</a>
    <h1>Delete or remove your Pitaka data</h1>
    <p>This page explains how to remove selected records or delete your full Pitaka account. You can use it without reinstalling the app.</p>
    <section aria-labelledby="delete-selected-data"><h2 id="delete-selected-data">Delete selected data and keep your account</h2>
      <p>Sign in to Pitaka, open the section containing the record, choose its Delete action, and confirm. You can remove individual income, expense, transfer, account, category, budget, savings goal, recurring item, or investment records without deleting your account.</p>
      <p>To ask for help with deleting specific data, use the <a href="/contact">Pitaka contact form</a>. Tell us the account email and the type of data; do not include passwords or financial account numbers.</p>
    </section>
    <section aria-labelledby="delete-full-account"><h2 id="delete-full-account">Delete your full account</h2>
      <p>Sign in below, then confirm your email and password or Google account. A successful request deletes your Pitaka sign-in, profile, and associated cloud finance records, including accounts, transactions, categories, budgets, savings goals, recurring items, investments, lending records, snapshots, and Pitaka billing records.</p>
      <p>Downloaded exports and copies on other devices are not removed. Payment providers may retain their own transaction records under their policies and legal requirements.</p>
    </section><Auth initialMode="login" />
  </main>
}
