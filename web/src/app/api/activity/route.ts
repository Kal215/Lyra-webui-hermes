import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getHermesEnv } from '@/lib/hermesEnv';

export async function GET(request: Request) {
  try {
    const env = getHermesEnv();
    const logPath = path.join(env.HERMES_HOME, 'logs', 'agent.log');
    
    if (!fs.existsSync(logPath)) {
      return NextResponse.json({ activities: [] });
    }

    const content = fs.readFileSync(logPath, 'utf8');
    const lines = content.split('\n').map(l => l.replace(/\r$/, '')).filter(l => l.trim().length > 0).slice(-200);
    
    const activities: any[] = [];
    let idCounter = 0;

    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      // Format: YYYY-MM-DD HH:MM:SS,mmm LEVEL [session_id] module: message
      const regex = /^(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2},\d{3})\s+(INFO|WARNING|ERROR|DEBUG)\s+(?:\[(.*?)\]\s+)?(.*?):\s+(.*)$/;
      const match = line.match(regex);
      
      if (match) {
        const [, timestamp, level, session_id, moduleName, message] = match;
        
        let type = 'command';
        let status = level === 'ERROR' ? 'failed' : 'completed';
        if (message.includes('running') || message.includes('started')) status = 'running';
        
        let operation = moduleName;
        let target = message.substring(0, 100);

        if (moduleName.includes('file') || message.includes('file')) type = 'file';

        activities.push({
          id: `log-${idCounter++}`,
          agentId: session_id || 'System',
          agentName: 'Hermes Core',
          type,
          operation,
          target,
          status,
          timestamp,
          runId: session_id || 'Global',
        });
      }
    }

    return NextResponse.json({
      activities,
      meta: {
        persistence: 'FILE_LOGS',
        totalEventsBuffered: activities.length,
      }
    });
  } catch (error) {
    console.error('API Activity Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}