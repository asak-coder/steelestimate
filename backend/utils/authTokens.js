const crypto = require('crypto');

const hashToken = (token) =>
  crypto
    .createHash('sha256')
    .update(String(token || ''))
    .digest('hex');

const hashDevice = ({ ip = '', userAgent = '' }) =>
  crypto
    .createHash('sha256')
    .update(`${ip}|${userAgent}`)
    .digest('hex');

module.exports = {
  hashToken,
  hashDevice
};
