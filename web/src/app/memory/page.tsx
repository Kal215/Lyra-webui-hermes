'use client';

import React, { useEffect, useState } from 'react';
import { NeoPanel } from '@/components/NeoPanel';
import { NeoButton } from '@/components/NeoButton';
import { Brain, User, Save, RefreshCw, AlertTriangle } from 'lucide-react';
import { useTactileSound } from '@/hooks/use-tactile-sound';
import { useI18nStore } from '@/i18n';
import { HermesInstallBanner } from '@/components/common/HermesInstallBanner';

export default function MemoryPage() {
  const { language } = useI18nStore();
  const { playClick } = useTactileSound();
  const [memoryMd, setMemoryMd] = useState('');
  const [userMd, setUserMd] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isHermesDetected, setIsHermesDetected] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'memory' | 'user'>('memory');

  const fetchMemories = () => {
    setLoading(true);
    fetch('/api/memory')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMemoryMd(data.memory);
          setUserMd(data.user);
          if (typeof data.hermes_detected === 'boolean') {
            setIsHermesDetected(data.hermes_detected);
          }
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const handleSave = async () => {
    playClick();
    setSaving(true);
    try {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memory: memoryMd, user: userMd })
      });
      if (!res.ok) throw new Error(language === 'id' ? 'Gagal menyimpan' : 'Failed to save');
    } catch (e) {
      console.error(e);
      alert(language === 'id' ? 'Gagal menyimpan memori' : 'Failed to save memory');
    } finally {
      setTimeout(() => setSaving(false), 500);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto p-4 md:p-8 space-y-8 h-screen flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-lyra-text flex items-center gap-3">
            <Brain size={32} className="text-lyra-accent" />
            {language === 'id' ? 'Ingatan Inti (Memory)' : 'Core Memory'}
          </h1>
          <p className="text-lyra-text-muted mt-2 max-w-2xl">
            {language === 'id' 
              ? 'Pusat ingatan permanen JARVIS. Apa yang tertulis di sini akan selalu diingat oleh AI di setiap percakapan dan sesi yang Anda buka, menetapkan kepribadian dan pengetahuan absolut sistem.' 
              : 'JARVIS permanent memory center. Content here is preserved across all AI conversations and sessions, establishing absolute system knowledge and persona.'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <NeoButton variant="flat" onClick={() => { playClick(); fetchMemories(); }} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </NeoButton>
          <NeoButton variant="raised" className="px-6" onClick={handleSave} disabled={saving || loading}>
            {saving ? (language === 'id' ? 'Menyimpan...' : 'Saving...') : (
              <>
                <Save size={18} className="mr-2" /> 
                {language === 'id' ? 'Simpan Memori' : 'Save Memory'}
              </>
            )}
          </NeoButton>
        </div>
      </div>

      {/* Hermes Engine Installation Guidance Banner if not detected */}
      {isHermesDetected === false && (
        <HermesInstallBanner featureName={language === 'id' ? 'Penyimpanan Memori Inti' : 'Core Memory Persistence'} />
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-lyra-border/50 shrink-0">
        <button
          onClick={() => { playClick(); setActiveTab('memory'); }}
          className={`pb-4 px-2 font-bold transition-all relative ${activeTab === 'memory' ? 'text-lyra-accent' : 'text-lyra-text-secondary hover:text-lyra-text'}`}
        >
          <div className="flex items-center gap-2">
            <Brain size={18} />
            MEMORY.md
          </div>
          {activeTab === 'memory' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-lyra-accent rounded-t-full shadow-[0_-2px_8px_rgba(var(--color-lyra-accent),0.5)]"></div>}
        </button>
        <button
          onClick={() => { playClick(); setActiveTab('user'); }}
          className={`pb-4 px-2 font-bold transition-all relative ${activeTab === 'user' ? 'text-lyra-accent' : 'text-lyra-text-secondary hover:text-lyra-text'}`}
        >
          <div className="flex items-center gap-2">
            <User size={18} />
            USER.md
          </div>
          {activeTab === 'user' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-lyra-accent rounded-t-full shadow-[0_-2px_8px_rgba(var(--color-lyra-accent),0.5)]"></div>}
        </button>
      </div>

      {/* Editor Space */}
      <NeoPanel depth={1} className="flex-1 overflow-hidden flex flex-col p-1 rounded-2xl relative">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-lyra-text-muted animate-pulse">
            {language === 'id' ? 'Menyinkronkan dengan JARVIS_CORE...' : 'Synchronizing with JARVIS_CORE...'}
          </div>
        ) : (
          <textarea
            className="flex-1 w-full h-full bg-transparent resize-none p-6 outline-none text-sm font-mono text-lyra-text leading-relaxed whitespace-pre-wrap"
            value={activeTab === 'memory' ? memoryMd : userMd}
            onChange={(e) => {
              if (activeTab === 'memory') setMemoryMd(e.target.value);
              else setUserMd(e.target.value);
            }}
            placeholder={
              language === 'id'
                ? `Tuliskan instruksi sistem atau ingatan absolut di sini...\n\nSetiap perubahan akan ditanamkan ke dalam inti AI.`
                : `Write system instructions or absolute memories here...\n\nEvery change will be embedded into the core AI.`
            }
          />
        )}
      </NeoPanel>

      <div className="flex items-center gap-3 p-4 rounded-lyra-sm bg-amber-500/10 border border-amber-500/20 text-amber-600/90 dark:text-amber-400/90 shrink-0">
        <AlertTriangle size={20} className="shrink-0" />
        <p className="text-xs">
          {language === 'id' 
            ? 'Berhati-hatilah mengedit file ini. Semakin panjang memori yang ditulis, semakin besar token awal yang dibutuhkan AI setiap kali merespons.' 
            : 'Edit this file carefully. The longer the stored memory, the more initial tokens the AI requires on every response.'}
        </p>
      </div>
    </div>
  );
}