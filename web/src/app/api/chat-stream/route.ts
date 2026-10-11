import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// Global map tracking active child CLI processes across server requests (kept for backward-compatibility with /api/work/stop)
export const activeChildProcesses = new Map<string, any>();

const CONFIG_DIR = path.join(process.cwd(), '.hermes-backend');
const AI_CONFIG_PATH = path.join(CONFIG_DIR, 'ai-config.json');

interface AiConfig {
  providerId: string;
  baseUrl: string;
  model: string;
  apiKey: string;
}

function getAiConfig(): AiConfig {
  try {
    if (fs.existsSync(AI_CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(AI_CONFIG_PATH, 'utf8'));
    }
  } catch (e) {}
  return {
    providerId: 'custom',
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    apiKey: process.env.OPENAI_API_KEY || ''
  };
}

export async function POST(req: NextRequest) {
  let { message, session_id, attachments, systemPrompt, model, thinking } = await req.json();

  if (!message) {
    return new Response(JSON.stringify({ error: 'Message is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const aiConfig = getAiConfig();
  const effectiveBaseUrl = aiConfig.baseUrl?.replace(/\/$/, '') || 'https://api.openai.com/v1';
  const effectiveModel = (model && model !== 'default' && model !== 'Hermes Agent') 
    ? model 
    : (aiConfig.model || 'gpt-4o-mini');
  const apiKey = aiConfig.apiKey;

  if (!apiKey && !effectiveBaseUrl.includes('localhost') && !effectiveBaseUrl.includes('127.0.0.1')) {
    const errorMsg = 'API Key belum dikonfigurasi. Silakan buka menu Pengaturan (Settings) untuk memasukkan API Key.';
    return new Response(
      `data: ${JSON.stringify({ type: 'text', text: errorMsg })}\n\ndata: {"type": "done"}\n\n`,
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      }
    );
  }

  // Prepend file context references to the prompt message
  if (attachments && Array.isArray(attachments)) {
    let contextPrefix = '';
    for (const file of attachments) {
      if (file.isUrl) {
        contextPrefix += `[Attached URL Context: ${file.url || file.path}]\n`;
      } else if (file.type && !file.type.startsWith('image/')) {
        contextPrefix += `[Attached Document/File: ${file.path}]\n`;
      }
    }
    if (contextPrefix) {
      message = `${contextPrefix}\n${message}`;
    }
  }

  const messages: Array<{ role: string; content: string }> = [];

  const formattingStandard = `[FORMATTING RULES]:
- Gunakan struktur GitHub-Flavored Markdown yang rapi, elegan, dan profesional.
- Gunakan heading yang jelas (##, ###) untuk membagi bagian.
- Gunakan bullet points (-) dan penekanan tebal (**teks**) pada poin-poin kunci.
- DILARANG KERAS menggunakan garis pemisah ASCII kuno seperti (===...) atau (---...).
- Prioritaskan format tabel Markdown atau bullet terstruktur jika menyajikan perbandingan.`;

  const finalSystemPrompt = systemPrompt 
    ? `${systemPrompt}\n\n${formattingStandard}`
    : formattingStandard;

  messages.push({ role: 'system', content: finalSystemPrompt });
  messages.push({ role: 'user', content: message });

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const payload: any = {
      model: effectiveModel,
      messages,
      stream: true
    };

    const endpoint = `${effectiveBaseUrl}/chat/completions`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: req.signal
    });

    if (!response.ok) {
      const errBody = await response.text();
      let parsedError = errBody;
      try {
        const json = JSON.parse(errBody);
        parsedError = json.error?.message || errBody;
      } catch (e) {}

      return new Response(
        `data: ${JSON.stringify({ type: 'text', text: `\n\n**[API Error ${response.status}]**: ${parsedError}` })}\n\ndata: {"type": "done"}\n\n`,
        {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          }
        }
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
          // Announce session_id
          const sid = session_id || 'session_' + Date.now();
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'session_id', session_id: sid })}\n\n`));

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data:')) continue;

              const dataStr = trimmed.replace(/^data:\s*/, '');
              if (dataStr === '[DONE]') {
                controller.enqueue(new TextEncoder().encode(`data: {"type": "done"}\n\n`));
                continue;
              }

              try {
                const parsed = JSON.parse(dataStr);
                const delta = parsed.choices?.[0]?.delta;
                
                // Handle text content
                if (delta?.content) {
                  controller.enqueue(
                    new TextEncoder().encode(`data: ${JSON.stringify({ type: 'text', text: delta.content })}\n\n`)
                  );
                }
                
                // Handle reasoning/thinking
                if (delta?.reasoning_content || delta?.thinking) {
                  const thinkText = delta.reasoning_content || delta.thinking;
                  controller.enqueue(
                    new TextEncoder().encode(`data: ${JSON.stringify({ type: 'text', text: `<think>${thinkText}</think>` })}\n\n`)
                  );
                }
              } catch (e) {
                // Ignore parse errors from non-json stream lines
              }
            }
          }

          controller.enqueue(new TextEncoder().encode(`data: {"type": "done"}\n\n`));
        } catch (err: any) {
          if (err.name !== 'AbortError') {
            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify({ type: 'text', text: `\n\n**[Stream Error]**: ${err.message}` })}\n\n`)
            );
          }
        } finally {
          controller.close();
        }
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

  } catch (error: any) {
    return new Response(
      `data: ${JSON.stringify({ type: 'text', text: `\n\n**[Connection Error]**: ${error.message}` })}\n\ndata: {"type": "done"}\n\n`,
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      }
    );
  }
}