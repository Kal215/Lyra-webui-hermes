import fs from 'fs';
import path from 'path';
import { getHermesEnv } from '@/lib/hermesEnv';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const env = getHermesEnv();
  const name = req.nextUrl.searchParams.get('name');
  if (!name) return NextResponse.json({ success: false, error: 'Name required' }, { status: 400 });

  const profileDir = name === 'default' ? env.HERMES_HOME : path.join(env.HERMES_HOME, 'profiles', name);
  const agentsMdPath = path.join(profileDir, 'AGENTS.md');
  
  let prompt = '';
  if (fs.existsSync(agentsMdPath)) {
    prompt = fs.readFileSync(agentsMdPath, 'utf8');
  }

  return NextResponse.json({ success: true, prompt });
}

export async function POST(req: NextRequest) {
  const env = getHermesEnv();
  const body = await req.json();
  const { name, prompt } = body;
  if (!name) return NextResponse.json({ success: false, error: 'Name required' }, { status: 400 });

  const profileDir = name === 'default' ? env.HERMES_HOME : path.join(env.HERMES_HOME, 'profiles', name);
  const agentsMdPath = path.join(profileDir, 'AGENTS.md');
  
  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }
  
  fs.writeFileSync(agentsMdPath, prompt || '', 'utf8');
  return NextResponse.json({ success: true });
}
