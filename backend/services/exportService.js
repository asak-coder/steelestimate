const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

function toNumber(value, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatNumber(value, digits = 2) {
  return toNumber(value, 0).toFixed(digits);
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function sanitizeFilenamePart(value) {
  return String(value || '')
    .trim()
    .replace(/[^\w\-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function normalizeProject(project) {
  const plainProject = typeof project?.toObject === 'function' ? project.toObject() : project || {};
  const items = Array.isArray(plainProject.items) ? plainProject.items : [];

  const normalizedItems = items.map((item, index) => {
    const weight = toNumber(item?.weight, 0);
    const amount = toNumber(item?.cost, 0);
    const qtyCandidate = item?.quantity ?? item?.dimensions?.quantity ?? item?.dimensions?.qty ?? 1;
    const qty = Math.max(1, Math.floor(toNumber(qtyCandidate, 1)));
    const rate = weight > 0 ? amount / weight : 0;

    return {
      item: item?.section
        ? `${item?.type || 'Item'} - ${item.section}`
        : item?.type || `Item ${index + 1}`,
      qty,
      weight,
      rate,
      amount,
    };
  });

  const totalWeight = toNumber(
    plainProject.totalWeight,
    normalizedItems.reduce((sum, row) => sum + row.weight, 0)
  );
  const totalAmount = toNumber(
    plainProject.totalCost,
    normalizedItems.reduce((sum, row) => sum + row.amount, 0)
  );

  return {
    companyName: 'A K ENGINEERING',
    projectName: plainProject.projectName || 'BOQ Export',
    projectId: String(plainProject._id || plainProject.id || ''),
    createdAt: plainProject.createdAt || null,
    updatedAt: plainProject.updatedAt || null,
    items: normalizedItems,
    totalWeight,
    totalAmount,
  };
}

function getTableRows(data) {
  const rows = [
    ['Item', 'Qty', 'Weight', 'Rate', 'Amount'],
    ...data.items.map((row) => [
      row.item,
      String(row.qty),
      formatNumber(row.weight),
      formatNumber(row.rate),
      formatNumber(row.amount),
    ]),
    ['TOTAL', '', formatNumber(data.totalWeight), '', formatNumber(data.totalAmount)],
  ];

  return rows;
}

function drawPageHeader(doc, data) {
  doc
    .fillColor('#0f172a')
    .fontSize(20)
    .font('Helvetica-Bold')
    .text(data.companyName, { align: 'center' });

  doc
    .moveDown(0.4)
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('BOQ Export', { align: 'center' });

  doc
    .moveDown(0.8)
    .fontSize(11)
    .font('Helvetica')
    .fillColor('#334155')
    .text(`Project Name: ${data.projectName || '-'}`)
    .text(`Project ID: ${data.projectId || '-'}`)
    .text(`Generated On: ${formatDate(new Date())}`)
    .text(`Created At: ${formatDate(data.createdAt)}`);

  doc.moveDown(0.8);
}

function drawTableHeader(doc, startY, columnPositions, columnWidths) {
  const headerHeight = 24;
  doc.save();
  doc.rect(40, startY, columnWidths.reduce((sum, width) => sum + width, 0), headerHeight).fill('#e2e8f0');
  doc.restore();

  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(10);

  const headers = ['Item', 'Qty', 'Weight', 'Rate', 'Amount'];
  headers.forEach((header, index) => {
    const x = columnPositions[index];
    const width = columnWidths[index];
    doc.text(header, x + 6, startY + 7, {
      width: width - 12,
      align: index === 0 ? 'left' : 'right',
    });
  });

  return startY + headerHeight;
}

function drawTableRow(doc, row, y, columnPositions, columnWidths, isTotal = false) {
  const height = isTotal ? 24 : 22;
  const rowFill = isTotal ? '#f1f5f9' : '#ffffff';

  doc.save();
  doc.rect(40, y, columnWidths.reduce((sum, width) => sum + width, 0), height).fill(rowFill);
  doc.restore();

  doc.fillColor('#0f172a').fontSize(10).font(isTotal ? 'Helvetica-Bold' : 'Helvetica');

  row.forEach((cell, index) => {
    const x = columnPositions[index];
    const width = columnWidths[index];
    doc.text(String(cell), x + 6, y + 6, {
      width: width - 12,
      align: index === 0 ? 'left' : 'right',
    });
  });

  return y + height;
}

async function generatePDF(project) {
  const data = normalizeProject(project);
  const doc = new PDFDocument({
    size: 'A4',
    margins: {
      top: 40,
      bottom: 40,
      left: 40,
      right: 40,
    },
  });

  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  const bufferPromise = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  drawPageHeader(doc, data);

  const columnWidths = [220, 50, 80, 80, 80];
  const columnPositions = [40, 260, 310, 390, 470];

  let y = doc.y + 10;
  y = drawTableHeader(doc, y, columnPositions, columnWidths);

  data.items.forEach((row) => {
    const rowHeight = 22;
    if (y + rowHeight > doc.page.height - 60) {
      doc.addPage();
      drawPageHeader(doc, data);
      y = doc.y + 10;
      y = drawTableHeader(doc, y, columnPositions, columnWidths);
    }

    y = drawTableRow(
      doc,
      [row.item, String(row.qty), formatNumber(row.weight), formatNumber(row.rate), formatNumber(row.amount)],
      y,
      columnPositions,
      columnWidths,
      false
    );
  });

  if (y + 28 > doc.page.height - 60) {
    doc.addPage();
    drawPageHeader(doc, data);
    y = doc.y + 10;
  }

  y += 8;
  y = drawTableRow(
    doc,
    ['TOTAL', '', formatNumber(data.totalWeight), '', formatNumber(data.totalAmount)],
    y,
    columnPositions,
    columnWidths,
    true
  );

  doc
    .moveDown(1.5)
    .fontSize(11)
    .fillColor('#334155')
    .font('Helvetica')
    .text('Prepared for client submission.', {
      align: 'left',
    });

  doc.end();
  return bufferPromise;
}

async function generateExcel(project) {
  const data = normalizeProject(project);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SteelEstimate';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('BOQ Export', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  worksheet.columns = [
    { header: 'Item', key: 'item', width: 38 },
    { header: 'Qty', key: 'qty', width: 10 },
    { header: 'Weight', key: 'weight', width: 14 },
    { header: 'Rate', key: 'rate', width: 14 },
    { header: 'Amount', key: 'amount', width: 16 },
  ];

  worksheet.mergeCells('A1:E1');
  worksheet.getCell('A1').value = 'A K ENGINEERING';
  worksheet.getCell('A1').font = { bold: true, size: 16 };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };

  worksheet.mergeCells('A2:E2');
  worksheet.getCell('A2').value = `Project: ${data.projectName || '-'}`;
  worksheet.getCell('A2').alignment = { horizontal: 'center' };

  worksheet.mergeCells('A3:E3');
  worksheet.getCell('A3').value = `Generated On: ${formatDate(new Date())}`;
  worksheet.getCell('A3').alignment = { horizontal: 'center' };

  worksheet.addRow([]);
  worksheet.addRow(['Item', 'Qty', 'Weight', 'Rate', 'Amount']);

  const headerRow = worksheet.getRow(5);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE2E8F0' },
  };
  headerRow.alignment = { horizontal: 'center' };

  data.items.forEach((row) => {
    worksheet.addRow({
      item: row.item,
      qty: row.qty,
      weight: toNumber(row.weight, 0),
      rate: toNumber(row.rate, 0),
      amount: toNumber(row.amount, 0),
    });
  });

  const totalRow = worksheet.addRow({
    item: 'TOTAL',
    qty: '',
    weight: toNumber(data.totalWeight, 0),
    rate: '',
    amount: toNumber(data.totalAmount, 0),
  });

  totalRow.font = { bold: true };
  totalRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF1F5F9' },
  };

  worksheet.eachRow((row, rowNumber) => {
    row.alignment = rowNumber >= 5 ? { vertical: 'middle' } : { horizontal: 'center' };
  });

  worksheet.getColumn('weight').numFmt = '0.00';
  worksheet.getColumn('rate').numFmt = '0.00';
  worksheet.getColumn('amount').numFmt = '0.00';

  worksheet.views = [{ state: 'frozen', ySplit: 5 }];

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function buildExportFilename(project, format) {
  const data = normalizeProject(project);
  const suffix = sanitizeFilenamePart(data.projectName || 'boq-export') || 'boq-export';
  const extension = format === 'excel' ? 'xlsx' : 'pdf';
  return `${suffix}.${extension}`;
}

module.exports = {
  generatePDF,
  generateExcel,
  buildExportFilename,
  normalizeProject,
};
