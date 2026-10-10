import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const getRootDir = () => process.env.APPROVED_ROOT || process.cwd();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get('path');
  if (!filePath) return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });

  try {
    const fullPath = path.resolve(filePath);
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
    const fullPath = path.resolve(filePath);
    fs.writeFileSync(fullPath, content, 'utf-8');
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
