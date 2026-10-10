import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import readline from 'readline';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const { message, session_id } = await req.json();

  if (!message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  const args = ['chat', '-q', message, '--oneshot', '--format', 'stream-json'];
  if (session_id) {
    args.push('-c', session_id);
  } else {
    args.push('--profile', p.id);
  }

  const encoder = new TextEncoder();
  
    const stream = new ReadableStream({
    start(controller) {
      const child = spawn('hermes', args, { 
        shell: false,
        env: { ...process.env, PYTHONUNBUFFERED: '1' }
      });
      
      const rl = readline.createInterface({
        input: child.stdout,
        terminal: false
      });

      rl.on('line', (line) => {
        const t = line.trim();
        if (!t) return;
        
        if (t.startsWith('session_id:')) {
          const sessionId = t.split(':')[1].trim();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'session_id', session_id: sessionId })}\n\n`));
          return;
        }
        
        if (t.startsWith('{') && t.endsWith('}')) {
          try {
            const event = JSON.parse(t);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          } catch (e) {
            // Ignore parse errors
          }
        }
      });

      child.stderr.on('data', (data) => {
        console.error('Hermes Error:', data.toString());
      });

      child.on('close', (code) => {
        controller.enqueue(encoder.encode(`data: {"type": "done"}\n\n`));
        controller.close();
      });
      
      child.on('error', (err) => {
        controller.enqueue(encoder.encode(`data: {"type": "error", "message": "Failed to start Hermes CLI"}\n\n`));
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Content-Encoding': 'none',
      'X-Accel-Buffering': 'no',
    },
  });
}
