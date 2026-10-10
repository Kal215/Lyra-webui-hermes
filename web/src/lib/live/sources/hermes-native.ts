import fs from 'fs';
import path from 'path';

export function getHermesRegistry(): { source: 'hermes' | 'mock', data?: any[], unavailable?: boolean } {
  try {
    const homedirPath = path.join(process.env.HOME || require('os').homedir(), '.hermes', 'gateway_state.json');
    const jarvisPath = path.join('D:', 'JARVIS_CORE', '.hermes', 'gateway_state.json');
    const statePath = fs.existsSync(jarvisPath) ? jarvisPath : homedirPath;
    if (fs.existsSync(statePath)) {
      const stateStr = fs.readFileSync(statePath, 'utf8');
      const state = JSON.parse(stateStr);
      
      const servedProfiles = state.served_profiles || [];
      const agents = servedProfiles.map((id: string) => ({
        id,
        name: id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' '),
        status: 'Tersedia',
        currentWorkKey: null,
      }));
      
      return { source: 'hermes', data: agents };
    } else {
      return { source: 'hermes', unavailable: true };
    }
  } catch (error) {
    console.error("Failed to read native Hermes registry:", error);
    return { source: 'hermes', unavailable: true };
  }
}
