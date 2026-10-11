import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
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
    const env = getHermesEnv();
    const kanbanDb = env.HERMES_HOME ? `${env.HERMES_HOME}/kanban.db` : null;

    if (kanbanDb && fs.existsSync(kanbanDb)) {
      // Execute direct SQLite cleanup via built-in python script to prevent missing native binary dependency
      const pythonScript = `
import sqlite3
try:
    con = sqlite3.connect(r'${kanbanDb}')
    cur = con.cursor()
    cur.execute("DELETE FROM tasks WHERE id = ?", ('${id}',))
    cur.execute("DELETE FROM task_links WHERE parent_id = ? OR child_id = ?", ('${id}', '${id}'))
    cur.execute("DELETE FROM task_comments WHERE task_id = ?", ('${id}',))
    cur.execute("DELETE FROM task_events WHERE task_id = ?", ('${id}',))
    cur.execute("DELETE FROM task_runs WHERE task_id = ?", ('${id}',))
    con.commit()
    con.close()
except Exception as e:
    pass
`;
      await execFileAsync('python', ['-c', pythonScript]);
    } else {
      await execFileAsync('hermes', ['kanban', 'archive', id], { env });
    }

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
