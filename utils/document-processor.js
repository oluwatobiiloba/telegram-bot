const axios = require('axios');
const pdfParse = require('pdf-parse');
const { BlobServiceClient } = require('@azure/storage-blob');
const { jsPDF } = require('jspdf');

module.exports = {
  async retrieveDocument({fileUrl, body, file}) {
    try {

      const fileResponse = await axios.get(fileUrl, { responseType: 'arraybuffer' });

      const text = await pdfParse(fileResponse.data);

      let fileName = body.message?.document?.file_name;

      if (!fileName) {
        fileName = `${file?.document?.file_name || 'MAYA_DOC'}_${Date.now()}`;
      }
      const textInput = text.text;

      return { textInput, fileName };
    } catch (error) {
      throw error;
    }
  },

  createPDF(data) {
    try {
      const doc = new jsPDF();
      doc.setFontSize(12);
      doc.setLineHeightFactor(1.2);

      // split the text into an array of lines
      const textLines = doc.splitTextToSize(data, doc.internal.pageSize.width - 20);

      // loop over the lines and add them to the PDF
      let y = 10;
      for (let i = 0; i < textLines.length; i++) {
        // calculate the y position based on the current page
        const pageHeight = doc.internal.pageSize.height - 20;
        const contentHeight = doc.getTextDimensions(textLines[i]).h;
        const remainingHeight = pageHeight - y;

        if (contentHeight > remainingHeight) {
          doc.addPage();
          y = 10;
        }
        y += doc.getLineHeightFactor();

        if (y > pageHeight) {
          doc.addPage();
          y = 10;
        }

        doc.text(textLines[i], 10, y);

        y += contentHeight + doc.getLineHeightFactor();
      }

      const pdf = doc.output('arraybuffer');

      return pdf;
    } catch (error) {
      throw error;
    }
  },

  async uploadToBlob(pdf, fileName) {
    try {
      const blobServiceClient = BlobServiceClient.fromConnectionString(
        process.env.AZURE_STORAGE_CONNECTION_STRING
      );
      const containerClient = blobServiceClient.getContainerClient('pdf');
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);

      await blockBlobClient.upload(pdf, pdf.byteLength, {
        blobHTTPHeaders: { blobContentType: 'application/pdf' },
        fileName,
      });

      return blockBlobClient.url;
    } catch (error) {
      throw error;
    }
  },
};
