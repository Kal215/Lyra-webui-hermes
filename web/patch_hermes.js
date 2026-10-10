const fs = require('fs');
const path = './src/lib/live/sources/hermes-native.ts';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(
  "const statePath = path.join(process.env.HOME || require('os').homedir(), '.hermes', 'gateway_state.json');",
  `const homedirPath = path.join(process.env.HOME || require('os').homedir(), '.hermes', 'gateway_state.json');
    const jarvisPath = path.join('D:\\JARVIS_CORE', '.hermes', 'gateway_state.json');
    const statePath = fs.existsSync(jarvisPath) ? jarvisPath : homedirPath;`
);
fs.writeFileSync(path, content);
