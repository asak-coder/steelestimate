const PDFDocument = require('pdfkit');

const roundToTwo = (value) => Math.round(value * 100) / 100;

const formatNumber = (value) => {
    const numericValue = typeof value === 'number' ? value : Number(value || 0);

    return roundToTwo(numericValue).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

const addLabelValue = (doc, label, value) => {
    doc
        .font('Helvetica-Bold')
        .text(`${label}: `, {
            continued: true
        })
        .font('Helvetica')
        .text(value || 'N/A');
};

const addSectionTitle = (doc, title) => {
    doc
        .moveDown(0.8)
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor('#0F172A')
        .text(title)
        .moveDown(0.3);

    doc
        .strokeColor('#CBD5E1')
        .lineWidth(1)
        .moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .stroke()
        .moveDown(0.6);

    doc.fontSize(10).fillColor('#111827').font('Helvetica');
};

const addBulletLine = (doc, text) => {
    doc.text(`• ${text}`, {
        indent: 12
    });
};

const generateQuotationPdf = async ({
    clientDetails = {},
    input = {},
    calc = {},
    boq = {},
    cost = {},
    quotationText = ''
}) => {
    const doc = new PDFDocument({
        size: 'A4',
        margin: 50
    });

    const chunks = [];

    return new Promise((resolve, reject) => {
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc
            .font('Helvetica-Bold')
            .fontSize(20)
            .fillColor('#0F172A')
            .text('A K ENGINEERING', {
                align: 'left'
            });

        doc
            .moveDown(0.2)
            .font('Helvetica')
            .fontSize(10)
            .fillColor('#475569')
            .text('Pre-Engineered Building Solutions', {
                align: 'left'
            });

        doc
            .moveDown(0.8)
            .font('Helvetica-Bold')
            .fontSize(16)
            .fillColor('#111827')
            .text('Budgetary Quotation', {
                align: 'left'
            });

        doc
            .moveDown(0.3)
            .font('Helvetica')
            .fontSize(10)
            .fillColor('#374151')
            .text(`Date: ${new Date().toLocaleDateString('en-IN')}`);

        addSectionTitle(doc, 'Client Details');
        addLabelValue(doc, 'Client Name', clientDetails.clientName);
        addLabelValue(doc, 'Phone', clientDetails.phone);
        addLabelValue(doc, 'Email', clientDetails.email);

        addSectionTitle(doc, 'Project Inputs');
        addLabelValue(doc, 'Location', input.location);
        addLabelValue(doc, 'Length', `${formatNumber(input.length)} m`);
        addLabelValue(doc, 'Width', `${formatNumber(input.width)} m`);
        addLabelValue(doc, 'Height', `${formatNumber(input.height)} m`);
        addLabelValue(doc, 'Crane Provision', input.crane ? 'Yes' : 'No');
        addLabelValue(
            doc,
            'Crane Capacity',
            typeof input.craneCapacity === 'number' ? `${formatNumber(input.craneCapacity)} MT` : 'N/A'
        );

        addSectionTitle(doc, 'Design & Quantity Summary');
        addLabelValue(doc, 'Area', `${formatNumber(calc.areaSqm)} sqm / ${formatNumber(calc.areaSqft)} sqft`);
        addLabelValue(doc, 'Steel Rate', `${formatNumber(calc.steelRatePerSqm)} kg/sqm`);
        addLabelValue(doc, 'Estimated Steel Weight', `${formatNumber(calc.estimatedSteelWeightKg)} kg`);
        addLabelValue(doc, 'Primary Steel', `${formatNumber(boq.primarySteelKg)} kg`);
        addLabelValue(doc, 'Secondary Steel', `${formatNumber(boq.secondarySteelKg)} kg`);
        addLabelValue(doc, 'Roof Sheeting', `${formatNumber(boq.roofSheetingSqm)} sqm`);

        addSectionTitle(doc, 'Commercial Summary');
        addLabelValue(doc, 'Primary Steel Total', `INR ${formatNumber(cost.totals && cost.totals.primarySteel)}`);
        addLabelValue(doc, 'Secondary Steel Total', `INR ${formatNumber(cost.totals && cost.totals.secondarySteel)}`);
        addLabelValue(doc, 'Sheeting Total', `INR ${formatNumber(cost.totals && cost.totals.sheeting)}`);
        addLabelValue(doc, 'Grand Total', `INR ${formatNumber(cost.grandTotal)}`);
        addLabelValue(doc, 'Cost Per Sqft', `INR ${formatNumber(cost.costPerSqft)}`);

        addSectionTitle(doc, 'Proposal');
        doc
            .font('Helvetica')
            .fontSize(10)
            .fillColor('#111827')
            .text(
                quotationText ||
                    'Quotation narrative is currently unavailable. Please refer to the commercial summary and project inputs for the preliminary estimate.',
                {
                    align: 'justify',
                    lineGap: 3
                }
            );

        addSectionTitle(doc, 'Terms & Conditions');
        addBulletLine(doc, 'This quotation is budgetary in nature and subject to final design, detailing, and management approval.');
        addBulletLine(doc, 'Final price may vary based on applicable taxes, freight, unloading, erection scope, and client-approved technical specifications.');
        addBulletLine(doc, 'Any change in geometry, loading data, crane requirements, or project location may impact the final offer.');
        addBulletLine(doc, 'The bill of quantities and pricing are based on preliminary inputs and should be validated during detailed engineering.');
        addBulletLine(doc, 'Delivery schedule and payment terms shall be confirmed separately at the time of order finalization.');

        doc
            .moveDown(1)
            .font('Helvetica')
            .fontSize(10)
            .fillColor('#374151')
            .text('Thank you for considering A K ENGINEERING for your project requirements.', {
                align: 'left'
            });

        doc.end();
    });
};

module.exports = {
    generateQuotationPdf
};