import { NextResponse, NextRequest } from 'next/server';
import { getHermesRegistry } from '@/lib/live/sources/hermes-native';
import { AGENT_FIXTURES } from '@/data/agentFixtures';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const id = p.id;
  
  // For safety, force use of hermes-native as default source mode in production
  const registry = getHermesRegistry();
  
  if (registry.source === 'hermes') {
    if (registry.unavailable) {
      return NextResponse.json({ source: 'hermes', data: null, unavailable: true }, { status: 503 });
    }
    
    // Check running agents first
    let agent = registry.data?.find(a => a.id === id);
    if (agent) {
      return NextResponse.json({ source: 'hermes', data: agent });
    }
    
    // Check if it exists in CLI but not running
    try {
      const { stdout } = await execFileAsync('hermes', ['profile', 'list']);
      const lines = stdout.split('\n').filter(l => l.trim().length > 0 && !l.includes('─────')).slice(1);
      const exists = lines.some(line => {
        const parts = line.trim().split(/\s{2,}/);
        if (parts.length > 0) {
          let name = parts[0].trim();
          if (name.startsWith('◆')) name = name.substring(1);
          return name === id;
        }
        return false;
      });
      
      if (exists) {
        agent = {
          id,
          name: id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' '),
          status: 'Offline',
          currentWorkKey: null,
        };
        return NextResponse.json({ source: 'hermes', data: agent });
      }
    } catch (e) {
      console.error('Error fetching CLI profiles:', e);
    }
    
    // If the registry loaded properly but ID isn't there, it's a TRUE NOT FOUND.
    return NextResponse.json({ source: 'hermes', error: 'Not found' }, { status: 404 });
  }
  
  // Fallback to mock
  const agentMock = AGENT_FIXTURES.find(a => a.id === id || a.id === `ag-${id}`);
  if (agentMock) {
    return NextResponse.json({ source: 'mock', data: agentMock });
  }
  
  return NextResponse.json({ source: 'mock', error: 'Not found' }, { status: 404 });
}
