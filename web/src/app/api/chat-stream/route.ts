import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { activeChildProcesses } from '@/lib/activeProcesses';
import { chunkDocument, buildChunkedContextPrompt } from '@/lib/utils/documentChunker';
import { extractTextFromPdfBuffer } from '@/lib/utils/pdfExtractor';

export const dynamic = 'force-dynamic';

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

  // 9Router custom gateway mapping (handles model routing safely)
  const isNineRouter = effectiveBaseUrl.includes('20128') || effectiveBaseUrl.includes('100.127.180.57');
  if (isNineRouter) {
    if (!effectiveModel || isHermesAlias || effectiveModel.includes('claude') || effectiveModel.includes('anthropic') || effectiveModel.includes('deepseek')) {
      effectiveModel = 'gh/gpt-4o';
    } else if (effectiveModel.includes('gpt-4o-mini')) {
      effectiveModel = 'gh/gpt-4o-mini';
    } else if (effectiveModel.includes('gpt-4o') || effectiveModel.includes('gpt-4')) {
      effectiveModel = 'gh/gpt-4o';
    } else if (effectiveModel.includes('gemini')) {
      effectiveModel = 'ag/gemini-3-flash';
    } else if (!effectiveModel.startsWith('gh/') && !effectiveModel.startsWith('ag/') && !effectiveModel.startsWith('nvidia/')) {
      effectiveModel = 'gh/gpt-4o';
    }
  }

  if (!effectiveModel || isHermesAlias) {
    if (effectiveBaseUrl.includes('groq.com')) {
      effectiveModel = 'openai/gpt-oss-120b';
    } else if (effectiveBaseUrl.includes('openai.com')) {
      effectiveModel = 'gpt-4o';
    } else if (isNineRouter) {
      effectiveModel = 'gh/gpt-4o';
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

  // Process and ingest attachments (Documents, Source Code, Images, URLs)
  const imagePayloads: Array<{ type: 'image_url'; image_url: { url: string } }> = [];
  let fileContextPrefix = '';

  if (attachments && Array.isArray(attachments)) {
    for (const file of attachments) {
      if (!file) continue;

      if (file.isUrl) {
        fileContextPrefix += `[Attached URL Context: ${file.url || file.path}]\n`;
        continue;
      }

      // Check if image
      const isImg = file.type?.startsWith('image/') ||
        (typeof file.name === 'string' && /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name)) ||
        (typeof file.path === 'string' && /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.path));

      if (isImg) {
        let base64Str = file.base64;
        let mime = file.type?.startsWith('image/') ? file.type : 'image/png';
        if (!base64Str && file.path) {
          let resolved = file.path;
          if (!fs.existsSync(resolved)) {
            const inWs = path.join(process.cwd(), 'workspace', file.path);
            if (fs.existsSync(inWs)) resolved = inWs;
            else {
              const inCwd = path.join(process.cwd(), file.path);
              if (fs.existsSync(inCwd)) resolved = inCwd;
            }
          }
          if (fs.existsSync(resolved)) {
            try {
              const buf = fs.readFileSync(resolved);
              base64Str = buf.toString('base64');
              const ext = path.extname(resolved).toLowerCase();
              if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';
              else if (ext === '.webp') mime = 'image/webp';
              else if (ext === '.gif') mime = 'image/gif';
            } catch (err) {}
          }
        }

        if (base64Str) {
          imagePayloads.push({
            type: 'image_url',
            image_url: { url: `data:${mime};base64,${base64Str}` }
          });
        }
        continue;
      }

      // Text / Document / Code files: read full file contents into prompt
      let textContent = file.content;
      let resolved = file.path;

      if (!textContent && resolved) {
        let actualPath = resolved;
        const candidates = [
          resolved,
          path.join(process.cwd(), 'workspace', resolved),
          path.join(process.cwd(), resolved),
          path.join(process.cwd(), 'workspace', path.basename(resolved)),
          path.join(os.tmpdir(), 'lyra_uploads', path.basename(resolved))
        ];
        for (const cand of candidates) {
          if (fs.existsSync(cand)) {
            actualPath = cand;
            break;
          }
        }
        if (fs.existsSync(actualPath)) {
          try {
            const stat = fs.statSync(actualPath);
            if (!stat.isDirectory()) {
              const fileBuf = fs.readFileSync(actualPath);
              const isPdfTarget = actualPath.toLowerCase().endsWith('.pdf') || (typeof file.name === 'string' && file.name.toLowerCase().endsWith('.pdf'));
              if (isPdfTarget) {
                textContent = await extractTextFromPdfBuffer(fileBuf);
              } else {
                textContent = fileBuf.toString('utf-8');
              }
            }
          } catch (err) {}
        }
      }

      const fileName = file.name || (resolved ? path.basename(resolved) : 'attached_file');
      if (file.chunks && Array.isArray(file.chunks) && file.chunks.length > 1) {
        // Use precomputed smart sliding-window chunks (Phase 4)
        const chunkResult = {
          totalLines: file.totalLines || 0,
          totalChars: file.size || 0,
          estimatedTokens: file.estimatedTokens || 0,
          isChunked: true,
          chunks: file.chunks
        };
        fileContextPrefix += buildChunkedContextPrompt(fileName, chunkResult);
      } else if (textContent) {
        // Dynamic smart chunking for deep file contexts
        const chunkResult = chunkDocument(textContent);
        if (chunkResult.isChunked) {
          fileContextPrefix += buildChunkedContextPrompt(fileName, chunkResult);
        } else {
          const ext = path.extname(fileName).replace('.', '') || 'txt';
          fileContextPrefix += `\n[ATTACHED FILE CONTENT: "${fileName}"]\n\`\`\`${ext}\n${textContent}\n\`\`\`\n[END OF ATTACHED FILE "${fileName}"]\n`;
        }
      } else if (file.path) {
        fileContextPrefix += `[Attached File: ${fileName} (${file.path})]\n`;
      }
    }

    if (fileContextPrefix) {
      message = `${fileContextPrefix.trim()}\n\n${message}`;
    }
  }

  // If image attachments exist and communicating with 9Router, route to ag/gemini-3.8-flash (vision-capable)
  if (imagePayloads.length > 0 && isNineRouter) {
    effectiveModel = 'ag/gemini-3.8-flash';
  }

  const messages: Array<{ role: string; content: any }> = [];

  const formattingStandard = `[FORMATTING RULES]:
- Gunakan struktur GitHub-Flavored Markdown yang rapi, elegan, dan profesional.
- Gunakan heading yang jelas (##, ###) untuk membagi bagian.
- Gunakan bullet points (-) dan penekanan tebal (**teks**) pada poin-poin kunci.
- DILARANG KERAS menggunakan garis pemisah ASCII kuno seperti (===...) atau (---...).
- Prioritaskan format tabel Markdown atau bullet terstruktur jika menyajikan perbandingan.`;

  const defaultLyraSystemPrompt = language === 'en'
    ? `You are Lyra AI, an intelligent autonomous system assistant and software engineering companion. Be concise, direct, and actionable. Do not repeat greeting introductions or recite your identity in every turn.

CRITICAL: You are running inside Lyra Studio (/work). You MUST NEVER refuse to generate code, edit files, or create deliverables. When the user asks you to edit, create, or modify ANY file (.ts, .tsx, .py, .md, .json, .txt, .pptx), you MUST immediately output the complete file content inside a markdown code block with the file path clearly labeled above it. Do NOT say you "cannot access files" or "are just a text model" — you are an autonomous coding agent and your job is to deliver working code.`
    : `Anda adalah Lyra AI, asisten rekayasa perangkat lunak cerdas. Jawab langsung ke inti, ringkas, dan solutif. Dilarang mengulang salam perkenalan diri ("Halo saya...") di setiap giliran pesan.

PENTING: Anda berjalan di Lyra Studio (/work). Anda WAJIB TIDAK PERNAH menolak untuk membuat, mengedit, atau memodifikasi file (.ts, .tsx, .py, .md, .json, .txt, .pptx). Saat pengguna meminta Anda untuk mengedit atau membuat file, Anda HARUS langsung mengeluarkan isi file lengkap di dalam blok kode markdown dengan path file yang jelas di atasnya. JANGAN PERNAH bilang bahwa Anda "tidak dapat mengakses file" atau "hanya model teks" — Anda adalah coding agent otonom dan tugas Anda adalah mengirimkan hasil kerja yang siap pakai.`;

  const attachmentRule = fileContextPrefix ? (
    language === 'id' 
      ? `\n\n[INSTRUKSI DOKUMEN & LAMPIRAN]:\nPengguna telah melampirkan berkas di dalam pesan ([SMART CHUNKED DOCUMENT] atau [ATTACHED FILE CONTENT]). Seluruh teks dokumen tersebut sudah berhasil diekstrak dan disertakan langsung di dalam pesan pengguna. Anda WAJIB langsung membaca, menganalisis, dan menjawab permintaan pengguna berdasarkan isi dokumen tersebut. DILARANG KERAS menolak atau mengatakan "tidak dapat membaca file secara langsung" atau meminta pengguna menempelkan kembali teksnya.`
      : `\n\n[DOCUMENT & ATTACHMENT INSTRUCTION]:\nThe user has provided an attached document ([SMART CHUNKED DOCUMENT] or [ATTACHED FILE CONTENT]). The full extracted document text is provided directly in the user prompt. You MUST directly read, analyze, and answer the user's request based on this content. NEVER say you "cannot read files directly" or ask the user to copy-paste.`
  ) : '';

  const basePrompt = systemPrompt || defaultLyraSystemPrompt;
  const finalSystemPrompt = `${basePrompt}\n\n${formattingStandard}${attachmentRule}`;

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

  if (imagePayloads.length > 0) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: message },
        ...imagePayloads
      ]
    });
  } else {
    messages.push({ role: 'user', content: message });
  }

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