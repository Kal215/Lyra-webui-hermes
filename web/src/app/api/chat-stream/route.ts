import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import readline from 'readline';
import { getHermesEnv } from '@/lib/hermesEnv';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let { message, session_id, workspace, attachments, systemPrompt } = await req.json();

  if (!message) {
    return new Response(JSON.stringify({ error: 'Message is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Inject system prompt to the message if present
  if (systemPrompt && !session_id) {
    message = `[SYSTEM INSTRUCTION (OBEY STRICTLY)]\n${systemPrompt}\n\n[USER MESSAGE]\n${message}`;
  }

  // Prepend file context references to the prompt message
  if (attachments && Array.isArray(attachments)) {
    let contextPrefix = '';
    for (const file of attachments) {
      if (file.isWorkspaceRef) {
        contextPrefix += `[Attached ${file.isDirectory ? 'Directory' : 'File'} Context: ${file.path}]\n`;
      } else if (file.isUrl) {
        contextPrefix += `[Attached URL Context: ${file.url || file.path}]\n`;
      } else if (file.type && !file.type.startsWith('image/')) {
        contextPrefix += `[Attached Document/File: ${file.path}]\n`;
      }
    }
    if (contextPrefix) {
      message = `${contextPrefix}\n${message}`;
    }
  }

  const args = ['chat', '-q', message, '--oneshot', '--format', 'stream-json'];
  if (session_id) {
    args.push('-c', session_id);
  } else {
    args.push('--profile', 'default');
  }

  if (workspace) {
    args.push('--in', workspace);
  }

  if (attachments && Array.isArray(attachments)) {
    for (const file of attachments) {
      if ((file.type && file.type.startsWith('image/')) || (file.path && file.path.match(/\.(png|jpe?g|webp|gif)$/i))) {
        args.push('--image', file.path);
      }
    }
  }

  const child = spawn('hermes', args, { 
    shell: false,
    env: getHermesEnv()
  });

  const rl = readline.createInterface({
    input: child.stdout,
    terminal: false
  });

  const stream = new ReadableStream({
    start(controller) {
      let isClosed = false;
      const safeEnqueue = (payload: string) => {
        if (isClosed) return;
        try {
          controller.enqueue(new TextEncoder().encode(payload));
        } catch (e) {
          isClosed = true;
        }
      };

      // Pad to force proxy flush
      safeEnqueue(':' + ' '.repeat(2048) + '\n\n');
      
      rl.on('line', (line) => {
        if (isClosed) return;
        const t = line.trim();
        if (!t) return;
        
        if (t.startsWith('session_id:')) {
          const sid = t.split(':')[1].trim();
          safeEnqueue(`data: ${JSON.stringify({ type: 'session_id', session_id: sid })}\n\n`);
          return;
        }
        
        if (t.startsWith('{') && t.endsWith('}')) {
          try {
            const event = JSON.parse(t);
            safeEnqueue(`data: ${JSON.stringify(event)}\n\n`);
          } catch (e) {}
        }
      });

      child.stderr.on('data', (data) => {
        console.error('Hermes Error:', data.toString());
      });

      child.on('close', () => {
        if (isClosed) return;
        safeEnqueue(`data: {"type": "done"}\n\n`);
        try { controller.close(); } catch(e) {}
      });
      
      child.on('error', (err) => {
        if (isClosed) return;
        safeEnqueue(`data: {"type": "error", "message": "Failed to start Hermes CLI"}\n\n`);
        try { controller.close(); } catch(e) {}
      });
    },
    cancel() {
      child.kill();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Content-Encoding': 'none',
      'X-Accel-Buffering': 'no'
    }
  });
}