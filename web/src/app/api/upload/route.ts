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
    
    return NextResponse.json({ path: filePath, name: file.name, type: file.type });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
