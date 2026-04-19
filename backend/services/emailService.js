let nodemailer;
try {
    nodemailer = require('nodemailer');
} catch (error) {
    nodemailer = null;
}

const DEFAULT_FROM_NAME = 'A K ENGINEERING';
const DEFAULT_FROM_EMAIL = process.env.EMAIL_USER || '';

const isValidEmail = (email) => {
    if (typeof email !== 'string') {
        return false;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

const getTransporter = () => {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
        const error = new Error('Email service is not configured. Missing EMAIL_USER or EMAIL_PASS.');
        error.code = 'EMAIL_SERVICE_NOT_CONFIGURED';
        throw error;
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user,
            pass
        }
    });
};

const buildFromAddress = () => {
    if (DEFAULT_FROM_EMAIL) {
        return `"${DEFAULT_FROM_NAME}" <${DEFAULT_FROM_EMAIL}>`;
    }

    return DEFAULT_FROM_NAME;
};

const normalizeAttachments = (attachments) => {
    if (!Array.isArray(attachments)) {
        return [];
    }

    return attachments
        .filter(Boolean)
        .map((attachment) => {
            if (Buffer.isBuffer(attachment.content)) {
                return attachment;
            }

            return {
                ...attachment,
                content: attachment.content
            };
        });
};

const sendEmail = async ({ to, subject, text, html, attachments = [], replyTo }) => {
    if (!isValidEmail(to)) {
        const error = new Error('A valid recipient email address is required.');
        error.code = 'INVALID_RECIPIENT_EMAIL';
        throw error;
    }

    const transporter = getTransporter();
    const message = {
        from: buildFromAddress(),
        to: to.trim(),
        subject,
        text,
        html,
        attachments: normalizeAttachments(attachments)
    };

    if (replyTo && isValidEmail(replyTo)) {
        message.replyTo = replyTo.trim();
    }

    try {
        const info = await transporter.sendMail(message);

        return {
            success: true,
            messageId: info.messageId,
            accepted: info.accepted || [],
            rejected: info.rejected || []
        };
    } catch (error) {
        const wrappedError = new Error(`Failed to send email to ${to}: ${error.message}`);
        wrappedError.code = 'EMAIL_SEND_FAILED';
        wrappedError.cause = error;
        throw wrappedError;
    }
};

const buildQuotationEmailTemplate = ({ clientName, quotationRef, quotationSummary }) => {
    const safeClientName = clientName || 'Client';
    const safeQuotationRef = quotationRef || 'quotation';
    const safeSummary = quotationSummary || 'Please find the attached quotation PDF for your review.';

    return {
        subject: `Your Quotation from A K ENGINEERING - ${safeQuotationRef}`,
        text: [
            `Dear ${safeClientName},`,
            '',
            safeSummary,
            '',
            'Please find the attached quotation PDF.',
            '',
            'Regards,',
            'A K ENGINEERING'
        ].join('\n'),
        html: [
            `<p>Dear ${safeClientName},</p>`,
            `<p>${safeSummary}</p>`,
            '<p>Please find the attached quotation PDF.</p>',
            '<p>Regards,<br/>A K ENGINEERING</p>'
        ].join('')
    };
};

const sendQuotationEmail = async ({
    to,
    clientName,
    quotationRef,
    quotationSummary,
    pdfBuffer,
    fileName = 'quotation.pdf',
    replyTo
}) => {
    const template = buildQuotationEmailTemplate({
        clientName,
        quotationRef,
        quotationSummary
    });

    const attachments = [];

    if (pdfBuffer) {
        attachments.push({
            filename: fileName,
            content: pdfBuffer,
            contentType: 'application/pdf'
        });
    }

    return sendEmail({
        to,
        subject: template.subject,
        text: template.text,
        html: template.html,
        attachments,
        replyTo
    });
};

const sendInternalNotificationEmail = async ({
    to,
    subject,
    message,
    html,
    attachments = []
}) => {
    const internalTo = to || process.env.EMAIL_USER;

    if (!isValidEmail(internalTo)) {
        const error = new Error('A valid internal notification email address is required.');
        error.code = 'INVALID_INTERNAL_EMAIL';
        throw error;
    }

    const safeSubject = subject || 'New Quotation Notification';
    const safeText = message || 'A new quotation has been generated.';
    const safeHtml = html || `<p>${safeText}</p>`;

    return sendEmail({
        to: internalTo,
        subject: safeSubject,
        text: safeText,
        html: safeHtml,
        attachments
    });
};

module.exports = {
    sendEmail,
    sendQuotationEmail,
    sendInternalNotificationEmail,
    getTransporter,
    isValidEmail
};
