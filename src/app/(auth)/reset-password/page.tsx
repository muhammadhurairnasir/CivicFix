'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validations/auth';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { api } from '@/hooks/useAuth';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';

function ResetPasswordContent() {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const { control, handleSubmit, watch, formState: { isSubmitting } } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: token || '', password: '', confirmPassword: '' }
  });

  const password = watch('password');
  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength += 1;
    if (/[A-Z]/.test(pwd)) strength += 1;
    if (/[0-9]/.test(pwd)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) strength += 1;
    return strength;
  };
  const strength = getPasswordStrength(password || '');
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

  React.useEffect(() => {
    if (!token || !email) {
      setServerError('Invalid reset link. Missing token or email parameter.');
    }
  }, [token, email]);

  const onSubmit = async (data: ResetPasswordInput) => {
    setServerError(null);
    try {
      const response = await api.post(`/auth/reset-password?email=${encodeURIComponent(email || '')}`, data);
      if (response.data.success) {
        setIsSuccess(true);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setServerError(error.response.data.error || 'Failed to reset password');
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    }
  };

  if (isSuccess) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center w-full"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface)]">
          <CheckCircle2 className="h-8 w-8 text-[var(--status-resolved)]" />
        </div>
        <h2 className="mt-6 font-display text-2xl font-bold text-[var(--text-primary)]">Password Reset!</h2>
        <p className="mt-2 text-[var(--text-secondary)]">
          Your password has been successfully reset. You can now log in with your new password.
        </p>
        <div className="mt-8">
          <Link href="/login">
            <Button fullWidth size="lg">Sign In</Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="font-display text-3xl font-bold text-[var(--text-primary)]">
          Set new password
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Please enter your new password below.
        </p>
      </div>

      {serverError && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-[var(--background)] p-4 text-[var(--status-critical)] border border-[var(--status-critical)]/20">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-[var(--status-critical)]" />
          <p className="text-sm font-medium">{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" {...control.register('token')} value={token || ''} />

        <div>
          <FormField
            control={control}
            name="password"
            label="New Password"
            placeholder="••••••••"
            type="password"
            leftIcon={<Lock className="h-4 w-4" />}
            disabled={!token || !email}
          />
          {password && (
            <div className="mt-2">
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-[var(--text-secondary)]">Password strength:</span>
                <span className={strength === 0 ? "text-[var(--status-critical)]" : strength === 1 ? "text-[var(--status-pending)]" : strength === 2 ? "text-[var(--primary)]" : "text-[var(--status-resolved)]"}>
                  {strength > 0 ? strengthLabels[strength - 1] : 'Very Weak'}
                </span>
              </div>
              <div className="flex gap-1 h-1.5 w-full">
                {[1, 2, 3, 4].map((level) => (
                  <div 
                    key={level} 
                    className={`h-full flex-1 rounded-full transition-colors ${
                      strength >= level ? (strength === 1 ? 'bg-[var(--status-pending)]' : strength === 2 ? 'bg-[var(--primary)]' : 'bg-[var(--status-resolved)]') : 'bg-[var(--bg-overlay)]'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <FormField
          control={control}
          name="confirmPassword"
          label="Confirm New Password"
          placeholder="••••••••"
          type="password"
          leftIcon={<Lock className="h-4 w-4" />}
          disabled={!token || !email}
        />

        <Button type="submit" fullWidth loading={isSubmitting} disabled={!token || !email} size="lg" className="mt-4">
          Reset Password
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={null}>
      <ResetPasswordContent />
    </React.Suspense>
  );
}
