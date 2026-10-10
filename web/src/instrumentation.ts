export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { startObserverServer } = await import('./lib/live/observer/socket-server');
      startObserverServer();
    } catch (err) {
      console.error('[Lyra Observer] Failed to start socket server in instrumentation:', err);
    }
  }
}
