import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { getHermesEnv } from '@/lib/hermesEnv';

const execFileAsync = promisify(execFile);

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { stdout } = await execFileAsync('hermes', ['kanban', 'show', resolvedParams.id, '--json'], { env: getHermesEnv() });
    let data = {};
    try {
      data = JSON.parse(stdout);
    } catch(e) {}
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error(`Failed to fetch work:`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    await execFileAsync('hermes', ['kanban', 'archive', id], { env: getHermesEnv() });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Failed to delete work:`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await req.json();
    const { action } = body; 

    if (!action) return NextResponse.json({ success: false, error: 'Missing action' }, { status: 400 });

    let command = '';
    switch (action) {
      case 'complete': case 'done': command = 'complete'; break;
      case 'block': command = 'block'; break;
      case 'unblock': case 'todo': command = 'unblock'; break;
      case 'archive': command = 'archive'; break;
      case 'delete': command = 'delete'; break;
      default: return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    const { stdout } = await execFileAsync('hermes', ['kanban', command, id], { env: getHermesEnv() });
    return NextResponse.json({ success: true, message: stdout });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
