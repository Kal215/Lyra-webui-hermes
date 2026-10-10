const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { spawn } = require('child_process');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

// Ephemeral capability token
const observerToken = crypto.randomBytes(32).toString('hex');
process.env.INTERNAL_OBSERVER_TOKEN = observerToken;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

let daemonProcess = null;

app.prepare().then(() => {
  daemonProcess = spawn('node', [path.join(__dirname, 'socket-daemon.js')], {
    stdio: 'inherit',
    env: process.env // inherits INTERNAL_OBSERVER_TOKEN
  });

  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  });

  // Attach Socket.IO for Terminal
  const io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  io.on('connection', (socket) => {
    console.log('[Lyra Terminal] Client connected');
    
    // Spawn bash/cmd
    const shell = os.platform() === 'win32' ? 'cmd.exe' : 'bash';
    const ptyProcess = spawn(shell, [], {
      env: process.env,
      cwd: process.cwd()
    });

    ptyProcess.stdout.on('data', (data) => {
      socket.emit('terminal.data', data.toString('utf-8'));
    });

    ptyProcess.stderr.on('data', (data) => {
      socket.emit('terminal.data', data.toString('utf-8'));
    });

    socket.on('terminal.write', (data) => {
      if (ptyProcess && !ptyProcess.killed) {
        ptyProcess.stdin.write(data);
      }
    });

    socket.on('disconnect', () => {
      console.log('[Lyra Terminal] Client disconnected');
      if (ptyProcess && !ptyProcess.killed) ptyProcess.kill();
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
  });
});
