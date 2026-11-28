import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Weather from './Weather';

describe('Weather search', () => {
  // Enter in a text field only submits when the field and a submit button share a form.
  it('submits the city field with Enter: input and submit button sit in one form', () => {
    const html = renderToStaticMarkup(createElement(Weather));
    const form = html.match(/<form[^>]*>.*?<\/form>/s)?.[0] ?? '';
    expect(form).toContain('aria-label="Weather city"');
    expect(form).toMatch(/<button type="submit"[^>]*>Check Weather<\/button>/);
  });
});
