// client/src/components/ui/Notice.tsx
// Inline status message. Replaces react-bootstrap's Alert so pages use one styled, token-based notice.

import React from 'react';
import './Notice.css';

export type NoticeTone = 'danger' | 'success' | 'info';

interface NoticeProps {
  tone?: NoticeTone;
  onClose?: () => void;
  className?: string;
  children: React.ReactNode;
}

const Notice: React.FC<NoticeProps> = ({ tone = 'info', onClose, className, children }) => (
  <div
    className={['ff-notice', `ff-notice--${tone}`, className].filter(Boolean).join(' ')}
    role={tone === 'danger' ? 'alert' : 'status'}
  >
    <div className="ff-notice__body">{children}</div>
    {onClose && (
      <button type="button" className="ff-notice__close" onClick={onClose} aria-label="Dismiss">
        <span aria-hidden="true">×</span>
      </button>
    )}
  </div>
);

export default Notice;
