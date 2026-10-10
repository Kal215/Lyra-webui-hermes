const { spawn } = require('child_process');
const readline = require('readline');

console.log('Starting hermes...');
const child = spawn('hermes', ['chat', '-q', 'ceritakan dongeng anak singkat 2 paragraf', '--oneshot', '--format', 'stream-json', '--profile', 'default'], { 
  shell: false,
  env: { ...process.env, PYTHONUNBUFFERED: '1' }
});

const rl = readline.createInterface({
  input: child.stdout,
  terminal: false
});

rl.on('line', (line) => {
  console.log(`[${new Date().toISOString()}] LINE: ${line}`);
});

child.stderr.on('data', (data) => {
  console.error(`[${new Date().toISOString()}] STDERR: ${data.toString()}`);
});

child.on('close', (code) => {
  console.log(`[${new Date().toISOString()}] Process exited with code ${code}`);
});