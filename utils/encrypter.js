const crypto = require('crypto');
const { createCipheriv, createDecipheriv } = require('crypto');
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

module.exports = {
  encrypt(data) {
    const iv = crypto.randomBytes(16);

    const cipher = createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

    let encryptedData = cipher.update(data, 'utf8', 'hex');
    encryptedData += cipher.final('hex');

    return {
      iv: iv.toString('hex'), // Convert the IV to a string for storage
      encryptedData,
    };
  },

  decrypt(encryptedData, iv) {
    const decipher = createDecipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      Buffer.from(iv, 'hex')
    );

    let data = decipher.update(encryptedData, 'hex', 'utf8');
    data += decipher.final('utf8');

    return data;
  },
};
