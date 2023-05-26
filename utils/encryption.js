const crypto = require('crypto');
const { createCipheriv, createDecipheriv } = require('crypto');
const { ENCRYPTION_KEY } = process.env


module.exports = {
    encryptRefreshToken(refreshToken) {
        const iv = crypto.randomBytes(16); 
        const cipher = createCipheriv('aes-256-cbc',Buffer.from(ENCRYPTION_KEY,'hex'), iv);
        let encryptedToken = cipher.update(refreshToken, 'utf8', 'hex');
        encryptedToken += cipher.final('hex');
        return {
            iv: iv.toString('hex'), // Convert the IV to a string for storage
            encryptedToken
          };
      },
      
    decryptRefreshToken(encryptedToken, iv) {
        const decipher = createDecipheriv('aes-256-cbc',Buffer.from(ENCRYPTION_KEY,'hex'), Buffer.from(iv, 'hex'));
        let decryptedToken = decipher.update(encryptedToken, 'hex', 'utf8');
        decryptedToken += decipher.final('utf8');
        return decryptedToken;
      }

}


