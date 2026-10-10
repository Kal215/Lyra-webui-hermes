import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { getHermesEnv } from '@/lib/hermesEnv';
import { NextRequest, NextResponse } from 'next/server';

const execFileAsync = promisify(execFile);

export async function GET() {
  try {
    const env = getHermesEnv();
    const { stdout } = await execFileAsync('hermes', ['profile', 'list'], { env });
    
    const lines = stdout.split('\n').filter(l => l.trim().length > 0 && !l.includes('────') && !l.includes('Profile'));
    const profiles = lines.map(l => {
      const cleanLine = l.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
      const is_active = cleanLine.includes('◆');
      const nameMatch = cleanLine.match(/(?:◆|\s)\s*([a-zA-Z0-9_-]+)/);
      const name = nameMatch ? nameMatch[1] : 'unknown';
      
      if (name === 'unknown' || name === 'Gateway' || name === 'Model') return null;
      
      return {
        name,
        is_active,
        dir: name === 'default' ? env.HERMES_HOME : path.join(env.HERMES_HOME, 'profiles', name)
      };
    }).filter(Boolean);

    return NextResponse.json({ success: true, data: profiles });
  } catch (error: any) {
    console.error('Failed to list profiles:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name } = body;
    if (!name) return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });

    const { stdout } = await execFileAsync('hermes', ['profile', 'create', name], { env: getHermesEnv() });
    return NextResponse.json({ success: true, message: stdout });
  } catch (error: any) {
    console.error('Failed to create profile:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const name = url.searchParams.get('name');
    if (!name) return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });

    const { stdout } = await execFileAsync('hermes', ['profile', 'delete', '-y', name], { env: getHermesEnv() });
    return NextResponse.json({ success: true, message: stdout });
  } catch (error: any) {
    console.error('Failed to delete profile:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
