'use client';

import React, { useState } from 'react';
import { Presentation, FileText, ArrowRight, Sparkles, Check, Loader2 } from 'lucide-react';

interface SmartActionPillProps {
  actionType: string;
  label: string;
  payload?: string;
  onExecute?: (action: string, payload?: string) => void;
}

export const SmartActionPill: React.FC<SmartActionPillProps> = ({
  actionType,
  label,
  payload,
  onExecute
}) => {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleClick = async () => {
    if (loading || done) return;

    if (onExecute) {
      onExecute(actionType, payload);
      return;
    }

    // Default event dispatcher so any listening page (/work or /chat) can handle it
    setLoading(true);
    try {
      const event = new CustomEvent('lyra:smart-action', {
        detail: { actionType, payload, label }
      });
      window.dispatchEvent(event);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = () => {
    if (loading) return <Loader2 size={13} className="animate-spin text-lyra-accent" />;
    if (done) return <Check size={13} className="text-emerald-400" />;
    if (actionType === 'make_slides' || actionType === 'presentation') {
      return <Presentation size={13} className="text-amber-400" />;
    }
    if (actionType === 'export_docx' || actionType === 'document') {
      return <FileText size={13} className="text-blue-400" />;
    }
    return <Sparkles size={13} className="text-purple-400" />;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-xl border border-lyra-accent/20 bg-lyra-surface/70 px-3.5 py-1.5 text-xs font-medium text-zinc-200 shadow-sm backdrop-blur-sm transition-all hover:border-lyra-accent/50 hover:bg-lyra-accent/15 hover:text-white cursor-pointer active:scale-95 my-1 mr-2"
    >
      {getIcon()}
      <span>{label}</span>
      <ArrowRight size={11} className="text-zinc-500 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
};
