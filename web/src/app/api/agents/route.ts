import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { getHermesEnv } from '@/lib/hermesEnv';
import { ensureSpecialistProfiles } from '@/lib/bootstrapProfiles';

const execFileAsync = promisify(execFile);

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const env = getHermesEnv();

    // 1. Ensure the default specialist squad and kanban DB are seeded
    await ensureSpecialistProfiles();

    // 2. Discover all profiles using hermes profile list
    let agents: string[] = [];
    try {
      const { stdout } = await execFileAsync('hermes', ['profile', 'list'], { env });
      const lines = stdout.split('\n').filter(l => l.trim().length > 0 && !l.includes('─────') && !l.includes('Profile'));
      
      agents = lines.map(line => {
        const cleanLine = line.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '').trim();
        const match = cleanLine.match(/^(?:◆\s*)?([a-zA-Z0-9_\-]+)/);
        if (match && match[1] && match[1] !== 'Profile' && match[1] !== 'Gateway') {
          return match[1];
        }
        return null;
      }).filter(Boolean) as string[];
    } catch (cliErr) {
      console.warn('[Agents API] hermes profile list warning, falling back to disk check:', cliErr);
    }

    // 3. Fallback to filesystem if list was empty
    if (agents.length === 0) {
      agents = ['default'];
      const profilesDir = path.join(env.HERMES_HOME, 'profiles');
      if (fs.existsSync(profilesDir)) {
        const entries = fs.readdirSync(profilesDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory() && !agents.includes(entry.name)) {
            agents.push(entry.name);
          }
        }
      }
    } else if (!agents.includes('default')) {
      agents.unshift('default');
    }

    return NextResponse.json({ success: true, data: agents });
  } catch (error: any) {
    console.error('Failed to fetch agents:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
