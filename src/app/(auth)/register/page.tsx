'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@/lib/validations/auth';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { api } from '@/hooks/useAuth';
import Link from 'next/link';
import { Mail, Lock, User as UserIcon, Phone, AlertCircle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const { control, handleSubmit, watch, formState: { isSubmitting } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', phone: '', password: '', confirmPassword: '' }
  });

  const password = watch('password');

  // Simple password strength calculator
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

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);
    try {
      const response = await api.post('/auth/register', data);
      if (response.data.success) {
        setIsSuccess(true);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setServerError(error.response.data.error || 'Failed to register');
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
        <h2 className="mt-6 font-display text-2xl font-bold text-[var(--text-primary)]">Check your email</h2>
        <p className="mt-2 text-[var(--text-secondary)]">
          We&apos;ve sent a verification link to your email address. Please click the link to activate your account.
        </p>
        <div className="mt-8">
          <Link href="/login">
            <Button fullWidth size="lg">Return to login</Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="font-display text-3xl font-bold text-[var(--text-primary)]">
          Create an account
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Join CivicFix to start improving your community today.
        </p>
      </div>

      {serverError && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-[var(--background)] p-4 text-[var(--status-critical)] border border-[var(--status-critical)]/20">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-[var(--status-critical)]" />
          <p className="text-sm font-medium">{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={control}
          name="name"
          label="Full Name"
          placeholder="Jane Doe"
          leftIcon={<UserIcon className="h-4 w-4" />}
        />

        <FormField
          control={control}
          name="email"
          label="Email Address"
          placeholder="you@example.com"
          type="email"
          leftIcon={<Mail className="h-4 w-4" />}
        />

        <FormField
          control={control}
          name="phone"
          label="Phone Number (Optional)"
          placeholder="+1 (555) 000-0000"
          type="tel"
          leftIcon={<Phone className="h-4 w-4" />}
        />

        <div>
          <FormField
            control={control}
            name="password"
            label="Password"
            placeholder="••••••••"
            type="password"
            leftIcon={<Lock className="h-4 w-4" />}
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
          label="Confirm Password"
          placeholder="••••••••"
          type="password"
          leftIcon={<Lock className="h-4 w-4" />}
        />

        <Button type="submit" fullWidth loading={isSubmitting} size="lg" className="mt-4">
          Create Account
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-[var(--text-secondary)]">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)]">
          Sign in
        </Link>
      </p>
    </div>
  );
}
