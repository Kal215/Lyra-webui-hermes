import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import os from 'os';
import { chunkDocument, ChunkingResult } from '@/lib/utils/documentChunker';
import { extractTextFromPdfBuffer } from '@/lib/utils/pdfExtractor';
import { extractTextFromDocxBuffer, extractTextFromPptxBuffer } from '@/lib/utils/officeExtractor';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Use OS temp dir
    const tempDir = path.join(os.tmpdir(), 'lyra_uploads');
    await mkdir(tempDir, { recursive: true });
    
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueName = `${Date.now()}_${safeName}`;
    const filePath = path.join(tempDir, uniqueName);
    
    await writeFile(filePath, buffer);
    
    const isImage = file.type?.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg|bmp)$/i.test(file.name);
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    const isDocx = /\.docx$/i.test(file.name);
    const isPptx = /\.pptx$/i.test(file.name);
    let content: string | undefined = undefined;
    let base64: string | undefined = undefined;
    let chunkResult: ChunkingResult | null = null;

    if (isImage) {
      base64 = buffer.toString('base64');
    } else if (isPdf) {
      // Extract clean text from PDF document
      const pdfText = await extractTextFromPdfBuffer(buffer);
      if (pdfText) {
        chunkResult = chunkDocument(pdfText);
        content = pdfText.length > 50000 ? pdfText.slice(0, 50000) : pdfText;
      }
    } else if (isDocx) {
      // Extract clean text from Word (.docx) document
      const docxText = await extractTextFromDocxBuffer(buffer);
      if (docxText) {
        chunkResult = chunkDocument(docxText);
        content = docxText.length > 50000 ? docxText.slice(0, 50000) : docxText;
      }
    } else if (isPptx) {
      // Extract structured slide text from PowerPoint (.pptx) presentation
      const pptxText = await extractTextFromPptxBuffer(buffer);
      if (pptxText) {
        chunkResult = chunkDocument(pptxText);
        content = pptxText.length > 50000 ? pptxText.slice(0, 50000) : pptxText;
      }
    } else if (
      file.type?.startsWith('text/') ||
      /\.(txt|md|json|js|ts|tsx|jsx|py|html|css|scss|yaml|yml|xml|sql|csv|sh|bat|env|prisma|rs|go|c|cpp|h|java|php|rb|log)$/i.test(file.name)
    ) {
      // Decode full text file (safe up to 10MB) and compute smart sliding-window chunks
      const fullText = buffer.subarray(0, 10 * 1024 * 1024).toString('utf-8');
      chunkResult = chunkDocument(fullText);
      content = fullText.length > 50000 ? fullText.slice(0, 50000) : fullText;
    }

    return NextResponse.json({
      path: filePath,
      name: file.name,
      type: file.type || (isImage ? 'image/png' : isPdf ? 'application/pdf' : 'text/plain'),
      size: buffer.length,
      content,
      base64,
      totalLines: chunkResult?.totalLines,
      totalChunks: chunkResult?.chunks.length,
      estimatedTokens: chunkResult?.estimatedTokens,
      isChunked: chunkResult?.isChunked,
      chunks: chunkResult?.chunks
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
