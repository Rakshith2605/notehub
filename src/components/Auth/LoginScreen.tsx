'use client';

import { FormEvent, useState } from 'react';
import { Loader2, LogIn, UserPlus } from 'lucide-react';

interface LoginScreenProps {
  authError: string | null;
  authMessage: string | null;
  onSignIn: (username: string, password: string) => Promise<boolean>;
  onSignUp: (username: string, password: string) => Promise<boolean>;
}

export default function LoginScreen({ authError, authMessage, onSignIn, onSignUp }: LoginScreenProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignIn = mode === 'signin';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const succeeded = isSignIn
      ? await onSignIn(username.trim(), password)
      : await onSignUp(username.trim(), password);
    if (!succeeded) setPassword('');
    setIsSubmitting(false);
  };

  return (
    <main className="min-h-dvh w-screen bg-background flex items-center justify-center px-4">
      <section className="w-full max-w-sm rounded-lg border border-border bg-surface p-5 shadow-2xl shadow-black/20">
        <div className="mb-5">
          <h1 className="text-lg font-semibold text-foreground">Copybook</h1>
          <p className="mt-1 text-xs text-muted">Sign in to sync your workspace with Supabase.</p>
        </div>

        <div className="mb-4 grid grid-cols-2 rounded-md border border-border bg-surface-secondary p-0.5" role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
              isSignIn ? 'bg-surface-tertiary text-foreground' : 'text-muted hover:text-foreground'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
              !isSignIn ? 'bg-surface-tertiary text-foreground' : 'text-muted hover:text-foreground'
            }`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="username" className="mb-1 block text-[11px] font-medium text-muted-foreground">Username</label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent"
              placeholder={isSignIn ? 'Your username' : 'Pick a username'}
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-[11px] font-medium text-muted-foreground">Password</label>
            <input
              id="password"
              type="password"
              autoComplete={isSignIn ? 'current-password' : 'new-password'}
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent"
              placeholder="At least 6 characters"
            />
          </div>

          {authError && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300" role="alert">
              {authError}
            </div>
          )}

          {authMessage && (
            <div className="rounded-md border border-accent/30 bg-accent-muted px-3 py-2 text-xs text-muted-foreground" role="status">
              {authMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : isSignIn ? <LogIn size={16} /> : <UserPlus size={16} />}
            {isSignIn ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </section>
    </main>
  );
}
