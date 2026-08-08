'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import PATManager from './PATManager';
import MCPConfig from './MCPConfig';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="settings-title" tabIndex={-1} className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-lg border border-border bg-surface shadow-2xl p-5 max-sm:mt-auto max-sm:rounded-b-none max-sm:max-h-[90dvh]">
        <div className="flex items-center justify-between mb-1">
           <h1 id="settings-title" className="text-sm font-semibold text-foreground">Settings</h1>
          <button
            onClick={onClose}
             className="min-w-8 min-h-8 flex items-center justify-center rounded-md text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
             aria-label="Close settings"
          >
            <X size={16} />
          </button>
        </div>

        <div className="border-t border-border my-4" />

        <section className="mb-6">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Personal Access Tokens</h2>
          <PATManager />
        </section>

        <div className="border-t border-border my-4" />

        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">MCP Configuration</h2>
          <MCPConfig />
        </section>
      </div>
    </div>
  );
}
