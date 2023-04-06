const axios = require('axios');
const cosmo_surfer = require('./cosmo_util');
const pdfParse = require('pdf-parse');
const { BlobServiceClient } = require("@azure/storage-blob")
const openAI_API = axios.create({
    baseURL: process.env.OPEN_AI_URL,
    headers: { Authorization: `Bearer ${process.env.OPEN_AI_TOKEN}` },
});

const { jsPDF } = require('jspdf');

module.exports = {
    async retrieve_document(context, body, bot, is_resume) {
        try {
            const chatId = body.message.chat.id;
            const fileId = body.message.document.file_id;
            const fileName = body.message.document.file_name;


            const fileUrl = await bot.getFileLink(fileId);
            const fileResponse = await axios.get(fileUrl, { responseType: 'arraybuffer' });

            const text = await pdfParse(fileResponse.data);
            let text_input = text.text

            await bot.sendMessage(chatId, `I'm reading your ${is_resume ? "resume" : "document"}!🤖🤖`);
            return { text_input, fileName, chatId };
        } catch (error) {
            context.error(error);
        }
    },

    async openai_prompt(context, text, bot, is_resume, chatId) {
        const prompts = {
            resume: `Improve the resume below. Add a professional summary that emphasizes the skills relevant to the educational background, role, and experience. Highlight. Ensure your response does not contain characters that cannot be encoded by common text encodings. ${text}`,
            documents: `Improve the writeup below. Ensure your response does not contain characters that cannot be encoded by common text encodings.  ${text}`
        }

        try {
            const openaiPromptMessage = is_resume ? prompts.resume : prompts.documents;
            const cleanText = openaiPromptMessage.replace(/[^\x00-\x7F]/g, '-').replace(/[\u2022-\u2027\u25AA-\u25FF]/g, '-');

            const file_response = await openAI_API.post('/chat/completions', {
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: cleanText }],
            });

            await bot.sendMessage(chatId, `I'm writing your ${is_resume ? "resume" : "document"}!🤖🤖`);
            return file_response
        } catch (error) {
            context.error(error);
        }
    },

    async create_pdf(context, resume, bot, chatId) {
        try {
            const doc = new jsPDF();
            doc.setFontSize(12);
            doc.setLineHeightFactor(1.2);

            // split the text into an array of lines
            const textLines = doc.splitTextToSize(resume, doc.internal.pageSize.width - 20);

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

            const modifiedPdfBytes = doc.output('arraybuffer')
            await bot.sendMessage(chatId, "Almost done!🤖🤖");
            return modifiedPdfBytes
        } catch (error) {
            context.error(error);
        }
    },

    async upload_to_blob(context, modifiedPdfBytes, fileName, bot, chatId) {
        try {
            const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
            const containerName = 'pdf';
            const containerClient = blobServiceClient.getContainerClient(containerName);
            const blobName = fileName;
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);
            await bot.sendMessage(chatId, `Uploading ☁️☁️`);
            await blockBlobClient.upload(modifiedPdfBytes, modifiedPdfBytes.byteLength, {
                blobHTTPHeaders: { blobContentType: 'application/pdf' },
                fileName: fileName
            });
            const blobUrl = blockBlobClient.url;

            return blobUrl
        } catch (error) {
            context.error(error);
        }
    }
}