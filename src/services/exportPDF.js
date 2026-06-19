import { jsPDF } from 'jspdf';

/**
 * Exports the note to a clean PDF document using jsPDF.
 * Handles margins, text wrapping, and multi-page layouts.
 * @param {string} title - The title of the note.
 * @param {string} content - The text content of the note.
 */
export const exportToPDF = (title, content) => {
  const doc = new jsPDF({ //create new PDF document in portrait orientation, using mm units, and A4 size
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const margin = 20;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const maxLineWidth = pageWidth - (margin * 2); // maximum width for text lines after accounting for margins
 
  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(31, 41, 55); // Slate 800
  
  // Truncate or wrap title if it's too long
  const cleanTitle = title || 'Untitled Note'; // Fallback title if none provided
  const splitTitle = doc.splitTextToSize(cleanTitle, maxLineWidth); //split title into multiple lines if it exceeds maxLineWidth, returns array of lines
  
  let currentY = 25;
  splitTitle.forEach((line) => {
    doc.text(line, margin, currentY);
    currentY += 8;
  }); // Add some space after title before divider line

  // Divider Line
  doc.setDrawColor(209, 213, 219); // Gray 300
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;

  // Content Body
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12); // 12pt font for content
  doc.setTextColor(55, 65, 81); // Slate 700 
  
  const cleanContent = content || 'No content written yet.'; // Fallback content if note is empty
  // Split text by lines first to preserve paragraph structure, then wrap lines that are too long
  const rawParagraphs = cleanContent.split('\n'); // Split content into paragraphs based on newlines
  const pdfLines = []; // This will hold all lines to be written to PDF, including wrapped lines

  rawParagraphs.forEach((paragraph) => { // For each paragraph, check if it's empty (just a newline) and add an empty line to PDF, otherwise wrap the text and add wrapped lines to PDF
    if (paragraph.trim() === '') {
      pdfLines.push('');
    } else {
      const wrappedLines = doc.splitTextToSize(paragraph, maxLineWidth); // Wrap paragraph text into multiple lines if it exceeds maxLineWidth, returns array of lines
      wrappedLines.forEach((line) => pdfLines.push(line));
    }
  });

  const lineHeight = 6.5; // space between lines
  
  pdfLines.forEach((line) => {
    // If the next line exceeds page height (leaving margin at bottom), add new page
    if (currentY > pageHeight - margin) { // Check if current Y position exceeds page height minus bottom margin
      doc.addPage();
      currentY = margin; // Reset Y position to top margin for new page
    }
    
    // Only write text if it isn't an empty paragraph space
    if (line !== '') {
      doc.text(line, margin, currentY); // Write the line of text at the current Y position, starting from left margin
    }
    currentY += lineHeight; // Move Y position down for next line, even if current line is empty (to preserve paragraph spacing)
  });

  // Save the PDF with a clean filename
  const sanitizedTitle = cleanTitle
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_') // Replace non-alphanumeric characters with underscores
    .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
  const fileName = sanitizedTitle ? `${sanitizedTitle}.pdf` : 'note.pdf';
  doc.save(fileName); // Trigger the download of the generated PDF file with the specified filename
};
