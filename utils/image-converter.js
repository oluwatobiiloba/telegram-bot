const { BlobServiceClient } = require('@azure/storage-blob');
const uuid = require('uuid');
async function bufferToUrl(buffer, fileName) {
    try {
        const blobServiceClient = BlobServiceClient.fromConnectionString(
            process.env.AZURE_STORAGE_CONNECTION_STRING
        );
        const containerClient = blobServiceClient.getContainerClient('images');
        const blockBlobClient = containerClient.getBlockBlobClient(fileName);

       await blockBlobClient.uploadData(buffer, {
            blobHTTPHeaders: {
                blobContentType: "image/png",
            },
            fileName,
            });

        return blockBlobClient.url;
    } catch (error) {
        throw error;
    }
}

function binaryToBuffer(binary) {
    const buffer = Buffer.from(binary);
    return buffer;
}

async function binaryUpload(binary) {
    let buffer;
    if (!Buffer.isBuffer(binary)) {
        buffer = binaryToBuffer(binary);
    } else {
        buffer = binary;
    }
    const fileName = `Maya_generated_${uuid.v4()}.png`;
    const url = await bufferToUrl(buffer,fileName);
    return url;
}

module.exports = {
    bufferToUrl,
    binaryToBuffer,
    binaryUpload
};
