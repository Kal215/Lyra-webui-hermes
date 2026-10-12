import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getHermesEnv } from '@/lib/hermesEnv';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const opts = { maxBuffer: 1024 * 1024 * 100, env: getHermesEnv() };
    const [exportResult, pinnedResult] = await Promise.all([
      execAsync('hermes sessions export --format jsonl -', opts),
      execAsync('hermes sessions pinned', opts).catch(() => ({ stdout: '' }))
    ]);
    
    // Parse pinned IDs
    const pinnedIds = new Set<string>();
    const pinnedLines = pinnedResult.stdout.split('\n');
    for (const line of pinnedLines) {
      const match = line.match(/([0-9]{8}_[0-9]{6}_[a-f0-9]{6})/);
      if (match) {
        pinnedIds.add(match[1]);
      }
    }

    const lines = exportResult.stdout.split('\n').filter(line => line.trim().length > 0);
    const sessions = lines.map(line => {
      try {
        const data = JSON.parse(line);
        
        // Extract title
        let title = data.display_name;
        if (!title && data.messages && data.messages.length > 0) {
          const firstUserMsg = data.messages.find((m: any) => m.role === 'user');
          if (firstUserMsg && firstUserMsg.content) {
            let t = firstUserMsg.content;
            if (typeof t === 'string') {
              title = t.length > 50 ? t.substring(0, 50) + '...' : t;
            }
          }
        }
        
        const is_pinned = pinnedIds.has(data.id);
        const started_at = data.timings?.first_message_at ? new Date(data.timings.first_message_at).getTime() : 0;
        const updated_at = data.timings?.last_message_at ? new Date(data.timings.last_message_at).getTime() : 0;
        
        // Delete heavy properties to keep the payload small
        delete data.messages;
        delete data.system_prompt;
        delete data.model_config;
        
        return {
          id: data.id,
          title: title || data.id,
          is_pinned,
          started_at,
          updated_at,
          raw_data: data
        };
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    // Sort by updated_at descending
    sessions.sort((a, b) => (b?.updated_at || 0) - (a?.updated_at || 0));

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Failed to load sessions:', error);
    return NextResponse.json({ error: 'Failed to load sessions' }, { status: 500 });
  }
}
