import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export async function GET(req: NextRequest) {
  try {
    const { stdout } = await execFileAsync('hermes', ['profile', 'list']);
    const lines = stdout.split('\n').filter(l => l.trim().length > 0 && !l.includes('─────')).slice(1);
    const agents = lines.map(line => {
      // split by multiple spaces
      const parts = line.trim().split(/\s{2,}/);
      if (parts.length > 0) {
        let name = parts[0].trim();
        if (name.startsWith('◆')) name = name.substring(1);
        return name;
      }
      return null;
    }).filter(Boolean);

    return NextResponse.json({ success: true, data: agents });
  } catch (error: any) {
    console.error('Failed to fetch agents:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
