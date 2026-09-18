/**
 * PDF Quote Generator
 * Generates professional PDF quotes with company branding
 */

import { jsPDF } from 'jspdf';
import { site } from './site';
import { format } from 'date-fns';

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface QuoteData {
  quote_number: string;
  client_name: string;
  client_email: string | null;
  title: string;
  description: string | null;
  service_type: string;
  items: LineItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  valid_until: string | null;
  terms: string | null;
  created_at: string;
}

/**
 * Generate a professional PDF quote
 */
export function generateQuotePDF(quote: QuoteData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Colors
  const primaryColor: [number, number, number] = [41, 128, 185]; // Blue
  const darkGray: [number, number, number] = [51, 51, 51];
  const lightGray: [number, number, number] = [128, 128, 128];
  const bgGray: [number, number, number] = [245, 245, 245];

  // Helper function to add text
  const addText = (
    text: string,
    x: number,
    y: number,
    options: {
      fontSize?: number;
      fontStyle?: 'normal' | 'bold';
      color?: [number, number, number];
      align?: 'left' | 'center' | 'right';
      maxWidth?: number;
    } = {}
  ) => {
    const {
      fontSize = 10,
      fontStyle = 'normal',
      color = darkGray,
      align = 'left',
      maxWidth,
    } = options;

    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    doc.setTextColor(...color);

    if (maxWidth) {
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y, { align });
      return y + lines.length * fontSize * 0.35; // Return new Y position
    } else {
      doc.text(text, x, y, { align });
      return y + fontSize * 0.35;
    }
  };

  // Header - Company Info
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 60, 'F');

  // Company Name
  addText(site.name.toUpperCase(), margin, 25, {
    fontSize: 20,
    fontStyle: 'bold',
    color: [255, 255, 255],
  });

  // RC Number
  addText(`RC: ${site.rcNumber}`, margin, 35, {
    fontSize: 10,
    color: [255, 255, 255],
  });

  // Contact Info
  addText(site.addressLine, margin, 45, {
    fontSize: 9,
    color: [255, 255, 255],
    maxWidth: pageWidth - 2 * margin,
  });
  addText(`Email: ${site.email} | Phone: ${site.phones[0]}`, margin, 52, {
    fontSize: 9,
    color: [255, 255, 255],
  });

  yPos = 75;

  // Quote Title
  addText('QUOTATION', pageWidth / 2, yPos, {
    fontSize: 18,
    fontStyle: 'bold',
    color: primaryColor,
    align: 'center',
  });

  yPos += 15;

  // Quote Details - Two Columns
  const leftColX = margin;
  const rightColX = pageWidth / 2 + 10;

  // Left Column - Quote Info
  doc.setFillColor(...bgGray);
  doc.rect(leftColX, yPos, (pageWidth - 2 * margin) / 2 - 5, 30, 'F');

  addText('Quote Number:', leftColX + 5, yPos + 8, {
    fontSize: 9,
    color: lightGray,
  });
  addText(quote.quote_number, leftColX + 5, yPos + 14, {
    fontSize: 11,
    fontStyle: 'bold',
  });

  addText('Date Issued:', leftColX + 5, yPos + 22, {
    fontSize: 9,
    color: lightGray,
  });
  addText(format(new Date(quote.created_at), 'MMMM d, yyyy'), leftColX + 5, yPos + 28, {
    fontSize: 10,
  });

  // Right Column - Client Info
  doc.setFillColor(...bgGray);
  doc.rect(rightColX, yPos, (pageWidth - 2 * margin) / 2 - 5, 30, 'F');

  addText('Bill To:', rightColX + 5, yPos + 8, {
    fontSize: 9,
    color: lightGray,
  });
  addText(quote.client_name, rightColX + 5, yPos + 14, {
    fontSize: 11,
    fontStyle: 'bold',
  });

  if (quote.client_email) {
    addText(quote.client_email, rightColX + 5, yPos + 22, {
      fontSize: 9,
      color: lightGray,
    });
  }

  yPos += 40;

  // Service Type
  addText(`Service: ${quote.service_type.toUpperCase()}`, margin, yPos, {
    fontSize: 10,
    fontStyle: 'bold',
    color: primaryColor,
  });

  yPos += 8;

  // Quote Title and Description
  addText(quote.title, margin, yPos, {
    fontSize: 14,
    fontStyle: 'bold',
  });

  yPos += 8;

  if (quote.description) {
    yPos = addText(quote.description, margin, yPos, {
      fontSize: 10,
      color: lightGray,
      maxWidth: pageWidth - 2 * margin,
    });
    yPos += 5;
  }

  yPos += 10;

  // Line Items Table
  // Table Header
  doc.setFillColor(...primaryColor);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');

  addText('DESCRIPTION', margin + 3, yPos + 7, {
    fontSize: 9,
    fontStyle: 'bold',
    color: [255, 255, 255],
  });
  addText('QTY', pageWidth - margin - 80, yPos + 7, {
    fontSize: 9,
    fontStyle: 'bold',
    color: [255, 255, 255],
    align: 'right',
  });
  addText('UNIT PRICE', pageWidth - margin - 50, yPos + 7, {
    fontSize: 9,
    fontStyle: 'bold',
    color: [255, 255, 255],
    align: 'right',
  });
  addText('AMOUNT', pageWidth - margin - 3, yPos + 7, {
    fontSize: 9,
    fontStyle: 'bold',
    color: [255, 255, 255],
    align: 'right',
  });

  yPos += 10;

  // Table Rows
  let rowIndex = 0;
  for (const item of quote.items) {
    // Check if we need a new page
    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = margin;
    }

    // Alternate row background
    if (rowIndex % 2 === 0) {
      doc.setFillColor(...bgGray);
      doc.rect(margin, yPos, pageWidth - 2 * margin, 12, 'F');
    }

    // Description (can be multiline)
    const descLines = doc.splitTextToSize(item.description, pageWidth - 2 * margin - 130);
    const rowHeight = Math.max(12, descLines.length * 4 + 4);

    addText(descLines.join('\n'), margin + 3, yPos + 8, {
      fontSize: 9,
    });

    addText(item.quantity.toString(), pageWidth - margin - 80, yPos + 8, {
      fontSize: 9,
      align: 'right',
    });

    addText(`₦${item.unit_price.toLocaleString()}`, pageWidth - margin - 50, yPos + 8, {
      fontSize: 9,
      align: 'right',
    });

    addText(`₦${item.amount.toLocaleString()}`, pageWidth - margin - 3, yPos + 8, {
      fontSize: 9,
      fontStyle: 'bold',
      align: 'right',
    });

    yPos += rowHeight;
    rowIndex++;
  }

  // Totals Section
  yPos += 5;

  const totalsX = pageWidth - margin - 70;

  // Subtotal
  doc.setDrawColor(...lightGray);
  doc.line(totalsX - 10, yPos, pageWidth - margin, yPos);
  yPos += 8;

  addText('Subtotal:', totalsX - 10, yPos, {
    fontSize: 10,
    fontStyle: 'bold',
  });
  addText(`₦${Number(quote.subtotal).toLocaleString()}`, pageWidth - margin, yPos, {
    fontSize: 10,
    align: 'right',
  });

  yPos += 8;

  // Tax (if applicable)
  if (quote.tax_rate > 0) {
    addText(`Tax (${quote.tax_rate}%):`, totalsX - 10, yPos, {
      fontSize: 10,
    });
    addText(`₦${Number(quote.tax_amount).toLocaleString()}`, pageWidth - margin, yPos, {
      fontSize: 10,
      align: 'right',
    });
    yPos += 8;
  }

  // Total
  doc.setFillColor(...primaryColor);
  doc.rect(totalsX - 10, yPos - 5, pageWidth - totalsX - margin + 10, 12, 'F');

  addText('TOTAL:', totalsX - 7, yPos + 3, {
    fontSize: 12,
    fontStyle: 'bold',
    color: [255, 255, 255],
  });
  addText(`₦${Number(quote.total_amount).toLocaleString()}`, pageWidth - margin - 3, yPos + 3, {
    fontSize: 12,
    fontStyle: 'bold',
    color: [255, 255, 255],
    align: 'right',
  });

  yPos += 20;

  // Valid Until
  if (quote.valid_until) {
    addText(
      `This quote is valid until ${format(new Date(quote.valid_until), 'MMMM d, yyyy')}`,
      margin,
      yPos,
      {
        fontSize: 9,
        color: lightGray,
        fontStyle: 'bold',
      }
    );
    yPos += 10;
  }

  // Terms and Conditions
  if (quote.terms) {
    // Check if we need a new page
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }

    addText('TERMS & CONDITIONS', margin, yPos, {
      fontSize: 11,
      fontStyle: 'bold',
      color: primaryColor,
    });

    yPos += 8;

    yPos = addText(quote.terms, margin, yPos, {
      fontSize: 9,
      color: darkGray,
      maxWidth: pageWidth - 2 * margin,
    });
  }

  // Footer
  const footerY = pageHeight - 20;
  doc.setDrawColor(...lightGray);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  addText(
    `Generated on ${format(new Date(), 'MMMM d, yyyy')} | ${site.name}`,
    pageWidth / 2,
    footerY,
    {
      fontSize: 8,
      color: lightGray,
      align: 'center',
    }
  );

  // Save the PDF
  doc.save(`${quote.quote_number}.pdf`);
}
