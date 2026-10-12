import { NextResponse } from 'next/server';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { getHermesEnv } from '@/lib/hermesEnv';

export const dynamic = 'force-dynamic';
const execFileAsync = promisify(execFile);

export async function GET() {
  const env = getHermesEnv();
  const systems = [];

  // 1. WebUI
  systems.push({
    id: 'webui',
    name: 'WebUI Server',
    status: 'normal',
    details: `Mode: ${process.env.NODE_ENV || 'production'}`
  });

  // 2. Hermes Core
  let coreStatus = 'standby';
  let coreDetails = 'Cloud / Standalone';
  try {
    const { stdout } = await execFileAsync('hermes', ['status'], { env, encoding: 'utf8' });
    const gwMatch = stdout.match(/Gateway Service\s*Status:\s*(.*?)\n\s*Manager:\s*(.*?)\n\s*PID\(s\):\s*(.*)/);
    if (gwMatch && gwMatch[1].includes('running')) {
      coreStatus = 'normal';
      coreDetails = `PID: ${gwMatch[3]}`;
    }
  } catch (e) {
    // Expected when running on Vercel / serverless cloud without local Hermes daemon
  }
  systems.push({
    id: 'hermes',
    name: 'Hermes Core Gateway',
    status: coreStatus,
    details: coreDetails
  });

  // 4. Memory/Hardware Resources
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  
  let cpuUsage = 0;
  let diskUsage = { usedGB: 0, totalGB: 0 };
  
  try {
    // Windows CPU Load Percentage
    const { stdout: cpuOut } = await execFileAsync('powershell', ['-NoProfile', '-Command', '(Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average'], { encoding: 'utf8' });
    cpuUsage = parseFloat(cpuOut.trim()) || 0;

    // Windows Disk Usage (C: and D:)
    const { stdout: diskOut } = await execFileAsync('powershell', ['-NoProfile', '-Command', 'Get-CimInstance Win32_LogicalDisk | Where-Object DriveType -eq 3 | Select-Object FreeSpace, Size | ConvertTo-Json'], { encoding: 'utf8' });
    const disks = JSON.parse(diskOut.trim());
    let totalSize = 0;
    let totalFree = 0;
    const diskArray = Array.isArray(disks) ? disks : [disks];
    diskArray.forEach((d: any) => {
      totalSize += Number(d.Size) || 0;
      totalFree += Number(d.FreeSpace) || 0;
    });
    diskUsage.usedGB = (totalSize - totalFree) / 1024 / 1024 / 1024;
    diskUsage.totalGB = totalSize / 1024 / 1024 / 1024;
  } catch (e) {
    console.error("Failed to parse hardware metrics:", e);
  }

  let insights = {
    sessions: 0,
    messages: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    toolCalls: 0,
    topTools: [] as any[],
    activity: [] as any[]
  };

  try {
    const { stdout } = await execFileAsync('hermes', ['insights'], { env, encoding: 'utf8' });
    const extract = (regex: RegExp) => {
      const match = stdout.match(regex);
      return match ? parseInt(match[1].replace(/,/g, ''), 10) : 0;
    };
    insights.sessions = extract(/Sessions:\s+([\d,]+)/);
    insights.messages = extract(/Messages:\s+([\d,]+)/);
    insights.inputTokens = extract(/Input tokens:\s+([\d,]+)/);
    insights.outputTokens = extract(/Output tokens:\s+([\d,]+)/);
    insights.totalTokens = extract(/Total tokens:\s+([\d,]+)/);
    insights.toolCalls = extract(/Tool calls:\s+([\d,]+)/);

    // Extract Top Tools
    const toolsRegex = /🔧 Top Tools[\s\S]*?Tool\s+Calls\s+%([\s\S]*?)📅 Activity Patterns/;
    const toolsMatch = stdout.match(toolsRegex);
    if (toolsMatch) {
      insights.topTools = toolsMatch[1].trim().split('\n').map(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 3) {
          return {
            name: parts[0],
            calls: parseInt(parts[1], 10),
            percentage: parseFloat(parts[2].replace('%', ''))
          };
        }
        return null;
      }).filter(Boolean);
    }

    // Extract Activity
    const actRegex = /📅 Activity Patterns[\s\S]*?─+([\s\S]*?)(?:Peak hours:|🏆 Notable)/;
    const actMatch = stdout.match(actRegex);
    if (actMatch) {
      insights.activity = actMatch[1].trim().split('\n').map(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 2) {
          const val = parts[parts.length - 1];
          if (!isNaN(parseInt(val, 10))) {
            return {
              day: parts[0],
              count: parseInt(val, 10)
            };
          }
        }
        return null;
      }).filter(Boolean);
    }
  } catch (e) {
    console.error("Failed to parse hermes insights:", e);
  }

  return NextResponse.json({
    systems: {
      items: systems,
      degradedCount: systems.filter(s => s.status !== 'normal').length
    },
    resources: {
      cpu: cpuUsage,
      disk: diskUsage,
      memory: {
        usedGB: usedMem / 1024 / 1024 / 1024,
        totalGB: totalMem / 1024 / 1024 / 1024
      }
    },
    insights
  });
}
