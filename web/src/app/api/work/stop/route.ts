import { NextRequest, NextResponse } from 'next/server';
import { activeChildProcesses } from '@/lib/activeProcesses';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { executionId } = body;

    let stoppedCount = 0;
    if (executionId && activeChildProcesses.has(executionId)) {
      const child = activeChildProcesses.get(executionId);
      if (child) {
        try {
          child.kill('SIGTERM');
          stoppedCount++;
        } catch (e) {}
      }
      activeChildProcesses.delete(executionId);
    } else {
      // Kill all ongoing active Hermes processes spawned for work sessions
      for (const [id, child] of activeChildProcesses.entries()) {
        try {
          child.kill('SIGTERM');
          stoppedCount++;
        } catch (e) {}
      }
      activeChildProcesses.clear();
    }

    return NextResponse.json({ success: true, stoppedCount });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
