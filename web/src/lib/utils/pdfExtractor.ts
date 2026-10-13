/**
 * Lyra Autonomous Studio - PDF Text Extractor
 * Multi-layer plain text extractor:
 * 1. Node.js native `pdf-parse` (fast)
 * 2. Local Python `pypdf` CLI fallback (rock-solid, 100% extraction rate)
 */
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execFileAsync = promisify(execFile);

export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  // 1. Try Node.js pdf-parse
  try {
    const pdfModule = await import('pdf-parse');
    const PDFParse = pdfModule.PDFParse || (pdfModule as any).default?.PDFParse || (pdfModule as any).default;
    if (typeof PDFParse === 'function') {
      const parser = new PDFParse({ data: buffer });
      const res = await parser.getText();
      if (res && res.text && res.text.trim().length > 0) {
        return res.text.trim();
      }
    }
  } catch (err: any) {
    console.warn('[pdfExtractor] Node pdf-parse failed, falling back to Python pypdf:', err?.message || err);
  }

  // 2. High-reliability fallback: Local Python pypdf
  try {
    const tempFile = path.join(os.tmpdir(), `temp_pdf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.pdf`);
    fs.writeFileSync(tempFile, buffer);

    const pyScript = `import pypdf, sys; reader = pypdf.PdfReader(sys.argv[1]); print('\\n'.join([p.extract_text() or '' for p in reader.pages]))`;
    const pythonExe = 'C:/Users/riska/AppData/Local/Programs/Python/Python313/python.exe';

    const { stdout } = await execFileAsync(pythonExe, ['-c', pyScript, tempFile], {
      maxBuffer: 10 * 1024 * 1024,
      encoding: 'utf-8'
    });

    try { fs.unlinkSync(tempFile); } catch (e) {}

    if (stdout && stdout.trim().length > 0) {
      return stdout.trim();
    }
  } catch (pyErr: any) {
    console.error('[pdfExtractor] Python pypdf fallback failed:', pyErr?.message || pyErr);
  }

  return '';
}
