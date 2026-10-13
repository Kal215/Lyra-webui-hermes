import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { compilePresentation, parseMarkdownToSlides } from '@/lib/utils/pptxCompiler';
import { compileMarkdownToDocx } from '@/lib/utils/docxCompiler';

export async function POST(req: NextRequest) {
  try {
    const { 
      type, 
      title = 'Document', 
      content = '', 
      fileName 
    } = await req.json();

    if (!type || !content) {
      return NextResponse.json({ error: 'Type and content are required' }, { status: 400 });
    }

    const cleanTitle = title.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim() || 'Document';
    const workspaceDir = path.join(process.cwd(), 'workspace');
    await fs.mkdir(workspaceDir, { recursive: true });

    let finalFileName = fileName;
    let outputPath = '';

    if (type === 'pptx') {
      finalFileName = finalFileName || `${cleanTitle.replace(/\s+/g, '_')}.pptx`;
      outputPath = path.join(workspaceDir, finalFileName);
      
      let spec;
      try {
        spec = JSON.parse(content);
      } catch (e) {
        spec = parseMarkdownToSlides(content);
        spec.title = cleanTitle;
      }

      await compilePresentation(spec, outputPath);
    } else if (type === 'docx') {
      finalFileName = finalFileName || `${cleanTitle.replace(/\s+/g, '_')}.docx`;
      outputPath = path.join(workspaceDir, finalFileName);

      await compileMarkdownToDocx(content, cleanTitle, outputPath);
    } else {
      return NextResponse.json({ error: `Unsupported document type: ${type}` }, { status: 400 });
    }

    const stat = await fs.stat(outputPath);

    return NextResponse.json({
      success: true,
      path: outputPath,
      fileName: finalFileName,
      size: stat.size,
      workspaceRelPath: path.relative(process.cwd(), outputPath).replace(/\\/g, '/')
    });
  } catch (error: any) {
    console.error('Export document error:', error);
    return NextResponse.json({ error: error.message || 'Failed to export document' }, { status: 500 });
  }
}
