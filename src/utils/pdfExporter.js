import { jsPDF } from 'jspdf';

/**
 * Exports the note to a clean PDF document using jsPDF.
 * Handles margins, text wrapping, and multi-page layouts.
 * @param {string} title - The title of the note.
 * @param {string} content - The text content of the note.
 */
export const exportToPDF = (title, content) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const margin = 20;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const maxLineWidth = pageWidth - (margin * 2);

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(31, 41, 55); // Slate 800
  
  // Truncate or wrap title if it's too long
  const cleanTitle = title || 'Untitled Note';
  const splitTitle = doc.splitTextToSize(cleanTitle, maxLineWidth);
  
  let currentY = 25;
  splitTitle.forEach((line) => {
    doc.text(line, margin, currentY);
    currentY += 8;
  });

  // Divider Line
  doc.setDrawColor(209, 213, 219); // Gray 300
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;

  // Content Body
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(55, 65, 81); // Slate 700
  
  const cleanContent = content || 'No content written yet.';
  // Split text by lines first to preserve paragraph structure, then wrap lines that are too long
  const rawParagraphs = cleanContent.split('\n');
  const pdfLines = [];

  rawParagraphs.forEach((paragraph) => {
    if (paragraph.trim() === '') {
      pdfLines.push('');
    } else {
      const wrappedLines = doc.splitTextToSize(paragraph, maxLineWidth);
      wrappedLines.forEach((line) => pdfLines.push(line));
    }
  });

  const lineHeight = 6.5; // space between lines
  
  pdfLines.forEach((line) => {
    // If the next line exceeds page height (leaving margin at bottom), add new page
    if (currentY > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
    }
    
    // Only write text if it isn't an empty paragraph space
    if (line !== '') {
      doc.text(line, margin, currentY);
    }
    currentY += lineHeight;
  });

  // Save the PDF with a clean filename
  const sanitizedTitle = cleanTitle
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const fileName = sanitizedTitle ? `${sanitizedTitle}.pdf` : 'note.pdf';
  doc.save(fileName);
};
