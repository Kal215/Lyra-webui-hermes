import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import os from 'os';

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
    let content: string | undefined = undefined;
    let base64: string | undefined = undefined;

    if (isImage) {
      base64 = buffer.toString('base64');
    } else if (
      file.type?.startsWith('text/') ||
      /\.(txt|md|json|js|ts|tsx|jsx|py|html|css|scss|yaml|yml|xml|sql|csv|sh|bat|env|prisma|rs|go|c|cpp|h|java|php|rb)$/i.test(file.name)
    ) {
      // Decode text files up to 200KB
      content = buffer.subarray(0, 200000).toString('utf-8');
    }

    return NextResponse.json({
      path: filePath,
      name: file.name,
      type: file.type || (isImage ? 'image/png' : 'text/plain'),
      size: buffer.length,
      content,
      base64
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
