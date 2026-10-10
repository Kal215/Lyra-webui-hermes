'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FolderOpen, Trash2, Edit2, Command, Play, FolderTree, Sparkles, X, Save, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspaceStore } from '@/store/workspace';

interface Project {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  workspacePath: string;
  createdAt: number;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [workspacePath, setWorkspacePath] = useState('');
  
  // Folder Picker States
  const [isFolderPickerOpen, setIsFolderPickerOpen] = useState(false);
  const [browseDir, setBrowseDir] = useState('D:/project');
  const [browseFiles, setBrowseFiles] = useState<any[]>([]);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const router = useRouter();
  const { setCurrentWorkspace } = useWorkspaceStore();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch (e) {}
  };

  const loadBrowseDir = async (dir: string) => {
    try {
      const res = await fetch(`/api/workspace/ls?dir=${encodeURIComponent(dir)}`);
      const data = await res.json();
      if (data.files) {
        setBrowseFiles(data.files.filter((f: any) => f.isDirectory));
        setBrowseDir(data.cwd.replace(/\\/g, '/'));
      }
    } catch (err) {}
  };

  useEffect(() => {
    if (isFolderPickerOpen) loadBrowseDir(browseDir);
  }, [isFolderPickerOpen]);

  const createNewFolder = async () => {
    if (!newFolderName) return;
    try {
      await fetch('/api/workspace/mkdir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dirPath: browseDir, folderName: newFolderName })
      });
      setNewFolderName('');
      setIsCreatingFolder(false);
      loadBrowseDir(browseDir);
    } catch (e) {}
  };

  const openModal = (proj?: Project) => {
    if (proj) {
      setEditingId(proj.id);
      setName(proj.name);
      setDescription(proj.description);
      setSystemPrompt(proj.systemPrompt);
      setWorkspacePath(proj.workspacePath);
    } else {
      setEditingId(null);
      setName('');
      setDescription('');
      setSystemPrompt('');
      setWorkspacePath('');
    }
    setIsModalOpen(true);
  };

  const saveProject = async () => {
    const payload = { name, description, systemPrompt, workspacePath };
    try {
      if (editingId) {
        await fetch(`/api/projects/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      setIsModalOpen(false);
      fetchProjects();
    } catch (e) {}
  };

  const deleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Hapus proyek ini secara permanen? Obrolan tidak akan ikut terhapus.')) return;
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      fetchProjects();
    } catch (e) {}
  };

  const launchProject = (proj: Project) => {
    if (proj.workspacePath) {
      setCurrentWorkspace(proj.workspacePath);
    }
    // Launch chat with project id
    router.push(`/chat?project_id=${proj.id}`);
  };

  return (
    <div className="min-h-screen p-8 lg:p-12 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-lyra-text tracking-tight mb-2">Projects</h1>
          <p className="text-lyra-text-secondary">Kelola agen dan lingkungan kerja (workspace) spesifik Anda.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create New Card */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openModal()}
            className="border-2 border-dashed border-lyra-accent/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-lyra-accent/5 hover:border-lyra-accent/60 transition-colors min-h-[240px] group"
          >
            <div className="w-16 h-16 bg-lyra-accent/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus size={28} className="text-lyra-accent" />
            </div>
            <h3 className="text-xl font-bold text-lyra-text">Buat Proyek Baru</h3>
            <p className="text-sm text-lyra-text-secondary mt-2">Siapkan agen dengan karakter dan folder khusus.</p>
          </motion.div>

          {/* Project Cards */}
          {projects.map(proj => (
            <motion.div 
              key={proj.id}
              whileHover={{ scale: 1.02, y: -4 }}
              className="bg-lyra-surface border border-lyra-accent/20 rounded-3xl p-6 flex flex-col relative group cursor-pointer overflow-hidden"
              onClick={() => launchProject(proj)}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-lyra-accent/5 rounded-bl-full -z-10 group-hover:bg-lyra-accent/10 transition-colors"></div>
              
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-black/20 rounded-2xl flex items-center justify-center border border-white/5">
                  <Command size={20} className="text-lyra-accent" />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); openModal(proj); }} className="p-2 hover:bg-lyra-accent/20 rounded-full text-lyra-text-secondary hover:text-white transition-colors"><Edit2 size={14} /></button>
                  <button onClick={(e) => deleteProject(e, proj.id)} className="p-2 hover:bg-red-500/20 rounded-full text-lyra-text-secondary hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-lyra-text mb-2 truncate" title={proj.name}>{proj.name}</h3>
              <p className="text-sm text-lyra-text-secondary mb-6 line-clamp-2 min-h-[40px]">{proj.description || 'Tidak ada deskripsi.'}</p>
              
              <div className="mt-auto flex flex-col gap-2">
                {proj.workspacePath && (
                  <div className="flex items-center gap-2 text-xs font-mono bg-black/20 px-3 py-1.5 rounded-lg text-lyra-text-secondary truncate">
                    <FolderOpen size={12} className="shrink-0 text-lyra-accent/70" />
                    <span className="truncate">{proj.workspacePath}</span>
                  </div>
                )}
                {proj.systemPrompt && (
                  <div className="flex items-center gap-2 text-xs bg-black/20 px-3 py-1.5 rounded-lg text-lyra-text-secondary truncate">
                    <Sparkles size={12} className="shrink-0 text-purple-400/70" />
                    <span className="truncate">Kustom AI aktif</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div key="project-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm"></motion.div>
            
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-lyra-surface border border-lyra-accent/30 rounded-3xl w-full max-w-2xl shadow-2xl relative z-10 flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-lyra-accent/10 flex justify-between items-center">
                <h2 className="text-2xl font-bold">{editingId ? 'Edit Proyek' : 'Proyek Baru'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full"><X size={20} /></button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-lyra-text-secondary uppercase tracking-wider mb-2">Nama Proyek</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/20 border border-lyra-accent/20 rounded-xl p-3 text-lyra-text focus:border-lyra-accent outline-none" placeholder="Misal: Asisten Python Backend" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-lyra-text-secondary uppercase tracking-wider mb-2">Deskripsi Singkat</label>
                  <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-black/20 border border-lyra-accent/20 rounded-xl p-3 text-lyra-text focus:border-lyra-accent outline-none" placeholder="Jelaskan untuk apa agen ini..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-lyra-text-secondary uppercase tracking-wider mb-2">Alamat Folder (Workspace)</label>
                  <div className="flex gap-2">
                    <input type="text" value={workspacePath} onChange={e => setWorkspacePath(e.target.value)} className="flex-1 bg-black/20 border border-lyra-accent/20 rounded-xl p-3 font-mono text-sm text-lyra-text focus:border-lyra-accent outline-none" placeholder="D:/project/kode_saya" />
                    <button onClick={() => setIsFolderPickerOpen(true)} className="px-4 py-2 bg-lyra-accent/10 border border-lyra-accent/30 text-lyra-accent hover:bg-lyra-accent/20 rounded-xl transition-colors font-medium flex items-center gap-2">
                      <FolderOpen size={16} /> Cari
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-lyra-text-secondary uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Instruksi Khusus (System Prompt)</span>
                    <Sparkles size={14} className="text-purple-400" />
                  </label>
                  <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} rows={4} className="w-full bg-black/20 border border-lyra-accent/20 rounded-xl p-3 text-lyra-text focus:border-lyra-accent outline-none resize-none" placeholder="Kamu adalah senior developer. Selalu periksa keamanan sebelum membalas kode..." />
                </div>
              </div>

              <div className="p-6 border-t border-lyra-accent/10 flex justify-end gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl hover:bg-white/5 transition-colors font-medium">Batal</button>
                <button onClick={saveProject} disabled={!name} className="px-6 py-2.5 bg-lyra-accent text-white rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
                  <Save size={16} /> Simpan Proyek
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {isFolderPickerOpen && (
          <div key="folder-picker-modal" className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFolderPickerOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md"></motion.div>
            
            <motion.div 
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className="bg-lyra-surface border border-lyra-accent/30 rounded-3xl w-full max-w-lg shadow-2xl relative z-10 flex flex-col p-6"
            >
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><FolderOpen size={20} className="text-lyra-accent" /> Pilih Folder Proyek</h3>
              
              <div className="flex gap-2 mb-4">
                <button onClick={() => {
                  if (browseDir === 'ROOT') return;
                  const parts = browseDir.replace(/\\/g, '/').split('/').filter(Boolean);
                  if (parts.length > 1) {
                    parts.pop();
                    loadBrowseDir(parts.join('/') + '/');
                  } else {
                    loadBrowseDir('ROOT');
                  }
                }} className="bg-black/20 text-lyra-text p-2 px-3 rounded-lg hover:bg-lyra-accent/20 transition-colors">
                  ← Naik
                </button>
                <div className="flex-1 bg-black/20 p-2 px-3 rounded-lg font-mono text-xs flex items-center overflow-hidden whitespace-nowrap overflow-ellipsis">
                  {browseDir}
                </div>
              </div>

              <div className="w-full h-64 bg-black/20 border border-lyra-accent/10 rounded-xl overflow-y-auto mb-4">
                {browseFiles.length === 0 ? (
                  <div className="p-4 text-center text-xs opacity-50 italic">Folder kosong.</div>
                ) : (
                  browseFiles.map((f, idx) => (
                    <button key={idx} onClick={() => loadBrowseDir(f.path)} className="w-full text-left p-3 border-b border-lyra-accent/5 hover:bg-lyra-accent/10 flex items-center gap-3 transition-colors">
                      <FolderOpen size={16} className="text-lyra-accent/70" />
                      <span className="text-sm truncate">{f.name}</span>
                    </button>
                  ))
                )}
              </div>

              {isCreatingFolder ? (
                <div className="flex gap-2 mb-4">
                  <input type="text" autoFocus value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Nama folder baru..." className="flex-1 bg-black/20 border border-lyra-accent/20 rounded-xl p-2 text-sm outline-none focus:border-lyra-accent" />
                  <button onClick={createNewFolder} className="bg-lyra-accent text-white px-4 rounded-xl text-sm font-semibold hover:opacity-90">Buat</button>
                  <button onClick={() => setIsCreatingFolder(false)} className="bg-black/20 text-lyra-text px-4 rounded-xl text-sm hover:bg-black/30">Batal</button>
                </div>
              ) : (
                <button onClick={() => setIsCreatingFolder(true)} className="text-lyra-accent text-sm flex items-center gap-2 mb-4 hover:underline w-fit">
                  <Plus size={14} /> Buat folder baru di sini
                </button>
              )}
              
              <div className="flex gap-2">
                <button onClick={() => setIsFolderPickerOpen(false)} className="flex-1 bg-black/20 text-lyra-text p-3 rounded-xl font-semibold hover:bg-black/30 transition-colors">Batal</button>
                <button onClick={() => {
                  setWorkspacePath(browseDir);
                  setIsFolderPickerOpen(false);
                }} className="flex-1 bg-lyra-accent text-white p-3 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                  Pilih Folder Ini <Check size={16} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}