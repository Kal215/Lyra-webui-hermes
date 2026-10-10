import net from 'net';
import fs from 'fs';
import os from 'os';
import { runBuffer } from '../buffer';
import { LyraAgentEvent } from '../types';
import { safeReadFile, MAX_PATCH_BYTES } from '../file-security';

const IS_WIN = os.platform() === 'win32';
const SOCKET_PATH = IS_WIN ? '\\\\.\\pipe\\lyra-observer.sock' : `/run/user/${os.userInfo().uid}/lyra-observer.sock`;

const MAX_PAYLOAD_SIZE = 1024 * 1024; // 1MB limit for safety

let server: net.Server | null = null;
let sequenceCounter = Date.now();

export function startObserverServer() {
  if (server) return;

  const globalAny = global as any;
  if (globalAny.__lyraObserverServer) {
    server = globalAny.__lyraObserverServer;
    return;
  }

  const bindServer = () => {
    server = net.createServer((socket) => {
      let buffer = '';

      socket.on('data', (data) => {
        buffer += data.toString('utf-8');
        
        if (buffer.length > MAX_PAYLOAD_SIZE) {
          console.warn('[Lyra Observer] Payload exceeded max size. Dropping connection.');
          socket.destroy();
          return;
        }

        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);

          if (!line) continue;

          try {
            const rawPayload = JSON.parse(line);
            handleObserverEvent(rawPayload);
          } catch (err) {
            console.error('[Lyra Observer] Malformed event dropped:', err);
          }
        }
      });

      socket.on('error', (err) => {
        console.error('[Lyra Observer] Socket error:', err);
      });
    });

    server.listen(SOCKET_PATH, () => {
      console.log('[Lyra Observer] Listening on ' + SOCKET_PATH);
      fs.chmodSync(SOCKET_PATH, 0o600);
    });

    server.on('error', (err) => {
      console.error('[Lyra Observer] Server error:', err);
    });

    globalAny.__lyraObserverServer = server;
  };

  if (fs.existsSync(SOCKET_PATH)) {
    // Test if active listener exists
    const testSocket = net.connect(SOCKET_PATH);
    
    testSocket.on('connect', () => {
      console.log('[Lyra Observer] Active listener already running on ' + SOCKET_PATH);
      testSocket.destroy();
      // We don't overwrite it, but we can't share it natively in this process either.
      // Next.js hot reload shouldn't reach here due to global variable check.
      // If we got here, another instance has the socket.
    });

    testSocket.on('error', (err: any) => {
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOENT') {
        // Stale socket, safe to unlink
        try {
          fs.unlinkSync(SOCKET_PATH);
          bindServer();
        } catch (unlinkErr) {
          console.error('[Lyra Observer] Failed to unlink stale socket:', unlinkErr);
        }
      }
    });
  } else {
    bindServer();
  }
}

function handleObserverEvent(rawPayload: any) {
  if (!rawPayload || !rawPayload.type || !rawPayload.run_id) {
    return;
  }

  const runId = rawPayload.run_id;
  
  // Strip top level fields out of payload for the LyraAgentEvent schema
  const { type, run_id, agent_id, task_id, tool_call_id, ...payloadData } = rawPayload;

  let seq = sequenceCounter++;
  
  if (type === 'file.patch' && payloadData.diff && payloadData.diff.length > MAX_PATCH_BYTES) {
    payloadData.diff = payloadData.diff.substring(0, MAX_PATCH_BYTES) + '\n[Truncated]';
    payloadData.truncated = true;
  }
  
  if ((type === 'file.changed' || type === 'file.patch') && (payloadData.path || payloadData.file)) {
    const p = payloadData.path || payloadData.file;
    const readResult = safeReadFile(p);
    if (readResult.content !== undefined) {
      payloadData.content = readResult.content;
    } else {
      payloadData.contentUnavailable = readResult.error;
    }
    
    // Make relative
    if (typeof p === 'string' && p.startsWith(process.env.PROJECT_ROOT || '/app/')) {
      const shortPath = p.replace(process.env.PROJECT_ROOT || '/app/', '');
      if (payloadData.path) payloadData.path = shortPath;
      if (payloadData.file) payloadData.file = shortPath;
    }
  }

  const unredactedEvent: Partial<LyraAgentEvent> = {
    version: 1,
    eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    runId: run_id,
    agentId: agent_id || 'unknown',
    workId: task_id,
    timestamp: new Date().toISOString(),
    sequence: seq,
    type: type as any,
    source: 'hermes_observer',
    payload: {
      tool_call_id,
      ...payloadData
    }
  };

  runBuffer.pushEvent(runId, unredactedEvent as LyraAgentEvent);
  runBuffer.pushEvent('hermes-native', unredactedEvent as LyraAgentEvent);
}
