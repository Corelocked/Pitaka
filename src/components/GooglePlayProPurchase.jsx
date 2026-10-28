import { useEffect, useState } from 'react'
import { buyPitakaPro, getPlayProProduct, restorePitakaPro } from '../services/googlePlayBillingService'

export default function GooglePlayProPurchase({ user, isPro }) {
  const [product, setProduct] = useState(null)
  const [loadingPrice, setLoadingPrice] = useState(true)
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getPlayProProduct()
      .then((details) => { if (active) setProduct(details) })
      .catch((loadError) => { if (active) setError(loadError.message || 'Could not load the Google Play price.') })
      .finally(() => { if (active) setLoadingPrice(false) })
    return () => { active = false }
  }, [])

  const buy = async () => {
    setBusy('buy')
    setError('')
    setMessage('')
    try {
      const result = await buyPitakaPro(user)
      if (result.state === 'pending') setMessage('Your payment is pending. Pro will unlock after Google Play confirms it.')
      else if (result.state === 'cancelled') setMessage('Purchase cancelled.')
      else setMessage('Purchase confirmed. Pitaka Pro is now linked to your account.')
    } catch (purchaseError) {
      setError(purchaseError.message || 'Could not complete the purchase. Please try again.')
    } finally {
      setBusy('')
    }
  }

  const restore = async () => {
    setBusy('restore')
    setError('')
    setMessage('')
    try {
      const result = await restorePitakaPro(user)
      setMessage(result.restored
        ? 'Your Google Play purchase has been restored to this account.'
        : result.pending
          ? 'A Google Play payment is still pending. Pro will unlock after it clears.'
          : 'No Pitaka Pro purchase was found for this Google Play account.')
    } catch (restoreError) {
      setError(restoreError.message || 'Could not restore the purchase. Please try again.')
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="mobile-content page-shell">
      <section className="card page-hero-card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Pitaka Pro</h2>
            <p className="card-subtitle">A one-time upgrade for recurring income, subscription tracking, investments, and all supported currencies.</p>
          </div>
          <span className={`sidebar-plan-badge ${isPro ? 'pro' : 'basic'}`}>{isPro ? 'Pro Active' : 'Basic'}</span>
        </div>

        {isPro ? (
          <p className="pro-purchase-text">Pro features are active on {user?.email || 'your account'}.</p>
        ) : (
          <>
            <section className="pro-purchase-card">
              <div className="pro-purchase-copy">
                <span className="eyebrow">One-Time Upgrade</span>
                <h3 className="pro-purchase-title">Buy Pitaka Pro</h3>
                <p className="pro-purchase-text">Pay securely through Google Play. The price is shown in your Play Store currency, and your Pro access is linked to this signed-in Pitaka account.</p>
                <div className="pro-purchase-price-row">
                  <strong className="pro-purchase-price">{loadingPrice ? 'Loading price…' : product?.formattedPrice || 'Price unavailable'}</strong>
                  <span className="pro-purchase-chip">Google Play</span>
                </div>
                <div className="pro-purchase-actions">
                  <button className="btn btn-primary" type="button" onClick={buy} disabled={busy !== '' || loadingPrice || !product?.formattedPrice}>
                    {busy === 'buy' ? 'Opening Google Play…' : `Buy Pro${product?.formattedPrice ? ` · ${product.formattedPrice}` : ''}`}
                  </button>
                  <button className="btn btn-secondary" type="button" onClick={restore} disabled={busy !== ''}>
                    {busy === 'restore' ? 'Checking purchases…' : 'Restore purchase'}
                  </button>
                </div>
              </div>
            </section>
            <p className="card-subtitle">Restore with the same Google Play account and Pitaka account used for the purchase.</p>
          </>
        )}
        {message && <p role="status" className="status-pill accent">{message}</p>}
        {error && <p role="alert" className="status-pill warning">{error}</p>}
      </section>
    </div>
  )
}
