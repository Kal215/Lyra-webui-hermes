import { NextRequest } from 'next/server';
import { spawn, ChildProcess } from 'child_process';
import readline from 'readline';
import { getHermesEnv } from '@/lib/hermesEnv';

export const dynamic = 'force-dynamic';

// Global map tracking active child CLI processes across server requests
export const activeChildProcesses = new Map<string, ChildProcess>();

export async function POST(req: NextRequest) {
  let { message, session_id, workspace, attachments, systemPrompt, model, thinking, effort, webSearch, deepResearch, agent, profile, executionId } = await req.json();

  const currentExecId = executionId || session_id || ('exec_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6));

  if (!message) {
    return new Response(JSON.stringify({ error: 'Message is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Prepend deep research or web search directive if enabled
  if (deepResearch) {
    message = `[DIRECTIVE: MODE RISET MENDALAM (DEEP RESEARCH) DIAKTIFKAN. Lakukan investigasi komprehensif, telaah berbagai sudut pandang/sumber, dan berikan laporan analitis terstruktur dengan fakta dan penalaran mendalam.]\n\n${message}`;
  } else if (webSearch) {
    message = `[DIRECTIVE: PENCARIAN WEB DIAKTIFKAN. Gunakan kapabilitas pencarian web untuk mendapatkan informasi faktual dan data terbaru secara akurat.]\n\n${message}`;
  }

  // Format directive: only inject for detailed requests, never overshadow simple conversational greetings
  const formattingStandard = `[FORMATTING RULES]:
- Gunakan struktur Markdown rapi. Jika respon panjang, gunakan heading dan bullet points.
- Hindari garis pemisah mentah (===...). Gunakan tabel jika ada perbandingan.`;

  if (systemPrompt && !session_id) {
    message = `[SYSTEM INSTRUCTION]\n${systemPrompt}\n\n[USER MESSAGE]\n${message}`;
  }

  // Prepend file context references to the prompt message
  if (attachments && Array.isArray(attachments)) {
    let contextPrefix = '';
    const workspaceTargetFiles: string[] = [];

    for (const file of attachments) {
      if (file.isWorkspaceRef) {
        contextPrefix += `[TARGET EXCLUSIVE CONTEXT - ${file.isDirectory ? 'DIREKTORI' : 'BERKAS'}: ${file.path}]\n`;
        workspaceTargetFiles.push(file.path);
      } else if (file.isUrl) {
        contextPrefix += `[Attached URL Context: ${file.url || file.path}]\n`;
      } else if (file.type && !file.type.startsWith('image/')) {
        contextPrefix += `[Attached Document/File: ${file.path}]\n`;
      }
    }

    if (workspaceTargetFiles.length > 0) {
      contextPrefix += `[STRICT DIRECTIVE: Pengguna secara spesifik menunjuk berkas/direktori target: ${workspaceTargetFiles.map(f => `\`${f}\``).join(', ')}. Fokus dan eksekusi HANYA berkas atau folder target ini. JANGAN memodifikasi atau menyentuh berkas di luar target yang ditunjuk tersebut kecuali jika secara eksplisit diinstruksikan.]\n`;
    }

    if (contextPrefix) {
      message = `${contextPrefix}\n${message}`;
    }
  }

  const args = ['chat', '-q', message, '--oneshot', '--format', 'stream-json'];
  const targetProfile = profile || agent;
  if (session_id) {
    args.push('-c', session_id);
  } else if (targetProfile) {
    args.push('--profile', targetProfile);
  } else {
    args.push('--profile', 'default');
  }

  if (workspace) {
    args.push('--in', workspace);
  }

  // Model selection
  if (model && model !== 'default' && model !== 'Hermes Agent') {
    // If user passed a model name (e.g. from UI dropdown like "Claude 3.5 Sonnet"), find its real ID or pass as is
    args.push('-m', model);
  }

  // Reasoning / Thinking level
  if (thinking === false) {
    args.push('--reasoning', 'none');
  } else if (effort) {
    const effortStr = String(effort).toLowerCase();
    const effortMap: Record<string, string> = {
      minimal: 'minimal',
      low: 'low',
      med: 'medium',
      medium: 'medium',
      high: 'high',
      'extra high': 'xhigh',
      xhigh: 'xhigh',
      max: 'max',
      ultra: 'ultra'
    };
    const level = effortMap[effortStr] || 'medium';
    args.push('--reasoning', level);
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

  activeChildProcesses.set(currentExecId, child);

  // Hook request cancellation signal (e.g. browser refreshed or aborted)
  if (req.signal) {
    req.signal.addEventListener('abort', () => {
      try {
        child.kill('SIGTERM');
      } catch (e) {}
      activeChildProcesses.delete(currentExecId);
    });
  }

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
      // Announce executionId to client
      safeEnqueue(`data: ${JSON.stringify({ type: 'execution_id', executionId: currentExecId })}\n\n`);
      
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
        const errText = data.toString();
        console.error('Hermes Error:', errText);
        if (errText.includes('Error') || errText.includes('Exception') || errText.includes('invalid') || errText.includes('failed') || errText.includes('not found')) {
          safeEnqueue(`data: ${JSON.stringify({ type: 'text', text: `\n\n**[Hermes Engine Error]**: ${errText.trim()}` })}\n\n`);
        }
      });

      child.on('close', () => {
        activeChildProcesses.delete(currentExecId);
        if (isClosed) return;
        safeEnqueue(`data: {"type": "done"}\n\n`);
        try { controller.close(); } catch(e) {}
      });
      
      child.on('error', (err) => {
        activeChildProcesses.delete(currentExecId);
        if (isClosed) return;
        safeEnqueue(`data: {"type": "error", "message": "Failed to start Hermes CLI"}\n\n`);
        try { controller.close(); } catch(e) {}
      });
    },
    cancel() {
      activeChildProcesses.delete(currentExecId);
      try { child.kill('SIGTERM'); } catch (e) {}
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