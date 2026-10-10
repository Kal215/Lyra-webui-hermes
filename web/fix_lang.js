const fs = require('fs');
const path = './src/app/agents/[id]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// I accidentally added `const language = useI18nStore(s => s.language);` twice, or it already existed.
content = content.replace("const liveState = useHermesLive(agentId);\n  const language = useI18nStore(s => s.language);", "const liveState = useHermesLive(agentId);");

fs.writeFileSync(path, content);
console.log('Fixed lang');
