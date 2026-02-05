import React, { useState } from 'react';
import './HamburgerMenu.css';

export default function HamburgerMenu({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="hamburger-btn" onClick={() => setOpen(!open)} aria-label="Open menu">
        <span className="hamburger-icon" />
      </button>
      <div className={'side-drawer' + (open ? ' open' : '')}> 
        <button className="close-btn" onClick={() => setOpen(false)} aria-label="Close menu">×</button>
        <div className="drawer-content">{children}</div>
      </div>
      {open && <div className="drawer-backdrop" onClick={() => setOpen(false)} />}
    </>
  );
}
