import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getHermesEnv } from '@/lib/hermesEnv';

const execAsync = promisify(exec);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const p = await params;
    const sessionId = p.id;
    const { stdout } = await execAsync(`hermes sessions export --session-id ${sessionId} --format jsonl -`, { maxBuffer: 1024 * 1024 * 10, env: getHermesEnv() });
    
    const lines = stdout.split('\n').filter(line => line.trim().length > 0);
    if (lines.length === 0 || !lines[0].startsWith('{')) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    try {
      const sessionData = JSON.parse(lines[0]);
      return NextResponse.json({ 
        session_id: sessionData.id,
        messages: sessionData.messages || [] 
      });
    } catch (e) {
      return NextResponse.json({ error: 'Invalid session data' }, { status: 500 });
    }
  } catch (error) {
    console.error('Failed to load messages:', error);
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 });
  }
}
