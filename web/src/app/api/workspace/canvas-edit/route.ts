import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const CONFIG_DIR = isServerless 
  ? path.join('/tmp', '.hermes-backend')
  : path.join(process.cwd(), '.hermes-backend');
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
    baseUrl: process.env.OPENAI_BASE_URL || 'http://100.127.180.57:20128/v1',
    model: process.env.OPENAI_MODEL || 'gh/gpt-4o',
    apiKey: process.env.OPENAI_API_KEY || ''
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      filePath, 
      fullContent, 
      selectedSnippet, 
      instruction, 
      actionType = 'edit', // 'edit' | 'explain' | 'docs' | 'optimize'
      language = 'id' 
    } = body;

    if (!selectedSnippet || !instruction) {
      return NextResponse.json({ 
        error: 'selectedSnippet and instruction are required' 
      }, { status: 400 });
    }

    const aiConfig = getAiConfig();
    const baseUrl = (aiConfig.baseUrl || 'http://100.127.180.57:20128/v1').replace(/\/+$/, '');
    const model = aiConfig.model || 'gh/gpt-4o';
    const apiKey = aiConfig.apiKey;

    const fileExt = filePath ? path.extname(filePath).replace('.', '') : 'ts';

    // Tailored system prompts for formal open-source Canvas operations
    let systemPrompt = '';
    if (actionType === 'explain') {
      systemPrompt = language === 'id'
        ? `Anda adalah mesin analisis kode Lyra Studio.
Tugas: Jelaskan potongan kode yang disorot oleh pengguna secara formal, ringkas, dan teknis.
Format output: Markdown terstruktur dengan poin-poin penting (tujuan, parameter/input, output, dan kompleksitas jika relevan). Jangan gunakan basa-basi perkenalan.`
        : `You are the Lyra Studio code analysis engine.
Task: Provide a formal, concise, and technical explanation of the user's selected code snippet.
Output format: Structured markdown covering purpose, parameters/inputs, outputs, and edge cases. Do not include conversational greetings.`;
    } else {
      systemPrompt = `You are the surgical in-line code transformation engine for Lyra Canvas Studio.
Your responsibility is to take a selected code snippet from a file, understand the user's instruction, and return the exact updated code snippet that directly replaces the selection.

STRICT OPERATIONAL RULES:
1. Output ONLY the replacement code snippet.
2. DO NOT wrap the output in markdown code blocks (\`\`\` or \`\`\`${fileExt}) unless the original file is a markdown file.
3. DO NOT output conversational comments, greetings, explanations, or notes like "Here is the updated code".
4. Maintain exact original indentation, whitespace, and coding style of the file.
5. Ensure the returned replacement snippet seamlessly fits into the surrounding file context.`;
    }

    const userPrompt = actionType === 'explain'
      ? `File: ${filePath || 'snippet'}\n\nSelected Code Snippet:\n\`\`\`${fileExt}\n${selectedSnippet}\n\`\`\`\n\nInstruction: ${instruction}`
      : `File Context: ${filePath || 'file'}\n\nSelected Code Snippet to Replace:\n${selectedSnippet}\n\nTransformation Instruction: ${instruction}\n\nSurrounding File Context (first 1500 chars):\n${(fullContent || '').slice(0, 1500)}\n\nOutput strictly the replacement code snippet:`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `AI Gateway error: ${response.status}`, details: errText }, { status: response.status });
    }

    const rawBody = await response.text();
    let cleanedBody = rawBody.trim();
    if (cleanedBody.includes('data: [DONE]')) {
      cleanedBody = cleanedBody.replace(/data:\s*\[DONE\][\s\S]*$/, '').trim();
    }
    const lastBrace = cleanedBody.lastIndexOf('}');
    if (lastBrace !== -1 && lastBrace < cleanedBody.length - 1) {
      cleanedBody = cleanedBody.substring(0, lastBrace + 1);
    }
    const data = JSON.parse(cleanedBody);
    let rawResult = data.choices?.[0]?.message?.content || '';

    // If edit/refactor, strip accidental triple backticks if the model still emitted them
    if (actionType !== 'explain') {
      const tripleBacktickRegex = /^```[a-zA-Z]*\n?([\s\S]*?)\n?```$/;
      const match = rawResult.trim().match(tripleBacktickRegex);
      if (match) {
        rawResult = match[1];
      }
    }

    return NextResponse.json({
      success: true,
      actionType,
      originalSnippet: selectedSnippet,
      replacementSnippet: rawResult,
      explanation: actionType === 'explain' ? rawResult : undefined
    });
  } catch (error: any) {
    console.error('Canvas edit error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process canvas edit' }, { status: 500 });
  }
}
