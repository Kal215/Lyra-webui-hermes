export type AgentLiveEvent = {
  id: string;
  type: 'run.started' | 'run.completed' | 'command.started' | 'terminal.stdout' | 'terminal.stderr' | 'command.finished' | 'file.opened' | 'file.changed' | 'file.patch' | 'check.started' | 'check.finished' | 'status.changed';
  timestamp: number;
  terminal?: string;
  command?: string;
  text?: string;
  success?: boolean;
  actionKey?: string;
  actionParams?: any;
  file?: string;
  content?: string | { type: 'context' | 'added' | 'removed', text: string }[];
  status?: string;
  check?: string;
};

// Fixture timeline for the Coder agent simulating editing checkout

// Fixture timeline for the Coder agent simulating editing checkout
export const DEMO_EVENTS: Omit<AgentLiveEvent, 'timestamp'>[] = [
  { id: 'e1', type: 'status.changed', status: 'running', actionKey: 'analyze' },
  { id: 'e2', type: 'command.started', command: 'lyra-analyze src/app/checkout/page.tsx', terminal: 'Analyzing structure...' },
  { id: 'e3', type: 'terminal.stdout', terminal: 'Found 1 file to edit' },
  { id: 'e4', type: 'command.finished', terminal: 'Analysis complete.' },
  
  { id: 'e5', type: 'status.changed', actionKey: 'edit', actionParams: { file: 'src/app/checkout/page.tsx' }, file: 'src/app/checkout/page.tsx' },
  { id: 'e6', type: 'file.opened', file: 'src/app/checkout/page.tsx', 
      content: `import React, { useState, useEffect } from 'react';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { EmptyCart } from '@/components/checkout/EmptyCart';
import { OrderSummary } from '@/components/checkout/OrderSummary';

export default function Checkout() {
  const { items, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    clearCart();
    setIsSubmitting(false);
    router.push('/checkout/success');
  };

  if (!items.length) {
    return <EmptyCart />;
  }

  return (
    <div className="container max-w-4xl py-12">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <OrderSummary items={items} total={total} />
        </div>
      </div>
    </div>
  );
}` },
  
  { id: 'e7', type: 'status.changed', actionKey: 'edit', actionParams: { file: 'src/app/checkout/page.tsx' } },
  { id: 'e8', type: 'terminal.stdout', terminal: 'Patching lines 17-19...' },
  
  { id: 'e10', type: 'file.patch', file: 'src/app/checkout/page.tsx', 
      content: [
        { type: 'context', text: '  const router = useRouter();' },
        { type: 'context', text: '' },
        { type: 'removed', text: '  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);' },
        { type: 'added', text: '  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity + (item.discount > 0 ? (item.price * item.quantity * (item.discount / 100)) : 0) + (item.shippingCost || 0) + (item.handlingFee || 0) + (config.globalMarkup || 0), 0); // Very long line to demonstrate horizontal camera follow behavior in the file viewer...' },
        { type: 'added', text: '  const tax = subtotal * 0.1;' },
        { type: 'added', text: '  const total = subtotal + tax;' },
        { type: 'context', text: '' },
        { type: 'context', text: '  const handleSubmit = async (e: React.FormEvent) => {' }
      ] },
      
  { id: 'e11', type: 'terminal.stdout', terminal: 'File patched successfully.' },
  { id: 'e12', type: 'status.changed', actionKey: 'run_tsc' },
  { id: 'e13', type: 'command.started', command: 'npm run typecheck', terminal: '$ npm run typecheck' },
  { id: 'e14', type: 'terminal.stdout', terminal: 'tsc --noEmit\nNo errors found.' },
  { id: 'e15', type: 'command.finished', success: true, check: 'Typecheck' },
  
  { id: 'e16', type: 'status.changed', actionKey: 'run_eslint' },
  { id: 'e17', type: 'command.started', command: 'npm run lint', terminal: '$ npm run lint' },
  { id: 'e18', type: 'terminal.stdout', terminal: 'eslint .\nNo errors found.' },
  { id: 'e19', type: 'command.finished', success: true, check: 'ESLint' },
  
  { id: 'e20', type: 'status.changed', actionKey: 'run_tests' },
  { id: 'e21', type: 'command.started', command: 'npx playwright test', terminal: '$ npx playwright test' },
  { id: 'e22', type: 'terminal.stdout', terminal: 'Running 3 tests using 1 worker\n...\n  ✘  checkout.spec.ts:42 (1.2s)' },
  { id: 'e23', type: 'command.finished', success: false, check: 'Playwright E2E' },
  
  { id: 'e24', type: 'status.changed', status: 'completed_issue', actionKey: 'completed' },
];