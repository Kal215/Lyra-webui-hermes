import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getHermesEnv } from '@/lib/hermesEnv';
import { LyraAgentEvent } from '@/lib/live/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const env = getHermesEnv();
  const logPath = path.join(env.HERMES_HOME, 'logs', 'agent.log');

  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;
      let sequence = 0;
      let currSize = 0;
      let heartbeatInterval: any = null;

      const sendEvent = (event: LyraAgentEvent) => {
        if (isClosed) return;
        try {
          controller.enqueue(`id: ${event.sequence}\n`);
          controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
        } catch (e) {
          isClosed = true;
          cleanup();
        }
      };

      const cleanup = () => {
        isClosed = true;
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        try { controller.close(); } catch(err) {}
      };

      try {
        controller.enqueue(`: heartbeat\n\n`);
        
        if (fs.existsSync(logPath)) {
          currSize = fs.statSync(logPath).size;
          
          heartbeatInterval = setInterval(() => {
            if (isClosed) return;
            try {
              if (fs.existsSync(logPath)) {
                const stat = fs.statSync(logPath);
                if (stat.size > currSize) {
                  const buffer = Buffer.alloc(stat.size - currSize);
                  const fd = fs.openSync(logPath, 'r');
                  fs.readSync(fd, buffer, 0, buffer.length, currSize);
                  fs.closeSync(fd);
                  currSize = stat.size;
                  
                  const text = buffer.toString('utf8');
                  const lines = text.split('\n').map(l => l.replace(/\r$/, '')).filter(l => l.trim().length > 0);
                  
                  for (const line of lines) {
                    sequence++;
                    let type: any = 'terminal.stdout';
                    let payload: any = { chunk: line + '\n' };

                    if (line.includes('running') || line.includes('started')) type = 'run.started';
                    else if (line.includes('completed')) type = 'run.completed';
                    else if (line.includes('tool_call')) {
                      type = 'command.started';
                      payload = { command: line.substring(line.indexOf('tool_call')) };
                    }

                    sendEvent({
                      version: 1,
                      eventId: `ev-${sequence}`,
                      runId: 'live',
                      agentId: 'default',
                      timestamp: new Date().toISOString(),
                      sequence,
                      type,
                      source: 'native_hermes',
                      payload
                    });
                  }
                } else if (stat.size < currSize) {
                  currSize = stat.size;
                }
              }
              
              // Send heartbeat every ~15 polls
              if (sequence % 15 === 0) {
                controller.enqueue(`: heartbeat\n\n`);
              }
            } catch (e) {
              // Ignore EBUSY errors when Hermes is actively writing
            }
          }, 1000);
        }

        request.signal.addEventListener('abort', cleanup);

      } catch (err) {
        if (!isClosed) cleanup();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}