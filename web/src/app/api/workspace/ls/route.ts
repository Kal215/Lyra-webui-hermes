import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawDir = searchParams.get('dir');
  let dirPath: string = (rawDir && rawDir.trim() !== '') ? rawDir : process.cwd();

  try {
    if (dirPath === 'ROOT') {
      const isWindows = process.platform === 'win32';
      if (isWindows) {
        const drives = [];
        const letters = ['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'Z'];
        for (const letter of letters) {
          const d = `${letter}:/`;
          try {
            if (fs.existsSync(d)) {
              drives.push({ name: `Local Disk (${letter}:)`, isDirectory: true, path: d });
            }
          } catch(e) {}
        }
        return NextResponse.json({ files: drives, cwd: 'ROOT' });
      } else {
        // Unix / Linux / Vercel container
        dirPath = '/';
      }
    }

    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    
    // Sort directories first, then files alphabetically
    const sorted = files.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

    const result = sorted.map(dirent => {
      const fullPath = path.join(dirPath, dirent.name);
      return {
        name: dirent.name,
        isDirectory: dirent.isDirectory(),
        path: fullPath.replace(/\\/g, '/')
      };
    });

    const cleanCwd = dirPath.replace(/\\/g, '/');
    return NextResponse.json({ files: result, cwd: cleanCwd });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
