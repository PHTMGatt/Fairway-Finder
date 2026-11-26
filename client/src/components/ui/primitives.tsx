// client/src/components/ui/primitives.tsx
// Shared UI primitives. Pages compose these; page stylesheets keep layout only.
// Styles: ./ui.css (every colour from styles/tokens.css).

import React, { useEffect, useId, useRef } from 'react';
import { Link } from 'react-router-dom';
import './ui.css';

const cx = (...names: Array<string | false | null | undefined>) => names.filter(Boolean).join(' ');

/* ---------- PageHeader: one row, title + optional one-line subtitle + optional action ---------- */

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action, className }) => (
  <header className={cx('ff-page-header', className)}>
    <div className="ff-page-header__text">
      <h1 className="ff-page-header__title">{title}</h1>
      {subtitle && <p className="ff-page-header__subtitle">{subtitle}</p>}
    </div>
    {action && <div className="ff-page-header__action">{action}</div>}
  </header>
);

/* ---------- Panel: the one surface level. Never nest a Panel inside a Panel. ---------- */

interface PanelProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  as?: 'section' | 'div' | 'article' | 'aside' | 'form';
  title?: React.ReactNode;
  titleId?: string;
  action?: React.ReactNode;
  raised?: boolean;
}

export const Panel: React.FC<PanelProps> = ({
  as: Tag = 'section',
  title,
  titleId,
  action,
  raised = false,
  className,
  children,
  ...rest
}) => {
  const autoId = useId();
  const headingId = title ? titleId ?? `${autoId}-title` : undefined;
  return (
    <Tag
      className={cx('ff-panel', raised && 'ff-panel--raised', className)}
      aria-labelledby={Tag === 'section' ? headingId : undefined}
      {...(rest as React.HTMLAttributes<HTMLElement>)}
    >
      {(title || action) && (
        <div className="ff-panel__head">
          {title && (
            <h2 id={headingId} className="ff-panel__title">
              {title}
            </h2>
          )}
          {action && <div className="ff-panel__action">{action}</div>}
        </div>
      )}
      {children}
    </Tag>
  );
};

/* ---------- Button: primary / secondary / text, as <button>, <a> or router <Link> ---------- */

export type ButtonVariant = 'primary' | 'secondary' | 'text' | 'danger';

interface ButtonBaseProps {
  variant?: ButtonVariant;
  block?: boolean;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

type ButtonAsButton = ButtonBaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & { to?: undefined; href?: undefined };
type ButtonAsLink = ButtonBaseProps & { to: string; href?: undefined; onClick?: () => void; state?: unknown };
type ButtonAsAnchor = ButtonBaseProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'> & { href: string; to?: undefined };

export type ButtonProps = ButtonAsButton | ButtonAsLink | ButtonAsAnchor;

const buttonClass =(variant: ButtonVariant = 'primary', block = false, extra?: string) =>
  cx('ff-btn', `ff-btn--${variant}`, block && 'ff-btn--block', extra);

const BUTTON_OWN_PROPS = new Set(['variant', 'block', 'icon', 'className', 'children', 'to', 'state']);

/** The props that belong on the DOM element (drops Button's own props). */
const domProps = (props: ButtonProps) =>
  Object.fromEntries(Object.entries(props).filter(([key]) => !BUTTON_OWN_PROPS.has(key))) as Record<string, unknown>;

export const Button: React.FC<ButtonProps> = (props) => {
  const { variant = 'primary', block = false, icon, className, children } = props;
  const cls = buttonClass(variant, block, className);
  const content = (
    <>
      {icon && (
        <span className="ff-btn__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </>
  );

  if (props.to !== undefined) {
    const { to, onClick, state } = props as ButtonAsLink;
    return (
      <Link to={to} onClick={onClick} state={state} className={cls}>
        {content}
      </Link>
    );
  }
  if (props.href !== undefined) {
    return (
      <a {...domProps(props)} className={cls}>
        {content}
      </a>
    );
  }
  const { type = 'button', ...button } = domProps(props) as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button {...button} type={type} className={cls}>
      {content}
    </button>
  );
};

/* ---------- Field: label + control + hint/error, wired for a11y ---------- */

interface FieldProps {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  /** Visually hide the label (it stays for screen readers). */
  hideLabel?: boolean;
  className?: string;
  /** A single input/select/textarea, or a render function receiving the generated id. */
  children: React.ReactElement | ((ids: { id: string; describedBy?: string }) => React.ReactNode);
}

export const Field: React.FC<FieldProps> = ({ label, hint, error, hideLabel = false, className, children }) => {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  let control: React.ReactNode;
  if (typeof children === 'function') {
    control = children({ id, describedBy });
  } else {
    const existing = children.props as { id?: string; className?: string };
    control = React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      id: existing.id ?? id,
      'aria-describedby': describedBy,
      'aria-invalid': error ? true : undefined,
      className: cx('ff-input', existing.className),
    });
  }
  const forId =
    typeof children === 'function' ? id : ((children.props as { id?: string }).id ?? id);

