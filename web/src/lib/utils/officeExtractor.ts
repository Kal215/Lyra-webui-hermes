/**
 * Lyra Autonomous Studio - Office Document Extractor (.docx, .pptx)
 * 100% Pure JavaScript, zero OS-level or external binary dependencies.
 * Extracts clean structured text for Smart Document Chunking & Model Ingestion.
 */
import JSZip from 'jszip';

/**
 * Extracts plain text from a Word (.docx) document buffer using mammoth.
 */
export async function extractTextFromDocxBuffer(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value?.trim() || '';
  } catch (err: any) {
    console.error('[officeExtractor] Failed to extract text from DOCX:', err);
    return '';
  }
}

/**
 * Extracts slide-by-slide text from a PowerPoint (.pptx) presentation buffer.
 */
export async function extractTextFromPptxBuffer(buffer: Buffer): Promise<string> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const slideFiles = Object.keys(zip.files).filter(
      (f) => f.startsWith('ppt/slides/slide') && f.endsWith('.xml')
    );

    slideFiles.sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
      const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
      return numA - numB;
    });

    const slides: string[] = [];
    for (let i = 0; i < slideFiles.length; i++) {
      const file = zip.files[slideFiles[i]];
      if (!file) continue;

      const xml = await file.async('text');
      // Match text contents inside <a:t>...</a:t>
      const matches = xml.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g) || [];
      const textPieces = matches
        .map((m) => m.replace(/<[^>]+>/g, '').trim())
        .filter(Boolean);

      if (textPieces.length > 0) {
        slides.push(`[Slide ${i + 1}]\n` + textPieces.join('\n'));
      }
    }

    return slides.join('\n\n').trim();
  } catch (err: any) {
    console.error('[officeExtractor] Failed to extract text from PPTX:', err);
    return '';
  }
}
