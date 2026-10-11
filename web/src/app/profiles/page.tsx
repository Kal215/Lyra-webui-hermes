'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation, useI18nStore } from '@/i18n';
import { NeoPanel } from '@/components/NeoPanel';
import { NeoButton } from '@/components/NeoButton';
import { NeoInput } from '@/components/NeoInput';
import { UsersRound, Plus, Trash2, ShieldCheck, Cpu, HardDrive, Terminal, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileItem {
  name: string;
  is_active: boolean;
  dir: string;
}

export default function ProfilesPage() {
  const t = useTranslation();
  const { language } = useI18nStore();
  
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configTarget, setConfigTarget] = useState('');
  const [configPrompt, setConfigPrompt] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/profiles');
      if (!res.ok) throw new Error('Failed to fetch profiles');
      const json = await res.json();
      if (json.success && json.data) {
        setProfiles(json.data);
      } else {
        throw new Error(json.error || 'Unknown error');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProfileName })
      });
      if (!res.ok) throw new Error('Failed to create profile');
      setNewProfileName('');
      setShowCreateModal(false);
      fetchProfiles();
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (!window.confirm(`Hapus profil "${name}" secara permanen? Seluruh log, memori, dan konfigurasi profil ini akan hancur.`)) return;
    try {
      const res = await fetch(`/api/profiles?name=${encodeURIComponent(name)}`, { method: 'DELETE' });
      if (res.ok) fetchProfiles();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenConfig = async (name: string) => {
    setConfigTarget(name);
    setConfigPrompt('Memuat...');
    setShowConfigModal(true);
    try {
      const res = await fetch(`/api/profiles/config?name=${encodeURIComponent(name)}`);
      const json = await res.json();
      if (json.success) setConfigPrompt(json.prompt || '');
    } catch (err) {
      setConfigPrompt('');
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      await fetch('/api/profiles/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: configTarget, prompt: configPrompt })
      });
      setShowConfigModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingConfig(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-8 sm:px-8 max-w-7xl mx-auto w-full">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-lyra-text tracking-tight mb-2 flex items-center gap-3">
            <UsersRound className="w-8 h-8 text-lyra-accent" />
            {language === 'id' ? 'Profil Otak AI' : 'AI Profiles'}
          </h1>
          <p className="text-lyra-text-secondary text-sm sm:text-base max-w-2xl">
            {language === 'id' 
              ? 'Kelola multi-instans (Profiles) dari Hermes. Setiap profil berjalan terisolasi dengan ingatan (Memory), pengaturan model, dan terminal log yang 100% berbeda, bagaikan mempekerjakan asisten yang berbeda-beda.' 
              : 'Manage multiple isolated Hermes instances (Profiles). Each profile has its own memory, configuration, and terminal logs.'}
          </p>
        </div>
        <NeoButton variant="raised" className="gap-2 shrink-0 self-start sm:self-auto bg-lyra-accent text-white px-6 py-3" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} />
          {language === 'id' ? 'Buat Profil Baru' : 'New Profile'}
        </NeoButton>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-lyra-text-muted">
          <div className="w-8 h-8 rounded-full border-2 border-lyra-accent border-t-transparent animate-spin mb-4" />
          <p>{language === 'id' ? 'Memuat profil...' : 'Loading profiles...'}</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-red-400">
          <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-lg">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((prof, idx) => (
            <NeoPanel key={idx} className={`p-6 flex flex-col relative transition-all duration-300 hover:shadow-neo-hover border-t-4 ${prof.is_active ? 'border-t-green-500 bg-lyra-surface-inset shadow-neo-inset' : 'border-t-lyra-border'}`}>
              
              {/* Active Badge */}
              {prof.is_active && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-[10px] font-bold tracking-wider uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  {language === 'id' ? 'Aktif' : 'Active'}
                </div>
              )}

              <div className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-neo-deep ${prof.is_active ? 'bg-lyra-accent/10 text-lyra-accent' : 'bg-lyra-surface-inset text-lyra-text-muted'}`}>
                  <Cpu className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-lyra-text mb-1 capitalize truncate max-w-[150px]">{prof.name}</h3>
                  <div className="text-xs text-lyra-text-muted font-mono bg-black/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Terminal size={10} /> {prof.name === 'default' ? 'Core Node' : 'Worker Node'}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-8 flex-1">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-lyra-bg/40 border border-lyra-border/30">
                  <ShieldCheck className="w-4 h-4 text-lyra-text-secondary mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-lyra-text mb-0.5">
                      {language === 'id' ? 'Isolasi Keamanan' : 'Security Isolation'}
                    </div>
                    <div className="text-[11px] text-lyra-text-muted leading-relaxed">
                      {language === 'id' 
                        ? 'Profil ini tidak bisa membaca config.yaml atau API Key milik profil lain.' 
                        : 'This profile cannot access config.yaml or API Keys belonging to other profiles.'}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-lyra-bg/40 border border-lyra-border/30">
                  <HardDrive className="w-4 h-4 text-lyra-text-secondary mt-0.5 shrink-0" />
                  <div className="w-full min-w-0">
                    <div className="text-xs font-semibold text-lyra-text mb-0.5">
                      {language === 'id' ? 'Path Penyimpanan' : 'Storage Path'}
                    </div>
                    <div className="text-[10px] text-lyra-text-muted font-mono truncate" title={prof.dir}>{prof.dir}</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-lyra-border/20">
                <NeoButton variant="inset" className="px-4 py-2 text-xs font-medium" onClick={() => handleOpenConfig(prof.name)}>
                  {language === 'id' ? 'Konfigurasi' : 'Configure'}
                </NeoButton>
                {!prof.is_active && prof.name !== 'default' && (
                  <button 
                    onClick={() => handleDelete(prof.name)}
                    className="p-2 rounded-full hover:bg-red-500/10 text-lyra-text-muted hover:text-red-400 transition-colors"
                    title={language === 'id' ? 'Hapus Profil' : 'Delete Profile'}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

            </NeoPanel>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div key="profile-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm"></motion.div>
            
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-lyra-surface border border-lyra-accent/30 rounded-3xl w-full max-w-md shadow-2xl relative z-10 flex flex-col"
            >
              <div className="p-6 border-b border-lyra-accent/10 flex justify-between items-center">
                <h2 className="text-xl font-bold text-lyra-text">{language === 'id' ? 'Buat Profil Baru' : 'Create New Profile'}</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white/5 rounded-full text-lyra-text-secondary"><X size={20} /></button>
              </div>

              <form onSubmit={handleCreate} className="flex flex-col h-full overflow-hidden">
                <div className="p-6 overflow-y-auto flex-1 space-y-5">
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-200 leading-relaxed mb-2">
                    Profil baru adalah direktori <strong>.hermes/profiles/&lt;nama&gt;</strong> yang kosong. Ia akan mewarisi pengaturan global Anda, tetapi memiliki ruang memori, obrolan, dan pekerjaan yang independen.
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-lyra-text-secondary uppercase tracking-wider mb-2">Nama Profil</label>
                    <input 
                      required 
                      autoFocus
                      type="text" 
                      value={newProfileName} 
                      onChange={e => setNewProfileName(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))} 
                      className="w-full bg-black/20 border border-lyra-accent/20 rounded-xl p-3 text-lyra-text focus:border-lyra-accent outline-none font-mono" 
                      placeholder="contoh: penulis_kode" 
                    />
                    <p className="text-[10px] text-lyra-text-muted mt-2">Gunakan huruf kecil, angka, dan underscore saja.</p>
                  </div>
                </div>
                
                <div className="p-6 border-t border-lyra-accent/10 flex justify-end gap-3 bg-black/10 rounded-b-3xl">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 text-sm font-medium text-lyra-text hover:bg-white/5 rounded-xl transition-colors">
                    Batal
                  </button>
                  <button type="submit" disabled={isCreating} className="px-6 py-2.5 text-sm font-medium bg-lyra-accent text-white hover:bg-lyra-accent/90 rounded-xl transition-colors shadow-lg shadow-lyra-accent/20 flex items-center justify-center min-w-[120px]">
                    {isCreating ? 'Membangun Otak...' : 'Ciptakan Profil'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* CONFIG MODAL */}
        {showConfigModal && (
          <div key="config-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfigModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm"></motion.div>
            
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-lyra-surface border border-lyra-accent/30 rounded-3xl w-full max-w-2xl shadow-2xl relative z-10 flex flex-col"
            >
              <div className="p-6 border-b border-lyra-accent/10 flex justify-between items-center">
                <h2 className="text-xl font-bold text-lyra-text">{language === 'id' ? 'Konfigurasi Profil' : 'Profile Config'}: <span className="text-lyra-accent">{configTarget}</span></h2>
                <button onClick={() => setShowConfigModal(false)} className="p-2 hover:bg-white/5 rounded-full text-lyra-text-secondary"><X size={20} /></button>
              </div>

              <form onSubmit={handleSaveConfig} className="flex flex-col h-full overflow-hidden">
                <div className="p-6 overflow-y-auto flex-1 space-y-5">
                  <div className="p-4 rounded-xl bg-lyra-accent/10 border border-lyra-accent/20 text-sm text-lyra-text-secondary leading-relaxed mb-2">
                    {language === 'id' 
                      ? 'Di sini Anda mendefinisikan watak dan aturan AI. Teks ini akan disimpan ke dalam file AGENTS.md di dalam direktori profil ini, yang bertindak sebagai "System Prompt" absolut untuk agen ini.' 
                      : 'Define the AI behavior and rules here. This text will be saved to AGENTS.md within this profile directory, acting as the absolute System Prompt for this agent.'}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-lyra-text-secondary uppercase tracking-wider mb-2">Instruksi Sistem (AGENTS.md)</label>
                    <textarea 
                      value={configPrompt} 
                      onChange={e => setConfigPrompt(e.target.value)} 
                      className="w-full h-64 bg-black/20 border border-lyra-accent/20 rounded-xl p-4 text-lyra-text focus:border-lyra-accent outline-none font-mono text-[13px] resize-none" 
                      placeholder="Contoh: Anda adalah agen ahli pemrograman Python. Anda selalu menggunakan type-hints..." 
                    />
                  </div>
                </div>
                
                <div className="p-6 border-t border-lyra-accent/10 flex justify-end gap-3 bg-black/10 rounded-b-3xl">
                  <button type="button" onClick={() => setShowConfigModal(false)} className="px-5 py-2.5 text-sm font-medium text-lyra-text hover:bg-white/5 rounded-xl transition-colors">
                    Batal
                  </button>
                  <button type="submit" disabled={isSavingConfig} className="px-6 py-2.5 text-sm font-medium bg-lyra-accent text-white hover:bg-lyra-accent/90 rounded-xl transition-colors shadow-lg shadow-lyra-accent/20 flex items-center justify-center min-w-[120px]">
                    {isSavingConfig ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}