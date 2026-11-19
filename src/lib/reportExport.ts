/**
 * Table exports for reports: real .xlsx (Office Open XML, zipped with fflate)
 * and PDF (jsPDF). Both take the same report definition the page renders, so
 * what is exported is exactly what is on screen.
 */
import { zipSync, strToU8 } from 'fflate';
import { jsPDF } from 'jspdf';
import { site } from '@/lib/site';

export interface ReportColumn {
  key: string;
  label: string;
  /** 'money' and 'number' cells are written as numbers in Excel and right-aligned. */
  type?: 'text' | 'money' | 'number';
}

export type ReportCell = string | number | null;

export interface ReportTable {
  title: string;
  subtitle?: string | undefined;
  columns: ReportColumn[];
  rows: Record<string, ReportCell>[];
  /** Optional bold summary row. */
  totals?: Record<string, ReportCell> | undefined;
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function reportFilename(title: string, ext: 'xlsx' | 'pdf') {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${slug}-${new Date().toISOString().slice(0, 10)}.${ext}`;
}

// ---------------------------------------------------------------------------
// Excel
// ---------------------------------------------------------------------------

const xmlEscape = (value: string) =>
  value
    // Characters XML 1.0 cannot carry at all.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function columnLetter(index: number) {
  let n = index + 1;
  let out = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    out = String.fromCharCode(65 + r) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

// Style ids from styles.xml below: 0 normal, 1 bold, 2 number, 3 bold number.
function cellXml(ref: string, value: ReportCell, numeric: boolean, bold: boolean) {
  if (value === null || value === '') return '';
  if (numeric && typeof value === 'number' && Number.isFinite(value)) {
    return `<c r="${ref}" s="${bold ? 3 : 2}"><v>${value}</v></c>`;
  }
  // Inline strings are never evaluated as formulas, so "=..." text stays text.
  return `<c r="${ref}" t="inlineStr"${bold ? ' s="1"' : ''}><is><t xml:space="preserve">${xmlEscape(String(value))}</t></is></c>`;
}

export function exportXlsx(report: ReportTable) {
  const rows: string[] = [];
  let r = 0;
  const addRow = (cells: string[]) => {
    r += 1;
    rows.push(`<row r="${r}">${cells.join('')}</row>`);
  };

  addRow([cellXml('A1', report.title, false, true)]);
  if (report.subtitle) addRow([cellXml(`A${r + 1}`, report.subtitle, false, false)]);
  addRow([]);
  addRow(report.columns.map((c, i) => cellXml(`${columnLetter(i)}${r + 1}`, c.label, false, true)));
  for (const row of report.rows) {
    addRow(report.columns.map((c, i) => cellXml(`${columnLetter(i)}${r + 1}`, row[c.key] ?? null, c.type === 'money' || c.type === 'number', false)));
  }
  if (report.totals) {
    const totals = report.totals;
    addRow(report.columns.map((c, i) => cellXml(`${columnLetter(i)}${r + 1}`, totals[c.key] ?? null, c.type === 'money' || c.type === 'number', true)));
  }

  const widths = report.columns
    .map((c, i) => {
      const longest = Math.max(c.label.length, ...report.rows.slice(0, 200).map((row) => String(row[c.key] ?? '').length));
      return `<col min="${i + 1}" max="${i + 1}" width="${Math.min(Math.max(longest + 2, 10), 50)}" customWidth="1"/>`;
    })
    .join('');

  const ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const files: Record<string, Uint8Array> = {
    '[Content_Types].xml': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        '</Types>',
    ),
    '_rels/.rels': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        '</Relationships>',
    ),
    'xl/workbook.xml': strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="${ns}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
        '<sheets><sheet name="Report" sheetId="1" r:id="rId1"/></sheets></workbook>',
    ),
    'xl/_rels/workbook.xml.rels': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
        '</Relationships>',
    ),
    'xl/styles.xml': strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="${ns}">` +
        '<numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.00"/></numFmts>' +
        '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
        '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
        '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
        '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
        '<cellXfs count="4">' +
        '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
        '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
        '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
        '<xf numFmtId="164" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>' +
        '</cellXfs></styleSheet>',
    ),
    'xl/worksheets/sheet1.xml': strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="${ns}">` +
        `<cols>${widths}</cols><sheetData>${rows.join('')}</sheetData></worksheet>`,
    ),
  };

  const zipped = zipSync(files, { level: 6 });
  download(
    new Blob([zipped as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    reportFilename(report.title, 'xlsx'),
  );
}

// ---------------------------------------------------------------------------
// PDF
// ---------------------------------------------------------------------------

// jsPDF's built-in fonts have no naira sign, so PDFs show amounts as "NGN 1,234.00".
const pdfNumber = new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pdfQty = new Intl.NumberFormat('en-NG', { maximumFractionDigits: 3 });

function pdfText(value: ReportCell, type: ReportColumn['type']) {
  if (value === null || value === '') return '';
  if (typeof value === 'number') {
    if (type === 'money') return `NGN ${pdfNumber.format(value)}`;
    return pdfQty.format(value);
  }
  return String(value).replace(/₦/g, 'NGN ');
}

export function exportPdf(report: ReportTable) {
  const doc = new jsPDF({ orientation: report.columns.length > 6 ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36;
  const usable = pageWidth - margin * 2;
  const fontSize = report.columns.length > 8 ? 7 : 8;
  const lineHeight = fontSize + 6;

  // Column widths: proportional to content length, numeric columns get a floor.
  const weights = report.columns.map((c) => {
    const sample = [c.label, ...report.rows.slice(0, 100).map((row) => pdfText(row[c.key] ?? null, c.type))];
    return Math.min(Math.max(...sample.map((s) => s.length), 6), 40);
  });
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const widths = weights.map((w) => (w / totalWeight) * usable);

  let y = margin;
  const header = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(report.title, margin, y);
    y += 16;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`${site.name}${report.subtitle ? `  ·  ${report.subtitle}` : ''}`, margin, y);
    doc.setTextColor(0);
    y += 18;
  };
  const tableHeader = () => {
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, y - fontSize - 2, usable, lineHeight, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(fontSize);
    let x = margin;
    report.columns.forEach((c, i) => {
      const w = widths[i] ?? 0;
      const label = doc.splitTextToSize(c.label, w - 6)[0] ?? '';
      if (c.type === 'money' || c.type === 'number') doc.text(label, x + w - 3, y, { align: 'right' });
      else doc.text(label, x + 3, y);
      x += w;
    });
    y += lineHeight;
    doc.setFont('helvetica', 'normal');
  };
  const row = (values: Record<string, ReportCell>, bold: boolean) => {
    if (y > pageHeight - margin - lineHeight) {
      doc.addPage();
      y = margin;
      tableHeader();
    }
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    let x = margin;
    report.columns.forEach((c, i) => {
      const w = widths[i] ?? 0;
      const text = doc.splitTextToSize(pdfText(values[c.key] ?? null, c.type), w - 6)[0] ?? '';
      if (c.type === 'money' || c.type === 'number') doc.text(text, x + w - 3, y, { align: 'right' });
      else doc.text(text, x + 3, y);
      x += w;
    });
    if (bold) {
      doc.setDrawColor(180);
      doc.line(margin, y - fontSize - 3, margin + usable, y - fontSize - 3);
    }
    y += lineHeight;
  };

  header();
  tableHeader();
  report.rows.forEach((values) => row(values, false));
  if (report.totals) row(report.totals, true);
  if (report.rows.length === 0) {
    doc.setTextColor(120);
    doc.text('No records for this selection.', margin, y);
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(140);
    doc.text(`Generated ${new Date().toLocaleString('en-NG')}  ·  Page ${i} of ${pages}`, margin, pageHeight - 18);
  }
  doc.save(reportFilename(report.title, 'pdf'));
}
