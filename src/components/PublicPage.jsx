import { useEffect } from 'react'
import ContactForm from './ContactForm'
import { PublicHeader, PublicFooter } from './PublicNavigation'
import { FAQS, pageMetadata, pageSchema, WEB_PRO_PRICE_AMOUNT, WEB_PRO_PRICE_CURRENCY } from '../content/site.mjs'
import { formatCurrency } from '../utils/currency'
import { applySeo, setStructuredData, removeStructuredData } from '../utils/seo'

export function NotFound() {
  return <div className="landing-page"><PublicHeader /><main className="public-content"><h1>Page not found</h1><p>This address does not match a Pitaka page.</p><a href="/">Go to the homepage</a></main><PublicFooter /></div>
}

export default function PublicPage({ path }) {
  const metadata = pageMetadata(path)
  useEffect(() => {
    const metadata = pageMetadata(path)
    applySeo(metadata)
    setStructuredData('pitaka-page-schema', pageSchema(metadata))
    return () => removeStructuredData('pitaka-page-schema')
  }, [path])

  return <div className="landing-page"><PublicHeader /><main className="public-content"><p><a href="/">Home</a> / {path.slice(1)}</p><h1>{metadata.heading}</h1><p>{metadata.description}</p>
    {path === '/features' && <>
      <h2>Record income, expenses, and transfers</h2><p>Enter the amount, date, account, and category of each transaction. Keep cash, bank, card, and e-wallet records together. Account labels do not connect Pitaka to your bank or payment app.</p>
      <h2>Plan spending and savings</h2><p>Set category budgets, review spending against them, and record progress toward savings goals. Your dashboard summarizes the records you enter so you can review cash flow and balances.</p>
      <h2>Keep your records portable</h2><p>Import and export spreadsheets, download a backup, and sync your account across devices when connected. Previously loaded records can be available offline; sign-in and purchases need a connection.</p>
      <h2>Add Pro tools when you need them</h2><p>Pro adds recurring income, subscription tracking, investments, and more currencies. Investment tracking records your entries; it does not execute trades or recommend investments.</p><p><a href="/pricing">Compare Basic and Pro</a> or <a href="/signup">create a free account</a>.</p>
      <h2>Web now, Android in testing</h2><p>Use Pitaka in your browser. The Android app is currently in Google Play closed testing for selected testers.</p>
    </>}
    {path === '/pricing' && <>
      <h2>Basic is free</h2><p>Start tracking without purchasing Pro. There is no recurring subscription for the Pro upgrade.</p>
      <div className="public-table-wrap" role="region" aria-label="Compare Pitaka plans" tabIndex={0}><table><caption>Compare Pitaka plans</caption><thead><tr><th scope="col">Feature</th><th scope="col">Basic</th><th scope="col">Pro</th></tr></thead><tbody>
        {[['Income, expenses, accounts, and transfers', 'Included', 'Included'], ['Category budgets and savings goals', 'Included', 'Included'], ['Spreadsheet import and export', 'Included', 'Included'], ['Currencies', 'PHP and USD', 'Full supported list'], ['Recurring income and subscriptions', '—', 'Included'], ['Investment tracking', '—', 'Included']].map(row => <tr key={row[0]}><th scope="row">{row[0]}</th><td>{row[1]}</td><td>{row[2]}</td></tr>)}
      </tbody></table></div>
      <h2>How to buy Pro</h2><p>The website Pro upgrade is {formatCurrency(WEB_PRO_PRICE_AMOUNT / 100, WEB_PRO_PRICE_CURRENCY)}, paid once. Sign in, open More, and select Pitaka Pro. On the website, PayMongo handles checkout. In the Android app, Google Play handles the one-time purchase. Review the price and currency shown at checkout; regional prices can differ.</p><p>After payment is verified, Pro is linked to your Pitaka account. In Android, use Restore purchase if an existing purchase has not appeared. Use the same Google Play and Pitaka accounts used for the purchase.</p><p><a href="/signup">Start with Basic</a> · <a href="/contact">Get help with a purchase</a></p>
    </>}
    {path === '/about' && <>
      <h2>What Pitaka does</h2><p>Pitaka helps individuals and households keep a manual record of everyday finances. Start with Philippine pesos or US dollars, organize spending by category, and compare your entries with your budget and savings goals.</p>
      <h2>What you enter stays explicit</h2><p>Pitaka works from the records you provide. It does not connect to bank accounts, hold funds, transfer money, or offer loans. Reports reflect your entries and may be incomplete if transactions are missing.</p>
      <h2>Learn and get support</h2><p>The <a href="/blogs">Pitaka guides</a> explain budgeting workflows with examples. They are general educational information. For product questions, feedback, or account requests, <a href="/contact">contact Pitaka</a>.</p><p><a href="/features">Explore features</a> · <a href="/privacy">Privacy and data controls</a></p>
    </>}
    {path === '/help' && <>{FAQS.map(item => <details key={item.question} open><summary>{item.question}</summary><p>{item.answer}</p></details>)}<p>Still need help? <a href="/contact">Contact Pitaka</a>. To remove your account or selected data, follow the <a href="/delete-account">deletion instructions</a>.</p></>}
    {path === '/contact' && <><h2>Product and account support</h2><p>Include your account email, the screen you were using, and the steps that led to the issue. For purchase support, include the order reference. Never include passwords, payment card numbers, or bank credentials.</p><ContactForm /><p>For deletion requests, first review <a href="/delete-account">account and data deletion</a>.</p></>}
    {path === '/privacy' && <><h2>Account and finance records</h2><p>Pitaka stores account information and the finance records you enter to provide sign-in, syncing, and budgeting features. It does not automatically read your bank or e-wallet transactions.</p><h2>Export or remove your data</h2><p>Download exports or a backup from More. Delete individual entries in their section, or follow the <a href="/delete-account">account and data deletion instructions</a>. Account deletion does not remove downloaded copies or records held separately by payment providers.</p><h2>Read the full policy</h2><p>The <a href="/privacy-policy.html">Pitaka Privacy Policy</a> explains collection, use, providers, retention, and contact options. For questions about your data, <a href="/contact">contact Pitaka</a>.</p></>}
  </main><PublicFooter /></div>
}
