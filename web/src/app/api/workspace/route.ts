import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const getRootDir = () => process.env.APPROVED_ROOT || process.cwd();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dirPath = searchParams.get('path') || '/';
  
  try {
    const ROOT_DIR = getRootDir();
    const fullPath = path.join(ROOT_DIR, dirPath);
    
    if (!fullPath.startsWith(ROOT_DIR)) {
      return NextResponse.json({ error: 'Unauthorized path' }, { status: 403 });
    }

    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ files: [] });
    }

    const items = fs.readdirSync(fullPath, { withFileTypes: true });
    const files = items.map(item => ({
      name: item.name,
      isDirectory: item.isDirectory(),
      path: path.join(dirPath === '/' ? '' : dirPath, item.name).split(path.sep).join('/')
    })).sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ files, currentPath: dirPath });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
