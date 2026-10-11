'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ListTodo } from 'lucide-react';
import { AgentTodoItem } from '@/types/agent-studio';

interface DynamicTodosCardProps {
  todos: AgentTodoItem[];
  className?: string;
}

export const DynamicTodosCard: React.FC<DynamicTodosCardProps> = ({ todos, className = '' }) => {
  const completedCount = todos.filter((t) => t.state === 'completed').length;
  const progressPercentage = todos.length > 0 ? (completedCount / todos.length) * 100 : 0;

  return (
    <div className={`w-full rounded-2xl border border-lyra-accent/15 bg-lyra-surface/80 p-5 shadow-sm backdrop-blur-md transition-all ${className}`}>
      {/* Header */}
      <div className="mb-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-lyra-accent/10 text-lyra-accent">
            <ListTodo className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight text-lyra-text">
              Todos
            </h3>
            <span className="rounded-full bg-lyra-accent/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-lyra-accent">
              {todos.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-medium text-lyra-text-secondary">
            {completedCount}/{todos.length} Selesai
          </span>
          <span className="rounded-full bg-lyra-bg border border-lyra-accent/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-lyra-accent">
            {Math.round(progressPercentage)}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-lyra-bg/80">
        <motion.div
          className="h-full bg-lyra-accent"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        />
      </div>

      {/* Todo Items */}
      <div className="flex flex-col space-y-3">
        <AnimatePresence initial={false}>
          {todos.map((todo) => (
            <motion.div
              key={todo.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-3 group"
            >
              {/* Status Icons */}
              {todo.state === 'completed' && (
                <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/20">
                  <Check className="h-2.5 w-2.5 stroke-[3] text-white" />
                </div>
              )}

              {todo.state === 'in_progress' && (
                <div className="relative mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lyra-accent opacity-75" />
                  <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-lyra-accent bg-lyra-surface" />
                </div>
              )}

              {todo.state === 'pending' && (
                <div className="mt-0.5 h-4 w-4 shrink-0 rounded-full border border-lyra-border/40" />
              )}

              {/* Label & Description */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-xs transition-colors duration-150 ${
                    todo.state === 'completed'
                      ? 'text-lyra-text-secondary/60 line-through'
                      : todo.state === 'in_progress'
                      ? 'font-bold text-lyra-text'
                      : 'text-lyra-text-secondary'
                  }`}
                >
                  {todo.label}
                </p>
                {todo.description && (
                  <p className={`mt-0.5 text-[11px] ${todo.state === 'in_progress' ? 'text-lyra-accent/90 font-medium' : 'text-lyra-text-secondary/60'}`}>
                    {todo.description}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
