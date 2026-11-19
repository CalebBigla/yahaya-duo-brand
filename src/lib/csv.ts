/**
 * Safe CSV download, shared by every "Export CSV" button.
 *
 * - Quotes inside a value are doubled, so a customer message containing `"`
 *   no longer shifts the columns.
 * - Values starting with = + - @ (or tab/CR) are prefixed with ' so Excel and
 *   Sheets show them as text instead of running them as formulas. These values
 *   come from public website forms, so this matters.
 * - A UTF-8 byte-order mark makes Excel read accented names correctly.
 */
export type CsvCell = string | number | null | undefined;

const FORMULA_START = /^[=+\-@\t\r]/;

export function csvEscape(value: CsvCell): string {
  if (value === null || value === undefined) return '""';
  let text = String(value);
  if (typeof value === 'string' && FORMULA_START.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(headers: string[], rows: CsvCell[][]): string {
  return [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\r\n');
}

export function downloadCsv(filename: string, headers: string[], rows: CsvCell[][]) {
  const blob = new Blob(['﻿', toCsv(headers, rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
