const fs = require('fs');
const path = './src/app/agents/[id]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add ChatTab component before OverviewTab
const chatTabCode = `
import { Send, User, Bot } from 'lucide-react';
import { NeoTextArea } from '@/components/NeoTextArea';

function ChatTab({ agent, t }: any) {
  const [messages, setMessages] = useState<{role: 'user'|'assistant', text: string}[]>([
    { role: 'assistant', text: 'Halo! Saya siap menerima instruksi atau membagikan status dari proyek ini.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInput('');
    setIsTyping(true);
    
    // TODO: Connect to actual Hermes API / websocket for prompting
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', text: '[Fitur dalam pengembangan: Koneksi ke REST API Hermes belum diimplementasi untuk mengirim prompt ini ke agen]' }]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[500px] border border-lyra-border/10 rounded-xl bg-lyra-surface shadow-neo">
      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={\`flex gap-3 \${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}\`}>
            <div className={\`w-8 h-8 rounded-full flex items-center justify-center shrink-0 \${m.role === 'user' ? 'bg-lyra-primary text-white' : 'bg-lyra-surface-inset shadow-neo-inset text-lyra-accent'}\`}>
              {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={\`max-w-[75%] p-3 rounded-2xl text-sm \${m.role === 'user' ? 'bg-lyra-primary text-white rounded-tr-none' : 'bg-lyra-surface-inset shadow-neo-inset text-lyra-text rounded-tl-none'}\`}>
              {m.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3 flex-row">
            <div className="w-8 h-8 rounded-full bg-lyra-surface-inset shadow-neo-inset flex items-center justify-center shrink-0 text-lyra-accent">
              <Bot size={16} />
            </div>
            <div className="max-w-[75%] p-3 rounded-2xl text-sm bg-lyra-surface-inset shadow-neo-inset text-lyra-text rounded-tl-none flex items-center gap-1">
              <div className="w-2 h-2 bg-lyra-muted rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-lyra-muted rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
              <div className="w-2 h-2 bg-lyra-muted rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      
      {/* Chat Input */}
      <div className="p-4 border-t border-lyra-border/10 bg-lyra-surface/50">
        <div className="relative">
          <NeoTextArea 
            placeholder="Ketik prompt atau pesan ke agen di sini..." 
            className="w-full min-h-[60px] max-h-[150px] pr-12 resize-none custom-scrollbar"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim()}
            className="absolute right-3 bottom-3 p-2 rounded-full text-lyra-primary hover:bg-lyra-primary/10 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

`;

if (!content.includes('function ChatTab')) {
  content = content.replace('function OverviewTab', chatTabCode + '\nfunction OverviewTab');
}

// 2. Add 'chat' to tabs array
content = content.replace(
  "const tabs = ['overview', 'live', 'files', 'changes', 'history'] as const;",
  "const tabs = ['overview', 'chat', 'live', 'files', 'changes', 'history'] as const;"
);

// 3. Add translation for chat tab
content = content.replace(
  "label: t('agentDetail.tabs.' + tab)",
  "label: tab === 'chat' ? (language === 'id' ? 'Percakapan' : 'Chat') : t('agentDetail.tabs.' + tab)"
);

// 4. Mount ChatTab
content = content.replace(
  "{activeTab === 'overview' && <OverviewTab agent={agent} t={t} />}",
  "{activeTab === 'overview' && <OverviewTab agent={agent} t={t} />}\n        {activeTab === 'chat' && <ChatTab agent={agent} t={t} />}"
);

// 5. Inject language variable if missing in the tabs area
// Actually, language is not defined there. Let's get it from useI18nStore.
content = content.replace(
  "const liveState = useHermesLive(agentId);",
  "const liveState = useHermesLive(agentId);\n  const language = useI18nStore(s => s.language);"
);

// Add missing lucide imports
if (!content.includes('import { Send, User, Bot }')) {
  content = content.replace("import { ChevronLeft, TerminalSquare, FileText, Activity } from 'lucide-react';", "import { ChevronLeft, TerminalSquare, FileText, Activity, Send, User, Bot } from 'lucide-react';");
}

fs.writeFileSync(path, content);
console.log('Patched');
