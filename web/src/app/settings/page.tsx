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

export default function SettingsPage() {
  const t = useTranslation();
  const { language, setLanguage } = useI18nStore();
  const { mode, surface, workspaceTheme, setMode, setSurface, setWorkspaceTheme, reset } = useAppearanceStore();
  const { enabled, volume, setEnabled, setVolume } = useSoundStore();
  const { playClick, playPress } = useTactileSound();

  const [aiBaseUrl, setAiBaseUrl] = useState('');
  const [aiModel, setAiModel] = useState('');
  const [aiApiKey, setAiApiKey] = useState('');
  const [providerType, setProviderType] = useState<'openai' | 'anthropic' | 'ollama' | 'custom'>('custom');
  const [aiStatus, setAiStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);

  useEffect(() => {
    fetch('/api/settings/ai')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          const fetchedUrl = data.baseUrl || '';
          setAiBaseUrl(fetchedUrl);
          setAiModel(data.model || '');
          setAiApiKey(data.apiKey || '');
          
          if (fetchedUrl.includes('api.openai.com')) setProviderType('openai');
          else if (fetchedUrl.includes('api.anthropic.com')) setProviderType('anthropic');
          else if (fetchedUrl.includes('11434')) setProviderType('ollama');
          else setProviderType('custom');
        }
      });
  }, []);

  const handleProviderTypeChange = (type: 'openai' | 'anthropic' | 'ollama' | 'custom') => {
    setProviderType(type);
    if (type === 'openai') {
      setAiBaseUrl('https://api.openai.com/v1');
      if (!aiModel || aiModel === 'hermes-agent') setAiModel('gpt-4o-mini');
    } else if (type === 'anthropic') {
      setAiBaseUrl('https://api.anthropic.com/v1'); // Assuming Hermes handles Anthropic translation, or rely on custom liteLLM
      if (!aiModel || aiModel === 'hermes-agent') setAiModel('claude-3-5-sonnet-latest');
    } else if (type === 'ollama') {
      setAiBaseUrl('http://127.0.0.1:11434/v1');
      if (!aiModel || aiModel.startsWith('gpt-') || aiModel.startsWith('claude-')) setAiModel('llama3.1');
    }
  };

  const handleSaveAiConfig = async () => {
    setAiStatus('saving');
    playClick();
    try {
      const res = await fetch('/api/settings/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl: aiBaseUrl, model: aiModel, apiKey: aiApiKey })
      });
      if (res.ok) {
        setAiStatus('saved');
        setTimeout(() => setAiStatus('idle'), 2000);
      } else {
        setAiStatus('error');
      }
    } catch (e) {
      setAiStatus('error');
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
                <h2 className="text-base font-bold text-lyra-text">AI Engine Connection</h2>
                <p className="text-sm text-lyra-text-muted mt-0.5">
                  {language === 'id' ? 'Konfigurasi alamat server AI, model, dan autentikasi' : 'Configure AI server address, models, and authentication'}
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
                  
                  {/* Warning Box */}
                  <div className="flex gap-3 p-4 rounded-lyra-sm bg-amber-500/10 border border-amber-500/20 text-amber-600/90 dark:text-amber-400/90">
                    <ShieldAlert size={20} className="shrink-0" />
                    <p className="text-sm">
                      {language === 'id' 
                        ? 'Pilih penyedia layanan AI. Pengaturan ini akan diterapkan di ruang terisolasi (Lyra Web) dan tidak mengubah JARVIS Utama Anda.' 
                        : 'Select AI service provider. This configuration applies exclusively to Lyra Web isolation and does not alter your primary JARVIS setup.'}
                    </p>
                  </div>
                  
                  {/* Provider Tabs */}
                  <div className="flex flex-wrap gap-2 pb-2">
                    {[
                      { id: 'openai', label: 'OpenAI (ChatGPT)' },
                      { id: 'anthropic', label: 'Anthropic (Claude)' },
                      { id: 'ollama', label: 'Ollama (Local)' },
                      { id: 'custom', label: 'Custom / VPS' }
                    ].map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleProviderTypeChange(p.id as any)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${providerType === p.id ? 'bg-lyra-accent text-white shadow-md' : 'bg-lyra-surface-inset text-lyra-text hover:bg-lyra-border'}`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Left Col */}
                    <div className="space-y-6">
                      
                      {providerType === 'custom' && (
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
                            placeholder="http://100.127.180.57:20128/v1"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-sm font-bold uppercase tracking-wider text-lyra-text-secondary flex items-center gap-2">
                          <Server size={16} /> 
                          {language === 'id' ? 'Nama Model Default' : 'Default Model Name'}
                        </label>
                        <p className="text-xs text-lyra-text-muted mb-2">
                          {providerType === 'openai' 
                            ? (language === 'id' ? 'Contoh: gpt-4o, gpt-4o-mini' : 'e.g. gpt-4o, gpt-4o-mini') 
                            : providerType === 'anthropic' 
                            ? (language === 'id' ? 'Contoh: claude-3-5-sonnet-latest' : 'e.g. claude-3-5-sonnet-latest') 
                            : providerType === 'ollama' 
                            ? (language === 'id' ? 'Contoh: llama3.1, mistral' : 'e.g. llama3.1, mistral') 
                            : (language === 'id' ? 'Nama spesifik model yang akan dipanggil saat chat.' : 'Specific model name called during chat.')}
                        </p>
                        <input 
                          type="text" 
                          className="w-full bg-lyra-bg border border-lyra-border rounded-lyra-md px-4 py-3 text-sm text-lyra-text focus:outline-none focus:border-lyra-accent focus:shadow-[0_0_0_2px_rgba(var(--color-lyra-accent),0.2)] transition-all shadow-neo-inset"
                          value={aiModel}
                          onChange={e => setAiModel(e.target.value)}
                          placeholder="hermes-agent"
                        />
                      </div>
                    </div>

                    {/* Right Col */}
                    <div className="space-y-6">
                      {providerType !== 'ollama' && (
                        <div className="space-y-2">
                          <label className="text-sm font-bold uppercase tracking-wider text-lyra-text-secondary flex items-center gap-2">
                            <KeyRound size={16} /> 
                            {language === 'id' ? 'API Key Rahasia' : 'Secret API Key'}
                          </label>
                          <p className="text-xs text-lyra-text-muted mb-2">
                            {providerType === 'openai' 
                              ? (language === 'id' ? 'Token akses dari platform.openai.com' : 'Access token from platform.openai.com') 
                              : providerType === 'anthropic' 
                              ? (language === 'id' ? 'Token akses dari console.anthropic.com' : 'Access token from console.anthropic.com') 
                              : (language === 'id' ? 'Token akses (akan dienkripsi di config backend).' : 'Access token (encrypted in backend config).')}
                          </p>
                          <input 
                            type="password" 
                            className="w-full bg-lyra-bg border border-lyra-border rounded-lyra-md px-4 py-3 text-sm text-lyra-text focus:outline-none focus:border-lyra-accent focus:shadow-[0_0_0_2px_rgba(var(--color-lyra-accent),0.2)] transition-all shadow-neo-inset"
                            value={aiApiKey}
                            onChange={e => setAiApiKey(e.target.value)}
                            placeholder="sk-..."
                          />
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
