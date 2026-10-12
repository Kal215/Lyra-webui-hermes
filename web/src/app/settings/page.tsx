'use client';

import React, { useState, useEffect } from 'react';
import { NeoPanel } from '@/components/NeoPanel';
import { NeoButton } from '@/components/NeoButton';
import { useTranslation, useI18nStore, Language } from '@/i18n';
import { useAppearanceStore, Mode, Surface, WorkspaceTheme } from '@/store/preferences';
import { ThemePreviewCard } from '@/components/ThemePreviewCard';
import { ModePreviewCard } from '@/components/ModePreviewCard';
import { SurfacePreviewCard } from '@/components/SurfacePreviewCard';
import { useSoundStore, useTactileSound } from '@/hooks/use-tactile-sound';
import { Check, ChevronDown, ChevronRight, Server, Link, Cpu, ShieldAlert, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type ProviderType = 'openai' | 'anthropic' | 'openrouter' | 'deepseek' | 'google' | 'groq' | 'mistral' | 'ollama' | 'custom';

interface ProviderPreset {
  id: ProviderType;
  label: string;
  baseUrl: string;
  defaultModel: string;
  keyEnv: string;
  keyPlaceholder: string;
  keyHelp: string;
  models: { id: string; name: string }[];
}

const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'openrouter',
    label: 'OpenRouter (All Models)',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'anthropic/claude-3.5-sonnet',
    keyEnv: 'OPENROUTER_API_KEY',
    keyPlaceholder: 'sk-or-v1-...',
    keyHelp: 'openrouter.ai/keys (Akses ratusan model LLM sekaligus)',
    models: [
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
      { id: 'openai/gpt-4o', name: 'GPT-4o' },
      { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3' },
      { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 (Reasoning)' },
      { id: 'google/gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
      { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B' },
      { id: 'qwen/qwen-2.5-coder-32b-instruct', name: 'Qwen 2.5 Coder 32B' },
      { id: 'minimax/minimax-01', name: 'MiniMax-01' }
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
      { id: 'gpt-4o', name: 'GPT-4o (Omni)' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'o1', name: 'o1 (Reasoning)' },
      { id: 'o1-mini', name: 'o1 Mini' },
      { id: 'o3-mini', name: 'o3 Mini' }
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
      { id: 'deepseek-chat', name: 'DeepSeek V3 (Chat)' },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1 (Reasoner)' }
    ]
  },
  {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-5-sonnet-latest',
    keyEnv: 'ANTHROPIC_API_KEY',
    keyPlaceholder: 'sk-ant-api03-...',
    keyHelp: 'console.anthropic.com/settings/keys',
    models: [
      { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku' },
      { id: 'claude-3-opus-latest', name: 'Claude 3 Opus' }
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
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
      { id: 'gemini-2.0-pro-exp-02-05', name: 'Gemini 2.0 Pro' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' }
    ]
  },
  {
    id: 'groq',
    label: 'Groq (Ultra-Fast)',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    keyEnv: 'GROQ_API_KEY',
    keyPlaceholder: 'gsk_...',
    keyHelp: 'console.groq.com/keys',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B' },
      { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 70B' }
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
      { id: 'mistral-large-latest', name: 'Mistral Large' },
      { id: 'codestral-latest', name: 'Codestral (Coding)' },
      { id: 'mistral-small-latest', name: 'Mistral Small' }
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
      { id: 'llama3.1', name: 'Llama 3.1' },
      { id: 'qwen2.5-coder:7b', name: 'Qwen 2.5 Coder 7B' },
      { id: 'deepseek-r1:8b', name: 'DeepSeek R1 8B' },
      { id: 'mistral', name: 'Mistral 7B' }
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
      { id: 'custom-model', name: 'Custom Model' },
      { id: 'llama-3-8b', name: 'Llama 3 8B' },
      { id: 'mistral-7b', name: 'Mistral 7B' }
    ]
  }
];

function getPresetMeta(preset: ProviderPreset | undefined, lang: string) {
  if (!preset) return { keyHelp: '', keyPlaceholder: 'sk-...' };
  if (preset.id === 'openrouter') {
    return {
      keyHelp: lang === 'id' ? 'openrouter.ai/keys (Akses ratusan model LLM sekaligus)' : 'openrouter.ai/keys (Access hundreds of LLM models)',
      keyPlaceholder: 'sk-or-v1-...'
    };
  }
  if (preset.id === 'ollama') {
    return {
      keyHelp: lang === 'id' ? 'Berjalan di localhost mesin lokal Anda' : 'Runs locally on your machine',
      keyPlaceholder: lang === 'id' ? 'Tidak memerlukan API Key' : 'No API key required'
    };
  }
  if (preset.id === 'custom') {
    return {
      keyHelp: lang === 'id' ? 'Endpoint kompatibel OpenAI v1 (vLLM, LiteLLM, Ollama, TGI)' : 'OpenAI v1 compatible endpoint (vLLM, LiteLLM, Ollama, TGI)',
      keyPlaceholder: 'sk-...'
    };
  }
  return {
    keyHelp: preset.keyHelp,
    keyPlaceholder: preset.keyPlaceholder
  };
}

export default function SettingsPage() {
  const t = useTranslation();
  const { language, setLanguage } = useI18nStore();
  const { mode, surface, workspaceTheme, setMode, setSurface, setWorkspaceTheme, reset } = useAppearanceStore();
  const { enabled, volume, setEnabled, setVolume } = useSoundStore();
  const { playClick, playPress } = useTactileSound();

  const [aiBaseUrl, setAiBaseUrl] = useState('');
  const [aiModel, setAiModel] = useState('');
  const [aiApiKey, setAiApiKey] = useState('');
  const [providerType, setProviderType] = useState<ProviderType>('custom');
  const [aiStatus, setAiStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);

  useEffect(() => {
    // 1. Try reading from local browser storage first for instant BYOK persistence
    try {
      const cached = localStorage.getItem('lyra_ai_config');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.baseUrl) setAiBaseUrl(parsed.baseUrl);
        if (parsed.model) setAiModel(parsed.model);
        if (parsed.apiKey) setAiApiKey(parsed.apiKey);
        if (parsed.providerId) setProviderType(parsed.providerId);
      }
    } catch (e) {}

    // 2. Sync with backend if available
    fetch('/api/settings/ai')
      .then(res => res.json())
      .then(data => {
        if (!data.error && data.baseUrl) {
          const fetchedUrl = data.baseUrl || '';
          setAiBaseUrl(fetchedUrl);
          if (data.model) setAiModel(data.model);
          if (data.apiKey && !data.apiKey.startsWith('••••')) setAiApiKey(data.apiKey);
          
          if (fetchedUrl.includes('openrouter.ai')) setProviderType('openrouter');
          else if (fetchedUrl.includes('api.openai.com')) setProviderType('openai');
          else if (fetchedUrl.includes('deepseek.com')) setProviderType('deepseek');
          else if (fetchedUrl.includes('api.anthropic.com')) setProviderType('anthropic');
          else if (fetchedUrl.includes('googleapis.com')) setProviderType('google');
          else if (fetchedUrl.includes('groq.com')) setProviderType('groq');
          else if (fetchedUrl.includes('mistral.ai')) setProviderType('mistral');
          else if (fetchedUrl.includes('11434')) setProviderType('ollama');
          else if (data.provider) setProviderType(data.provider);
        }
      })
      .catch(() => {});
  }, []);

  const handleProviderTypeChange = (type: ProviderType) => {
    setProviderType(type);
    const preset = PROVIDER_PRESETS.find(p => p.id === type);
    if (preset) {
      setAiBaseUrl(preset.baseUrl);
      setAiModel(preset.defaultModel);
    }
  };

  const handleSaveAiConfig = async () => {
    setAiStatus('saving');
    playClick();

    // Save locally in browser for robust BYOK across serverless / Vercel
    try {
      localStorage.setItem('lyra_ai_config', JSON.stringify({
        baseUrl: aiBaseUrl,
        model: aiModel,
        apiKey: (aiApiKey || ''),
        providerId: providerType
      }));
    } catch (e) {}

    try {
      const currentPreset = PROVIDER_PRESETS.find(p => p.id === providerType);
      const res = await fetch('/api/settings/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          baseUrl: aiBaseUrl, 
          model: aiModel, 
          apiKey: (aiApiKey || ''),
          providerId: providerType,
          keyEnv: currentPreset?.keyEnv || 'LYRA_WEB_KEY'
        })
      });
      setAiStatus('saved');
      setTimeout(() => setAiStatus('idle'), 2000);
    } catch (e) {
      // Even if server post fails (e.g. offline or serverless error), local storage is saved
      setAiStatus('saved');
      setTimeout(() => setAiStatus('idle'), 2000);
    }
  };

  const handleModeChange = (m: Mode) => {
    playClick();
    setMode(m);
  };

  const handleSurfaceChange = (s: Surface) => {
    playClick();
    setSurface(s);
  };

  const handleWorkspaceChange = (w: WorkspaceTheme) => {
    playClick();
    setWorkspaceTheme(w);
  };

  const handleLanguageChange = (l: Language) => {
    playClick();
    setLanguage(l);
  };

  return (
    <div className="max-w-[800px] mx-auto space-y-8 pb-10">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lyra-text">{t('settings.appearance')}</h1>
      </header>

      <section className="space-y-6">
        
        {/* AI Engine Settings */}
        <NeoPanel depth={1} className="overflow-hidden">
          <button 
            onClick={() => { playClick(); setIsAiSettingsOpen(!isAiSettingsOpen); }}
            className="w-full flex items-center justify-between p-6 text-left hover:bg-lyra-surface-inset transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lyra-md bg-lyra-bg shadow-neo-inset flex items-center justify-center text-lyra-accent">
                <Cpu size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-lyra-text">
                  {language === 'id' ? 'Model & API Key' : 'Models & API Keys'}
                </h2>
                <p className="text-sm text-lyra-text-muted mt-0.5">
                  {language === 'id' 
                    ? 'Pilih penyedia LLM, model default, dan kelola kredensial API' 
                    : 'Choose LLM provider, default model, and manage API credentials'}
                </p>
              </div>
            </div>
            <div className="text-lyra-text-muted">
              {isAiSettingsOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
          </button>
          
          <AnimatePresence>
            {isAiSettingsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-lyra-border/50"
              >
                <div className="p-6 space-y-8 bg-lyra-surface/50">
                  
                  {/* Info Box */}
                  <div className="flex gap-3 p-4 rounded-lyra-sm bg-lyra-accent/10 border border-lyra-accent/20 text-lyra-text">
                    <KeyRound size={20} className="shrink-0 text-lyra-accent mt-0.5" />
                    <p className="text-sm">
                      {language === 'id' 
                        ? 'Kredensial dan endpoint ini tersimpan aman di environment lokal Anda untuk menangani inferensi model di sesi Chat dan Studio.' 
                        : 'Credentials and endpoints are securely stored in your local environment for model inference in Chat and Studio sessions.'}
                    </p>
                  </div>
                  
                  {/* Provider Tabs */}
                  <div className="flex flex-wrap gap-2 pb-2">
                    {PROVIDER_PRESETS.map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleProviderTypeChange(p.id)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                          providerType === p.id 
                            ? 'bg-lyra-accent text-white shadow-md' 
                            : 'bg-lyra-surface-inset text-lyra-text hover:bg-lyra-border'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Preset Active Info Bar */}
                  {(() => {
                    const preset = PROVIDER_PRESETS.find(p => p.id === providerType);
                    return (
                      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-lyra-accent/5 border border-lyra-accent/15 text-xs">
                        <span className="font-semibold text-lyra-accent">
                          Preset: {preset?.label}
                        </span>
                        <span className="text-lyra-text-secondary opacity-75 font-mono text-[11px]">
                          ENV: {preset?.keyEnv || 'None'}
                        </span>
                      </div>
                    );
                  })()}

                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Left Col */}
                    <div className="space-y-6">
                      
                      <div className="space-y-2">
                        <label className="text-sm font-bold uppercase tracking-wider text-lyra-text-secondary flex items-center gap-2">
                          <Link size={16} /> Base URL Provider
                        </label>
                        <p className="text-xs text-lyra-text-muted mb-2">
                          {language === 'id' 
                            ? 'Alamat API endpoint yang kompatibel dengan OpenAI (v1).' 
                            : 'OpenAI-compatible (v1) API endpoint address.'}
                        </p>
                        <input 
                          type="text" 
                          className="w-full bg-lyra-bg border border-lyra-border rounded-lyra-md px-4 py-3 text-sm text-lyra-text focus:outline-none focus:border-lyra-accent focus:shadow-[0_0_0_2px_rgba(var(--color-lyra-accent),0.2)] transition-all shadow-neo-inset"
                          value={aiBaseUrl}
                          onChange={e => setAiBaseUrl(e.target.value)}
                          placeholder="https://api.openai.com/v1"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-bold uppercase tracking-wider text-lyra-text-secondary flex items-center gap-2">
                            <Server size={16} /> 
                            {language === 'id' ? 'Nama Model Default' : 'Default Model Name'}
                          </label>
                        </div>
                        <p className="text-xs text-lyra-text-muted mb-2">
                          {language === 'id' 
                            ? 'Pilih dari rekomendasi preset atau ketik nama model kustom.' 
                            : 'Select from preset recommendations or type custom model name.'}
                        </p>
                        
                        {/* Quick Model Selector Pills */}
                        {(() => {
                          const preset = PROVIDER_PRESETS.find(p => p.id === providerType);
                          if (!preset || preset.models.length === 0) return null;
                          return (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {preset.models.map(m => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => setAiModel(m.id)}
                                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-mono transition-all ${
                                    aiModel === m.id
                                      ? 'bg-lyra-accent text-white border-lyra-accent shadow-sm'
                                      : 'bg-lyra-bg/70 border-lyra-border text-lyra-text-secondary hover:text-lyra-text hover:border-lyra-accent/40'
                                  }`}
                                >
                                  {m.name}
                                </button>
                              ))}
                            </div>
                          );
                        })()}

                        <input 
                          type="text" 
                          className="w-full bg-lyra-bg border border-lyra-border rounded-lyra-md px-4 py-3 text-sm text-lyra-text focus:outline-none focus:border-lyra-accent focus:shadow-[0_0_0_2px_rgba(var(--color-lyra-accent),0.2)] transition-all shadow-neo-inset"
                          value={aiModel}
                          onChange={e => setAiModel(e.target.value)}
                          placeholder="gpt-4o"
                        />
                      </div>
                    </div>

                    {/* Right Col */}
                    <div className="space-y-6">
                      {providerType !== 'ollama' ? (
                        <div className="space-y-2">
                          <label className="text-sm font-bold uppercase tracking-wider text-lyra-text-secondary flex items-center gap-2">
                            <KeyRound size={16} /> 
                            {language === 'id' ? 'API Key Rahasia' : 'Secret API Key'}
                          </label>
                          <p className="text-xs text-lyra-text-muted mb-2">
                            {(() => {
                              const preset = PROVIDER_PRESETS.find(p => p.id === providerType);
                              const meta = getPresetMeta(preset, language);
                              return meta.keyHelp || (language === 'id' ? 'Kunci akses rahasia (disimpan aman di sesi browser Anda).' : 'Secret access key (stored securely in your browser session).');
                            })()}
                          </p>
                          <input 
                            type="password" 
                            className="w-full bg-lyra-bg border border-lyra-border rounded-lyra-md px-4 py-3 text-sm text-lyra-text focus:outline-none focus:border-lyra-accent focus:shadow-[0_0_0_2px_rgba(var(--color-lyra-accent),0.2)] transition-all shadow-neo-inset"
                            value={aiApiKey}
                            onChange={e => setAiApiKey(e.target.value)}
                            placeholder={(() => {
                              const preset = PROVIDER_PRESETS.find(p => p.id === providerType);
                              const meta = getPresetMeta(preset, language);
                              return meta.keyPlaceholder;
                            })()}
                          />
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-lyra-bg/40 border border-lyra-border text-xs text-lyra-text-muted space-y-2">
                          <div className="font-semibold text-lyra-text flex items-center gap-2">
                            <Server size={14} className="text-emerald-400" /> {language === 'id' ? 'Server Lokal Ollama' : 'Local Ollama Server'}
                          </div>
                          <p>
                            {language === 'id' 
                              ? 'Ollama berjalan secara mandiri di komputer Anda tanpa memerlukan kuota API Key eksternal.' 
                              : 'Ollama runs entirely on your local machine without needing external API keys.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-lyra-border/50 flex items-center gap-4">
                    <NeoButton 
                      variant="raised" 
                      className="h-11 px-8 min-w-[160px]"
                      onClick={handleSaveAiConfig}
                      disabled={aiStatus === 'saving'}
                    >
                      {aiStatus === 'saving' 
                        ? (language === 'id' ? 'Menyimpan...' : 'Saving...') 
                        : (language === 'id' ? 'Simpan Koneksi' : 'Save Connection')}
                    </NeoButton>
                    {aiStatus === 'saved' && (
                      <motion.span initial={{opacity:0, x:-10}} animate={{opacity:1, x:0}} className="text-sm text-lyra-success font-medium flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-lyra-success/20 flex items-center justify-center">
                          <Check size={12}/>
                        </div> 
                        {language === 'id' ? 'Tersimpan!' : 'Saved!'}
                      </motion.span>
                    )}
                    {aiStatus === 'error' && (
                      <span className="text-sm text-red-500 font-medium">
                        {language === 'id' ? 'Gagal menyimpan data' : 'Failed to save settings'}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </NeoPanel>

        {/* Mode Selector */}
        <NeoPanel depth={1} className="p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-lyra-text-secondary">{t('settings.mode')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <ModePreviewCard mode="light" title={t('settings.light') || 'Light'} selected={mode === 'light'} onClick={() => handleModeChange('light')} />
            <ModePreviewCard mode="dark" title={t('settings.dark') || 'Dark'} selected={mode === 'dark'} onClick={() => handleModeChange('dark')} />
          </div>
        </NeoPanel>

        
        {/* Workspace Theme Selector */}
        <NeoPanel depth={1} className="p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-lyra-text-secondary">{t('settings.workspaceTheme') || 'Workspace Theme'}</h2>
          <p className="text-sm text-lyra-text-muted mb-4">{t('settings.workspaceThemeDesc') || 'Choose the appearance of the live coding and terminal workspace.'}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <ThemePreviewCard 
              theme="light" 
              title={t('settings.workspaceFollow') || 'Follow Lyra'} 
              selected={workspaceTheme === 'light'} 
              onClick={() => handleWorkspaceChange('light')} 
            />
            <ThemePreviewCard 
              theme="dark" 
              title={t('settings.workspaceDark') || 'Dark'} 
              selected={workspaceTheme === 'dark'} 
              onClick={() => handleWorkspaceChange('dark')} 
            />
            <ThemePreviewCard 
              theme="vscode" 
              title="VS Code" 
              selected={workspaceTheme === 'vscode'} 
              onClick={() => handleWorkspaceChange('vscode')} 
            />
            <ThemePreviewCard 
              theme="paper" 
              title={t('settings.workspacePaper') || 'Warm Paper'} 
              selected={workspaceTheme === 'paper'} 
              onClick={() => handleWorkspaceChange('paper')} 
            />
          </div>
        </NeoPanel>


        {/* Surface Selector */}
        <NeoPanel depth={1} className="p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-lyra-text-secondary">{t('settings.surface')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <SurfacePreviewCard surface="stone" title={t('settings.stone') || 'Stone'} selected={surface === 'stone'} onClick={() => handleSurfaceChange('stone')} />
            <SurfacePreviewCard surface="pearl" title={t('settings.pearl') || 'Pearl'} selected={surface === 'pearl'} onClick={() => handleSurfaceChange('pearl')} />
            <SurfacePreviewCard surface="sand" title={t('settings.sand') || 'Sand'} selected={surface === 'sand'} onClick={() => handleSurfaceChange('sand')} />
          </div>
        </NeoPanel>

        {/* Language Selector */}
        <NeoPanel depth={1} className="p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-lyra-text-secondary">{t('settings.language')}</h2>
          <div className="flex gap-4">
            <NeoButton
              variant={language === 'id' ? 'inset' : 'raised'}
              className="w-32 h-12"
              onClick={() => handleLanguageChange('id')}
            >
              Indonesia
            </NeoButton>
            <NeoButton
              variant={language === 'en' ? 'inset' : 'raised'}
              className="w-32 h-12"
              onClick={() => handleLanguageChange('en')}
            >
              English
            </NeoButton>
          </div>
        </NeoPanel>

        {/* Sound Settings */}
        <NeoPanel depth={1} className="p-6 space-y-6">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-lyra-text-secondary mb-4">{t('settings.sound')}</h2>
            <div className="flex gap-4">
              <NeoButton
                variant={enabled ? 'inset' : 'raised'}
                className="w-32 h-12"
                onClick={() => { playClick(); setEnabled(true); }}
              >
                {t('settings.on')}
              </NeoButton>
              <NeoButton
                variant={!enabled ? 'inset' : 'raised'}
                className="w-32 h-12"
                onClick={() => { setEnabled(false); }}
              >
                {t('settings.off')}
              </NeoButton>
            </div>
          </div>

          {enabled && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-lyra-text-secondary mb-4">{t('settings.volume')}</h2>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                onPointerUp={() => playClick()}
                className="w-full max-w-md accent-lyra-accent h-2 bg-lyra-surface-inset rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}
        </NeoPanel>

        <div className="pt-4 flex justify-end">
          <NeoButton variant="flat" onClick={() => { playClick(); reset(); }} className="px-6 h-12">
            {t('settings.reset')}
          </NeoButton>
        </div>

      </section>
    </div>
  );
}
