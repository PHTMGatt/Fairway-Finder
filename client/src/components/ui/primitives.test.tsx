import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Button, Chip, Field, ListRow, PageHeader, Panel, Sheet } from './primitives';

const inRouter = (node: React.ReactNode) => renderToStaticMarkup(<MemoryRouter>{node}</MemoryRouter>);

describe('PageHeader', () => {
  it('renders one h1, optional subtitle and action', () => {
    const html = renderToStaticMarkup(<PageHeader title="Play" subtitle="Find a course" action={<b>x</b>} />);
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain('ff-page-header__subtitle');
    expect(html).toContain('ff-page-header__action');
  });

  it('omits subtitle and action when not given', () => {
    const html = renderToStaticMarkup(<PageHeader title="Play" />);
    expect(html).not.toContain('subtitle');
    expect(html).not.toContain('__action');
  });
});

describe('Panel', () => {
  it('labels a titled section by its heading', () => {
    const html = renderToStaticMarkup(<Panel title="Search">body</Panel>);
    const id = html.match(/<h2 id="([^"]+)"/)?.[1];
    expect(id).toBeTruthy();
    expect(html).toContain(`aria-labelledby="${id}"`);
  });

  it('supports raised and custom tags', () => {
    const html = renderToStaticMarkup(<Panel as="div" raised>x</Panel>);
    expect(html.startsWith('<div')).toBe(true);
    expect(html).toContain('ff-panel--raised');
  });
});

describe('Button', () => {
  it('defaults to a primary type=button', () => {
    const html = renderToStaticMarkup(<Button>Go</Button>);
    expect(html).toContain('type="button"');
    expect(html).toContain('ff-btn--primary');
  });

  it('renders submit, router link and external anchor forms', () => {
    expect(renderToStaticMarkup(<Button type="submit">S</Button>)).toContain('type="submit"');
    expect(inRouter(<Button to="/courses" variant="secondary">P</Button>)).toMatch(/<a[^>]+href="\/courses"/);
    const anchor = renderToStaticMarkup(
      <Button href="https://maps.example" target="_blank" rel="noopener noreferrer" variant="text">M</Button>
    );
    expect(anchor).toContain('target="_blank"');
    expect(anchor).toContain('ff-btn--text');
  });

  it('marks block buttons and hides icons from screen readers', () => {
    const html = renderToStaticMarkup(<Button block icon={<i />}>Go</Button>);
    expect(html).toContain('ff-btn--block');
    expect(html).toContain('aria-hidden="true"');
  });
});

describe('Field', () => {
  it('links label, control, hint and error', () => {
    const html = renderToStaticMarkup(
      <Field label="City" hint="City, state" error="Required">
        <input />
      </Field>
    );
    const id = html.match(/<input id="([^"]+)"/)?.[1];
    expect(html).toContain(`for="${id}"`);
    expect(html).toContain(`aria-describedby="${id}-hint ${id}-error"`);
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('ff-input');
  });

  it('keeps an existing control id and can hide the label visually', () => {
    const html = renderToStaticMarkup(
      <Field label="Tee" hideLabel>
        <select id="tee" />
      </Field>
    );
    expect(html).toContain('for="tee"');
    expect(html).toContain('ff-visually-hidden');
  });
});

describe('Chip and ListRow', () => {
  it('chip is a button only when clickable', () => {
    expect(renderToStaticMarkup(<Chip>72°F</Chip>)).toMatch(/^<span/);
    expect(renderToStaticMarkup(<Chip onClick={() => {}}>72°F</Chip>)).toMatch(/^<button type="button"/);
  });

  it('row shows a chevron when interactive', () => {
    expect(inRouter(<ListRow title="Pebble" to="/trip/1" />)).toContain('ff-row__chevron');
    expect(renderToStaticMarkup(<ListRow title="Pebble" />)).not.toContain('ff-row__chevron');
    expect(renderToStaticMarkup(<ListRow title="Pebble" meta="Monterey" trailing="4.8" onClick={() => {}} />)).toContain(
      'ff-row__meta'
    );
  });
});

describe('Sheet', () => {
  it('is a labelled dialog with a close button', () => {
    const html = renderToStaticMarkup(
      <Sheet open={false} onClose={() => {}} title="Start a round" footer={<b>f</b>}>
        body
      </Sheet>
    );
    const id = html.match(/<h2 id="([^"]+)"/)?.[1];
    expect(html).toMatch(/^<dialog/);
    expect(html).toContain(`aria-labelledby="${id}"`);
    expect(html).toContain('aria-label="Close"');
    expect(html).toContain('ff-sheet__foot');
  });
});
