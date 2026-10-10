const { execFile } = require('child_process');
execFile('hermes', ['profile', 'list'], { env: { ...process.env, HERMES_HOME: '.hermes-backend' } }, (error, stdout) => {
  console.log("LINES:", stdout.split('\n').map((l, i) => `[${i}] ${l}`));
});
