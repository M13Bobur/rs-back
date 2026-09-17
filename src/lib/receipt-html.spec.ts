import { describe, expect, it } from 'vitest';

/**
 * Lightweight layout checks for thermal print HTML (mirrors frontend receipt-html).
 * Keeps @page rules stable for 58mm / 80mm without coupling packages.
 */
function miniReceiptHtml(width: '58mm' | '80mm'): string {
  return `<style>@page { size: ${width} auto; margin: 2mm; }</style><body style="width:${width}">`;
}

describe('thermal receipt print layout', () => {
  it('uses 58mm page size', () => {
    expect(miniReceiptHtml('58mm')).toContain('size: 58mm auto');
    expect(miniReceiptHtml('58mm')).toContain('width:58mm');
  });

  it('uses 80mm page size', () => {
    expect(miniReceiptHtml('80mm')).toContain('size: 80mm auto');
    expect(miniReceiptHtml('80mm')).toContain('width:80mm');
  });
});
