'use client';

import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';

const AUTH_DOMAIN = 'notehub.dev';

function toEmail(username: string): string {
  return `${username.trim()}@${AUTH_DOMAIN}`;
}

function toUsername(user: User | null): string | null {
  if (!user) return null;
  if (typeof user.user_metadata?.username === 'string') return user.user_metadata.username;
  if (user.email) return user.email.replace(`@${AUTH_DOMAIN}`, '');
  return null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  const username = toUsername(user);

  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabase();

    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) setAuthError(error.message);
        setUser(data.session?.user || null);
        setIsLoading(false);
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        setAuthError(error instanceof Error ? error.message : 'Unable to load Supabase session.');
        setIsLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (name: string, password: string) => {
    setAuthError(null);
    setAuthMessage(null);

    const email = toEmail(name);
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
      return false;
    }

    return true;
  }, []);

  const signUp = useCallback(async (name: string, password: string) => {
    setAuthError(null);
    setAuthMessage(null);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name.trim(), password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setAuthError(data?.error || 'Sign up failed');
        return false;
      }

      const email = toEmail(name);
      const { error } = await getSupabase().auth.signInWithPassword({ email, password });
      if (error) {
        setAuthError(error.message);
        return false;
      }

      return true;
    } catch {
      setAuthError('Unable to connect. Check your internet connection.');
      return false;
    }
  }, []);

  const signOut = useCallback(async () => {
    setAuthError(null);
    setAuthMessage(null);
    const { error } = await getSupabase().auth.signOut();
    if (error) setAuthError(error.message);
  }, []);

  return { user, username, isLoading, authError, authMessage, signIn, signUp, signOut };
}
