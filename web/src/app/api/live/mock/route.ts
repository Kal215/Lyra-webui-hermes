import { NextRequest, NextResponse } from 'next/server';
import { runBuffer } from '@/lib/live/buffer';
import { LyraAgentEvent } from '@/lib/live/types';

export async function POST(request: NextRequest) {
  const { runId } = await request.json();
  if (!runId) return NextResponse.json({ error: 'Missing runId' }, { status: 400 });

  if (!runId.startsWith('mock-') && runId !== 'bridge-demo-1') {
    return NextResponse.json({ error: 'Mock endpoint only allows runIds starting with mock- or bridge-demo-1' }, { status: 403 });
  }

  runBuffer.clear(runId);

  const mockEvents: LyraAgentEvent[] = [
    {
      version: 1, eventId: 'e1', runId, agentId: 'coder', timestamp: new Date().toISOString(),
      sequence: 1, type: 'run.started', source: 'native_hermes', payload: {}
    },
    {
      version: 1, eventId: 'e2', runId, agentId: 'coder', timestamp: new Date().toISOString(),
      sequence: 2, type: 'agent.status', source: 'derived', payload: { status: 'working' }
    },
    {
      version: 1, eventId: 'e3', runId, agentId: 'coder', timestamp: new Date().toISOString(),
      sequence: 3, type: 'command.started', source: 'future_instrumented', payload: { command: 'find src/app' }
    },
    {
      version: 1, eventId: 'e4', runId, agentId: 'coder', timestamp: new Date().toISOString(),
      sequence: 4, type: 'terminal.stdout', source: 'future_instrumented', payload: { text: 'src/app/page.tsx\n' }
    },
    {
      version: 1, eventId: 'e5', runId, agentId: 'coder', timestamp: new Date().toISOString(),
      sequence: 5, type: 'terminal.stdout', source: 'future_instrumented', payload: { text: 'src/app/checkout/page.tsx\n' }
    },
    {
      version: 1, eventId: 'e6', runId, agentId: 'coder', timestamp: new Date().toISOString(),
      sequence: 6, type: 'command.finished', source: 'future_instrumented', payload: { exitCode: 0 }
    },
    {
      version: 1, eventId: 'e7', runId, agentId: 'coder', timestamp: new Date().toISOString(),
      sequence: 7, type: 'file.opened', source: 'mock_only', payload: { file: 'src/app/checkout/page.tsx', content: 'export default function Page() {\n  return <div>Checkout</div>;\n}' }
    },
    {
      version: 1, eventId: 'e8', runId, agentId: 'coder', timestamp: new Date().toISOString(),
      sequence: 8, type: 'file.patch', source: 'mock_only', payload: { 
        file: 'src/app/checkout/page.tsx', 
        patch: [
          { type: 'removed', text: '  return <div>Checkout</div>;' },
          { type: 'added', text: '  return <main>Secure Checkout</main>;' }
        ] 
      }
    },
    {
      version: 1, eventId: 'e9', runId, agentId: 'coder', timestamp: new Date().toISOString(),
      sequence: 9, type: 'command.started', source: 'mock_only', payload: { command: 'npm run typecheck' }
    },
    {
      version: 1, eventId: 'e10', runId, agentId: 'coder', timestamp: new Date().toISOString(),
      sequence: 10, type: 'terminal.stdout', source: 'mock_only', payload: { text: 'tsc --noEmit\n' }
    },
    {
      version: 1, eventId: 'e11', runId, agentId: 'coder', timestamp: new Date().toISOString(),
      sequence: 11, type: 'command.finished', source: 'mock_only', payload: { exitCode: 0 }
    },
    {
      version: 1, eventId: 'e12', runId, agentId: 'coder', timestamp: new Date().toISOString(),
      sequence: 12, type: 'check.finished', source: 'derived', payload: { check: 'typescript', success: true }
    },
    {
      version: 1, eventId: 'e13', runId, agentId: 'coder', timestamp: new Date().toISOString(),
      sequence: 13, type: 'run.completed', source: 'native_hermes', payload: { status: 'completed' }
    }
  ];

  // We feed them into the buffer deterministically but asynchronously to mimic a stream
  (async () => {
    for (const e of mockEvents) {
      runBuffer.pushEvent(runId, e);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  })();

  return NextResponse.json({ success: true, count: mockEvents.length });
}
