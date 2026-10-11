import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { dirPath, fileName, content = '' } = await req.json();

    if (!dirPath || !fileName) {
      return NextResponse.json({ error: 'dirPath and fileName are required' }, { status: 400 });
    }

    const fullPath = path.join(dirPath, fileName);
    if (fs.existsSync(fullPath)) {
      return NextResponse.json({ error: 'File already exists' }, { status: 409 });
    }

    fs.mkdirSync(dirPath, { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf-8');

    return NextResponse.json({ success: true, path: fullPath, name: fileName });
  } catch (error: any) {
    console.error('Create file error:', error);
    return NextResponse.json({ error: error.message || 'Create file failed' }, { status: 500 });
  }
}