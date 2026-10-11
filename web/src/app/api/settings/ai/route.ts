import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const CONFIG_DIR = path.join(process.cwd(), '.hermes-backend');
const AI_CONFIG_PATH = path.join(CONFIG_DIR, 'ai-config.json');

interface AiConfig {
  providerId: string;
  providerLabel: string;
  baseUrl: string;
  model: string;
  apiKey: string;
  keyEnv: string;
}

function readConfig(): AiConfig {
  try {
    if (fs.existsSync(AI_CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(AI_CONFIG_PATH, 'utf8'));
    }
  } catch (e) {}
  return {
    providerId: 'custom',
    providerLabel: 'Custom',
    baseUrl: '',
    model: '',
    apiKey: '',
    keyEnv: 'LYRA_WEB_KEY'
  };
}

function writeConfig(config: AiConfig) {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(AI_CONFIG_PATH, JSON.stringify(config, null, 2));
}

export async function GET() {
  try {
    const config = readConfig();
    return NextResponse.json({
      provider: config.providerId || 'custom',
      providerLabel: config.providerLabel || 'Custom',
      model: config.model || '',
      baseUrl: config.baseUrl || '',
      apiKey: config.apiKey ? '••••' + config.apiKey.slice(-4) : '',
      hasApiKey: !!config.apiKey
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { baseUrl, model, apiKey, providerId, providerLabel, keyEnv } = data;
    
    const existing = readConfig();

    const updated: AiConfig = {
      providerId: providerId || existing.providerId || 'custom',
      providerLabel: providerLabel || existing.providerLabel || 'Custom',
      baseUrl: baseUrl !== undefined ? baseUrl : existing.baseUrl,
      model: model !== undefined ? model : existing.model,
      apiKey: apiKey !== undefined ? apiKey : existing.apiKey,
      keyEnv: keyEnv || existing.keyEnv || 'LYRA_WEB_KEY'
    };

    writeConfig(updated);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

