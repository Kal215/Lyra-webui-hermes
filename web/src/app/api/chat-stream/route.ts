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
  let { message, session_id, attachments, systemPrompt, model, thinking, clientConfig, language, conversationHistory } = await req.json();

  if (!message) {
    return new Response(JSON.stringify({ error: 'Message is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const aiConfig = getAiConfig();
  const providersMap = clientConfig?.providers || {};
  let activeProvider = clientConfig?.activeProvider || clientConfig?.providerId || 'openrouter';
  let effectiveBaseUrl = (clientConfig?.baseUrl || aiConfig.baseUrl)?.replace(/\/$/, '') || '';
  let apiKey = (clientConfig?.apiKey || aiConfig.apiKey)?.trim() || '';

  const isHermesAlias = !model || model === 'default' || model === 'hermes-agent' || model === 'Hermes Agent';
  let effectiveModel = !isHermesAlias ? model : (clientConfig?.model || aiConfig.model);

  // If the model requested is a Groq model (e.g. 'llama-3.1-8b-instant' or 'llama-3.3-70b-versatile')
  // and we have a Groq key saved in providersMap, prioritize Groq!
  if ((effectiveModel === 'llama-3.1-8b-instant' || effectiveModel === 'llama-3.3-70b-versatile' || effectiveModel?.includes('distill-llama-70b')) 
      && providersMap['groq']?.apiKey) {
    activeProvider = 'groq';
    apiKey = providersMap['groq'].apiKey.trim();
    effectiveBaseUrl = 'https://api.groq.com/openai/v1';
  } else if (providersMap[activeProvider]?.apiKey) {
    apiKey = providersMap[activeProvider].apiKey.trim();
    effectiveBaseUrl = providersMap[activeProvider].baseUrl || effectiveBaseUrl;
  }

  // Key prefix routing guarantees:
  if (apiKey.startsWith('gsk_')) {
    effectiveBaseUrl = 'https://api.groq.com/openai/v1';
    activeProvider = 'groq';
  } else if (apiKey.startsWith('sk-or-')) {
    effectiveBaseUrl = 'https://openrouter.ai/api/v1';
    activeProvider = 'openrouter';
  } else if (apiKey.startsWith('sk-ant-')) {
    effectiveBaseUrl = 'https://api.anthropic.com/v1';
    activeProvider = 'anthropic';
  } else if (apiKey.startsWith('sk-proj-')) {
    effectiveBaseUrl = 'https://api.openai.com/v1';
    activeProvider = 'openai';
  } else if (activeProvider === 'deepseek') {
    effectiveBaseUrl = 'https://api.deepseek.com/v1';
  } else if (activeProvider === 'ollama') {
    effectiveBaseUrl = 'http://127.0.0.1:11434/v1';
  }

  if (!effectiveBaseUrl) {
    effectiveBaseUrl = 'https://openrouter.ai/api/v1';
  }

  // Harmonize model IDs according to target endpoint:
  if (effectiveBaseUrl.includes('openrouter.ai')) {
    // OpenRouter requires provider namespace prefixes
    if (effectiveModel === 'llama-3.1-8b-instant' || effectiveModel === 'llama-3.1-8b') {
      effectiveModel = 'meta-llama/llama-3.1-8b-instruct';
    } else if (effectiveModel === 'llama-3.3-70b-versatile' || effectiveModel === 'llama-3.3-70b') {
      effectiveModel = 'meta-llama/llama-3.3-70b-instruct';
    } else if (effectiveModel === 'deepseek-r1-distill-llama-70b') {
      effectiveModel = 'deepseek/deepseek-r1-distill-llama-70b';
    } else if (effectiveModel === 'gpt-4o') {
      effectiveModel = 'openai/gpt-4o';
    } else if (effectiveModel === 'gpt-4o-mini') {
      effectiveModel = 'openai/gpt-4o-mini';
    } else if (effectiveModel === 'deepseek-chat') {
      effectiveModel = 'deepseek/deepseek-chat';
    } else if (effectiveModel === 'deepseek-reasoner') {
      effectiveModel = 'deepseek/deepseek-r1';
    }
  } else if (effectiveBaseUrl.includes('groq.com')) {
    // If the model was decommissioned on Groq (e.g. DeepSeek R1), fallback to active Groq model
    if (effectiveModel?.includes('deepseek-r1') || effectiveModel === 'deepseek-r1-distill-llama-70b') {
      effectiveModel = 'openai/gpt-oss-120b';
    }
  }

  if (!effectiveModel || isHermesAlias) {
    if (effectiveBaseUrl.includes('groq.com')) {
      effectiveModel = 'openai/gpt-oss-120b';
    } else if (effectiveBaseUrl.includes('openai.com')) {
      effectiveModel = 'gpt-4o';
    } else {
      effectiveModel = 'anthropic/claude-3.5-sonnet';
    }
  }

  const isEnglish = language === 'en';

  if (!apiKey && !effectiveBaseUrl.includes('localhost') && !effectiveBaseUrl.includes('127.0.0.1')) {
    const errorMsg = isEnglish
      ? `### ⚠️ API Key Required (BYOK Mode)

**Lyra Studio** is currently operating in **Bring Your Own Key (BYOK)** mode. No active API key was found for this session.

#### How to Activate:
1. Open the **[Settings](/settings)** page.
2. Select your AI provider (e.g. **OpenRouter**, **OpenAI**, **Groq**, **DeepSeek**, or **Ollama**).
3. Enter your **API Key** and click **Save Connection**.

Once configured, you can immediately chat, generate code, and orchestrate autonomous AI agents.

---
💡 *Tip: Don't have an API key? You can get a free key on [OpenRouter](https://openrouter.ai/keys) or run [Ollama](https://ollama.ai) locally without needing an API key.*`
      : `### ⚠️ API Key Belum Dikonfigurasi (Mode BYOK)

**Lyra Studio** berjalan dalam mode **Bring Your Own Key (BYOK)**. Belum ada API Key yang dikonfigurasi untuk sesi ini.

#### Cara Mengaktifkan:
1. Buka menu **[Pengaturan](/settings)**.
2. Pilih penyedia AI Anda (contoh: **OpenRouter**, **OpenAI**, **Groq**, **DeepSeek**, atau **Ollama**).
3. Masukkan **API Key** Anda lalu klik **Simpan Pengaturan**.

Setelah disimpan, Anda dapat langsung mengobrol, menulis kode, dan mendelegasikan tugas ke skuad agen AI secara penuh.

---
💡 *Tips: Belum memiliki API Key? Anda bisa membuat akun gratis di [OpenRouter](https://openrouter.ai/keys) atau menjalankan [Ollama](https://ollama.ai) secara lokal di komputer Anda tanpa memerlukan API key.*`;

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

  const defaultLyraSystemPrompt = language === 'en'
    ? `You are Lyra AI, an intelligent autonomous system assistant and software engineering companion for Lyra Command Center. You are helpful, precise, analytical, and professional.`
    : `Anda adalah Lyra AI, asisten sistem otonom dan rekan rekayasa perangkat lunak cerdas di Lyra Command Center. Anda ramah, solutif, analitis, dan profesional.`;

  const basePrompt = systemPrompt || defaultLyraSystemPrompt;
  const finalSystemPrompt = `${basePrompt}\n\n${formattingStandard}`;

  messages.push({ role: 'system', content: finalSystemPrompt });

  // Add conversation history if provided (multi-turn memory)
  if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
    for (const item of conversationHistory) {
      if (item && item.role && item.content) {
        messages.push({
          role: item.role === 'user' ? 'user' : 'assistant',
          content: String(item.content)
        });
      }
    }
  }

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

      let endpointHost = 'API';
      try { endpointHost = new URL(endpoint).hostname; } catch (e) {}

      return new Response(
        `data: ${JSON.stringify({ type: 'text', text: `\n\n**[API Error ${response.status} from ${endpointHost}]**: ${parsedError}\n*(Request target: \`${effectiveModel}\` on \`${endpointHost}\`)*` })}\n\ndata: {"type": "done"}\n\n`,
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
        const encoder = new TextEncoder();
        let buffer = '';
        let pingInterval: any = null;

        try {
          // Keep-alive heartbeat interval to prevent proxy, Nginx, or serverless HTTP/SSE timeouts
          pingInterval = setInterval(() => {
            try {
              controller.enqueue(encoder.encode(': ping\n\n'));
            } catch (e) {
              clearInterval(pingInterval);
            }
          }, 8000);

          // Announce session_id
          const sid = session_id || 'session_' + Date.now();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'session_id', session_id: sid })}\n\n`));

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
          if (pingInterval) clearInterval(pingInterval);
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