const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const getWhatsAppConfig = () => {
    const apiUrl = process.env.WHATSAPP_API_URL;
    const token = process.env.WHATSAPP_TOKEN;

    if (!isNonEmptyString(apiUrl) || !isNonEmptyString(token)) {
        const error = new Error('WhatsApp service is not configured. Missing WHATSAPP_API_URL or WHATSAPP_TOKEN.');
        error.code = 'WHATSAPP_SERVICE_NOT_CONFIGURED';
        throw error;
    }

    return {
        apiUrl: apiUrl.trim().replace(/\/+$/, ''),
        token: token.trim()
    };
};

const buildRequestHeaders = (token) => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
});

const buildWhatsAppTextPayload = ({ to, message }) => ({
    to,
    type: 'text',
    text: {
        body: message
    }
});

const buildWhatsAppDocumentPayload = ({ to, message, pdfUrl, mediaId, fileName = 'quotation.pdf' }) => {
    if (isNonEmptyString(mediaId)) {
        return {
            to,
            type: 'document',
            document: {
                id: mediaId.trim(),
                filename: fileName
            }
        };
    }

    const document = {
        filename: fileName
    };

    if (isNonEmptyString(pdfUrl)) {
        document.link = pdfUrl.trim();
    }

    return {
        to,
        type: 'document',
        document,
        ...(isNonEmptyString(message)
            ? {
                  caption: message.trim()
              }
            : {})
    };
};

const parseResponseBody = async (response) => {
    const contentType = response.headers && response.headers.get ? response.headers.get('content-type') : '';

    if (contentType && contentType.includes('application/json')) {
        return response.json();
    }

    return response.text();
};

const sendWhatsAppRequest = async (payload) => {
    const { apiUrl, token } = getWhatsAppConfig();

    if (typeof fetch !== 'function') {
        const error = new Error('Global fetch is not available in this runtime.');
        error.code = 'FETCH_NOT_AVAILABLE';
        throw error;
    }

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: buildRequestHeaders(token),
        body: JSON.stringify(payload)
    });

    const responseBody = await parseResponseBody(response);

    if (!response.ok) {
        const error = new Error(`WhatsApp API request failed with status ${response.status}.`);
        error.code = 'WHATSAPP_API_REQUEST_FAILED';
        error.status = response.status;
        error.response = responseBody;
        throw error;
    }

    return responseBody;
};

const sendWhatsAppText = async ({ to, message }) => {
    if (!isNonEmptyString(to)) {
        const error = new Error('A valid WhatsApp recipient number is required.');
        error.code = 'INVALID_WHATSAPP_RECIPIENT';
        throw error;
    }

    if (!isNonEmptyString(message)) {
        const error = new Error('A WhatsApp message body is required.');
        error.code = 'INVALID_WHATSAPP_MESSAGE';
        throw error;
    }

    try {
        return await sendWhatsAppRequest(buildWhatsAppTextPayload({
            to: to.trim(),
            message: message.trim()
        }));
    } catch (error) {
        const wrappedError = new Error(`Failed to send WhatsApp text message to ${to}: ${error.message}`);
        wrappedError.code = 'WHATSAPP_TEXT_SEND_FAILED';
        wrappedError.cause = error;
        throw wrappedError;
    }
};

const sendWhatsAppDocument = async ({ to, message, pdfUrl, mediaId, fileName }) => {
    if (!isNonEmptyString(to)) {
        const error = new Error('A valid WhatsApp recipient number is required.');
        error.code = 'INVALID_WHATSAPP_RECIPIENT';
        throw error;
    }

    if (!isNonEmptyString(pdfUrl) && !isNonEmptyString(mediaId)) {
        const error = new Error('Either pdfUrl or mediaId is required to send a WhatsApp document.');
        error.code = 'INVALID_WHATSAPP_DOCUMENT';
        throw error;
    }

    try {
        return await sendWhatsAppRequest(
            buildWhatsAppDocumentPayload({
                to: to.trim(),
                message,
                pdfUrl,
                mediaId,
                fileName
            })
        );
    } catch (error) {
        const wrappedError = new Error(`Failed to send WhatsApp document to ${to}: ${error.message}`);
        wrappedError.code = 'WHATSAPP_DOCUMENT_SEND_FAILED';
        wrappedError.cause = error;
        throw wrappedError;
    }
};

const sendQuotationWhatsApp = async ({ to, clientName, quotationRef, message, pdfUrl, mediaId, fileName }) => {
    const safeClientName = clientName || 'Client';
    const safeQuotationRef = quotationRef || 'quotation';
    const safeMessage =
        message ||
        `Hello ${safeClientName}, your quotation ${safeQuotationRef} from A K ENGINEERING is ready. Please review the attached document.`;

    const results = {
        text: null,
        document: null
    };

    results.text = await sendWhatsAppText({
        to,
        message: safeMessage
    });

    if (isNonEmptyString(pdfUrl) || isNonEmptyString(mediaId)) {
        results.document = await sendWhatsAppDocument({
            to,
            message: safeMessage,
            pdfUrl,
            mediaId,
            fileName: fileName || 'quotation.pdf'
        });
    }

    return results;
};

module.exports = {
    sendWhatsAppText,
    sendWhatsAppDocument,
    sendQuotationWhatsApp,
    getWhatsAppConfig,
    buildWhatsAppTextPayload,
    buildWhatsAppDocumentPayload
};