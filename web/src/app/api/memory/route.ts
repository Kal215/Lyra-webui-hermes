import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getHermesEnv } from '@/lib/hermesEnv';

export async function GET() {
  try {
    const env = getHermesEnv();
    const memoriesPath = path.join(env.HERMES_HOME, 'memories');
    
    let memoryMd = '';
    let userMd = '';

    const memoryFile = path.join(memoriesPath, 'MEMORY.md');
    const userFile = path.join(memoriesPath, 'USER.md');

    if (fs.existsSync(memoryFile)) memoryMd = fs.readFileSync(memoryFile, 'utf8');
    if (fs.existsSync(userFile)) userMd = fs.readFileSync(userFile, 'utf8');

    return NextResponse.json({ success: true, memory: memoryMd, user: userMd });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const env = getHermesEnv();
    const memoriesPath = path.join(env.HERMES_HOME, 'memories');
    
    if (!fs.existsSync(memoriesPath)) {
      fs.mkdirSync(memoriesPath, { recursive: true });
    }

    const { memory, user } = await req.json();

    const memoryFile = path.join(memoriesPath, 'MEMORY.md');
    const userFile = path.join(memoriesPath, 'USER.md');

    if (memory !== undefined) fs.writeFileSync(memoryFile, memory, 'utf8');
    if (user !== undefined) fs.writeFileSync(userFile, user, 'utf8');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
