import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Converts an image import (URL or base64) to a base64 data-URL usable by
// jsPDF.addImage.  Works with Vite's asset imports (which return a URL string)
// as well as raw base64 strings.
async function loadImageAsBase64(src) {
  if (!src) return null;
  // Already a data-URL or raw base64 – use as-is.
  if (src.startsWith('data:')) return src;
  try {
    const response = await fetch(src);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────────────────────

/**
 * Generate and download a professional PDF evaluation report.
 *
 * @param {object} opts
 * @param {string}   opts.studentName
 * @param {string}   opts.studentNumber
 * @param {string}   opts.program
 * @param {string}   opts.yearSection
 * @param {string}   opts.academicYear
 * @param {string}   opts.semester
 * @param {string}   opts.gwa
 * @param {string}   opts.dateIssued
 * @param {Array}    opts.groupedSubjects – array of { label, subjects[] }
 * @param {Function} opts.getRemarks      – (grade) => string
 * @param {string}   [opts.sealImageSrc]  – imported logo asset URL
 * @param {string}   [opts.filename]      – download filename
 * @param {string}   [opts.evaluationType] – optional evaluation type label
 */
export async function generateEvaluationPdf(opts) {
  const {
    studentName = '—',
    studentNumber = '—',
    program = '—',
    yearSection = '—',
    academicYear = '—',
    semester = '—',
    gwa = '—',
    dateIssued = new Date().toLocaleDateString(),
    groupedSubjects = [],
    getRemarks,
    sealImageSrc,
    filename = `evaluation_report_${studentNumber}.pdf`,
    evaluationType
  } = opts;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const marginL = 18;
  const marginR = 18;
  const contentW = pageW - marginL - marginR;

  // Colours
  const MAROON = [125, 25, 36];        // #7D1924
  const DARK = [15, 23, 42];           // slate-900
  const GRAY = [100, 116, 139];        // slate-500
  const LIGHT_GRAY = [226, 232, 240];  // slate-200
  const WHITE = [255, 255, 255];

  let y = 14;

  // ── Logo ──────────────────────────────────────────────────────────────────
  const logoBase64 = await loadImageAsBase64(sealImageSrc);
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', marginL, y, 16, 16);
    } catch { /* skip if image fails */ }
  }

  // ── Letterhead ────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...MAROON);
  doc.text('The Last Salle University', pageW / 2, y + 6, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.setFont('helvetica', 'normal');
  doc.text('Office of the University Registrar', pageW / 2, y + 11, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text('Student Academic Evaluation Report', pageW / 2, y + 16, { align: 'center' });

  y += 20;

  // Divider line
  doc.setDrawColor(...MAROON);
  doc.setLineWidth(0.6);
  doc.line(marginL, y, pageW - marginR, y);
  y += 6;

  // ── Student Information Block ─────────────────────────────────────────────
  const infoLeft = [
    ['Student Name', studentName],
    ['Program', program],
    ['Academic Year', academicYear]
  ];
  const infoRight = [
    ['Student Number', studentNumber],
    ['Year & Section', yearSection],
    ['Semester', semester]
  ];

  if (evaluationType) {
    infoLeft.push(['Evaluation Type', evaluationType]);
  }
  infoLeft.push(['Date Issued', dateIssued]);

  const halfW = contentW / 2;
  const drawInfoColumn = (items, xBase, yStart) => {
    let cy = yStart;
    items.forEach(([label, value]) => {
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...GRAY);
      doc.text(label.toUpperCase(), xBase, cy);
      cy += 3.5;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...DARK);
      doc.text(String(value), xBase, cy);
      cy += 5.5;
    });
    return cy;
  };

  const leftEnd = drawInfoColumn(infoLeft, marginL, y);
  drawInfoColumn(infoRight, marginL + halfW, y);
  y = Math.max(leftEnd, y + infoRight.length * 9) + 2;

  // Thin divider
  doc.setDrawColor(...LIGHT_GRAY);
  doc.setLineWidth(0.3);
  doc.line(marginL, y, pageW - marginR, y);
  y += 5;

  // ── Evaluation Table ──────────────────────────────────────────────────────
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...MAROON);
  doc.text('Evaluation Results', marginL, y);
  y += 5;

  groupedSubjects.forEach((group) => {
    // Check if we need a new page (header + at least one row)
    if (y > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      y = 16;
    }

    // Term label
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...MAROON);
    doc.text(String(group.label || '').toUpperCase(), marginL, y);
    y += 2;

    const tableBody = group.subjects.map((s) => [
      s.subjectCode || '—',
      s.subjectTitle || '—',
      String(s.units ?? '—'),
      s.grade || '—',
      getRemarks ? getRemarks(s.grade) : '—'
    ]);

    doc.autoTable({
      startY: y,
      margin: { left: marginL, right: marginR },
      head: [['Subject Code', 'Subject Name', 'Units', 'Grade', 'Remarks']],
      body: tableBody,
      styles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        lineColor: LIGHT_GRAY,
        lineWidth: 0.2,
        textColor: DARK,
        font: 'helvetica'
      },
      headStyles: {
        fillColor: [248, 250, 252],
        textColor: GRAY,
        fontStyle: 'bold',
        fontSize: 6.5,
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 28, fontStyle: 'bold' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 16, halign: 'center' },
        3: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
        4: { cellWidth: 30, fontSize: 6.5 }
      },
      theme: 'grid',
      didDrawPage: () => {}
    });

    y = doc.lastAutoTable.finalY + 5;
  });

  // ── GWA Row ───────────────────────────────────────────────────────────────
  if (y > doc.internal.pageSize.getHeight() - 30) {
    doc.addPage();
    y = 16;
  }

  doc.setFillColor(234, 240, 235);
  doc.roundedRect(marginL, y, contentW, 12, 2, 2, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...MAROON);
  doc.text('GENERAL WEIGHTED AVERAGE (GWA)', marginL + 5, y + 7.5);
  doc.setFontSize(14);
  doc.text(String(gwa), pageW - marginR - 5, y + 8, { align: 'right' });
  y += 18;

  // ── Footer ────────────────────────────────────────────────────────────────
  const footerY = Math.max(y + 20, doc.internal.pageSize.getHeight() - 40);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...GRAY);
  doc.text('* Not valid without university seal.', marginL, footerY);

  // Signature line
  const sigLineX = pageW - marginR - 55;
  doc.setDrawColor(...LIGHT_GRAY);
  doc.setLineWidth(0.3);
  doc.line(sigLineX, footerY + 10, pageW - marginR, footerY + 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  const sigCenterX = sigLineX + (pageW - marginR - sigLineX) / 2;
  doc.text('University Registrar', sigCenterX, footerY + 14, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...GRAY);
  doc.text('Authorized Signature', sigCenterX, footerY + 17.5, { align: 'center' });

  // ── Save ──────────────────────────────────────────────────────────────────
  doc.save(filename);
}