  return (
    <div className={cx('ff-field', Boolean(error) && 'ff-field--error', className)}>
      <label htmlFor={forId} className={cx('ff-field__label', hideLabel && 'ff-visually-hidden')}>
        {label}
      </label>
      {control}
      {hint && (
        <p id={hintId} className="ff-field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="ff-field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

/* ---------- Chip: small status/info pill, optionally a button ---------- */

interface ChipProps {
  icon?: React.ReactNode;
  tone?: 'neutral' | 'accent' | 'muted';
  onClick?: () => void;
  className?: string;
  'aria-label'?: string;
  children: React.ReactNode;
}

export const Chip: React.FC<ChipProps> = ({ icon, tone = 'neutral', onClick, className, children, ...aria }) => {
  const cls = cx('ff-chip', `ff-chip--${tone}`, onClick && 'ff-chip--button', className);
  const content = (
    <>
      {icon && (
        <span className="ff-chip__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="ff-chip__label">{children}</span>
    </>
  );
  return onClick ? (
    <button type="button" className={cls} onClick={onClick} aria-label={aria['aria-label']}>
      {content}
    </button>
  ) : (
    <span className={cls} aria-label={aria['aria-label']}>
      {content}
    </span>
  );
};

/* ---------- ListRow: one compact tappable row (title, meta, trailing value, chevron) ---------- */

interface ListRowProps {
  title: React.ReactNode;
  meta?: React.ReactNode;
  trailing?: React.ReactNode;
  leading?: React.ReactNode;
  to?: string;
  onClick?: () => void;
  chevron?: boolean;
  className?: string;
}

export const ListRow: React.FC<ListRowProps> = ({
  title,
  meta,
  trailing,
  leading,
  to,
  onClick,
  chevron,
  className,
}) => {
  const interactive = Boolean(to || onClick);
  const showChevron = chevron ?? interactive;
  const inner = (
    <>
      {leading && (
        <span className="ff-row__leading" aria-hidden="true">
          {leading}
        </span>
      )}
      <span className="ff-row__text">
        <span className="ff-row__title">{title}</span>
        {meta && <span className="ff-row__meta">{meta}</span>}
      </span>
      {trailing && <span className="ff-row__trailing">{trailing}</span>}
      {showChevron && (
        <span className="ff-row__chevron" aria-hidden="true">
          ›
        </span>
      )}
    </>
  );
  const cls = cx('ff-row', interactive && 'ff-row--interactive', className);
  if (to)
    return (
      <Link to={to} className={cls}>
        {inner}
      </Link>
    );
  if (onClick)
    return (
      <button type="button" className={cls} onClick={onClick}>
        {inner}
      </button>
    );
  return <div className={cls}>{inner}</div>;
};

/* ---------- Sheet: modal dialog; bottom sheet on phones, centred dialog on wide screens ---------- */

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Sheet: React.FC<SheetProps> = ({ open, onClose, title, children, footer, className }) => {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    } else if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={cx('ff-sheet', className)}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // Click on the backdrop (the dialog element itself, outside the inner box) closes.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="ff-sheet__box">
        <div className="ff-sheet__head">
          <h2 id={titleId} className="ff-sheet__title">
            {title}
          </h2>
          <button type="button" className="ff-sheet__close" onClick={onClose} aria-label="Close">
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="ff-sheet__body">{children}</div>
        {footer && <div className="ff-sheet__foot">{footer}</div>}
      </div>
    </dialog>
  );
};
