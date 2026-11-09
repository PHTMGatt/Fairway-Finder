// client/src/components/Footer/Footer.tsx
// Quiet footer: navigation lives in the sidebar / bottom tabs now.
import React, { memo } from 'react';
import './Footer.css';

const Footer: React.FC = memo(() => (
  <footer className="footer">
    <p className="footer__copy">&copy; {new Date().getFullYear()} Fairway Finder Golf Co.</p>
  </footer>
));

export default Footer;
