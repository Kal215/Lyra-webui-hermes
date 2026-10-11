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
