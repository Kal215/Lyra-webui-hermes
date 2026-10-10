const net = require('net');
const fs = require('fs');
const os = require('os');

const IS_WIN = os.platform() === 'win32';
const SOCKET_PATH = IS_WIN ? '\\\\.\\pipe\\lyra-observer.sock' : `/run/user/${os.userInfo().uid}/lyra-observer.sock`;
const MAX_PAYLOAD_SIZE = 1024 * 1024;
const CAPABILITY_TOKEN = process.env.INTERNAL_OBSERVER_TOKEN;

if (fs.existsSync(SOCKET_PATH)) {
  try {
    fs.unlinkSync(SOCKET_PATH);
  } catch (err) {}
}

const server = net.createServer((socket) => {
  let buffer = '';

  socket.on('data', (data) => {
    buffer += data.toString('utf-8');
    
    if (buffer.length > MAX_PAYLOAD_SIZE) {
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
        // We will forward this to Next.js API endpoint instead
        fetch('http://127.0.0.1:3000/api/live/internal/ingest', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Lyra-Observer-Capability': CAPABILITY_TOKEN || ''
          },
          body: JSON.stringify(rawPayload)
        }).then(res => {
          if (!res.ok) {
             console.error('[Lyra Socket Daemon] Delivery rejected:', res.status);
          }
        }).catch(err => {
             console.error('[Lyra Socket Daemon] Delivery failed', err);
        });
      } catch (err) {
      }
    }
  });
});

server.listen(SOCKET_PATH, () => {
  console.log('[Lyra Socket Daemon] Listening on ' + SOCKET_PATH);
  fs.chmodSync(SOCKET_PATH, 0o600);
});

const cleanup = () => {
  server.close();
  process.exit(0);
};

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
