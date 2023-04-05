// const { DefaultAzureCredential } = require("@azure/identity");
// const { BlobServiceClient } = require("@azure/storage-blob");
// //const { v1: uuidv1 } = require("uuid");
// const { Blob_cobtainers, User } = require('../models')
// require("dotenv").config();

// const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
// if (!accountName) throw Error('Azure Storage accountName not found');
// const credential = new DefaultAzureCredential()
// const blobServiceClient = new BlobServiceClient(
//     `https://${accountName}.blob.core.windows.net`,
//     credential
// );

// module.exports = {
//     create_container(name) {
//         return Blob_cobtainers.findOne({ where: { name } })
//             .then(async (container) => {
//                 if (!container) {
//                     const containerName = name
//                     // Get a reference to a container
//                     const containerClient = blobServiceClient.getContainerClient(containerName);
//                     // Create the container
//                     const created_container = await containerClient.create(containerName)
//                     const saved_container = JSON.stringify(created_container)
//                     return Blob_cobtainers.create({ name: containerName, ref: saved_container, url: containerClient.url });
//                 } else {
//                     return container
//                 }
//             }).then((container) => {
//                 container.message = `Container was created successfully.\n\trequestId:${container.ref.requestId}\n\tURL: ${container.url}`
//                 return container
//             }).catch((err) => {
//                 throw err
//             })

//     },
//     // An asynchronous function to create and upload a blob to Azure storage
//     create_upload_blob(stream, format, container_name, uploadOptions, username, user_id) {

//         // Finds the Blob container using its name
//         return Blob_cobtainers.findOne({ where: { name: container_name } })

//             // After finding it, create or use existing container and return it
//             .then((container) => {
//                 if (!container) {
//                     return this.create_container(container_name)
//                 } else {
//                     return container
//                 }
//             })

//             // After getting a reference to a Blob container, get a Block Blob client instance for the new Blob object, then upload it 
//             .then(async (container) => {

//                 // Create the blob name with user id, username, date and file extension
//                 const blobName = `${username}_${user_id}_${Date.now()}.${format.split('/')[1]}`

//                 // Get a reference to the container
//                 const containerClient = blobServiceClient.getContainerClient(container.name)

//                 // Get a block blob client instance
//                 const blockBlobClient = containerClient.getBlockBlobClient(blobName)

//                 // Upload stream to the Blob previously created with uploadStream method
//                 const uploadBlobResponse = await blockBlobClient.uploadStream(stream,
//                     uploadOptions.bufferSize, uploadOptions.maxBuffers,
//                     { blobHTTPHeaders: { blobContentType: format } })

//                 // Print details of uploaded Blob object
//                 console.log(`\nUploading to Azure storage as blob\n\tname: ${blobName}:\n\tURL: ${blockBlobClient.url}`)

//                 // Return uploaded request ID and URL
//                 return [uploadBlobResponse.requestId, blockBlobClient.url]
//             })

//             // Finally, modify User object profile_image property to link it to the recently uploaded Blob object
//             .then(async ([requestId, blobUrl]) => {

//                 // Modify User object's properties and update them in the database
//                 const meta = JSON.stringify({
//                     requestId
//                 })
//                 await User.update({ profile_image: blobUrl, meta }, { where: { id: user_id } })

//                 // Return the Blobs URL
//                 return blobUrl
//             })

//             // If there is an error uploading or modifying User object, throw the error and stop the function
//             .catch((err) => {
//                 throw err
//             })
//     },


//     async list_user_blob(containerName) {
//         const blobdata = {}
//         // List the blob(s) in the container.
//         const containerClient = blobServiceClient.getContainerClient(containerName)
//         const listBlobsResponse = await containerClient.listBlobFlatSegment();
//         for await (const blob of listBlobsResponse.segment.blobItems) {
//             // Get Blob Client from name, to get the URL
//             const tempBlockBlobClient = containerClient.getBlockBlobClient(blob.name);

//             // Display blob name and URL
//             console.log(
//                 `\n\tname: ${blob.name}\n\tURL: ${tempBlockBlobClient.url}\n`
//             );

//         }
//         if (listBlobsResponse.segment.blobItems.length) {
//             blobdata.items = listBlobsResponse.segment.blobItems;
//         }
//         return blobdata.items;

//     },
//     // Convert stream to text
//     async streamToText(readable) {
//         readable.setEncoding('utf8');
//         let data = '';
//         for await (const chunk of readable) {
//             data += chunk;
//         }
//         return data;
//     },


//     async download_blob(blobName, containerName) {
//         const containerClient = blobServiceClient.getContainerClient(containerName)
//         const blockBlobClient = containerClient.getBlockBlobClient(blobName);
//         const downloadBlockBlobResponse = await blockBlobClient.download(0);
//         console.log('\nDownloaded blob content...');
//         console.log(
//             '\t',
//             await this.streamToText(downloadBlockBlobResponse.readableStreamBody)
//         );
//     }
// }







