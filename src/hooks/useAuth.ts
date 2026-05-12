'use client';

import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

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

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    setAuthMessage(null);

    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
      return false;
    }

    return true;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    setAuthMessage(null);

    const { data, error } = await getSupabase().auth.signUp({ email, password });
    if (error) {
      setAuthError(error.message);
      return false;
    }

    if (data.user && !data.session) {
      setAuthMessage('Check your email to confirm your account, then sign in.');
    }

    return true;
  }, []);

  const signOut = useCallback(async () => {
    setAuthError(null);
    setAuthMessage(null);
    const { error } = await getSupabase().auth.signOut();
    if (error) setAuthError(error.message);
  }, []);

  return { user, isLoading, authError, authMessage, signIn, signUp, signOut };
}