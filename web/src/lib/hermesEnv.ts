import path from 'path';

/**
 * Returns a customized environment object for Hermes CLI calls.
 * This explicitly isolates the WebUI's Hermes instance into a dedicated folder
 * (.hermes-backend) so it does not collide with the user's main JARVIS setup.
 */
export const getHermesEnv = () => {
  const HERMES_HOME = path.join(process.cwd(), '.hermes-backend');
  return {
    ...process.env,
    HERMES_HOME,
    PYTHONUNBUFFERED: '1'
  };
};
