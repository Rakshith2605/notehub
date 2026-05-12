'use client';

import { X } from 'lucide-react';
import PATManager from './PATManager';
import MCPConfig from './MCPConfig';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-lg border border-border bg-surface shadow-2xl p-5">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-sm font-semibold text-foreground">Settings</h1>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
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
