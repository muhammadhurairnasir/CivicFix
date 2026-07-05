'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations/auth';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { api } from '@/hooks/useAuth';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' }
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setServerError(null);
    try {
      await api.post('/auth/forgot-password', data);
      // We always show success to prevent email enumeration,
      // the backend returns 200 consistently.
      setIsSuccess(true);
    } catch (error) {
      setServerError('An unexpected error occurred. Please try again later.');
    }
  };

  if (isSuccess) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center w-full"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-muted)]">
          <CheckCircle2 className="h-8 w-8 text-[var(--primary)]" />
        </div>
        <h2 className="mt-6 font-display text-2xl font-bold text-[var(--text-primary)]">Check your inbox</h2>
        <p className="mt-2 text-[var(--text-secondary)]">
          If an account exists with that email, we&apos;ve sent a password reset link.
        </p>
        <div className="mt-8">
          <Link href="/login">
            <Button fullWidth variant="secondary" size="lg">Return to login</Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="w-full">
      <Link href="/login" className="mb-6 flex items-center text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to login
      </Link>

      <div className="mb-8">
        <h2 className="font-display text-3xl font-bold text-[var(--text-primary)]">
          Forgot password?
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      {serverError && (
        <div className="mb-6 rounded-xl bg-[var(--background)] p-4 text-sm text-[var(--status-critical)] border border-[var(--status-critical)]/20">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={control}
          name="email"
          label="Email Address"
          placeholder="you@example.com"
          type="email"
          leftIcon={<Mail className="h-4 w-4" />}
        />

        <Button type="submit" fullWidth loading={isSubmitting} size="lg" className="mt-2">
          Send Reset Link
        </Button>
      </form>
    </div>
  );
}
