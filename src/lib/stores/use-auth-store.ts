'use client';

import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createClient } from '@/utils/supabase/client-wrapper';
import { track } from '@vercel/analytics';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  valyuAccessToken: string | null;
  valyuRefreshToken: string | null;
  valyuTokenExpiresAt: number | null;
  hasApiKey: boolean;
  creditsAvailable: boolean;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  signInWithGoogle: () => Promise<{ data?: any; error?: any }>;
  signInWithValyu: () => Promise<{ data?: any; error?: any }>;
  completeValyuAuth: (
    idToken: string,
    accessToken: string,
    refreshToken: string,
    expiresIn: number
  ) => Promise<{ success: boolean; error?: string }>;
  setValyuTokens: (accessToken: string, refreshToken: string, expiresIn: number) => void;
  getValyuAccessToken: () => string | null;
  setApiKeyStatus: (hasApiKey: boolean, creditsAvailable: boolean) => void;
  signOut: () => Promise<{ error?: any }>;
  initialize: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      loading: true,
      initialized: false,
      valyuAccessToken: null,
      valyuRefreshToken: null,
      valyuTokenExpiresAt: null,
      hasApiKey: false,
      creditsAvailable: false,

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
          return { error };
        }
      },

      signInWithValyu: async () => ({
        error: new Error('Valyu auth is no longer active in Dreammap'),
      }),

      completeValyuAuth: async () => ({
        success: false,
        error: 'Valyu auth is no longer active in Dreammap',
      }),

      setValyuTokens: () => {
        set({
          valyuAccessToken: null,
          valyuRefreshToken: null,
          valyuTokenExpiresAt: null,
        });
      },

      getValyuAccessToken: () => null,

      setApiKeyStatus: (hasApiKey, creditsAvailable) => {
        set({ hasApiKey, creditsAvailable });
      },

      signOut: async () => {
        const supabase = createClient();

        try {
          const result = await supabase.auth.signOut();
          set({
            user: null,
            valyuAccessToken: null,
            valyuRefreshToken: null,
            valyuTokenExpiresAt: null,
            hasApiKey: false,
            creditsAvailable: false,
          });
          return result;
        } catch (error) {
          return { error };
        }
      },

      initialize: () => {
        if (get().initialized) return;

        set({ initialized: true });

        const supabase = createClient();
        const timeoutId = setTimeout(() => {
          set({ loading: false });
        }, 3000);

        supabase.auth
          .getSession()
          .then(({ data: { session } }: { data: { session: Session | null } }) => {
            clearTimeout(timeoutId);
            set({
              user: session?.user ?? null,
              loading: false,
            });
          })
          .catch(() => {
            clearTimeout(timeoutId);
            set({
              user: null,
              loading: false,
            });
          });

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(
          async (event: AuthChangeEvent, session: Session | null) => {
            set({
              user: session?.user ?? null,
              loading: false,
            });

            if (event === 'SIGNED_OUT') {
              set({
                user: null,
                valyuAccessToken: null,
                valyuRefreshToken: null,
                valyuTokenExpiresAt: null,
                hasApiKey: false,
                creditsAvailable: false,
              });

              if (typeof window !== 'undefined') {
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('auth:signout'));
                }, 100);
              }
            }

            if (event === 'SIGNED_IN' && session?.user) {
              track('Sign In Success', {
                method: session.user.app_metadata.provider || 'google',
              });
            }
          }
        );

        if (typeof window !== 'undefined') {
          window.addEventListener('beforeunload', () => {
            subscription?.unsubscribe();
          });
        }
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
