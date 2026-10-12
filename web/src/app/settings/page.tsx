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

import { 
  ProviderType, 
  PROVIDER_PRESETS, 
  ProviderPreset, 
  ProviderAccount, 
  LyraAiConfig, 
  loadLyraAiConfig, 
  saveLyraAiConfig,
  getDefaultPreset 
} from '@/lib/ai-providers';

function getPresetMeta(preset: ProviderPreset | undefined, lang: string) {
  if (!preset) return { keyHelp: '', keyPlaceholder: 'sk-...' };
  if (preset.id === 'openrouter') {
    return {
      keyHelp: lang === 'id' ? 'openrouter.ai/keys (Akses ratusan model LLM sekaligus)' : 'openrouter.ai/keys (Access hundreds of LLM models)',
      keyPlaceholder: 'sk-or-v1-...'
    };
  }
  if (preset.id === 'groq') {
    return {
      keyHelp: lang === 'id' ? 'console.groq.com/keys (Gratis, instan, & ultra-cepat)' : 'console.groq.com/keys (Free, instant, & ultra-fast)',
      keyPlaceholder: 'gsk_...'
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

  // Full multi-provider persistent config (Each provider retains its own API key and settings)
  const [aiConfig, setAiConfig] = useState<LyraAiConfig>(() => ({
    activeProvider: 'openrouter',
    providerId: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: '',
    model: 'anthropic/claude-3.5-sonnet',
    providers: {}
  }));

  // Currently viewed provider tab in the UI
  const [providerType, setProviderType] = useState<ProviderType>('openrouter');
  // Form fields for the currently viewed tab
  const [aiBaseUrl, setAiBaseUrl] = useState('https://openrouter.ai/api/v1');
  const [aiModel, setAiModel] = useState('anthropic/claude-3.5-sonnet');
  const [aiApiKey, setAiApiKey] = useState('');

  const [aiStatus, setAiStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);

  useEffect(() => {
    // Load saved multi-provider BYOK configuration
    const loaded = loadLyraAiConfig();
    setAiConfig(loaded);
    
    const active = loaded.activeProvider || 'openrouter';
    setProviderType(active);

    const activeAcc = loaded.providers[active];
    const preset = getDefaultPreset(active);
    setAiBaseUrl(activeAcc?.baseUrl || preset.baseUrl);
    setAiModel(activeAcc?.model || preset.defaultModel);
    setAiApiKey(activeAcc?.apiKey || '');
  }, []);

  const handleProviderTypeChange = (newType: ProviderType) => {
    playClick();

    // 1. Stash current tab's inputs into state so user edits are NEVER lost or mixed up
    const updatedProviders: Partial<Record<ProviderType, ProviderAccount>> = {
      ...aiConfig.providers,
      [providerType]: {
        apiKey: aiApiKey,
        baseUrl: aiBaseUrl,
        model: aiModel
      }
    };

    // 2. Switch tab
    setProviderType(newType);

    // 3. Load target provider's settings from updatedProviders (or fallback to preset default)
    const targetAcc = updatedProviders[newType];
    const preset = getDefaultPreset(newType);

    if (targetAcc) {
      setAiBaseUrl(targetAcc.baseUrl || preset.baseUrl);
      setAiModel(targetAcc.model || preset.defaultModel);
      setAiApiKey(targetAcc.apiKey || '');
    } else {
      setAiBaseUrl(preset.baseUrl);
      setAiModel(preset.defaultModel);
      setAiApiKey('');
    }

    setAiConfig(prev => ({
      ...prev,
      providers: updatedProviders
    }));
  };

  const handleApiKeyChange = (val: string) => {
    setAiApiKey(val);
  };

  const handleSaveAiConfig = async () => {
    setAiStatus('saving');
    playClick();

    const currentPreset = getDefaultPreset(providerType);
    const updatedProviders: Partial<Record<ProviderType, ProviderAccount>> = {
      ...aiConfig.providers,
      [providerType]: {
        apiKey: aiApiKey,
        baseUrl: aiBaseUrl || currentPreset.baseUrl,
        model: aiModel || currentPreset.defaultModel
      }
    };

    const newConfig: LyraAiConfig = {
      activeProvider: providerType,
      providerId: providerType,
      baseUrl: aiBaseUrl || currentPreset.baseUrl,
      apiKey: aiApiKey,
      model: aiModel || currentPreset.defaultModel,
      providers: updatedProviders
    };

    setAiConfig(newConfig);
    saveLyraAiConfig(newConfig);

    try {
      await fetch('/api/settings/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          baseUrl: newConfig.baseUrl, 
          model: newConfig.model, 
          apiKey: newConfig.apiKey,
          providerId: newConfig.providerId,
          keyEnv: currentPreset?.keyEnv || 'LYRA_WEB_KEY'
        })
      });
      setAiStatus('saved');
      setTimeout(() => setAiStatus('idle'), 2500);
    } catch (e) {
      setAiStatus('saved');
      setTimeout(() => setAiStatus('idle'), 2500);
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
                    {PROVIDER_PRESETS.map(p => {
                      const isActive = aiConfig.activeProvider === p.id;
                      const hasKey = !!aiConfig.providers[p.id]?.apiKey;
                      const isSelected = providerType === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => handleProviderTypeChange(p.id)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                            isSelected 
                              ? 'bg-lyra-accent text-white shadow-md ring-2 ring-lyra-accent/30' 
                              : 'bg-lyra-surface-inset text-lyra-text hover:bg-lyra-border'
                          }`}
                        >
                          <span>{p.label}</span>
                          {isActive && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-bold tracking-wider uppercase">
                              Active
                            </span>
                          )}
                          {!isActive && hasKey && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="API Key saved" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Preset Active Info Bar */}
                  {(() => {
                    const preset = PROVIDER_PRESETS.find(p => p.id === providerType);
                    const isActive = aiConfig.activeProvider === providerType;
                    return (
                      <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs transition-colors ${
                        isActive 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                          : 'bg-lyra-accent/5 border-lyra-accent/15 text-lyra-text-secondary'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-lyra-text-muted'}`} />
                          <span className="font-semibold text-lyra-text">
                            {isActive 
                              ? (language === 'id' ? `Provider Aktif: ${preset?.label}` : `Active Provider: ${preset?.label}`) 
                              : (language === 'id' ? `Konfigurasi: ${preset?.label}` : `Configuring: ${preset?.label}`)}
                          </span>
                        </div>
                        <span className="opacity-75 font-mono text-[11px]">
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
                            onChange={e => handleApiKeyChange(e.target.value)}
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
