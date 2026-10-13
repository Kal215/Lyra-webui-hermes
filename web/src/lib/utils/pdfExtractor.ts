/**
 * Lyra Autonomous Studio - PDF Text Extractor
 * Extracts plain text from PDF buffers for chunking and AI model context ingestion.
 */
import { PDFParse } from 'pdf-parse';

export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  try {
    const parser = new PDFParse({ data: buffer });
    const res = await parser.getText();
    return res.text ? res.text.trim() : '';
  } catch (err: any) {
    console.error('Failed to parse PDF with PDFParse:', err);
    return '';
  }
}
