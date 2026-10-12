export type ProviderType = 
  | 'openrouter' 
  | 'openai' 
  | 'deepseek' 
  | 'anthropic' 
  | 'google' 
  | 'groq' 
  | 'mistral' 
  | 'ollama' 
  | 'custom';

export interface ProviderModel {
  id: string;
  name: string;
  badge: string;
  description?: string;
}

export interface ProviderPreset {
  id: ProviderType;
  label: string;
  baseUrl: string;
  defaultModel: string;
  keyEnv: string;
  keyPlaceholder: string;
  keyHelp: string;
  models: ProviderModel[];
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'openrouter',
    label: 'OpenRouter (All Models)',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'anthropic/claude-3.5-sonnet',
    keyEnv: 'OPENROUTER_API_KEY',
    keyPlaceholder: 'sk-or-v1-...',
    keyHelp: 'openrouter.ai/keys (Akses ratusan model LLM sekaligus)',
    models: [
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', badge: 'High' },
      { id: 'openai/gpt-4o', name: 'GPT-4o', badge: 'High' },
      { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', badge: 'Med' },
      { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', badge: 'Ultra' },
      { id: 'google/gemini-2.0-flash', name: 'Gemini 2.0 Flash', badge: 'Low' },
      { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', badge: 'Med' },
      { id: 'qwen/qwen-2.5-coder-32b-instruct', name: 'Qwen 2.5 Coder 32B', badge: 'Med' },
      { id: 'minimax/minimax-01', name: 'MiniMax-01', badge: 'Med' }
    ]
  },
  {
    id: 'groq',
    label: 'Groq (Ultra-Fast LPU)',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'openai/gpt-oss-120b',
    keyEnv: 'GROQ_API_KEY',
    keyPlaceholder: 'gsk_...',
    keyHelp: 'console.groq.com/keys (Gratis & Ultra-cepat pada hardware Groq LPU)',
    models: [
      { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B (Groq)', badge: '500 tps' },
      { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B (Groq)', badge: '1000 tps' },
      { id: 'qwen/qwen3.8-27b', name: 'Qwen 3.8 27B (Groq)', badge: '450 tps' },
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Enterprise)', badge: 'Ent' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Enterprise)', badge: 'Ent' }
    ]
  },
  {
    id: 'openai',
    label: 'OpenAI (Official)',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    keyEnv: 'OPENAI_API_KEY',
    keyPlaceholder: 'sk-proj-...',
    keyHelp: 'platform.openai.com/api-keys',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', badge: 'High' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', badge: 'Low' },
      { id: 'o1', name: 'o1', badge: 'Ultra' },
      { id: 'o3-mini', name: 'o3 Mini', badge: 'Med' }
    ]
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    keyEnv: 'DEEPSEEK_API_KEY',
    keyPlaceholder: 'sk-...',
    keyHelp: 'platform.deepseek.com/api_keys',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek V3', badge: 'Med' },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1', badge: 'Ultra' }
    ]
  },
  {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-5-sonnet-latest',
    keyEnv: 'ANTHROPIC_API_KEY',
    keyPlaceholder: '«redacted:sk-…»...',
    keyHelp: 'console.anthropic.com/settings/keys',
    models: [
      { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet', badge: 'High' },
      { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku', badge: 'Low' },
      { id: 'claude-3-opus-latest', name: 'Claude 3 Opus', badge: 'Ultra' }
    ]
  },
  {
    id: 'google',
    label: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    defaultModel: 'gemini-2.0-flash',
    keyEnv: 'GEMINI_API_KEY',
    keyPlaceholder: 'AIzaSy...',
    keyHelp: 'aistudio.google.com/apikey',
    models: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', badge: 'Fast' },
      { id: 'gemini-2.0-pro-exp-02-05', name: 'Gemini 2.0 Pro', badge: 'High' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', badge: 'High' }
    ]
  },
  {
    id: 'mistral',
    label: 'Mistral AI',
    baseUrl: 'https://api.mistral.ai/v1',
    defaultModel: 'mistral-large-latest',
    keyEnv: 'MISTRAL_API_KEY',
    keyPlaceholder: '...',
    keyHelp: 'console.mistral.ai/api-keys',
    models: [
      { id: 'mistral-large-latest', name: 'Mistral Large', badge: 'High' },
      { id: 'codestral-latest', name: 'Codestral', badge: 'Code' },
      { id: 'mistral-small-latest', name: 'Mistral Small', badge: 'Fast' }
    ]
  },
  {
    id: 'ollama',
    label: 'Ollama (Local)',
    baseUrl: 'http://127.0.0.1:11434/v1',
    defaultModel: 'llama3.1',
    keyEnv: '',
    keyPlaceholder: 'Tidak memerlukan API Key',
    keyHelp: 'Berjalan di localhost mesin lokal Anda',
    models: [
      { id: 'llama3.1', name: 'Llama 3.1', badge: 'Local' },
      { id: 'qwen2.5-coder:7b', name: 'Qwen 2.5 Coder 7B', badge: 'Local' },
      { id: 'deepseek-r1:8b', name: 'DeepSeek R1 8B', badge: 'Local' },
      { id: 'mistral', name: 'Mistral 7B', badge: 'Local' }
    ]
  },
  {
    id: 'custom',
    label: 'Custom / VPS / Self-Hosted',
    baseUrl: 'http://localhost:8000/v1',
    defaultModel: 'custom-model',
    keyEnv: 'LYRA_WEB_KEY',
    keyPlaceholder: 'sk-...',
    keyHelp: 'Endpoint kompatibel OpenAI v1 (vLLM, LiteLLM, Ollama, TGI)',
    models: [
      { id: 'custom-model', name: 'Custom Model', badge: 'Custom' },
      { id: 'llama-3-8b', name: 'Llama 3 8B', badge: 'Custom' },
      { id: 'mistral-7b', name: 'Mistral 7B', badge: 'Custom' }
    ]
  }
];

export interface ProviderAccount {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface LyraAiConfig {
  activeProvider: ProviderType;
  providerId: ProviderType;
  baseUrl: string;
  apiKey: string;
  model: string;
  providers: Partial<Record<ProviderType, ProviderAccount>>;
}

export function getDefaultPreset(id: ProviderType): ProviderPreset {
  return PROVIDER_PRESETS.find(p => p.id === id) || PROVIDER_PRESETS[0];
}

export function loadLyraAiConfig(): LyraAiConfig {
  const fallbackPreset = PROVIDER_PRESETS[0]; // OpenRouter
  const defaultConfig: LyraAiConfig = {
    activeProvider: 'openrouter',
    providerId: 'openrouter',
    baseUrl: fallbackPreset.baseUrl,
    apiKey: '',
    model: fallbackPreset.defaultModel,
    providers: {
      openrouter: {
        apiKey: '',
        baseUrl: fallbackPreset.baseUrl,
        model: fallbackPreset.defaultModel
      }
    }
  };

  if (typeof window === 'undefined') return defaultConfig;

  try {
    const raw = localStorage.getItem('lyra_ai_config');
    if (!raw) return defaultConfig;

    const parsed = JSON.parse(raw);
    const active: ProviderType = parsed.activeProvider || parsed.providerId || 'openrouter';
    const providersMap: Partial<Record<ProviderType, ProviderAccount>> = parsed.providers || {};

    // Ensure active provider has entry
    if (!providersMap[active]) {
      const pPreset = getDefaultPreset(active);
      providersMap[active] = {
        apiKey: parsed.apiKey || '',
        baseUrl: parsed.baseUrl || pPreset.baseUrl,
        model: parsed.model || pPreset.defaultModel
      };
    }

    const currentAccount = providersMap[active]!;
    return {
      activeProvider: active,
      providerId: active,
      baseUrl: currentAccount.baseUrl || parsed.baseUrl || getDefaultPreset(active).baseUrl,
      apiKey: currentAccount.apiKey !== undefined ? currentAccount.apiKey : (parsed.apiKey || ''),
      model: currentAccount.model || parsed.model || getDefaultPreset(active).defaultModel,
      providers: providersMap
    };
  } catch (e) {
    return defaultConfig;
  }
}

export function saveLyraAiConfig(config: LyraAiConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('lyra_ai_config', JSON.stringify(config));
    if (config.model) {
      localStorage.setItem('lyra_chat_model', config.model);
      localStorage.setItem('lyra_work_model', config.model);
    }
  } catch (e) {}
}

export function getModelsForProvider(providerId: ProviderType): ProviderModel[] {
  const preset = PROVIDER_PRESETS.find(p => p.id === providerId);
  return preset ? preset.models : PROVIDER_PRESETS[0].models;
}
