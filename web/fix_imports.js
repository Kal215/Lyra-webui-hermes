const fs = require('fs');
const path = './src/app/agents/[id]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace("import { Send, User, Bot } from 'lucide-react';\nimport { NeoTextArea } from '@/components/NeoTextArea';\n", "");

content = content.replace(
  "import { ChevronLeft, TerminalSquare, FileText, Activity } from 'lucide-react';",
  "import { ChevronLeft, TerminalSquare, FileText, Activity, Send, User, Bot } from 'lucide-react';\nimport { NeoTextArea } from '@/components/NeoTextArea';"
);

fs.writeFileSync(path, content);
console.log('Fixed imports');
