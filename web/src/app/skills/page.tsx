'use client';

import React, { useEffect, useState } from 'react';
import { NeoPanel } from '@/components/NeoPanel';
import { NeoButton } from '@/components/NeoButton';
import { Zap, Puzzle, MessageSquare, Terminal, ChevronRight } from 'lucide-react';
import { useTactileSound } from '@/hooks/use-tactile-sound';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18nStore } from '@/i18n';
import { HermesInstallBanner } from '@/components/common/HermesInstallBanner';

export default function SkillsPage() {
  const { language } = useI18nStore();
  const { playClick } = useTactileSound();
  const [skillsList, setSkillsList] = useState<any[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [isHermesDetected, setIsHermesDetected] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'skills' | 'snippets'>('skills');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [snippets, setSnippets] = useState<any[]>([]);
  const [editingSnippet, setEditingSnippet] = useState<any>(null);
  const [snippetForm, setSnippetForm] = useState({ title: '', text: '' });

  useEffect(() => {
    fetch('/api/skills')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSkillsList(data.skills);
          if (typeof data.hermes_detected === 'boolean') {
            setIsHermesDetected(data.hermes_detected);
          }
        }
      })
      .finally(() => setSkillsLoading(false));
      
    fetchSnippets();
  }, []);

  const fetchSnippets = () => {
    fetch('/api/snippets')
      .then(res => res.json())
      .then(data => setSnippets(data))
      .catch(console.error);
  };

  const saveSnippet = async () => {
    playClick();
    if (!snippetForm.title || !snippetForm.text) return;
    
    if (editingSnippet) {
      await fetch('/api/snippets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingSnippet.id, ...snippetForm })
      });
    } else {
      await fetch('/api/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snippetForm)
      });
    }
    setEditingSnippet(null);
    setSnippetForm({ title: '', text: '' });
    fetchSnippets();
  };

  const deleteSnippet = async (id: string) => {
    playClick();
    if (confirm(language === 'id' ? 'Yakin ingin menghapus snippet ini?' : 'Are you sure you want to delete this snippet?')) {
      await fetch(`/api/snippets?id=${id}`, { method: 'DELETE' });
      fetchSnippets();
    }
  };

  const categories = ['All', ...Array.from(new Set(skillsList.map(s => s.category)))].filter(Boolean);

  return (
    <div className="max-w-[1200px] mx-auto p-4 md:p-8 space-y-8 h-screen flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-lyra-text flex items-center gap-3">
            <Zap size={32} className="text-lyra-accent" />
            {language === 'id' ? 'Kemampuan (Skills)' : 'Skills & Capabilities'}
          </h1>
          <p className="text-lyra-text-muted mt-2 max-w-2xl">
            {language === 'id' 
              ? 'Pusat manajemen alat, ekstensi, dan cuplikan cepat (Prompt Snippets). Agen AI akan secara otomatis memanggil kemampuan ini kapan pun percakapan Anda membutuhkannya.' 
              : 'Management center for tools, extensions, and prompt snippets. The AI agent will automatically invoke these skills whenever your workflow requires them.'}
          </p>
        </div>
      </div>

      {/* Hermes Engine Installation Guidance Banner if not detected */}
      {isHermesDetected === false && (
        <HermesInstallBanner featureName={language === 'id' ? 'Katalog Skills & Ekstensi' : 'Skills & Extension Catalog'} />
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-lyra-border/50 shrink-0">
        <button
          onClick={() => { playClick(); setActiveTab('skills'); }}
          className={`pb-4 px-2 font-bold transition-all relative ${activeTab === 'skills' ? 'text-lyra-accent' : 'text-lyra-text-secondary hover:text-lyra-text'}`}
        >
          <div className="flex items-center gap-2">
            <Puzzle size={18} />
            {language === 'id' ? 'Daftar Modul AI' : 'AI Skills Modules'}
          </div>
          {activeTab === 'skills' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-lyra-accent rounded-t-full shadow-[0_-2px_8px_rgba(var(--color-lyra-accent),0.5)]"></div>}
        </button>
        <button
          onClick={() => { playClick(); setActiveTab('snippets'); }}
          className={`pb-4 px-2 font-bold transition-all relative ${activeTab === 'snippets' ? 'text-lyra-accent' : 'text-lyra-text-secondary hover:text-lyra-text'}`}
        >
          <div className="flex items-center gap-2">
            <MessageSquare size={18} />
            Prompt Snippets
          </div>
          {activeTab === 'snippets' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-lyra-accent rounded-t-full shadow-[0_-2px_8px_rgba(var(--color-lyra-accent),0.5)]"></div>}
        </button>
      </div>

      {/* Main Content Space */}
      <div className="flex-1 overflow-hidden flex flex-col rounded-2xl relative">
        <AnimatePresence mode="wait">
          
          {activeTab === 'skills' && (
            <motion.div 
              key="skills-tab"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex overflow-hidden gap-6 h-full"
            >
              {/* Category Sidebar */}
              <NeoPanel depth={1} className="w-64 flex flex-col overflow-hidden shrink-0">
                <div className="p-4 border-b border-lyra-border/50 text-xs font-bold uppercase tracking-wider text-lyra-text-secondary">
                  {language === 'id' ? 'Kategori' : 'Categories'}
                </div>
                <div className="overflow-y-auto p-2 space-y-1">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => { playClick(); setSelectedCategory(cat); }}
                      className={`w-full text-left px-4 py-3 rounded-lyra-md text-sm font-medium transition-colors ${selectedCategory === cat ? 'bg-lyra-surface-inset shadow-neo-shallow-inset text-lyra-accent' : 'text-lyra-text-secondary hover:bg-lyra-surface-inset hover:text-lyra-text'}`}
                    >
                      {cat === 'All' ? (language === 'id' ? 'Semua Kemampuan' : 'All Skills') : cat.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      <span className="float-right text-xs opacity-50">
                        {cat === 'All' ? skillsList.length : skillsList.filter(s => s.category === cat).length}
                      </span>
                    </button>
                  ))}
                </div>
              </NeoPanel>

              {/* Grid Content */}
              <div className="flex-1 overflow-y-auto pb-20 pr-2">
                {skillsLoading ? (
                  <div className="h-full flex items-center justify-center text-lyra-text-muted animate-pulse">
                    {language === 'id' ? 'Memuat daftar kemampuan...' : 'Loading skills modules...'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {skillsList.filter(s => selectedCategory === 'All' || s.category === selectedCategory).map(skill => (
                      <NeoPanel key={skill.name} depth={0} className="p-5 flex flex-col group cursor-default hover:border-lyra-accent/30 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-bold text-lg text-lyra-text flex items-center gap-2">
                            <Terminal size={18} className="text-lyra-accent" />
                            {skill.name}
                          </span>
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md ${skill.source === 'local' ? 'bg-lyra-success/20 text-lyra-success border border-lyra-success/20' : 'bg-lyra-surface-inset text-lyra-text-muted'}`}>
                            {skill.source}
                          </span>
                        </div>
                        <p className="text-sm text-lyra-text-secondary leading-relaxed flex-1">
                          {skill.description}
                        </p>
                        <div className="mt-4 pt-3 border-t border-lyra-border/50 text-xs font-mono text-lyra-text-muted flex items-center justify-between opacity-50 group-hover:opacity-100 transition-opacity">
                          <span>@skill:{skill.name}</span>
                          <button className="text-lyra-accent hover:underline flex items-center">
                            {language === 'id' ? 'Detail' : 'Details'} <ChevronRight size={14} />
                          </button>
                        </div>
                      </NeoPanel>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'snippets' && (
            <motion.div 
              key="snippets-tab"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="flex-1 overflow-y-auto pr-2"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {snippets.map((snip, i) => (
                  <NeoPanel key={snip.id} depth={1} className="p-6 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                      <MessageSquare size={100} />
                    </div>
                    {editingSnippet?.id === snip.id ? (
                      <div className="relative z-10 space-y-4">
                        <input
                          type="text"
                          value={snippetForm.title}
                          onChange={e => setSnippetForm({...snippetForm, title: e.target.value})}
                          className="w-full bg-lyra-surface-inset border border-lyra-border rounded p-2 text-sm text-lyra-text outline-none focus:border-lyra-accent"
                          placeholder={language === 'id' ? 'Judul Snippet' : 'Snippet Title'}
                        />
                        <textarea
                          value={snippetForm.text}
                          onChange={e => setSnippetForm({...snippetForm, text: e.target.value})}
                          className="w-full bg-lyra-surface-inset border border-lyra-border rounded p-2 text-sm text-lyra-text outline-none focus:border-lyra-accent h-24 resize-none"
                          placeholder={language === 'id' ? 'Teks prompt...' : 'Prompt text...'}
                        />
                        <div className="flex gap-2">
                          <NeoButton variant="raised" className="text-xs px-4 h-8" onClick={saveSnippet}>{language === 'id' ? 'Simpan' : 'Save'}</NeoButton>
                          <NeoButton variant="flat" className="text-xs px-4 h-8" onClick={() => setEditingSnippet(null)}>{language === 'id' ? 'Batal' : 'Cancel'}</NeoButton>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-lg font-bold text-lyra-text mb-2 relative z-10">{snip.title}</h3>
                        <p className="text-sm text-lyra-text-secondary leading-relaxed mb-6 relative z-10">{snip.text}</p>
                        
                        <div className="flex items-center gap-3 relative z-10">
                          <NeoButton variant="raised" className="text-xs px-4 h-8" onClick={() => { playClick(); setEditingSnippet(snip); setSnippetForm({ title: snip.title, text: snip.text }); }}>Edit Snippet</NeoButton>
                          <NeoButton variant="flat" className="text-xs px-4 h-8 text-red-400 hover:text-red-500" onClick={() => deleteSnippet(snip.id)}>{language === 'id' ? 'Hapus' : 'Delete'}</NeoButton>
                        </div>
                      </>
                    )}
                  </NeoPanel>
                ))}

                {editingSnippet?.id === 'new' ? (
                  <NeoPanel depth={1} className="p-6 relative z-10 space-y-4">
                    <input
                      type="text"
                      value={snippetForm.title}
                      onChange={e => setSnippetForm({...snippetForm, title: e.target.value})}
                      className="w-full bg-lyra-surface-inset border border-lyra-border rounded p-2 text-sm text-lyra-text outline-none focus:border-lyra-accent"
                      placeholder={language === 'id' ? 'Judul Snippet Baru' : 'New Snippet Title'}
                    />
                    <textarea
                      value={snippetForm.text}
                      onChange={e => setSnippetForm({...snippetForm, text: e.target.value})}
                      className="w-full bg-lyra-surface-inset border border-lyra-border rounded p-2 text-sm text-lyra-text outline-none focus:border-lyra-accent h-24 resize-none"
                      placeholder={language === 'id' ? 'Teks prompt...' : 'Prompt text...'}
                    />
                    <div className="flex gap-2">
                      <NeoButton variant="raised" className="text-xs px-4 h-8" onClick={saveSnippet}>{language === 'id' ? 'Simpan' : 'Save'}</NeoButton>
                      <NeoButton variant="flat" className="text-xs px-4 h-8" onClick={() => setEditingSnippet(null)}>{language === 'id' ? 'Batal' : 'Cancel'}</NeoButton>
                    </div>
                  </NeoPanel>
                ) : (
                  <NeoPanel depth={0} className="p-6 border-dashed border-2 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-lyra-surface-inset transition-colors min-h-[200px]" onClick={() => { playClick(); setEditingSnippet({ id: 'new' }); setSnippetForm({ title: '', text: '' }); }}>
                    <div className="w-12 h-12 rounded-full bg-lyra-surface flex items-center justify-center text-lyra-text-muted mb-3 shadow-neo-inset">
                      <span className="text-2xl">+</span>
                    </div>
                    <h3 className="font-bold text-lyra-text">{language === 'id' ? 'Buat Snippet Baru' : 'Create New Snippet'}</h3>
                    <p className="text-xs text-lyra-text-muted mt-1">{language === 'id' ? 'Tambahkan jalan pintas prompt kustom Anda' : 'Add your custom prompt shortcut'}</p>
                  </NeoPanel>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}