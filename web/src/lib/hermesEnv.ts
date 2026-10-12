import path from 'path';
import fs from 'fs';

/**
 * Returns a customized environment object for Hermes CLI calls.
 * This explicitly isolates the WebUI's Hermes instance into a dedicated folder
 * (.hermes-backend) so it does not collide with the user's main JARVIS setup.
 *
 * Automatically parses and merges .env from .hermes-backend/.env into process.env
 * so custom provider API keys (such as HERMES_CUSTOM_LYRA_PC_API_KEY) are always
 * present when running CLI commands across any profile.
 */
export const getHermesEnv = (): NodeJS.ProcessEnv & { HERMES_HOME: string } => {
  // If running in Vercel / AWS Lambda / Read-Only container, use writable /tmp
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const HERMES_HOME = isServerless 
    ? path.join('/tmp', '.hermes-backend')
    : path.join(process.cwd(), '.hermes-backend');
    
  const envMap: NodeJS.ProcessEnv = { ...process.env };

  const dotEnvPath = path.join(HERMES_HOME, '.env');
  if (fs.existsSync(dotEnvPath)) {
    try {
      const content = fs.readFileSync(dotEnvPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=');
          const k = trimmed.substring(0, idx).trim();
          const v = trimmed.substring(idx + 1).trim();
          if (k && !envMap[k]) {
            envMap[k] = v;
          }
        }
      }
    } catch (e) {}
  }

  envMap.HERMES_HOME = HERMES_HOME;
  envMap.PYTHONUNBUFFERED = '1';

  return envMap as NodeJS.ProcessEnv & { HERMES_HOME: string };
};
