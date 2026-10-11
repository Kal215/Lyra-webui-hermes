import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { source_session_id, message_index, title } = body;

    const pythonScript = `
import sqlite3, datetime, secrets, json, sys

db_path = 'D:/JARVIS_CORE/.hermes/state.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

source_id = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] else ''
msg_idx = int(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[2] != '' else -1
custom_title = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] else ''

now = datetime.datetime.now()
new_id = now.strftime('%Y%m%d_%H%M%S_') + secrets.token_hex(3)
now_ts = now.timestamp()

source_row = None
if source_id:
    c.execute('SELECT source, user_id, session_key, chat_id, chat_type, thread_id, display_name, model, model_config, system_prompt, cwd, title FROM sessions WHERE id = ?', (source_id,))
    source_row = c.fetchone()

if source_row:
    base_title = custom_title or ((source_row[11] or 'Obrolan') + ' (Branch)')
    c.execute('''
    INSERT INTO sessions (
        id, source, user_id, session_key, chat_id, chat_type, thread_id, 
        display_name, model, model_config, system_prompt, cwd, 
        parent_session_id, started_at, last_activity_at, title, message_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        new_id, source_row[0], source_row[1], source_row[2], source_row[3], source_row[4], source_row[5], 
        base_title, source_row[7], source_row[8], source_row[9], source_row[10], 
        source_id, now_ts, now_ts, base_title, max(1, msg_idx + 1)
    ))

    limit_clause = f'LIMIT {msg_idx + 1}' if msg_idx >= 0 else ''
    c.execute(f'''
    INSERT INTO messages (
        session_id, role, content, tool_call_id, tool_calls, tool_name, 
        effect_disposition, timestamp, token_count, finish_reason, reasoning, 
        reasoning_content, reasoning_details, active
    ) SELECT 
        ?, role, content, tool_call_id, tool_calls, tool_name, 
        effect_disposition, timestamp, token_count, finish_reason, reasoning, 
        reasoning_content, reasoning_details, 1
    FROM messages WHERE session_id = ? ORDER BY id ASC {limit_clause}
    ''', (new_id, source_id))
else:
    base_title = custom_title or 'Obrolan (Branch)'
    c.execute('''
    INSERT INTO sessions (
        id, source, display_name, title, started_at, last_activity_at, message_count
    ) VALUES (?, 'web', ?, ?, ?, ?, ?)
    ''', (new_id, base_title, base_title, now_ts, now_ts, max(1, msg_idx + 1)))

conn.commit()
print(json.dumps({'success': True, 'session_id': new_id, 'title': base_title}))
`;

    const result = await new Promise<any>((resolve, reject) => {
      const py = spawn('python', ['-', source_session_id || '', String(message_index ?? -1), title || '']);
      let stdout = '';
      let stderr = '';

      py.stdout.on('data', chunk => { stdout += chunk; });
      py.stderr.on('data', chunk => { stderr += chunk; });

      py.on('close', code => {
        if (code !== 0) {
          reject(new Error(stderr || `Python process exited with code ${code}`));
        } else {
          try {
            resolve(JSON.parse(stdout.trim()));
          } catch (e) {
            reject(new Error(`Failed to parse Python output: ${stdout}`));
          }
        }
      });

      py.stdin.write(pythonScript);
      py.stdin.end();
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Branch session failed:', err);
    return NextResponse.json({ error: err.message || 'Failed to branch session' }, { status: 500 });
  }
}
