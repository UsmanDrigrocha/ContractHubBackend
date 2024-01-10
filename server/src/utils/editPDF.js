const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs').promises;

const main = async () => {
  try {
    // Read the existing PDF file
    const pdfBytes = await fs.readFile('white.pdf');

    // Load the existing PDF
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Get the first page of the PDF
    const firstPage = pdfDoc.getPages()[0];

    // Add text to the page
    const { width, height } = firstPage.getSize();
    const fontSize = 30;
    const text = 'Test_LLC';

    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const textWidth = helveticaBoldFont.widthOfTextAtSize(text, fontSize);

    const textX = (width - textWidth) / 2;
    const textY = height / 2; // Adjust the Y coordinate as needed

    firstPage.drawText(text, {
      x: textX,
      y: textY,
      size: fontSize,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0), // Black color
    });

    // Save the modified PDF to a new file
    const modifiedPdfBytes = await pdfDoc.save();
    await fs.writeFile('output_new.pdf', modifiedPdfBytes);

    console.log('PDF updated successfully!');
  } catch (error) {
    console.error('Error:', error.message);
  }
};

main();
