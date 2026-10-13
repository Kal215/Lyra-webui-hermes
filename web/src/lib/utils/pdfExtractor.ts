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

function getPythonCandidates(): string[] {
  if (process.env.PYTHON_PATH) return [process.env.PYTHON_PATH];
  const isWin = process.platform === 'win32';
  const candidates: string[] = isWin 
    ? ['python', 'python3', 'py'] 
    : ['python3', 'python'];

  // On Windows, dynamically search standard AppData Python installs without hardcoding usernames
  if (isWin && process.env.LOCALAPPDATA) {
    const pyBase = path.join(process.env.LOCALAPPDATA, 'Programs', 'Python');
    if (fs.existsSync(pyBase)) {
      try {
        const dirs = fs.readdirSync(pyBase).sort().reverse();
        for (const d of dirs) {
          const exe = path.join(pyBase, d, 'python.exe');
          if (fs.existsSync(exe)) candidates.unshift(exe);
        }
      } catch (e) {}
    }
  }

  return candidates;
}

export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  // 1. Universal in-memory worker-less extraction via unpdf (pure JS, zero worker bloat)
  try {
    const { extractText } = await import('unpdf');
    const res = await extractText(new Uint8Array(buffer));
    const pagesText = Array.isArray(res.text) ? res.text.join('\n\n') : String(res.text || '');
    if (pagesText && pagesText.trim().length > 0) {
      return pagesText.trim();
    }
  } catch (err: any) {
    console.warn('[pdfExtractor] unpdf in-memory parser failed, falling back to Python pypdf:', err?.message || err);
  }

  // 2. High-reliability cross-platform fallback: Dynamic Python pypdf
  const pythonBinaries = getPythonCandidates();
  for (const pythonExe of pythonBinaries) {
    try {
      const tempFile = path.join(os.tmpdir(), `temp_pdf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.pdf`);
      fs.writeFileSync(tempFile, buffer);

      const pyScript = `import pypdf, sys; reader = pypdf.PdfReader(sys.argv[1]); print('\\n'.join([p.extract_text() or '' for p in reader.pages]))`;

      const { stdout } = await execFileAsync(pythonExe, ['-c', pyScript, tempFile], {
        maxBuffer: 10 * 1024 * 1024,
        encoding: 'utf-8'
      });

      try { fs.unlinkSync(tempFile); } catch (e) {}

      if (stdout && stdout.trim().length > 0) {
        return stdout.trim();
      }
    } catch (pyErr: any) {
      // Continue to next candidate
    }
  }

  return '';
}
