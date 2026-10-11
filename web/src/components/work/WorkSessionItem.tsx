'use client';

import React, { useState, useEffect } from 'react';
import { 
  MoreVertical, 
  Pin, 
  PinOff, 
  Edit2, 
  DownloadCloud, 
  Trash2, 
  Check, 
  X, 
  ExternalLink,
  Bot
} from 'lucide-react';
import { useI18nStore } from '@/i18n';

interface WorkSessionItemProps {
  task: any;
  isActive: boolean;
  onClick: () => void;
  onViewDetail: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onPin: (id: string, isPinned: boolean) => void;
}

export function WorkSessionItem({
  task,
  isActive,
  onClick,
  onViewDetail,
  onDelete,
  onRename,
  onPin
}: WorkSessionItemProps) {
  const { language } = useI18nStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title || task.id);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setEditTitle(task.title || task.id);
  }, [task.title, task.id]);

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editTitle.trim() && editTitle.trim() !== (task.title || task.id)) {
      onRename(task.id, editTitle.trim());
    }
    setIsEditing(false);
    setMenuOpen(false);
  };

  const getStatusColor = (st: string) => {
    switch (st) {
      case 'done': return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]';
      case 'running': return 'bg-blue-500 animate-pulse';
      case 'blocked': return 'bg-red-500';
      default: return 'bg-amber-400';
    }
  };

  return (
    <div className={`relative group w-full rounded-xl mb-1 flex items-center transition-all ${
      isActive ? 'bg-lyra-accent/15 border border-lyra-accent/30 text-lyra-text font-medium shadow-sm' : 'hover:bg-lyra-accent/5 text-lyra-text-secondary border border-transparent'
    }`}>
      {isConfirmingDelete ? (
        <div className="flex-1 flex items-center justify-between p-2 text-xs bg-red-500/10 rounded-xl">
          <span className="text-red-500 pl-1 truncate font-semibold">
            {language === 'id' ? 'Hapus tugas?' : 'Delete task?'}
          </span>
          <div className="flex gap-1 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
                setIsConfirmingDelete(false);
              }}
              className="text-emerald-500 p-1 hover:bg-emerald-500/20 rounded-md transition-colors cursor-pointer"
            >
              <Check size={13} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsConfirmingDelete(false);
              }}
              className="text-lyra-text-secondary p-1 hover:bg-lyra-accent/10 rounded-md transition-colors cursor-pointer"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      ) : isEditing ? (
        <form onSubmit={handleRenameSubmit} className="flex-1 flex items-center p-1.5">
          <input
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setIsEditing(false)}
            className="w-full bg-lyra-bg border border-lyra-accent/50 rounded-lg px-2 py-0.5 text-xs text-lyra-text focus:outline-none focus:border-lyra-accent"
          />
          <button
            type="submit"
            className="ml-1 text-emerald-500 p-1 hover:bg-emerald-500/20 rounded cursor-pointer"
          >
            <Check size={13} />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setEditTitle(task.title || task.id);
            }}
            className="text-red-500 p-1 hover:bg-red-500/20 rounded cursor-pointer"
          >
            <X size={13} />
          </button>
        </form>
      ) : (
        <>
          <button
            type="button"
            onClick={onClick}
            className="flex-1 flex items-center p-2 min-w-0 text-left cursor-pointer group-hover:text-lyra-text transition-colors"
          >
            <div className={`w-2 h-2 rounded-full mr-2.5 shrink-0 ${getStatusColor(task.status)}`} />
            <div className="truncate flex-1 min-w-0">
              <div className="text-xs truncate font-medium">{task.title || task.id}</div>
              <div className="text-[10px] text-lyra-text-secondary/60 flex items-center gap-1.5 mt-0.5 font-mono">
                <span className="text-lyra-accent">@{task.assignee || 'Aster'}</span>
                <span>•</span>
                <span>{task.id}</span>
              </div>
            </div>
          </button>

          {/* Context Options Button */}
          <div className="relative pr-1.5 flex items-center shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className={`p-1.5 rounded-lg hover:bg-lyra-accent/15 text-lyra-text-secondary hover:text-lyra-text transition-all cursor-pointer ${
                menuOpen || isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
              title="Menu Opsi Tugas"
            >
              <MoreVertical size={13} />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                />
                <div className="absolute right-0 top-7 w-44 bg-lyra-surface border border-lyra-accent/20 rounded-xl shadow-2xl z-50 overflow-hidden text-xs py-1 backdrop-blur-md">
                  {/* Detail Option (Paling atas) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onViewDetail(task.id);
                    }}
                    className="w-full text-left px-3 py-2 text-lyra-text hover:bg-lyra-accent/10 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <ExternalLink size={13} className="text-sky-400" />
                    <span>{language === 'id' ? 'Detail Pekerjaan' : 'Work Details'}</span>
                  </button>

                  {/* Pin / Unpin */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onPin(task.id, !task.is_pinned);
                    }}
                    className="w-full text-left px-3 py-2 text-lyra-text hover:bg-lyra-accent/10 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    {task.is_pinned ? <PinOff size={13} className="opacity-70" /> : <Pin size={13} className="opacity-70 text-amber-400" />}
                    <span>{task.is_pinned ? (language === 'id' ? 'Lepas Pin' : 'Unpin Task') : (language === 'id' ? 'Pin Tugas' : 'Pin Task')}</span>
                  </button>

                  {/* Rename */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      setIsEditing(true);
                    }}
                    className="w-full text-left px-3 py-2 text-lyra-text hover:bg-lyra-accent/10 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Edit2 size={13} className="opacity-70 text-emerald-400" />
                    <span>{language === 'id' ? 'Ubah Nama' : 'Rename'}</span>
                  </button>

                  {/* Export */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      const blob = new Blob([JSON.stringify(task, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `work_task_${task.id}.json`;
                      a.click();
                    }}
                    className="w-full text-left px-3 py-2 text-lyra-text hover:bg-lyra-accent/10 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <DownloadCloud size={13} className="opacity-70 text-indigo-400" />
                    <span>{language === 'id' ? 'Ekspor Tugas (JSON)' : 'Export Task (JSON)'}</span>
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      setIsConfirmingDelete(true);
                    }}
                    className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors border-t border-lyra-accent/10 mt-1 pt-1.5 cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>{language === 'id' ? 'Hapus Tugas' : 'Delete Task'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
