'use client';

import { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { track } from '@vercel/analytics';
import { createClient } from '@/utils/supabase/client';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  signInWithGoogle: () => Promise<{ data?: unknown; error?: Error | null }>;
  signOut: () => Promise<{ error?: unknown }>;
  initialize: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      loading: true,
      initialized: false,

      setUser: (user) => set({ user }),
      setLoading: (loading) => set({ loading }),
      setInitialized: (initialized) => set({ initialized }),

      signInWithGoogle: async () => {
        try {
          const supabase = createClient();
          const result = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${window.location.origin}/auth/callback`,
            },
          });

          if (!result.error) {
            track('Sign In Started', { method: 'google' });
          }

          return result;
        } catch (error) {
          return {
            error: error instanceof Error ? error : new Error('Failed to initiate sign in'),
          };
        }
      },

      signOut: async () => {
        const supabase = createClient();

        try {
          const result = await supabase.auth.signOut();
          set({ user: null });
          return result;
        } catch (error) {
          return { error };
        }
      },

      initialize: () => {
        if (get().initialized) return;

        set({ initialized: true });

        const supabase = createClient();
        const timeoutId = window.setTimeout(() => {
          set({ loading: false });
        }, 3000);

        void supabase.auth
          .getSession()
          .then(({ data: { session } }: { data: { session: Session | null } }) => {
            window.clearTimeout(timeoutId);
            set({
              user: session?.user ?? null,
              loading: false,
            });
          })
          .catch(() => {
            window.clearTimeout(timeoutId);
            set({
              user: null,
              loading: false,
            });
          });

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(
          (event: AuthChangeEvent, session: Session | null) => {
            set({
              user: session?.user ?? null,
              loading: false,
            });

            if (event === 'SIGNED_OUT') {
              set({ user: null });

              window.setTimeout(() => {
                window.dispatchEvent(new CustomEvent('auth:signout'));
              }, 100);
            }

            if (event === 'SIGNED_IN' && session?.user) {
              track('Sign In Success', {
                method: session.user.app_metadata.provider || 'google',
              });
            }
          }
        );

        window.addEventListener('beforeunload', () => subscription?.unsubscribe(), { once: true });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
      }),
      skipHydration: true,
    }
  )
);
