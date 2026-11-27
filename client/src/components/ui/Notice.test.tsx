import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Notice from './Notice';

describe('Notice', () => {
  it('announces danger notices as alerts', () => {
    const html = renderToStaticMarkup(<Notice tone="danger">Bad input</Notice>);
    expect(html).toContain('role="alert"');
    expect(html).toContain('ff-notice--danger');
    expect(html).toContain('Bad input');
  });

  it('uses a polite status role for other tones', () => {
    const html = renderToStaticMarkup(<Notice>Saved</Notice>);
    expect(html).toContain('role="status"');
    expect(html).toContain('ff-notice--info');
  });

  it('shows a dismiss button only when closable', () => {
    expect(renderToStaticMarkup(<Notice>Hi</Notice>)).not.toContain('Dismiss');
    expect(renderToStaticMarkup(<Notice onClose={() => {}}>Hi</Notice>)).toContain(
      'aria-label="Dismiss"'
    );
  });

  it('keeps a page class for spacing', () => {
    expect(renderToStaticMarkup(<Notice className="plan-trip__alert">x</Notice>)).toContain(
      'plan-trip__alert'
    );
  });
});
