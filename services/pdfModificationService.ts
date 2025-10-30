// Fix: Add a global declaration for window.PDFLib to resolve TypeScript error.
declare global {
    interface Window {
        PDFLib: any;
    }
}
import { Edit, ImageEdit, RedactEdit, TextEdit } from '../App';

const fileToUint8Array = (file: File): Promise<Uint8Array> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            resolve(new Uint8Array(reader.result as ArrayBuffer));
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
};

export async function applyEditsAndReorder(
    originalPdfBytes: Uint8Array,
    edits: Edit[],
    pageOrder: number[], // 1-based page numbers
    password?: string
): Promise<Uint8Array> {
    const { PDFDocument, rgb, StandardFonts, PDFPermissions } = window.PDFLib;
    
    const pdfDoc = await PDFDocument.load(originalPdfBytes);
    const newPdfDoc = await PDFDocument.create();
    
    const originalPages = await newPdfDoc.copyPages(pdfDoc, pageOrder.map(n => n - 1));
    originalPages.forEach(page => newPdfDoc.addPage(page));

    const helveticaFont = await newPdfDoc.embedFont(StandardFonts.Helvetica);

    for (let i = 0; i < newPdfDoc.getPageCount(); i++) {
        const page = newPdfDoc.getPage(i);
        const { width, height } = page.getSize();
        
        // Find the original page number (1-based) for this new page index
        const originalPageNumber = pageOrder[i];
        
        // Filter edits for this original page number
        const pageEdits = edits.filter(edit => edit.pageIndex === originalPageNumber - 1);

        for (const edit of pageEdits) {
            // Y-coordinate needs to be flipped from top-left (canvas) to bottom-left (pdf-lib)
            const y = height - edit.y;

            if (edit.type === 'text') {
                const textEdit = edit as TextEdit;
                page.drawText(textEdit.text, {
                    x: textEdit.x,
                    y: y - (textEdit.fontSize * 0.8), // Adjust for font baseline
                    font: helveticaFont,
                    size: textEdit.fontSize,
                    color: rgb(0, 0, 0),
                });
            } else if (edit.type === 'image') {
                const imageEdit = edit as ImageEdit;
                const imageBytes = await fileToUint8Array(imageEdit.file);
                
                const image = imageEdit.file.type === 'image/png'
                    ? await newPdfDoc.embedPng(imageBytes)
                    : await newPdfDoc.embedJpg(imageBytes);
                
                page.drawImage(image, {
                    x: imageEdit.x,
                    y: y - imageEdit.height,
                    width: imageEdit.width,
                    height: imageEdit.height,
                });
            } else if (edit.type === 'redact') {
                const redactEdit = edit as RedactEdit;
                page.drawRectangle({
                    x: redactEdit.x,
                    y: y - redactEdit.height,
                    width: redactEdit.width,
                    height: redactEdit.height,
                    color: rgb(0, 0, 0),
                });
            }
        }
    }
    
    if (password) {
        await newPdfDoc.encrypt(password, password, {
            // Allow all permissions for the user who has the password
            printing: PDFPermissions.HighResolution,
            copying: true,
            modifying: true,
            annotating: true,
            fillingForms: true,
            contentAccessibility: true,
            documentAssembly: true,
        });
    }

    return newPdfDoc.save();
}
