'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Sparkles, 
  ShieldCheck,
  RotateCw,
  Terminal,
  FileCode,
  Globe,
  Database
} from 'lucide-react';
import { AgentTodoItem, WorkPlanStatus } from '@/types/agent-studio';
import { useI18nStore } from '@/i18n';

interface InteractiveMissionPlanCardProps {
  todos: AgentTodoItem[];
  planStatus: WorkPlanStatus;
  isExecuting: boolean;
  onApprovePlan: () => void;
  onAddTodo: (todo: Omit<AgentTodoItem, 'id' | 'order'>) => void;
  onUpdateTodo: (id: string, updates: Partial<AgentTodoItem>) => void;
  onRemoveTodo: (id: string) => void;
  className?: string;
}

export const InteractiveMissionPlanCard: React.FC<InteractiveMissionPlanCardProps> = ({
  todos,
  planStatus,
  isExecuting,
  onApprovePlan,
  onAddTodo,
  onUpdateTodo,
  onRemoveTodo,
  className = '',
}) => {
  const { language } = useI18nStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTodoLabel, setNewTodoLabel] = useState('');

  const completedCount = todos.filter((t) => t.state === 'completed').length;
  const progressPercent = todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0;

  const handleStartEdit = (t: AgentTodoItem) => {
    if (isExecuting) return;
    setEditingId(t.id);
    setEditText(t.label);
  };

  const handleSaveEdit = (id: string) => {
    if (editText.trim()) {
      onUpdateTodo(id, { label: editText.trim() });
    }
    setEditingId(null);
  };

  const handleCreateTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoLabel.trim()) return;
    onAddTodo({
      label: newTodoLabel.trim(),
      state: 'pending',
      assignee: 'coder'
    });
    setNewTodoLabel('');
    setIsAddingNew(false);
  };

  const getToolIcon = (tool?: string) => {
    switch (tool?.toLowerCase()) {
      case 'terminal':
      case 'bash':
        return <Terminal size={12} className="text-emerald-500" />;
      case 'web_search':
      case 'browse':
        return <Globe size={12} className="text-blue-500" />;
      case 'file_writer':
      case 'read_file':
        return <FileCode size={12} className="text-amber-500" />;
      default:
        return <Database size={12} className="text-purple-500" />;
    }
  };

  return (
    <div className={`w-full rounded-2xl border border-lyra-accent/20 bg-lyra-surface/90 backdrop-blur-md p-5 shadow-lg transition-all ${className}`}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-lyra-accent/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-lyra-accent/15 flex items-center justify-center text-lyra-accent shadow-sm">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold tracking-tight text-lyra-text">
                {language === 'id' ? 'Rencana Aksi Otonom (Action Plan)' : 'Autonomous Action Plan'}
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider ${
                planStatus === 'completed'
                  ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                  : isExecuting
                  ? 'bg-blue-500/15 text-blue-500 border border-blue-500/30 animate-pulse'
                  : planStatus === 'approved'
                  ? 'bg-purple-500/15 text-purple-500 border border-purple-500/30'
                  : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
              }`}>
                {planStatus === 'completed' 
                  ? (language === 'id' ? 'Selesai' : 'Completed') 
                  : isExecuting 
                  ? (language === 'id' ? 'Mengeksekusi...' : 'Executing...') 
                  : planStatus === 'approved' 
                  ? (language === 'id' ? 'Disetujui' : 'Approved') 
                  : (language === 'id' ? 'Menunggu Persetujuan' : 'Awaiting Review')}
              </span>
            </div>
            <p className="text-[11px] text-lyra-text-secondary mt-0.5">
              {language === 'id' 
                ? 'Daftar langkah kerja dapat disesuaikan sebelum disetujui untuk dieksekusi secara otonom.' 
                : 'Action steps can be reviewed or edited before approving automated execution.'}
            </p>
          </div>
        </div>

        {/* Progress Bar & Actions */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium text-lyra-text-secondary">
              {completedCount}/{todos.length} ({progressPercent}%)
            </span>
            <div className="w-20 h-2 bg-lyra-accent/10 rounded-full overflow-hidden border border-lyra-accent/15">
              <div 
                className="h-full bg-lyra-accent rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Action Approval Gate */}
          {planStatus === 'draft' && !isExecuting && todos.length > 0 && (
            <button
              type="button"
              onClick={onApprovePlan}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lyra-accent hover:bg-lyra-accent/90 text-white font-medium text-xs shadow-md shadow-lyra-accent/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <Play size={13} fill="currentColor" />
              <span>{language === 'id' ? 'Setujui & Jalankan' : 'Approve & Execute'}</span>
            </button>
          )}

          {isExecuting && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-500 text-xs font-medium">
              <RotateCw size={13} className="animate-spin" />
              <span>{language === 'id' ? 'Sedang Berjalan' : 'Running'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Todo List Items */}
      <div className="mt-4 space-y-2">
        <AnimatePresence>
          {todos.map((todo, idx) => {
            const isCompleted = todo.state === 'completed';
            const isInProgress = todo.state === 'in_progress';
            const isFailed = todo.state === 'failed';
            const isEditing = editingId === todo.id;

            return (
              <motion.div
                key={todo.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`group relative flex items-start gap-3 p-3 rounded-xl border transition-all ${
                  isInProgress
                    ? 'bg-blue-500/5 border-blue-500/40 shadow-sm'
                    : isCompleted
                    ? 'bg-emerald-500/5 border-emerald-500/30 text-lyra-text/70'
                    : isFailed
                    ? 'bg-red-500/5 border-red-500/30'
                    : 'bg-lyra-surface/40 hover:bg-lyra-surface/70 border-lyra-accent/10 hover:border-lyra-accent/20'
                }`}
              >
                {/* State Checkmark / Icon */}
                <div className="pt-0.5 shrink-0">
                  {isCompleted ? (
                    <div className="w-5 h-5 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center border border-emerald-500/30">
                      <CheckCircle2 size={13} />
                    </div>
                  ) : isInProgress ? (
                    <div className="w-5 h-5 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center border border-blue-500/30 animate-pulse">
                      <Clock size={13} className="animate-spin" />
                    </div>
                  ) : isFailed ? (
                    <div className="w-5 h-5 rounded-lg bg-red-500/15 text-red-500 flex items-center justify-center border border-red-500/30">
                      <AlertCircle size={13} />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-lg bg-lyra-accent/10 text-lyra-text-secondary/60 flex items-center justify-center border border-lyra-accent/15">
                      <Circle size={12} />
                    </div>
                  )}
                </div>

                {/* Content / Editor */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(todo.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="flex-1 bg-lyra-bg border border-lyra-accent/30 rounded-lg px-2.5 py-1 text-xs text-lyra-text focus:outline-none focus:border-lyra-accent"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(todo.id)}
                        className="p-1 rounded-lg bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25"
                      >
                        <Check size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="p-1 rounded-lg bg-lyra-surface text-lyra-text-secondary hover:text-lyra-text"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-lyra-text-secondary/60 font-medium">
                          #{idx + 1}
                        </span>
                        <span className={`text-xs font-medium leading-relaxed ${
                          isCompleted ? 'line-through text-lyra-text-secondary/60' : 'text-lyra-text'
                        }`}>
                          {todo.label}
                        </span>
                      </div>

                      {/* Meta badges: Assignee, Tool, Output */}
                      <div className="flex items-center gap-2 mt-1">
                        {todo.assignee && (
                          <span className="text-[10px] font-mono text-lyra-text-secondary/70 bg-lyra-accent/5 px-1.5 py-0.5 rounded border border-lyra-accent/10">
                            @{todo.assignee}
                          </span>
                        )}
                        {todo.toolType && (
                          <span className="flex items-center gap-1 text-[10px] font-mono text-lyra-text-secondary/70 bg-lyra-accent/5 px-1.5 py-0.5 rounded border border-lyra-accent/10">
                            {getToolIcon(todo.toolType)}
                            {todo.toolType}
                          </span>
                        )}
                        {todo.outputArtifact && (
                          <span className="text-[10px] font-mono text-emerald-500/90 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            {todo.outputArtifact}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Edit & Delete Controls (Only available before execution / during draft) */}
                {!isExecuting && !isEditing && planStatus === 'draft' && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(todo)}
                      className="p-1 rounded-lg text-lyra-text-secondary hover:text-lyra-text hover:bg-lyra-accent/10 transition-colors"
                      title={language === 'id' ? 'Ubah langkah' : 'Edit step'}
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveTodo(todo.id)}
                      className="p-1 rounded-lg text-red-500/70 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      title={language === 'id' ? 'Hapus langkah' : 'Delete step'}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Add Step Button / Input Form */}
        {!isExecuting && planStatus === 'draft' && (
          <div className="pt-2">
            {isAddingNew ? (
              <form onSubmit={handleCreateTodo} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={language === 'id' ? 'Tulis langkah baru... (misal: Jalankan linter kode)' : 'Write a new step... (e.g. Run code linter)'}
                  value={newTodoLabel}
                  onChange={(e) => setNewTodoLabel(e.target.value)}
                  className="flex-1 bg-lyra-bg border border-lyra-accent/30 rounded-xl px-3 py-1.5 text-xs text-lyra-text placeholder:text-lyra-text-secondary/50 focus:outline-none focus:border-lyra-accent"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-lyra-accent text-white text-xs font-medium hover:bg-lyra-accent/90"
                >
                  {language === 'id' ? 'Simpan' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="p-1.5 rounded-xl bg-lyra-surface text-lyra-text-secondary hover:text-lyra-text"
                >
                  <X size={14} />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="flex items-center gap-1.5 text-xs font-mono text-lyra-accent/80 hover:text-lyra-accent py-1 px-2 rounded-lg hover:bg-lyra-accent/5 transition-colors cursor-pointer"
              >
                <Plus size={13} />
                <span>{language === 'id' ? '+ Tambah Langkah Manual' : '+ Add Manual Step'}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
