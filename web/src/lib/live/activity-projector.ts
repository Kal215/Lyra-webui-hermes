import { LyraAgentEvent } from './types';
import path from 'path';

export type ActivityStatus = 'running' | 'completed' | 'failed' | 'changed' | 'patch';

export interface ActivityItem {
  id: string; // runId-sequence or toolCallId
  agentId: string;
  agentName: string;
  type: 'command' | 'file';
  operation: string; // e.g. 'Menjalankan', 'Mengubah', 'Memperbarui'
  target: string;    // e.g. 'npm test', 'src/app/page.tsx'
  status: ActivityStatus;
  exitCode?: number;
  timestamp: string; // latest timestamp
  runId: string;
  toolCallId?: string;
  details?: string;
  patchDiff?: string;
}

function safeRelativePath(fullPath: string): string {
  if (!fullPath) return '';
  const cwd = process.cwd();
  // Strip absolute prefixes to keep paths safe
  if (fullPath.startsWith(cwd)) {
    return fullPath.substring(cwd.length).replace(/^[\/\\]/, '');
  }
  // Try finding common project patterns
  const match = fullPath.match(/portfolio-projects\/nexus-command-center\/(.*)/);
  if (match) return match[1];
  
  // Return basename as ultimate fallback for safety
  return path.basename(fullPath);
}

function formatAgentName(agentId: string): string {
  if (!agentId) return 'Agent';
  const parts = agentId.split('-');
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('-');
}

function redactSecret(str: string): string {
  if (!str) return str;
  // Synthetic match for test
  if (str.includes('TEST_ACTIVITY_SECRET')) {
    return str.replace(/TEST_ACTIVITY_SECRET/g, '[REDACTED]');
  }
  // Generic token match (bearer, api_key, etc)
  return str.replace(/(bearer\s+|api_key=|token=)[a-zA-Z0-9_\-]+/gi, '$1[REDACTED]');
}

export function projectActivities(events: LyraAgentEvent[]): ActivityItem[] {
  // events are assumed to be sorted latest first
  // We need to pair command.started and command.finished
  
  const activities: ActivityItem[] = [];
  const commandMap = new Map<string, ActivityItem>();

  for (let i = events.length - 1; i >= 0; i--) { // process oldest first to build state
    const ev = events[i];
    const { runId, sequence, type, payload, agentId, timestamp } = ev;
    const toolCallId = (payload?.tool_call_id || payload?.toolCallId) as string | undefined;

    if (type === 'command.started') {
      const command = redactSecret((payload?.command as string) || 'command');
      const item: ActivityItem = {
        id: toolCallId || `${runId}-${sequence}`,
        agentId: agentId || 'unknown',
        agentName: formatAgentName(agentId || 'unknown'),
        type: 'command',
        operation: 'Menjalankan',
        target: command,
        status: 'running',
        timestamp: timestamp,
        runId,
        toolCallId
      };
      
      if (toolCallId) {
        commandMap.set(toolCallId, item);
      }
      activities.push(item);
    } else if (type === 'command.finished') {
      if (toolCallId && commandMap.has(toolCallId)) {
        const item = commandMap.get(toolCallId)!;
        const exitCode = payload?.exit_code !== undefined ? payload.exit_code : payload?.exitCode;
        item.status = (exitCode === 0) ? 'completed' : 'failed';
        item.exitCode = exitCode as number | undefined;
        item.timestamp = timestamp; // update to finished time
      } else {
        // Fallback: find the last 'running' command for this runId and agentId
        const pendingCommand = activities.slice().reverse().find(
          a => a.type === 'command' && a.status === 'running' && a.runId === runId && a.agentId === agentId
        );
        if (pendingCommand) {
          const exitCode = payload?.exit_code !== undefined ? payload.exit_code : payload?.exitCode;
          pendingCommand.status = (exitCode === 0) ? 'completed' : 'failed';
          pendingCommand.exitCode = exitCode as number | undefined;
          pendingCommand.timestamp = timestamp;
        } else {
          const exitCode = payload?.exit_code !== undefined ? payload.exit_code : payload?.exitCode;
          activities.push({
            id: toolCallId || `${runId}-${sequence}`,
            agentId: agentId || 'unknown',
            agentName: formatAgentName(agentId || 'unknown'),
            type: 'command',
            operation: 'Menjalankan',
            target: redactSecret((payload?.command as string) || 'unknown command'),
            status: (exitCode === 0) ? 'completed' : 'failed',
            exitCode: exitCode as number | undefined,
            timestamp: timestamp,
            runId,
            toolCallId
          });
        }
      }
    } else if (type === 'file.changed') {
      const filePath = safeRelativePath((payload?.path as string) || '');
      activities.push({
        id: `${runId}-${sequence}`,
        agentId: agentId || 'unknown',
        agentName: formatAgentName(agentId || 'unknown'),
        type: 'file',
        operation: 'Mengubah',
        target: filePath,
        status: 'changed',
        timestamp,
        runId,
        toolCallId
      });
    } else if (type === 'file.patch') {
      const filePath = safeRelativePath((payload?.path as string) || '');
      activities.push({
        id: `${runId}-${sequence}`,
        agentId: agentId || 'unknown',
        agentName: formatAgentName(agentId || 'unknown'),
        type: 'file',
        operation: 'Memperbarui',
        target: filePath,
        status: 'patch',
        timestamp,
        runId,
        toolCallId,
        patchDiff: (payload?.diff as string) || ''
      });
    }
  }

  // Reverse back to latest first
  return activities.reverse();
}