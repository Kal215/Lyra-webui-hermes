import { NextResponse } from 'next/server';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { getHermesEnv } from '@/lib/hermesEnv';

export const dynamic = 'force-dynamic';
const execFileAsync = promisify(execFile);

// Simple in-memory cache to eliminate Python CLI overhead on repeated loads
let cachedResponse: any = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 5000; // 5 seconds cache

export async function GET() {
  const now = Date.now();
  if (cachedResponse && (now - lastFetchTime < CACHE_TTL_MS)) {
    return NextResponse.json(cachedResponse);
  }

  const env = getHermesEnv();

  // Run all CLI calls in parallel to massively speed up load times
  const [profileResult, kanbanResult, statusResult] = await Promise.allSettled([
    execFileAsync('hermes', ['profile', 'list'], { env }),
    execFileAsync('hermes', ['kanban', 'list', '--json'], { env }),
    execFileAsync('hermes', ['status'], { env, encoding: 'utf8' })
  ]);

  // 1. PROFILES (formerly Agents)
  let profiles: any[] = [];
  if (profileResult.status === 'fulfilled') {
    const lines = profileResult.value.stdout.split('\n').filter(l => l.trim().length > 0 && !l.includes('────') && !l.includes('Profile'));
    profiles = lines.map(l => {
      const cleanLine = l.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '').trim();
      const match = cleanLine.match(/^[◆\s]\s*([^\s]+)/);
      if (match) return { id: match[1], status: cleanLine.includes('◆') ? 'Active' : 'Idle' };
      return null;
    }).filter(Boolean);
  }

  // 2. KANBAN (Work)
  let workData: any[] = [];
  if (kanbanResult.status === 'fulfilled') {
    try {
      workData = JSON.parse(kanbanResult.value.stdout);
    } catch (e) {}
  }
  
  // Hitung tiket aktif
  const activeWork = workData.filter((w:any) => w.status?.toLowerCase() !== 'done' && w.status?.toLowerCase() !== 'archived').length;

  // 3. ACTIVITY (Log Parser) - File System reading is instantaneous
  let recentActivity: any[] = [];
  try {
    const logPath = path.join(env.HERMES_HOME, 'logs', 'agent.log');
    if (fs.existsSync(logPath)) {
      const logs = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);
      // Ambil 5 baris terakhir
      recentActivity = logs.slice(-5).reverse().map((line, i) => {
        const lineStr = line.replace(/\r$/, '');
        const match = lineStr.match(/^(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2},\d{3})\s+([A-Z]+)\s+\[([^\]]+)\]\s+(.*?):\s+(.*)$/);
        if (match) {
          return { id: `act-${i}`, timestamp: match[1], level: match[2], source: match[4], message: match[5] };
        }
        return { id: `act-${i}`, message: lineStr };
      });
    }
  } catch (e) {}

  // 4. SYSTEMS HEALTH
  let sysItems: any[] = [];
  let degraded = 0;
  if (statusResult.status === 'fulfilled') {
    const stdout = statusResult.value.stdout;
    const gwMatch = stdout.match(/Gateway Service\s*Status:\s*(.*?)\n/);
    const isGwUp = gwMatch && gwMatch[1].includes('running');
    sysItems.push({ id: 'Gateway', status: isGwUp ? 'normal' : 'unavailable' });
    sysItems.push({ id: 'WebUI', status: 'normal' });
    
    const totalMem = os.totalmem();
    const usedMem = totalMem - os.freemem();
    if ((usedMem / totalMem) > 0.9) {
      sysItems.push({ id: 'RAM Limit', status: 'degraded' });
      degraded++;
    } else {
      sysItems.push({ id: 'RAM', status: 'normal' });
    }
    if (!isGwUp) degraded++;
  }

  cachedResponse = {
    profiles: { data: profiles },
    work: { data: workData },
    activity: { data: recentActivity },
    systems: { items: sysItems, degradedCount: degraded },
    stats: {
      activeWork: activeWork,
      attention: degraded,
      healthy: degraded === 0 ? '100%' : 'Degraded'
    }
  };
  lastFetchTime = Date.now();

  return NextResponse.json(cachedResponse);
}
