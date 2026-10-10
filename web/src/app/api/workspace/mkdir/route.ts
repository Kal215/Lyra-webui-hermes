import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { dirPath, folderName } = await req.json();
    if (!dirPath || !folderName) {
      return NextResponse.json({ error: 'Missing dirPath or folderName' }, { status: 400 });
    }

    const newPath = path.resolve(path.join(dirPath, folderName));
    fs.mkdirSync(newPath, { recursive: true });
    
    return NextResponse.json({ success: true, path: newPath });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}