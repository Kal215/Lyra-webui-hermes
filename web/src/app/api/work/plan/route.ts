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
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    apiKey: process.env.OPENAI_API_KEY || ''
  };
}

export async function POST(req: NextRequest) {
  try {
    const { 
      instruction,
      prompt,
      assignee = 'planner', 
      clientConfig, 
      language = 'id' 
    } = await req.json();

    const targetInstruction = (instruction || prompt || '').trim();

    if (!targetInstruction) {
      return NextResponse.json({ success: false, error: 'Instruction is required' }, { status: 400 });
    }

    // --- DETERMINISTIC FAST GATING: Do NOT create todos for questions, presentations, or simple tasks ---
    const lowerInstr = targetInstruction.toLowerCase();
    
    const isQuestionOrChat = 
      lowerInstr.startsWith('bisakah') || 
      lowerInstr.startsWith('apakah') || 
      lowerInstr.startsWith('bagaimana') || 
      lowerInstr.startsWith('kenapa') || 
      lowerInstr.startsWith('mengapa') || 
      lowerInstr.startsWith('apa ') || 
      lowerInstr.startsWith('siapa ') || 
      lowerInstr.endsWith('?') ||
      lowerInstr.includes('bisa kah') ||
      lowerInstr.includes('bisa nggak') ||
      lowerInstr.includes('bisa tidak') ||
      lowerInstr.includes('halo') ||
      lowerInstr.includes('hai ') ||
      lowerInstr.startsWith('hai');

    const isPresentation = 
      lowerInstr.includes('powerpoint') || 
      lowerInstr.includes('power point') || 
      lowerInstr.includes('presentasi') || 
      lowerInstr.includes('slide') || 
      lowerInstr.includes('ppt') ||
      lowerInstr.includes('bisnis plan') ||
      lowerInstr.includes('business plan');
      
    const isSimpleDocOrEdit = 
      lowerInstr.includes('edit') || 
      lowerInstr.includes('perbaiki') || 
      lowerInstr.includes('revisi') || 
      lowerInstr.includes('summarize') || 
      lowerInstr.includes('ringkas') || 
      lowerInstr.includes('artikel') ||
      lowerInstr.includes('jelaskan');

    // If it's a question, chat, presentation, or simple edit: DO NOT create todos!
    if (isQuestionOrChat || isPresentation || isSimpleDocOrEdit) {
      return NextResponse.json({
        success: true,
        needs_todo: false,
        plan: {
          mission_title: targetInstruction.slice(0, 40),
          summary: language === 'id' ? 'Eksekusi langsung tanpa checklist.' : 'Direct execution without checklist.',
          todos: []
        },
        todos: []
      });
    }

    const aiConfig = getAiConfig();
    const providersMap = clientConfig?.providers || {};
    let activeProvider = clientConfig?.activeProvider || clientConfig?.providerId || 'openrouter';
    let effectiveBaseUrl = (clientConfig?.baseUrl || aiConfig.baseUrl)?.replace(/\/$/, '') || 'https://openrouter.ai/api/v1';
    let apiKey = (clientConfig?.apiKey || aiConfig.apiKey)?.trim() || '';
    let effectiveModel = clientConfig?.model || aiConfig.model || 'gh/gpt-4o';

    if (providersMap['groq']?.apiKey) {
      activeProvider = 'groq';
      apiKey = providersMap['groq'].apiKey.trim();
      effectiveBaseUrl = 'https://api.groq.com/openai/v1';
      effectiveModel = 'llama-3.3-70b-versatile';
    } else if (providersMap[activeProvider]?.apiKey) {
      apiKey = providersMap[activeProvider].apiKey.trim();
      effectiveBaseUrl = providersMap[activeProvider].baseUrl || effectiveBaseUrl;
    }

    const isNineRouter = effectiveBaseUrl.includes('20128') || effectiveBaseUrl.includes('100.127.180.57');
    if (isNineRouter) {
      if (!effectiveModel || effectiveModel.includes('claude') || effectiveModel.includes('anthropic') || effectiveModel.includes('deepseek') || effectiveModel === 'hermes-fast') {
        effectiveModel = 'gh/gpt-4o';
      } else if (effectiveModel.includes('gpt-4o-mini')) {
        effectiveModel = 'gh/gpt-4o-mini';
      } else if (effectiveModel.includes('gpt-4o')) {
        effectiveModel = 'gh/gpt-4o';
      }
    }

    if (!apiKey) {
      return NextResponse.json({
        success: true,
        needs_todo: false,
        plan: {
          mission_title: targetInstruction.slice(0, 40),
          summary: language === 'id' ? 'Eksekusi langsung otonom.' : 'Direct autonomous execution.',
          todos: []
        },
        todos: []
      });
    }

    const planSystemPrompt = language === 'id'
      ? `Anda adalah Kepala Arsitek & Planner AI dari Lyra Autonomous Studio.
Tugas Anda adalah menganalisis instruksi pengguna dan menentukan apakah instruksi ini membutuhkan rencana bertahap (todos) atau tidak.

ATURAN:
1. Jika instruksi berupa pertanyaan, perbaikan file, presentasi, atau instruksi tunggal: KELUARKAN "needs_todo": false dan "todos": [].
2. Hanya buat "needs_todo": true dan 3-5 langkah jika pengguna meminta pembuatan sistem/aplikasi besar multi-fitur dari nol (misal: "aplikasi kasir full", "dashboard analitik fullstack").

Format Output WAJIB berupa JSON murni tanpa markdown:
{
  "needs_todo": true / false,
  "mission_title": "Judul pekerjaan",
  "summary": "Ringkasan ringkas",
  "todos": [
    {
      "order": 1,
      "label": "Langkah spesifik",
      "assignee": "coder",
      "toolType": "file_writer",
      "expectedOutput": "workspace/app.tsx"
    }
  ]
}`
      : `You are the Lead AI Planner of Lyra Autonomous Studio.
Analyze whether the user's prompt needs a multi-step todo plan or direct execution.

RULES:
1. If the prompt is a question, file edit, presentation, or single deliverable: output "needs_todo": false and "todos": [].
2. Only set "needs_todo": true with 3-5 steps if building a complex full-stack app or multi-feature system from scratch.

Output pure JSON without markdown:
{
  "needs_todo": true / false,
  "mission_title": "Mission title",
  "summary": "Brief summary",
  "todos": [
    {
      "order": 1,
      "label": "Specific step",
      "assignee": "coder",
      "toolType": "file_writer",
      "expectedOutput": "workspace/app.tsx"
    }
  ]
}`;

    const response = await fetch(`${effectiveBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: effectiveModel,
        messages: [
          { role: 'system', content: planSystemPrompt },
          { role: 'user', content: `Instruksi: ${targetInstruction}` }
        ],
        temperature: 0.1,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        needs_todo: false,
        plan: {
          mission_title: targetInstruction.slice(0, 40),
          summary: 'Eksekusi langsung otonom.',
          todos: []
        },
        todos: []
      });
    }

    const rawResponseText = await response.text();
    const responseText = rawResponseText.replace(/data:\s*\[DONE\]/g, '').trim();

    let data: any = {};
    try {
      data = JSON.parse(responseText);
    } catch (e: any) {
      const jsonMatch = responseText.match(/\{[\s\S]*"choices"[\s\S]*\}/);
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[0]);
      } else {
        return NextResponse.json({
          success: true,
          needs_todo: false,
          plan: {
            mission_title: targetInstruction.slice(0, 40),
            summary: 'Eksekusi langsung otonom.',
            todos: []
          },
          todos: []
        });
      }
    }

    const rawContent = data.choices?.[0]?.message?.content || '{}';
    let parsedPlan: any = null;

    try {
      const startIdx = rawContent.indexOf('{');
      const endIdx = rawContent.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        parsedPlan = JSON.parse(rawContent.substring(startIdx, endIdx + 1));
      }
    } catch (err) {}

    if (!parsedPlan) {
      try {
        const cleanedJson = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
        parsedPlan = JSON.parse(cleanedJson);
      } catch (err) {
        parsedPlan = null;
      }
    }

    if (!parsedPlan || parsedPlan.needs_todo === false || !Array.isArray(parsedPlan.todos) || parsedPlan.todos.length === 0) {
      return NextResponse.json({
        success: true,
        needs_todo: false,
        plan: parsedPlan || {
          mission_title: targetInstruction.slice(0, 40),
          summary: 'Eksekusi langsung otonom.',
          todos: []
        },
        todos: []
      });
    }

    const formattedTodos = parsedPlan.todos.map((t: any, idx: number) => ({
      id: `todo-${t.order || idx + 1}`,
      order: t.order || idx + 1,
      label: t.label || t.title || `Langkah ${idx + 1}`,
      description: t.expectedOutput || t.description || '',
      state: 'pending' as const,
      assignee: t.assignee || 'coder',
      toolType: t.toolType || 'file_writer'
    }));

    return NextResponse.json({
      success: true,
      needs_todo: true,
      plan: parsedPlan,
      todos: formattedTodos
    });
  } catch (error: any) {
    console.error('Work Plan API Error:', error);
    return NextResponse.json({
      success: true,
      needs_todo: false,
      todos: []
    });
  }
}
