import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const getRootDir = () => process.env.APPROVED_ROOT || process.cwd();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get('path');
  if (!filePath) return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });

  try {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(getRootDir(), filePath);
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: `File not found: ${filePath}` }, { status: 404 });
    }
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      return NextResponse.json({ error: 'Path is a directory' }, { status: 400 });
    }
    const ext = path.extname(fullPath).toLowerCase();
    const isBinary = ['.pptx', '.docx', '.pdf', '.xlsx', '.zip', '.png', '.jpg', '.jpeg', '.webp'].includes(ext);
    const forceDownload = searchParams.get('download') === 'true';

    if (isBinary || forceDownload) {
      const buffer = fs.readFileSync(fullPath);
      const mimeTypes: Record<string, string> = {
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.pdf': 'application/pdf',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.webp': 'image/webp',
        '.zip': 'application/zip'
      };
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${path.basename(fullPath)}"`
        }
      });
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get('path');
  if (!filePath) return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });

  try {
    const { content } = await req.json();
    const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(getRootDir(), filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, content, 'utf-8');
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
