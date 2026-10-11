import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function POST(req: NextRequest) {
  try {
    const { targetPath } = await req.json();

    if (!targetPath) {
      return NextResponse.json({ error: 'targetPath is required' }, { status: 400 });
    }

    const normPath = path.resolve(targetPath);
    if (!fs.existsSync(normPath)) {
      return NextResponse.json({ error: 'Path does not exist' }, { status: 404 });
    }

    const isDir = fs.statSync(normPath).isDirectory();
    const cmd = isDir ? `explorer.exe "${normPath}"` : `explorer.exe /select,"${normPath}"`;

    exec(cmd, (err) => {
      if (err) console.error('Explorer reveal error:', err);
    });

    return NextResponse.json({ success: true, path: normPath });
  } catch (error: any) {
    console.error('Reveal error:', error);
    return NextResponse.json({ error: error.message || 'Reveal failed' }, { status: 500 });
  }
}