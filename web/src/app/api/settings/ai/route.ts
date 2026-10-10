import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { getHermesEnv } from '@/lib/hermesEnv';

const execFileAsync = promisify(execFile);

async function getConfigValue(key: string, env: any) {
  try {
    const { stdout } = await execFileAsync('hermes', ['config', 'get', key], { env });
    return stdout.trim();
  } catch (e) {
    return '';
  }
}

export async function GET() {
  try {
    const env = getHermesEnv();
    const provider = await getConfigValue('model.provider', env);
    const model = await getConfigValue('model.default', env);
    let baseUrl = '';
    
    if (provider) {
      baseUrl = await getConfigValue(`providers.${provider}.base_url`, env);
    }
    
    // Read API key from .env if possible
    let apiKey = '';
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(env.HERMES_HOME, '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/LYRA_WEB_KEY=(.*)/);
      if (match) apiKey = match[1];
    }
    
    return NextResponse.json({
      provider: provider || 'lyra-web',
      model: model || 'hermes-agent',
      baseUrl: baseUrl || 'http://localhost:11434/v1',
      apiKey: apiKey
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { baseUrl, model, apiKey } = data;
    
    const env = getHermesEnv();
    const targetProvider = 'lyra-web';
    
    if (baseUrl) {
      await execFileAsync('hermes', ['config', 'set', `providers.${targetProvider}.base_url`, baseUrl], { env });
      await execFileAsync('hermes', ['config', 'set', `providers.${targetProvider}.name`, 'Lyra Web Provider'], { env });
      await execFileAsync('hermes', ['config', 'set', 'model.provider', targetProvider], { env });
    }
    if (model) {
      await execFileAsync('hermes', ['config', 'set', `providers.${targetProvider}.model`, model], { env });
      await execFileAsync('hermes', ['config', 'set', 'model.default', model], { env });
    }
    if (apiKey !== undefined) {
      const fs = require('fs');
      const path = require('path');
      const envPath = path.join(env.HERMES_HOME, '.env');
      let envContent = '';
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }
      const lines = envContent.split('\n').filter((l: string) => !l.startsWith('LYRA_WEB_KEY='));
      if (apiKey.trim()) {
        lines.push(`LYRA_WEB_KEY=${apiKey}`);
      }
      fs.writeFileSync(envPath, lines.join('\n'));
      
      await execFileAsync('hermes', ['config', 'set', `providers.${targetProvider}.key_env`, 'LYRA_WEB_KEY'], { env });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
