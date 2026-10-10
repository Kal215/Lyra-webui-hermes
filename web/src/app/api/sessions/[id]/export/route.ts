import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import util from 'util';
import { getHermesEnv } from '@/lib/hermesEnv';

const execFileAsync = util.promisify(execFile);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const p = await params;
    const { id } = p;
    
    const { stdout } = await execFileAsync('hermes', ['sessions', 'export', '--session-id', id, '--format', 'jsonl', '-'], { env: getHermesEnv() });
    if (!stdout.trim() || !stdout.trim().startsWith('{')) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    let data;
    try {
      data = JSON.parse(stdout.trim());
    } catch(e) {
      return NextResponse.json({ error: 'Invalid session format' }, { status: 500 });
    }

    let md = `# Obrolan: ${data.display_name || data.id}\n\n`;

    if (data.messages && Array.isArray(data.messages)) {
      for (const m of data.messages) {
        if (m.role === 'system') continue;
        const roleName = m.role === 'user' ? 'Pengguna' : 'Lyra (Hermes)';
        md += `### ${roleName}\n${m.content}\n\n`;
      }
    }

    return new NextResponse(md, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="lyra_chat_${id}.md"`
      }
    });
  } catch (error) {
    console.error('Failed to export session:', error);
    return NextResponse.json({ error: 'Failed to export session' }, { status: 500 });
  }
}
