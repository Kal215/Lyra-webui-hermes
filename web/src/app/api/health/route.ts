import { NextResponse } from 'next/server';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { runBuffer } from '@/lib/live/buffer'; // Force init via import if not already

export const dynamic = 'force-dynamic';

export async function GET() {
  let observer = 'unavailable';
  const socketPath = `/run/user/${os.userInfo().uid}/lyra-observer.sock`;
  
  if (fs.existsSync(socketPath)) {
    observer = 'ready';
  }

  let registry = 'unavailable';
  try {
    const statePath = path.join(process.env.HOME || require('os').homedir(), '.hermes', 'gateway_state.json');
    if (fs.existsSync(statePath)) {
      registry = 'connected';
    }
  } catch (e) {
  }

  return NextResponse.json({
    status: 'ok',
    app: 'ready',
    registry,
    observer
  });
}
