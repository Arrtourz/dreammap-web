'use client';

import { useEffect, useState } from 'react';
import { track } from '@vercel/analytics';
import { Chrome } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/use-auth-store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSignUpSuccess?: (message: string) => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const authLoading = useAuthStore((state) => state.loading);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      track('Auth Modal Shown', {
        source: 'dream_submit',
      });
    }
  }, [open]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    track('Google Sign In Clicked', {
      step: 'initiate',
    });

    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setError(error.message || 'Failed to initiate sign in');
        setLoading(false);
      }
    } catch {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const isLoading = loading || authLoading;

  const handleClose = () => {
    track('Auth Modal Dismissed', {
      had_error: !!error,
    });
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Sign in with Google</DialogTitle>
          <DialogDescription className="text-center">
            Sign in to publish dreams. Browsing stays public.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="h-12 w-full font-medium"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Connecting...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-3">
                <Chrome className="h-4 w-4" />
                <span>Continue with Google</span>
              </span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
