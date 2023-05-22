// // Import jsPDF library
// const { jsPDF } = require('jspdf');

// // // Create a new PDF document
// // const doc = new jsPDF({
// //     orientation: "portrait",
// //     unit: "mm",
// //     format: "a4",
// //     lineHeight: 2,
// //     fontSize: 16,
// //     pageMargins: [20, 20, 20, 20],
// //     putOnlyUsedFonts: true,
// //     floatPrecision: 16,
// //     precision: 2,
// // });

// // // Set the document properties
// // doc.setProperties({
// //     title: 'My PDF Document',
// //     subject: 'Converting text to PDF',
// //     author: 'Your Name',
// //     keywords: 'PDF, text, conversion'
// // });

// // // Split the text content into paragraphs

// let textContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.\nInteger fringilla urna ut lectus efficitur, a suscipit ex lobortis.\nFusce eget sapien ac quam ultrices consectetur id id nisi.\nSed vel orci justo. Donec efficitur, sapien at luctus rhoncus,\nnibh ex vestibulum metus, sit amet fringilla metus quam eget lacus.\nNam vel pharetra ipsum. Suspendisse potenti. Sed in eleifend tellus,\neu pharetra elit. Vestibulum auctor, dolor sit amet pretium iaculis,\naugue nulla gravida est, ut pulvinar ipsum dui nec lectus.\nNullam quis semper felis. Nunc vitae magna non enim interdum convallis\nvitae vel augue.\n\nAenean venenatis lacinia turpis, nec venenatis purus.\nVestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere\nCubilia Curae; Nam at neque enim. Morbi consequat velit in massa iaculis pharetra.\nInteger fringilla, metus vitae sollicitudin pretium, tellus risus iaculis nibh,\nvitae pretium augue tellus vel justo. Duis ac erat eu ex posuere euismod\nEget a lorem. Nulla consequat felis non tellus auctor, non accumsan elit vestibulum.\nDuis consectetur euismod magna, id ultricies dolor dapibus ac.\n\nSed eu turpis eget sapien pulvinar iaculis a a enim.\nPraesent at ullamcorper erat, vitae lacinia lacus.\nCurabitur fringilla euismod lectus, sed elementum augue aliquet a.\nNulla facilisi. Pellentesque imperdiet augue vel mi posuere, ac mattis arcu elementum.\nSuspendisse eget fermentum odio, quis tempor est.\nQuisque vel quam vitae nunc imperdiet sollicitudin vel ac dui.\nInteger bibendum, urna in lobortis molestie, est orci semper augue, vel facilisis mi augue sed mi.\nSed eget nisi vel purus euismod fermentum. Nam laoreet est vel elit blandit iaculis.\nAliquam id urna eget magna volutpat bibendum.\n\nMaecenas dictum urna at nisl volutpat, a sollicitudin quam bibendum.\nPraesent volutpat vel augue vel lacinia. Morbi at dolor tristique,\ncursus augue nec, dignissim sapien. Donec eu ligula nisl.\nPellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egest"

// // const paragraphs = textContent.split('\n');

// // // Add each paragraph to a new page in the PDF document
// // for (let i = 0; i < paragraphs.length; i++) {
// //     // Add a new page if necessary
// //     if (i > 0) {
// //         doc.addPage();
// //     }
// //     // Add the paragraph to the page
// //     doc.text(paragraphs[i], 10, 10);
// // }

// // // Save the PDF document to a file or display it in the browser
// // doc.save('my-document.pdf');
// // create a new jsPDF instance
// // create a new jsPDF instance

// // create a new jsPDF instance
// const doc = new jsPDF();

// // set the font size and line height
// doc.setFontSize(12);
// doc.setLineHeightFactor(1.2);

// // split the text into an array of lines
// const textLines = doc.splitTextToSize(textContent, doc.internal.pageSize.width - 20);
// console.log(textLines);
// // loop over the lines and add them to the PDF
// let y = 10;
// for (let i = 0; i < textLines.length; i++) {
//     // calculate the y position based on the current page
//     const totalPages = doc.getNumberOfPages();
//     const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
//     const pageHeight = doc.internal.pageSize.height - 20;
//     const contentHeight = doc.getTextDimensions(textLines[i]).h;
//     const remainingHeight = pageHeight - y;
//     if (contentHeight > remainingHeight) {
//         doc.addPage();
//         y = 10;
//     }
//     y += doc.getLineHeightFactor();
//     if (y > pageHeight) {
//         doc.addPage();
//         y = 10;
//     }
//     doc.text(textLines[i], 10, y);
//     y += contentHeight + doc.getLineHeightFactor();
// }

// // save the PDF to a blob and upload it to Azure blob storage
// doc.save('blob');
// // your code to upload the blob to Azure blob storage
