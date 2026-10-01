import PDFParser from "pdf2json";

/**
 * Extracts raw text from a PDF buffer (a bank statement export).
 * pdf2json's API is callback-based, so it's wrapped in a promise.
 */
export function extractTextFromPDF(buffer) {
  return new Promise((resolve, reject) => {
    const parser = new PDFParser();

    parser.on("pdfParser_dataError", (err) => {
      reject(new Error(err?.parserError?.message || "Failed to read PDF"));
    });

    parser.on("pdfParser_dataReady", (data) => {
      let text = "";

      for (const page of data.Pages) {
        for (const item of page.Texts) {
          for (const run of item.R) {
            text += decodeURIComponent(run.T) + " ";
          }
        }
      }

      resolve(text.trim());
    });

    parser.parseBuffer(buffer);
  });
}
