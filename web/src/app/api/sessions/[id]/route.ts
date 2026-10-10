import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import util from 'util';
import { getHermesEnv } from '@/lib/hermesEnv';

const execFileAsync = util.promisify(execFile);

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const p = await params;
    const { id } = p;
    
    await execFileAsync('hermes', ['sessions', 'delete', '-y', id], { env: getHermesEnv() });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete session:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const p = await params;
    const { id } = p;
    
    const body = await req.json();
    
    if (body.hasOwnProperty('pin')) {
      const action = body.pin ? 'pin' : 'unpin';
      await execFileAsync('hermes', ['sessions', action, id], { env: getHermesEnv() });
      return NextResponse.json({ success: true });
    }

    if (!body.title) {
      return NextResponse.json({ error: 'Title or pin flag is required' }, { status: 400 });
    }
    
    await execFileAsync('hermes', ['sessions', 'rename', id, body.title], { env: getHermesEnv() });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update session:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}