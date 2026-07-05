'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { useAuth, api } from '@/hooks/useAuth';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import axios from 'axios';

function LoginContent() {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    try {
      const response = await api.post('/auth/login', data);
      if (response.data.success && response.data.data) {
        login(response.data.data.user, response.data.data.accessToken);
        const redirect = searchParams.get('redirect') || '/dashboard';
        router.push(redirect);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setServerError(error.response.data.error || 'Failed to login');
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="font-display text-3xl font-bold text-[var(--text-primary)]">
          Welcome back
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Please enter your details to sign in to your CivicFix account.
        </p>
      </div>

      {serverError && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-[var(--background)] p-4 text-[var(--status-critical)] border border-[var(--status-critical)]/20">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-[var(--status-critical)]" />
          <p className="text-sm font-medium">{serverError}</p>
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
          autoComplete="email"
        />

        <div>
          <FormField
            control={control}
            name="password"
            label="Password"
            placeholder="••••••••"
            type="password"
            leftIcon={<Lock className="h-4 w-4" />}
            autoComplete="current-password"
          />
          <div className="mt-2 flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
              <span className="text-sm text-[var(--text-secondary)]">Remember me</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)]"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" fullWidth loading={isSubmitting} size="lg" className="mt-2">
          Sign In
        </Button>
      </form>

      <div className="mt-8 relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border)]" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-[var(--surface)] px-2 text-[var(--text-secondary)]">Or continue with</span>
        </div>
      </div>

      <div className="mt-6">
        <Button variant="secondary" fullWidth disabled leftIcon={<svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>}>
          Google (Coming Soon)
        </Button>
      </div>

      <p className="mt-8 text-center text-sm text-[var(--text-secondary)]">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)]">
          Sign up for free
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={null}>
      <LoginContent />
    </React.Suspense>
  );
}
