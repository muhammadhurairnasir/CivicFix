'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/hooks/useAuth';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

type VerifyState = 'loading' | 'success' | 'error';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = React.useState<VerifyState>('loading');
  const [errorMessage, setErrorMessage] = React.useState('');

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  React.useEffect(() => {
    let isMounted = true;

    const verifyEmail = async () => {
      if (!token || !email) {
        if (isMounted) {
          setStatus('error');
          setErrorMessage('Invalid verification link. Missing parameters.');
        }
        return;
      }

      try {
        const response = await api.get(`/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`);
        if (response.data.success && isMounted) {
          setStatus('success');
        }
      } catch (error: any) {
        if (isMounted) {
          setStatus('error');
          setErrorMessage(error.response?.data?.error || 'Verification failed. The link may have expired.');
        }
      }
    };

    verifyEmail();

    return () => {
      isMounted = false;
    };
  }, [token, email]);

  return (
    <div className="w-full text-center">
      {status === 'loading' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center space-y-4"
        >
          <Loader2 className="h-12 w-12 animate-spin text-[var(--primary)]" />
          <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">Verifying Email...</h2>
          <p className="text-[var(--text-secondary)]">Please wait while we verify your account.</p>
        </motion.div>
      )}

      {status === 'success' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center space-y-4"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface)]">
            <CheckCircle2 className="h-8 w-8 text-[var(--status-resolved)]" />
          </div>
          <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">Email Verified!</h2>
          <p className="text-[var(--text-secondary)]">
            Thank you for verifying your email. You can now access all CivicFix features.
          </p>
          <div className="mt-8 w-full">
            <Link href="/login">
              <Button fullWidth size="lg">Continue to Login</Button>
            </Link>
          </div>
        </motion.div>
      )}

      {status === 'error' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center space-y-4"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--background)]">
            <XCircle className="h-8 w-8 text-[var(--status-critical)]" />
          </div>
          <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">Verification Failed</h2>
          <p className="text-[var(--status-critical)]">{errorMessage}</p>
          <div className="mt-8 w-full">
            <Link href="/login">
              <Button variant="secondary" fullWidth size="lg">Back to Login</Button>
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <React.Suspense fallback={null}>
      <VerifyEmailContent />
    </React.Suspense>
  );
}
