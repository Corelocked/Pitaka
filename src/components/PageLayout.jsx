import React from 'react'

export default function PageLayout({
  left,
  right,
  leftHeader,
  rightHeader,
  leftWidth = '340px'
  ,
  pageTitle
}) {
  return (
    <div className="page-layout">
      {pageTitle ? <h1 style={{ marginBottom: 12 }}>{pageTitle}</h1> : null}

      <div className="section" style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: `0 0 ${leftWidth}` }}>
          {leftHeader ? <h3 style={{ marginTop: 0 }}>{leftHeader}</h3> : null}
          {left}
        </div>

        {right ? (
          <div style={{ flex: 1 }}>
            {rightHeader ? <h3 style={{ marginTop: 0 }}>{rightHeader}</h3> : null}
            {right}
          </div>
        ) : null}
      </div>
    </div>
  )
}
