import { NextResponse } from 'next/server';
import { runBuffer } from '@/lib/live/buffer';
import { LyraAgentEvent } from '@/lib/live/types';
import { safeReadFile, MAX_PATCH_BYTES } from '@/lib/live/file-security';

export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = new Set([
  'command.started',
  'terminal.stdout',
  'terminal.stderr',
  'command.finished',
  'bridge.warning',
  'file.changed',
  'file.patch',
  'file.opened'
]);

const MAX_PAYLOAD_SIZE = 1024 * 1024;

let sequenceCounter = Date.now();

export async function POST(req: Request) {
  try {
    const token = req.headers.get('X-Lyra-Observer-Capability');
    const expectedToken = process.env.INTERNAL_OBSERVER_TOKEN;

    if (!token || !expectedToken || token !== expectedToken) {
      return new NextResponse(null, { status: 401 }); // unauthorized
    }
    
    const contentLength = parseInt(req.headers.get('content-length') || '0', 10);
    if (contentLength > MAX_PAYLOAD_SIZE) {
      return new NextResponse(null, { status: 413 });
    }

    const rawPayload = await req.json();

    const eventType = rawPayload.event_type || rawPayload.type || 'terminal.stdout';
    if (!ALLOWED_TYPES.has(eventType)) {
      return new NextResponse(null, { status: 400 });
    }
    
    if (eventType === 'file.patch' && rawPayload.diff) {
        if (rawPayload.diff.length > MAX_PATCH_BYTES) {
            rawPayload.diff = rawPayload.diff.substring(0, MAX_PATCH_BYTES) + '\n[Truncated]';
            rawPayload.truncated = true;
        }
    }
    
    // If it's a file event, optionally read file server-side to enrich
    if ((eventType === 'file.changed' || eventType === 'file.patch') && (rawPayload.path || rawPayload.file)) {
      const p = rawPayload.path || rawPayload.file;
      const readResult = safeReadFile(p);
      if (readResult.content !== undefined) {
         rawPayload.content = readResult.content;
      } else {
         rawPayload.contentUnavailable = readResult.error;
      }
      
      // Make it relative
      if (typeof p === 'string' && p.startsWith(process.env.PROJECT_ROOT || '/app/')) {
        const shortPath = p.replace(process.env.PROJECT_ROOT || '/app/', '');
        if (rawPayload.path) rawPayload.path = shortPath;
        if (rawPayload.file) rawPayload.file = shortPath;
      }
    }

    // Explicitly set source, ignoring what the payload might claim
    const e: LyraAgentEvent = {
      version: 1,
      eventId: Math.random().toString(36).substring(2, 11),
      runId: 'hermes-native',
      agentId: rawPayload.agent_id || rawPayload.agentId || 'default',
      timestamp: new Date().toISOString(),
      sequence: rawPayload.sequence || (sequenceCounter++),
      type: eventType as any,
      source: 'hermes_observer', // Always server-owned
      payload: rawPayload
    };

    runBuffer.pushEvent(e.runId, e);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}

export async function GET(req: Request) {
  return new NextResponse(null, { status: 405 });
}
