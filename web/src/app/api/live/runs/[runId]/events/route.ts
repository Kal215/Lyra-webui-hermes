import { NextRequest } from 'next/server';
import { runBuffer } from '@/lib/live/buffer';
import { LyraAgentEvent } from '@/lib/live/types';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;

  let lastEventId = request.headers.get('last-event-id');
  if (!lastEventId) {
    const searchParams = request.nextUrl.searchParams;
    lastEventId = searchParams.get('lastEventId');
  }
  
  let currentSequence = lastEventId ? parseInt(lastEventId, 10) : -1;

  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;

      // Safe enqueue wrapper
      const sendEvent = (event: LyraAgentEvent) => {
        if (isClosed) return;
        try {
          controller.enqueue(`id: ${event.sequence}\n`);
          controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
          currentSequence = event.sequence;
        } catch (e: unknown) {
          isClosed = true;
          controller.close();
        }
      };

      try {
        controller.enqueue(`: heartbeat\n\n`); // send initial heartbeat

        // Catch up on missed events
        const catchup = runBuffer.getEvents(runId, currentSequence);
        
        if (catchup.hasGap) {
          sendEvent({
            version: 1,
            eventId: `gap-${Date.now()}`,
            runId,
            agentId: 'system',
            timestamp: new Date().toISOString(),
            sequence: currentSequence, // keep same sequence so we don't break next real event order
            type: 'bridge.warning',
            source: 'derived',
            payload: { reason: 'history_gap', detail: 'Some historical events were evicted prior to reconnect' }
          });
        }

        for (const event of catchup.events) {
          sendEvent(event);
        }

        const unsubscribe = runBuffer.subscribe(runId, (event) => {
          if (event.sequence > currentSequence) {
             sendEvent(event);
          }
        });

        // Periodic heartbeat that DOES NOT increment sequence and is NOT buffered
        const interval = setInterval(() => {
          if (isClosed) return;
          try {
            controller.enqueue(`: heartbeat\n\n`);
          } catch (e: unknown) {
            isClosed = true;
            clearInterval(interval);
            unsubscribe();
            controller.close();
          }
        }, 15000); // 15 seconds

        request.signal.addEventListener('abort', () => {
          isClosed = true;
          clearInterval(interval);
          unsubscribe();
        });
      } catch (err: unknown) {
        if (!isClosed) {
          controller.close();
        }
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