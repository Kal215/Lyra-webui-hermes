'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/i18n';
import { NeoPanel } from '@/components/NeoPanel';
import { NeoButton } from '@/components/NeoButton';
import { NeoInput } from '@/components/NeoInput';
import { NeoTextArea } from '@/components/NeoTextArea';

export default function NewWorkPage() {
  const t = useTranslation();
  const router = useRouter();

  const [instruction, setInstruction] = useState('');
  const [title, setTitle] = useState('');
  const [agent, setAgent] = useState('');
  const [priority, setPriority] = useState('0'); // 0 = normal

  const [agentsList, setAgentsList] = useState<string[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);

  const [isPreview, setIsPreview] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [instructionError, setInstructionError] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  const [idempotencyKey, setIdempotencyKey] = useState('');

  useEffect(() => {
    // Set idempotency key on load
    setIdempotencyKey(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
    
    // Fetch agents
    const fetchAgents = async () => {
      try {
        const res = await fetch('/api/agents');
        const json = await res.json();
        if (json.success && json.data) {
          setAgentsList(json.data);
          if (json.data.length > 0) {
            setAgent(json.data[0]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setAgentsLoading(false);
      }
    };
    fetchAgents();
  }, []);

  const handleSubmit = () => {
    if (!instruction.trim()) {
      setInstructionError(t('work.newWorkForm.instructionRequired') || 'Instruksi wajib diisi.');
      return;
    }
    setInstructionError('');
    setIsPreview(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCancel = () => {
    if (instruction.trim() || title.trim()) {
      setShowDiscardConfirm(true);
    } else {
      router.push('/work');
    }
  };

  const deriveTitle = () => {
    if (title.trim()) return title.trim();
    const firstSentence = instruction.split(/[.?!\n]/)[0];
    if (firstSentence.length > 50) return firstSentence.substring(0, 50) + '...';
    return firstSentence || t('work.newWorkForm.title') || 'Pekerjaan Baru';
  };
  
  const confirmDispatch = async () => {
    try {
      setIsSubmitting(true);
      setSubmitError('');
      
      const payload = {
        title: deriveTitle(),
        body: instruction,
        assignee: agent,
        priority: parseInt(priority, 10) || 0,
        idempotencyKey: idempotencyKey
      };
      
      const res = await fetch('/api/work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const json = await res.json();
      
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengirim pekerjaan / Dispatch failed.');
      }
      
      router.push(`/work/${json.taskId}`);
    } catch (err: any) {
      setSubmitError(err.message);
      setIsSubmitting(false);
    }
  };

  if (isPreview) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pt-6 pb-20 px-4 md:px-0">
        <div className="flex items-center space-x-2 text-lyra-text-muted mb-4">
          <button onClick={() => setIsPreview(false)} className="hover:text-lyra-text transition-colors">
            &larr; Kembali
          </button>
        </div>

        <NeoPanel className="p-8 space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-lyra-text">Review Pekerjaan</h1>
            <p className="text-sm text-lyra-text-muted mt-2 whitespace-pre-wrap">Silakan periksa kembali detail pekerjaan ini sebelum memberikan instruksi eksekusi (dispatch) ke agen.</p>
          </div>

          <div className="space-y-6 border-t border-lyra-text-muted/10 pt-6">
            <div>
              <h2 className="text-xl font-medium text-lyra-text">{deriveTitle()}</h2>
              <div className="mt-4 p-4 bg-lyra-background/50 rounded-lg text-lyra-text-secondary whitespace-pre-wrap">
                {instruction}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div>
                <span className="block text-xs text-lyra-text-muted mb-1">Agen Target</span>
                <span className="text-sm text-lyra-text">{agent}</span>
              </div>
              <div>
                <span className="block text-xs text-lyra-text-muted mb-1">Prioritas</span>
                <span className="text-sm text-lyra-text">{priority === '1' ? 'Tinggi' : 'Normal'}</span>
              </div>
            </div>
            
            {submitError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{submitError}</p>
              </div>
            )}
          </div>

          <div className="flex space-x-4 pt-6 border-t border-lyra-text-muted/10">
            <NeoButton variant="raised" onClick={confirmDispatch} disabled={isSubmitting} className="bg-lyra-accent-soft text-black shadow-neo-accent min-w-[160px] justify-center font-semibold">
              {isSubmitting ? 'Mengirim...' : 'Jalankan Pekerjaan'}
            </NeoButton>
            <NeoButton variant="flat" onClick={() => setIsPreview(false)} disabled={isSubmitting}>
              Edit Instruksi
            </NeoButton>
          </div>
        </NeoPanel>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pt-6 pb-20 px-4 md:px-0">
      <div className="flex items-center space-x-2 text-lyra-text-muted mb-2">
        <Link href="/work" className="hover:text-lyra-text transition-colors">
          &larr; Kembali
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-lyra-text tracking-tight">{t('work.newWorkForm.title') || 'Pekerjaan Baru'}</h1>
        <p className="text-sm text-lyra-text-muted mt-1">Buat instruksi pekerjaan baru untuk dieksekusi oleh Agen secara langsung.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <NeoPanel className="p-6">
            <label className="block text-sm font-medium text-lyra-text mb-2">
              Instruksi / Prompt
            </label>
            <NeoTextArea
              value={instruction}
              onChange={(e) => {
                setInstruction(e.target.value);
                if (instructionError) setInstructionError('');
              }}
              onKeyDown={handleKeyDown}
              placeholder="Jelaskan secara detail apa yang harus dilakukan agen..."
              className={`w-full min-h-[160px] md:min-h-[220px] resize-y ${instructionError ? 'border-red-500/50 focus:border-red-500/70' : ''}`}
            />
            {instructionError && (
              <p className="text-red-500 text-xs mt-2">{instructionError}</p>
            )}
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-lyra-text mb-2">
                Judul <span className="text-lyra-text-muted font-normal ml-1">(Opsional)</span>
              </label>
              <NeoInput
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Mis: Optimasi kode base"
                className="w-full"
              />
            </div>
          </NeoPanel>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <NeoPanel className="p-6 space-y-6">
            <h3 className="text-sm font-medium text-lyra-text-muted border-b border-lyra-text-muted/10 pb-2 mb-4">Pengaturan</h3>
            
            <div>
              <label className="block text-sm font-medium text-lyra-text mb-2">
                Agen
              </label>
              <select 
                value={agent} 
                onChange={(e) => setAgent(e.target.value)}
                disabled={agentsLoading}
                className="w-full h-10 bg-lyra-surface-inset shadow-neo-inset rounded-lyra-md px-4 text-sm text-lyra-text outline-none transition-all duration-200 focus:ring-2 focus:ring-lyra-accent-soft "
              >
                {agentsLoading ? (
                  <option value="">Memuat agen...</option>
                ) : (
                  agentsList.map(a => <option key={a} value={a}>{a}</option>)
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-lyra-text mb-2">
                Prioritas
              </label>
              <select 
                value={priority} 
                onChange={(e) => setPriority(e.target.value)}
                className="w-full h-10 bg-lyra-surface-inset shadow-neo-inset rounded-lyra-md px-4 text-sm text-lyra-text outline-none transition-all duration-200 focus:ring-2 focus:ring-lyra-accent-soft "
              >
                <option value="0">Normal</option>
                <option value="1">Tinggi (High)</option>
              </select>
            </div>
          </NeoPanel>

          <div className="flex flex-col space-y-3 pt-2">
            <NeoButton variant="raised" onClick={handleSubmit} className="w-full justify-center">
              Lanjutkan ke Review
            </NeoButton>
            <NeoButton variant="flat" onClick={handleCancel} className="w-full justify-center text-lyra-text-muted hover:text-lyra-text">
              Batal
            </NeoButton>
          </div>
        </div>
      </div>

      {showDiscardConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lyra-surface-raised/40 backdrop-blur-sm">
          <NeoPanel className="w-full max-w-sm p-6 relative">
            <h3 className="text-lg font-medium text-lyra-text mb-2">Buang Draf?</h3>
            <p className="text-sm text-lyra-text-muted mb-6">
              Perubahan yang Anda buat belum disimpan dan akan hilang.
            </p>
            <div className="flex justify-end space-x-3">
              <NeoButton variant="flat" onClick={() => setShowDiscardConfirm(false)}>
                Tetap di sini
              </NeoButton>
              <NeoButton variant="raised" onClick={() => router.push('/work')} className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
                Buang
              </NeoButton>
            </div>
          </NeoPanel>
        </div>
      )}
    </div>
  );
}
