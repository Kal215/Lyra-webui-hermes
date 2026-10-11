import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';

export async function POST(req: NextRequest) {
  try {
    const { targetPath } = await req.json();

    if (!targetPath) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    if (!fs.existsSync(targetPath)) {
      return NextResponse.json({ error: 'Path does not exist' }, { status: 404 });
    }

    fs.rmSync(targetPath, { recursive: true, force: true });

    return NextResponse.json({ success: true, path: targetPath });
  } catch (error: any) {
    console.error('Workspace delete error:', error);
    return NextResponse.json({ error: error.message || 'Delete failed' }, { status: 500 });
  }
}