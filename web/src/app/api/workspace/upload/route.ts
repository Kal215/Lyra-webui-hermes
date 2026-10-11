import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const targetDir = formData.get('targetDir') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    if (!targetDir) {
      return NextResponse.json({ error: 'Target directory is required' }, { status: 400 });
    }

    await mkdir(targetDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(targetDir, file.name);

    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      path: filePath,
      name: file.name,
      size: file.size
    });
  } catch (error: any) {
    console.error('Workspace upload error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}